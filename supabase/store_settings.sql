-- Shivam Kirana Store: editable store hours/status
CREATE TABLE IF NOT EXISTS public.store_settings (
  id integer PRIMARY KEY,
  delivery_hours text NOT NULL DEFAULT '10 AM - 7 PM',
  store_hours text NOT NULL DEFAULT '9 AM - 8 PM',
  delivery_time text NOT NULL DEFAULT '30 minutes',
  store_open boolean NOT NULL DEFAULT true,
  delivery_open boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read store settings" ON public.store_settings;
CREATE POLICY "Public can read store settings"
ON public.store_settings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Shopkeepers can manage store settings" ON public.store_settings;
CREATE POLICY "Shopkeepers can manage store settings"
ON public.store_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'shopkeeper'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'shopkeeper'
  )
);

INSERT INTO public.store_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
