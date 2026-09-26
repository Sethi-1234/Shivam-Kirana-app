-- Shivam Kirana Store security hardening
-- Run this entire script once in Supabase SQL Editor.
-- It protects customer PII, restricts shopkeeper operations, and moves
-- customer order creation into a server-side database function.

BEGIN;

-- =========================================================
-- 1. RLS
-- =========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 2. PROFILE ACCESS
-- Customers/public visitors must never read profiles.
-- A signed-in user can read only their own role row.
-- =========================================================
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;

GRANT SELECT ON TABLE public.profiles TO authenticated;

DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;

CREATE POLICY "Users can read their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ((select auth.uid()) = id);

-- =========================================================
-- 3. PUBLIC PRODUCTS: read-only for customers
-- Only a shopkeeper can insert/update/delete products.
-- =========================================================
REVOKE ALL ON TABLE public.products FROM anon, authenticated;

GRANT SELECT ON TABLE public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;

DROP POLICY IF EXISTS "Anyone can read available products" ON public.products;

CREATE POLICY "Anyone can read available products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (available = true);

DROP POLICY IF EXISTS "Shopkeepers can insert products" ON public.products;
DROP POLICY IF EXISTS "Shopkeepers can update products" ON public.products;
DROP POLICY IF EXISTS "Shopkeepers can delete products" ON public.products;

CREATE POLICY "Shopkeepers can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'shopkeeper'
  )
);

CREATE POLICY "Shopkeepers can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'shopkeeper'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'shopkeeper'
  )
);

CREATE POLICY "Shopkeepers can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'shopkeeper'
  )
);

-- =========================================================
-- 4. ORDERS: customers cannot directly read or modify orders.
-- Customer order creation is done only through the RPC below.
-- Shopkeepers can read/update orders.
-- =========================================================
REVOKE ALL ON TABLE public.orders FROM anon, authenticated;

GRANT SELECT, UPDATE ON TABLE public.orders TO authenticated;

DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Shopkeepers can read orders" ON public.orders;
DROP POLICY IF EXISTS "Shopkeepers can update orders" ON public.orders;

CREATE POLICY "Shopkeepers can read orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'shopkeeper'
  )
);

CREATE POLICY "Shopkeepers can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'shopkeeper'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'shopkeeper'
  )
);

-- =========================================================
-- 5. ORDER ITEMS: shopkeeper read-only.
-- Customers cannot insert arbitrary line items directly.
-- The secure order RPC inserts them server-side.
-- =========================================================
REVOKE ALL ON TABLE public.order_items FROM anon, authenticated;
GRANT SELECT ON TABLE public.order_items TO authenticated;

DROP POLICY IF EXISTS "Shopkeepers can read order items" ON public.order_items;

CREATE POLICY "Shopkeepers can read order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'shopkeeper'
  )
);

-- =========================================================
-- 6. SECURE CUSTOMER ORDER CREATION
-- Prices and product names are read from the database.
-- The browser cannot choose its own price/total.
-- =========================================================
CREATE OR REPLACE FUNCTION public.create_customer_order(
  p_customer_name text,
  p_customer_phone text,
  p_order_type text,
  p_address text,
  p_pin_code text,
  p_latitude numeric,
  p_longitude numeric,
  p_payment_method text,
  p_items jsonb
)
RETURNS TABLE (
  order_id uuid,
  tracking_code text,
  total_amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id uuid;
  v_tracking_code text;
  v_total numeric := 0;
  v_item jsonb;
  v_product_id uuid;
  v_quantity numeric;
  v_product_name text;
  v_unit_price numeric;
  v_stock numeric;
  v_available boolean;
BEGIN
  -- Basic input validation.
  IF length(trim(coalesce(p_customer_name, ''))) < 2
     OR length(trim(p_customer_name)) > 80 THEN
    RAISE EXCEPTION 'Invalid customer name';
  END IF;

  IF regexp_replace(coalesce(p_customer_phone, ''), '[^0-9]', '', 'g') !~ '^[0-9]{7,15}$' THEN
    RAISE EXCEPTION 'Invalid phone number';
  END IF;

  IF p_order_type NOT IN ('delivery', 'pickup') THEN
    RAISE EXCEPTION 'Invalid order type';
  END IF;

  IF p_payment_method NOT IN ('upi', 'qr', 'card', 'netbanking', 'cod') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  IF p_order_type = 'delivery' THEN
    IF length(trim(coalesce(p_address, ''))) < 5
       OR length(trim(p_address)) > 300 THEN
      RAISE EXCEPTION 'Invalid delivery address';
    END IF;

    IF coalesce(p_pin_code, '') <> '301604' THEN
      RAISE EXCEPTION 'Delivery is not available for this PIN code';
    END IF;
  END IF;

  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Create the order first with a server-generated tracking code.
  v_order_id := gen_random_uuid();
  v_tracking_code := gen_random_uuid()::text;

  -- Check every product and calculate the total from trusted DB prices.
  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_product_id := (v_item ->> 'product_id')::uuid;
      v_quantity := (v_item ->> 'quantity')::numeric;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Invalid product or quantity';
    END;

    IF v_quantity IS NULL OR v_quantity <= 0 OR v_quantity > 10000 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;

    SELECT name, price, stock, available
    INTO v_product_name, v_unit_price, v_stock, v_available
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND OR v_available IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'A selected product is no longer available';
    END IF;

    IF v_stock < v_quantity THEN
      RAISE EXCEPTION 'Not enough stock for %', v_product_name;
    END IF;

    v_total := v_total + (v_unit_price * v_quantity);
  END LOOP;

  INSERT INTO public.orders (
    id,
    customer_name,
    customer_phone,
    order_type,
    address,
    pin_code,
    latitude,
    longitude,
    payment_method,
    total_amount,
    status,
    tracking_code
  )
  VALUES (
    v_order_id,
    trim(p_customer_name),
    trim(p_customer_phone),
    p_order_type,
    CASE WHEN p_order_type = 'delivery' THEN trim(p_address) ELSE NULL END,
    CASE WHEN p_order_type = 'delivery' THEN p_pin_code ELSE NULL END,
    p_latitude,
    p_longitude,
    p_payment_method,
    v_total,
    'new',
    v_tracking_code
  );

  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::numeric;

    SELECT name, price
    INTO v_product_name, v_unit_price
    FROM public.products
    WHERE id = v_product_id;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      line_total
    )
    VALUES (
      v_order_id,
      v_product_id,
      v_product_name,
      v_quantity,
      v_unit_price,
      v_unit_price * v_quantity
    );
  END LOOP;

  RETURN QUERY
  SELECT v_order_id, v_tracking_code, v_total;
END;
$$;

-- Never leave function execution open to PUBLIC.
REVOKE EXECUTE ON FUNCTION public.create_customer_order(
  text, text, text, text, text, numeric, numeric, text, jsonb
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_customer_order(
  text, text, text, text, text, numeric, numeric, text, jsonb
) TO anon, authenticated;

-- Existing tracking RPC: public data is limited to the tracking code,
-- status, total, and delivery coordinates.
REVOKE EXECUTE ON FUNCTION public.get_order_tracking(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_tracking(text) TO anon, authenticated;

-- Helpful indexes.
CREATE INDEX IF NOT EXISTS profiles_id_role_idx
ON public.profiles (id, role);

CREATE INDEX IF NOT EXISTS orders_tracking_code_idx
ON public.orders (tracking_code);

NOTIFY pgrst, 'reload schema';

COMMIT;
