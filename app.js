/* SHIVAM KIRANA STORE - COMPLETE APP.JS v3
   Added secure order tracking, status confirmation, live delivery GPS,
   and fixed shopkeeper auth/session handling, product stock saving,
   cart stock limits, and UPI payment button rendering.
*/
/* =========================================================
   SHIVAM KIRANA STORE
   COMPLETE APP.JS
   Supabase + Shopkeeper + Orders + Products
   ========================================================= */

/* =========================
   STORE SETTINGS
========================= */

const STORE = {
  name: "Shivam Kirana Store",

  whatsapp: "917231927995",

  upi: "Sethishivam04@ybl",

  deliveryPin: "301604",

  deliveryFee: 0,

  minOrder: 0,

  deliveryTime: "30 minutes",

  deliveryHours: "10 AM - 7 PM",

  storeHours: "9 AM - 8 PM",

  holidays: [1, 15],

  pickup: true,

  logo: "file_00000000b0fc820892f849140911788b.png"
};


/* =========================
   SUPABASE
========================= */

const SUPABASE_URL =
  "https://mwvypqlchvrfbafwtdwp.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_oS5NBiW-0z6T_awwAkbJxA_Vh0YeFCC";

let supabaseClient = null;


/* =========================
   APP STATE
========================= */

let products = [];

let cart =
  JSON.parse(localStorage.getItem("shivamCart") || "{}");

let category = "All";

let customerLocation = null;

let editingProductId = null;

let shopkeeperUser = null;

let trackingChannel = null;
let trackingCodeActive = null;
let deliveryWatchId = null;
let deliveryTrackingOrderId = null;
let deliveryTrackingCode = null;
let lastDeliveryLocationUpdate = 0;


/* =========================
   HELPERS
========================= */

const $ = id => document.getElementById(id);

function money(value) {
  return "₹" + Number(value || 0).toFixed(0);
}

function unitLabel(unit) {
  const labels = {
    kg: "kg",
    g: "g",
    bottle: "1 bottle",
    litre: "litre",
    piece: "piece",
    packet: "packet",
    dozen: "dozen"
  };
  return labels[String(unit || "piece").toLowerCase()] || String(unit || "piece");
}

function saveCart() {
  localStorage.setItem(
    "shivamCart",
    JSON.stringify(cart)
  );

  updateCartCount();
}

function updateCartCount() {

  const count =
    Object.values(cart)
      .reduce((sum, qty) => sum + Number(qty), 0);

  if ($("cartCount")) {
    $("cartCount").textContent = count;
  }
}

function cartTotal() {

  return Object.keys(cart).reduce((sum, id) => {

    const product =
      products.find(p => String(p.id) === String(id));

    if (!product) return sum;

    return sum +
      Number(product.price) *
      Number(cart[id]);

  }, 0);
}

function cartItemCount() {

  return Object.values(cart)
    .reduce((sum, qty) => sum + Number(qty), 0);
}


/* =========================
   LOAD SUPABASE
========================= */

async function loadSupabase() {

  if (window.supabase) {

    supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

    return;
  }

  await new Promise((resolve, reject) => {

    const script =
      document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    script.onload = resolve;

    script.onerror = reject;

    document.head.appendChild(script);
  });

  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

  if (supabaseClient?.auth) {
    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        shopkeeperUser = null;
        updateShopkeeperInterface();
        return;
      }

      try {
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        shopkeeperUser =
          profile?.role === "shopkeeper" ? session.user : null;
        updateShopkeeperInterface();
      } catch (error) {
        console.error("Auth/profile check failed:", error);
      }
    });
  }
}


/* =========================
   LOGO
========================= */

function setupLogo() {

  const header =
    document.querySelector("header");

  if (!header) return;

  const brand =
    header.querySelector(".brand");

  if (!brand) return;

  const existing =
    brand.querySelector(".logo, .storeLogo");

  if (existing) return;

  const img =
    document.createElement("img");

  img.className = "storeLogo";

  img.src = STORE.logo;

  img.alt = STORE.name + " Logo";

  img.style.width = "55px";

  img.style.height = "55px";

  img.style.objectFit = "contain";

  img.style.borderRadius = "50%";

  img.onerror = function () {
    this.style.display = "none";
  };

  brand.prepend(img);
}


/* =========================
   STORE INFORMATION
========================= */

function setupStoreInfo() {

  const main =
    document.querySelector("main");

  if (!main) return;

  let box =
    document.getElementById("storeInfo");

  if (box) return;

  box =
    document.createElement("section");

  box.id = "storeInfo";

  box.style.margin = "15px auto";

  box.style.maxWidth = "1100px";

  box.style.padding = "18px";

  box.style.borderRadius = "18px";

  box.style.background =
    "linear-gradient(135deg,#dcfce7,#fef9c3)";

  box.innerHTML = `
    <h2 style="margin:0 0 8px">
      🛒 ${STORE.name}
    </h2>

    <p style="margin:5px 0">
      🚚 Delivery within <b>${STORE.deliveryTime}</b>
    </p>

    <p style="margin:5px 0">
      🚚 Delivery: <b>${STORE.deliveryHours}</b>
    </p>

    <p style="margin:5px 0">
      🏪 Store: <b>${STORE.storeHours}</b>
    </p>

    <p style="margin:5px 0">
      📅 Holiday: <b>1st and 15th of every month</b>
    </p>

    <p style="margin:5px 0">
      📍 Delivery PIN: <b>${STORE.deliveryPin}</b>
    </p>
  `;

  main.prepend(box);
}


/* =========================
   QUICK ACTIONS
========================= */

function setupQuickActions() {

  const main =
    document.querySelector("main");

  if (!main) return;

  if ($("quickActions")) {
    const privateButton = $("shopkeeperAccessButton");
    if (privateButton) privateButton.remove();
    return;
  }

  const box =
    document.createElement("div");

  box.id = "quickActions";

  box.style.display = "flex";

  box.style.flexWrap = "wrap";

  box.style.gap = "8px";

  box.style.maxWidth = "1100px";

  box.style.margin = "10px auto";

  box.innerHTML = `

    <button onclick="openCart()">
      🛒 Order Now
    </button>

    <button onclick="showDeliveryInfo()">
      🚚 Delivery
    </button>

    <button onclick="showPickupInfo()">
      🏪 Pickup
    </button>

    <button onclick="showPaymentInfo()">
      💳 Payment
    </button>

    <button onclick="showHelp()">
      ❓ Help
    </button>

    <button id="shopkeeperAccessButton" onclick="openShopkeeperLogin()" style="display:none">
      👨‍💼 Shopkeeper
    </button>

    <button onclick="openOrderTrackingPrompt()">
      📦 Track Order
    </button>

    <button onclick="openWhatsApp()">
      💬 WhatsApp
    </button>
  `;

  [...box.querySelectorAll("button")]
    .forEach(btn => {

      btn.style.padding = "10px 13px";

      btn.style.borderRadius = "10px";

      btn.style.border =
        "1px solid #d1d5db";

      btn.style.background = "white";

      btn.style.fontWeight = "700";
    });

  main.insertBefore(
    box,
    main.children[1] || null
  );
}


/* =========================
   STORE INFO POPUPS
========================= */

function showDeliveryInfo() {

  alert(
`🚚 DELIVERY INFORMATION

Delivery time:
${STORE.deliveryHours}

Delivery:
Within ${STORE.deliveryTime}

Delivery PIN:
${STORE.deliveryPin}

Delivery charge:
FREE

Minimum order:
No minimum`
  );
}

function showPickupInfo() {

  alert(
`🏪 STORE PICKUP

Pickup is available.

Store timing:
${STORE.storeHours}

Please place your order online and select:
🏪 Store Pickup`
  );
}

function showPaymentInfo() {

  alert(
`💳 PAYMENT OPTIONS

📱 UPI:
${STORE.upi}

📷 QR Code / UPI QR:
Available at checkout

💳 Debit / Credit Card:
Available through a secure payment gateway when connected

🏦 Net Banking:
Available through a secure payment gateway when connected

💵 Cash on Delivery:
Available`
  );
}

function showHelp() {

  alert(
`❓ HELP

1. Select products.
2. Add them to your cart.
3. Open Cart.
4. Select Order Now.
5. Enter your details.
6. Choose Delivery or Pickup.
7. Select payment method.
8. Send the order.

WhatsApp:
+91 ${STORE.whatsapp.slice(2)}`
  );
}

function openWhatsApp() {

  window.open(
    "https://wa.me/" +
    STORE.whatsapp,
    "_blank"
  );
}


/* =========================
   SUPABASE PRODUCTS
========================= */

async function loadProductsFromDatabase() {

  if (!supabaseClient) return;

  const {
    data,
    error
  } = await supabaseClient
    .from("products")
    .select("*")
    .eq("available", true)
    .order("created_at", {
      ascending: true
    });

  if (error) {

    console.error(error);

    console.error("Products could not be loaded from database:", error);
    loadFallbackProducts();
    renderCategories();
    renderProducts();
    renderShopkeeperProducts();
    return;
  }

  products = (data || []).map(normalizeProduct);

  // If Supabase has no products marked available yet, keep the customer
  // storefront usable with the built-in starter catalogue.
  if (!products.length) {
    loadFallbackProducts();
  }

  renderCategories();
  renderProducts();
  renderShopkeeperProducts();
}


/* =========================
   FALLBACK PRODUCTS
========================= */

function loadFallbackProducts() {

  products = [

    {
      id: "demo1",
      name: "Rice 5 kg",
      price: 320,
      category: "Staples",
      emoji: "🍚",
      available: true
    },

    {
      id: "demo2",
      name: "Wheat Flour 10 kg",
      price: 280,
      category: "Staples",
      emoji: "🌾",
      available: true
    },

    {
      id: "demo3",
      name: "Toor Dal 1 kg",
      price: 140,
      category: "Staples",
      emoji: "🫘",
      available: true
    },

    {
      id: "demo4",
      name: "Milk 1 L",
      price: 60,
      category: "Dairy",
      emoji: "🥛",
      available: true
    },

    {
      id: "demo5",
      name: "Bread",
      price: 40,
      category: "Dairy",
      emoji: "🍞",
      available: true
    },

    {
      id: "demo6",
      name: "Biscuits",
      price: 30,
      category: "Snacks",
      emoji: "🍪",
      available: true
    },

    {
      id: "demo7",
      name: "Tea 250 g",
      price: 120,
      category: "Beverages",
      emoji: "🍵",
      available: true
    },

    {
      id: "demo8",
      name: "Cooking Oil 1 L",
      price: 150,
      category: "Staples",
      emoji: "🫗",
      available: true
    },

    {
      id: "demo9",
      name: "Bath Soap",
      price: 45,
      category: "Household",
      emoji: "🧼",
      available: true
    },

    {
      id: "demo10",
      name: "Shampoo",
      price: 90,
      category: "Personal Care",
      emoji: "🧴",
      available: true
    },

    {
      id: "demo11",
      name: "Cold Drink",
      price: 50,
      category: "Beverages",
      emoji: "🥤",
      available: true
    },

    {
      id: "demo12",
      name: "Sugar 1 kg",
      price: 52,
      category: "Staples",
      emoji: "🧂",
      available: true
    }
  ];
}


/* =========================
   CATEGORIES
========================= */

function renderCategories() {
  products = products.map(normalizeProduct);

  const el =
    $("categories");

  if (!el) return;

  const cats =
    [
      "All",
      ...new Set(
        products.map(
          p => p.category || p.cat || "General"
        )
      )
    ];

  el.innerHTML =
    cats.map(cat => `

      <button
        class="chip ${
          cat === category
            ? "active"
            : ""
        }"
        onclick="setCategory('${String(cat).replace(/'/g,"\\'")}')">

        ${cat}

      </button>

    `).join("");
}

function setCategory(cat) {

  category = cat;

  renderCategories();

  renderProducts();
}


/* =========================
   PRODUCT DISPLAY
========================= */

function normalizeProduct(product) {
  return {
    ...product,
    name: String(product.name || "Unnamed Product"),
    price: Number(product.price || 0),
    category: String(product.category || product.cat || "General"),
    emoji: String(product.emoji || "🛒"),
    stock: product.stock == null ? 999 : Number(product.stock),
    unit: String(product.unit || "piece").toLowerCase(),
    stock_unit: String(product.stock_unit || product.unit || "piece").toLowerCase(),
    available: product.available !== false
  };
}

function renderProducts() {

  const el =
    $("products");

  if (!el) return;

  // Never leave the storefront empty on the customer page.
  if (!Array.isArray(products) || !products.length) {
    loadFallbackProducts();
  }

  products = products.map(normalizeProduct);

  const search =
    ($("search")?.value || "")
      .toLowerCase()
      .trim();

  const list =
    products.filter(p => {

      const productCategory =
        p.category ||
        p.cat ||
        "General";

      const productName =
        String(p.name || "")
          .toLowerCase();

      return (
        (category === "All" ||
          productCategory === category) &&
        productName.includes(search)
      );
    });

  if (!list.length) {

    el.innerHTML =
      "<p>No products found.</p>";

    return;
  }

  el.innerHTML =
    list.map(p => {

      const image =
        p.image_url
          ? `<img
              src="${escapeHtml(p.image_url)}"
              alt="${escapeHtml(p.name)}"
              style="
                width:100%;
                height:110px;
                object-fit:contain;
                border-radius:12px;
              "
            >`
          : `<div
              class="emoji"
              style="
                font-size:45px;
                text-align:center;
                padding:25px;
              "
            >
              ${p.emoji || "🛒"}
            </div>`;

      return `

        <article class="card">

          ${image}

          <h3>
            ${escapeHtml(p.name)}
          </h3>

          <div class="price">
            ${money(p.price)} <small style="font-weight:700">/ ${escapeHtml(unitLabel(p.unit))}</small>
          </div>

          <small style="display:block;margin:5px 0 10px;color:#64748b">
            Stock: ${escapeHtml(p.stock)} ${escapeHtml(unitLabel(p.stock_unit))}
          </small>

          <button
            class="add"
            onclick="addToCart('${String(p.id)}')">

            Add to Cart

          </button>

        </article>

      `;

    }).join("");
}

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================
   CART
========================= */

function addToCart(id) {

  const product = products.find(p => String(p.id) === String(id));
  if (!product || product.available === false || Number(product.stock) <= 0) {
    alert("This product is currently out of stock.");
    return;
  }
  if (Number(cart[id] || 0) >= Number(product.stock)) {
    alert("You cannot add more than the available stock.");
    return;
  }

  cart[id] =
    Number(cart[id] || 0) + 1;

  saveCart();

  renderCart();

  alert("Product added to cart.");
}

function changeCart(id, change) {

  const product = products.find(
    p => String(p.id) === String(id)
  );

  const nextQty =
    Number(cart[id] || 0) + Number(change);

  if (product && nextQty > Number(product.stock)) {
    alert("You cannot add more than the available stock.");
    return;
  }

  cart[id] = nextQty;

  if (cart[id] <= 0) {
    delete cart[id];
  }

  saveCart();

  renderCart();
}

function clearCart() {

  cart = {};

  saveCart();

  renderCart();
}

function renderCart() {

  const box =
    $("cartItems");

  if (!box) return;

  const ids =
    Object.keys(cart);

  if (!ids.length) {

    box.innerHTML =
      "<p>Your cart is empty.</p>";

    if ($("total")) {
      $("total").textContent = "₹0";
    }

    return;
  }

  box.innerHTML =
    ids.map(id => {

      const p =
        products.find(
          x => String(x.id) === String(id)
        );

      if (!p) return "";

      const qty =
        Number(cart[id]);

      return `

        <div class="item">

          <div>

            <b>
              ${p.emoji || "🛒"}
              ${escapeHtml(p.name)}
            </b>

            <br>

            ${money(
              Number(p.price) * qty
            )}

          </div>

          <div class="qty">

            <button
              onclick="changeCart('${id}',-1)">
              −
            </button>

            ${qty}

            <button
              onclick="changeCart('${id}',1)">
              +
            </button>

          </div>

        </div>

      `;

    }).join("");

  if ($("total")) {

    $("total").textContent =
      money(cartTotal());
  }
}

function openCart() {

  const panel =
    $("cartPanel");

  if (!panel) return;

  panel.classList.remove("hidden");

  renderCart();
}

function closeCart() {

  $("cartPanel")
    ?.classList.add("hidden");
}


/* =========================
   CHECKOUT
========================= */

function setupCheckout() {
  updateCheckoutType();
  updatePaymentInfo();
}

function updateCheckoutType() {

  const selected =
    document.querySelector(
      'input[name="orderType"]:checked'
    )?.value;

  const fields =
    $("deliveryFields");

  if (!fields) return;

  if (selected === "pickup") {

    fields.style.display = "none";

  } else {

    fields.style.display = "block";
  }
}

function updatePaymentInfo() {

  const method = $("paymentMethod")?.value;
  const info = $("paymentInfo");

  if (!info) return;

  if (method === "upi") {
    info.innerHTML = `
      <b>UPI Payment</b>
      <div style="margin:6px 0 10px">UPI ID: ${escapeHtml(STORE.upi)}</div>
      <button type="button" class="upiButton" onclick="payByUPI()"
        style="padding:10px 14px;border:0;border-radius:10px;background:#16a34a;color:white;font-weight:800;cursor:pointer;">
        💳 Pay by UPI
      </button>
    `;
  } else if (method === "qr") {
    const amount = cartTotal().toFixed(2);
    const upiUri = "upi://pay?pa=" + encodeURIComponent(STORE.upi) +
      "&pn=" + encodeURIComponent(STORE.name) +
      "&am=" + encodeURIComponent(amount) +
      "&cu=INR";
    info.innerHTML = `
      <b>📱 Scan QR Code to Pay</b>
      <p style="margin:6px 0;color:#64748b">Amount: <b>₹${amount}</b></p>
      <div id="paymentQr" style="display:flex;justify-content:center;margin:10px 0;"></div>
      <small>UPI ID: ${escapeHtml(STORE.upi)}</small>
    `;
    if (window.QRCode) {
      new QRCode(document.getElementById("paymentQr"), {
        text: upiUri,
        width: 190,
        height: 190
      });
    }
  } else if (method === "card") {
    info.innerHTML = "💳 Debit/Credit Card selected. A secure payment gateway is required to collect card details.";
  } else if (method === "netbanking") {
    info.innerHTML = "🏦 Net Banking selected. A secure payment gateway is required to complete payment.";
  } else {
    info.innerHTML = "💵 Pay cash when your order is delivered.";
  }
}


/* =========================
   DELIVERY AREA
========================= */

function checkDeliveryArea() {

  const pin =
    $("orderPin")?.value.trim();

  if (!pin) {

    alert("Please enter your PIN code.");

    return false;
  }

  if (pin !== STORE.deliveryPin) {

    alert(
      "❌ Sorry, delivery is currently available only in PIN code " +
      STORE.deliveryPin
    );

    return false;
  }

  alert(
    "✅ Delivery available!\n\n" +
    "Estimated delivery: " +
    STORE.deliveryTime
  );

  return true;
}


/* =========================
   CUSTOMER LOCATION
========================= */

function getCustomerLocation() {

  const status =
    $("locationStatus");

  if (!navigator.geolocation) {

    if (status) {
      status.textContent =
        "❌ Location is not supported.";
    }

    return;
  }

  if (status) {

    status.textContent =
      "📍 Getting your location...";
  }

  navigator.geolocation.getCurrentPosition(

    position => {

      customerLocation = {

        latitude:
          position.coords.latitude,

        longitude:
          position.coords.longitude,

        accuracy:
          position.coords.accuracy
      };

      if (status) {

        status.innerHTML =
          "✅ Location added<br>" +
          "Accuracy: about " +
          Math.round(
            position.coords.accuracy
          ) +
          " metres";
      }
    },

    error => {

      console.error(error);

      if (status) {

        status.textContent =
          "❌ Location permission not allowed.";
      }

      alert(
        "Please allow location permission in your browser."
      );
    },

    {
      enableHighAccuracy: true,

      timeout: 15000,

      maximumAge: 0
    }
  );
}


/* =========================
   UPI PAYMENT
========================= */

function payByUPI() {

  if (!cartItemCount()) {

    alert(
      "Please add products to your cart first."
    );

    return;
  }

  const amount =
    cartTotal();

  const upiUrl =
    "upi://pay" +
    "?pa=" +
    encodeURIComponent(STORE.upi) +
    "&pn=" +
    encodeURIComponent(STORE.name) +
    "&am=" +
    encodeURIComponent(amount.toFixed(2)) +
    "&cu=INR";

  window.location.href =
    upiUrl;
}


/* =========================
   ORDER TRACKING
========================= */

function createTrackingCode() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "trk-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
}

function trackingStatusLabel(status) {
  const labels = {
    new: "Order received",
    confirmed: "Order confirmed",
    preparing: "Preparing your order",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled"
  };
  return labels[status] || "Order status: " + status;
}

function trackingStatusSteps(status) {
  const steps = [
    ["new", "📥", "Order received"],
    ["confirmed", "✅", "Confirmed"],
    ["preparing", "📦", "Preparing"],
    ["out_for_delivery", "🛵", "Out for delivery"],
    ["delivered", "🎉", "Delivered"]
  ];
  const order = ["new", "confirmed", "preparing", "out_for_delivery", "delivered"];
  const currentIndex = order.indexOf(status);
  return steps.map(([key, icon, label]) => {
    const done = currentIndex >= order.indexOf(key) && status !== "cancelled";
    const current = key === status;
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:9px 0">
        <div style="width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:${done ? "#16a34a" : "#e5e7eb"};color:${done ? "white" : "#64748b"}">${icon}</div>
        <div style="font-weight:${current ? "800" : "600"}">${escapeHtml(label)}</div>
      </div>`;
  }).join("");
}

function renderTrackingCard(order) {
  const box = $("trackingResult");
  if (!box || !order) return;
  const status = order.status || "new";
  const locationLink = order.delivery_latitude != null && order.delivery_longitude != null
    ? `<a href="https://www.google.com/maps?q=${encodeURIComponent(order.delivery_latitude + "," + order.delivery_longitude)}" target="_blank" rel="noopener" style="display:inline-block;margin-top:10px;padding:10px 12px;border-radius:10px;background:#2563eb;color:white;text-decoration:none;font-weight:800">📍 Open live delivery location</a>`
    : `<p style="margin:8px 0;color:#64748b">🛵 Live delivery location will appear when the shopkeeper starts tracking.</p>`;

  box.innerHTML = `
    <div style="border:1px solid #dbeafe;border-radius:16px;padding:16px;background:#f8fbff">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <strong>📦 Order #${escapeHtml(String(order.order_id || "").slice(0,8))}</strong>
        <strong>${money(order.total_amount)}</strong>
      </div>
      <p style="margin:8px 0"><b>Status:</b> ${escapeHtml(trackingStatusLabel(status))}</p>
      <div style="margin:10px 0">${status === "cancelled"
        ? "<div style='padding:10px;border-radius:10px;background:#fee2e2;color:#991b1b;font-weight:800'>❌ This order was cancelled.</div>"
        : trackingStatusSteps(status)}</div>
      ${locationLink}
      <p style="font-size:12px;color:#64748b;margin-top:12px">Tracking code: ${escapeHtml(order.tracking_code || "")}</p>
      ${order.tracking_updated_at ? `<p style="font-size:12px;color:#64748b">Last location update: ${escapeHtml(new Date(order.tracking_updated_at).toLocaleString())}</p>` : ""}
    </div>`;
}

async function copyTrackingCode() {
  const code = $("trackingCodeInput")?.value.trim();
  if (!code) {
    alert("No tracking code available.");
    return;
  }

  try {
    await navigator.clipboard.writeText(code);
    alert("✅ Tracking code copied.");
  } catch (e) {
    alert("Tracking code: " + code);
  }
}

async function fetchOrderTracking(code) {
  if (!supabaseClient) return null;
  const cleanCode = String(code || "").trim();
  if (!cleanCode) return null;

  const { data, error } = await supabaseClient.rpc("get_order_tracking", {
    p_tracking_code: cleanCode
  });

  if (error) {
    console.error("Tracking lookup error:", error);
    const box = $("trackingResult");
    if (box) box.innerHTML = "<p style='color:#b91c1c;font-weight:700'>Could not load tracking. Please check the tracking code and Supabase tracking function.</p>";
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    const box = $("trackingResult");
    if (box) box.innerHTML = "<p style='color:#b91c1c;font-weight:700'>No order found for this tracking code.</p>";
    return null;
  }

  renderTrackingCard(row);
  return row;
}

async function subscribeToOrderTracking(code) {
  if (!supabaseClient) return;
  const cleanCode = String(code || "").trim();
  if (!cleanCode) return;

  if (trackingChannel) {
    await supabaseClient.removeChannel(trackingChannel);
    trackingChannel = null;
  }

  trackingCodeActive = cleanCode;
  trackingChannel = supabaseClient
    .channel("order:" + cleanCode)
    .on("broadcast", { event: "tracking_update" }, payload => {
      const update = payload?.payload || {};
      if (update.tracking_code && update.tracking_code !== trackingCodeActive) return;
      fetchOrderTracking(cleanCode);
    })
    .subscribe(status => {
      if (status === "CHANNEL_ERROR") console.warn("Tracking realtime channel error");
    });
}

async function openOrderTracking(code) {
  const cleanCode = String(code || "").trim();
  if (!cleanCode) return;

  let panel = $("trackingPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "trackingPanel";
    panel.style.cssText = "position:fixed;inset:0;background:#0009;z-index:95;overflow:auto;padding:16px";
    panel.innerHTML = `
      <div style="background:white;width:min(560px,100%);margin:20px auto;border-radius:18px;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
          <h2 style="margin:0">📦 Track Your Order</h2>
          <button onclick="closeOrderTracking()" style="border:0;background:#eee;border-radius:8px;padding:8px">✕</button>
        </div>
        <p style="color:#64748b">Enter the tracking code you received after placing the order.</p>
        <input id="trackingCodeInput" value="${escapeHtml(cleanCode)}" placeholder="Tracking code" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box">
        <button onclick="loadTrackingFromInput()" style="width:100%;padding:12px;margin-top:8px;border:0;border-radius:10px;background:#2563eb;color:white;font-weight:800">🔎 Track Order</button>
        <button onclick="copyTrackingCode()" style="width:100%;padding:11px;margin-top:8px;border:1px solid #cbd5e1;border-radius:10px;background:white;color:#334155;font-weight:800">📋 Copy Tracking Code</button>
        <div id="trackingResult" style="margin-top:14px"></div>
      </div>`;
    document.body.appendChild(panel);
  } else {
    panel.classList.remove("hidden");
    if ($("trackingCodeInput")) $("trackingCodeInput").value = cleanCode;
  }

  await fetchOrderTracking(cleanCode);
  await subscribeToOrderTracking(cleanCode);
}

async function loadTrackingFromInput() {
  const code = $("trackingCodeInput")?.value.trim();
  if (!code) {
    alert("Please enter your tracking code.");
    return;
  }
  await fetchOrderTracking(code);
  await subscribeToOrderTracking(code);
}

function openOrderTrackingPrompt() {
  let code = "";
  try {
    code = localStorage.getItem("shivam_last_tracking_code") || "";
  } catch (e) {}

  if (code) {
    openOrderTracking(code.trim());
    return;
  }

  const entered = prompt("Enter your order tracking code:");
  if (entered) openOrderTracking(entered.trim());
}

async function closeOrderTracking() {
  if (trackingChannel && supabaseClient) {
    await supabaseClient.removeChannel(trackingChannel);
  }
  trackingChannel = null;
  trackingCodeActive = null;
  $("trackingPanel")?.remove();
}


/* =========================
   SEND ORDER
========================= */

async function sendOrderToWhatsApp() {

  if (!cartItemCount()) {

    alert(
      "Please add products first."
    );

    return;
  }

  const name =
    $("name")?.value.trim();

  const phone =
    $("phone")?.value.trim();

  if (!name || !phone) {

    alert(
      "Please enter your name and phone number."
    );

    return;
  }

  const orderType =
    document.querySelector(
      'input[name="orderType"]:checked'
    )?.value || "delivery";

  let address = "";

  let pin = "";

  if (orderType === "delivery") {

    address =
      $("orderAddress")?.value.trim();

    pin =
      $("orderPin")?.value.trim();

    if (!address) {

      alert(
        "Please enter your delivery address."
      );

      return;
    }

    if (!pin) {

      alert(
        "Please enter your delivery PIN code."
      );

      return;
    }

    if (pin !== STORE.deliveryPin) {

      alert(
        "❌ Delivery is not available for this PIN code."
      );

      return;
    }
  }

  const payment =
    $("paymentMethod")?.value || "upi";

  const paymentName = {

    upi: "UPI",

    qr: "QR Code / UPI QR",

    card: "Debit / Credit Card",

    netbanking: "Net Banking",

    cod: "Cash on Delivery"

  }[payment] || payment;


  /* SAVE ORDER THROUGH SECURE SUPABASE RPC */

  if (!supabaseClient) {
    alert(
      "❌ Secure order service is not available right now. Please try again in a moment."
    );
    return;
  }

  const rpcItems = Object.keys(cart).map(id => {
    const product = products.find(
      p => String(p.id) === String(id)
    );

    if (!product || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(product.id))) {
      return null;
    }

    const quantity = Number(cart[id] || 0);

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 10000) {
      return null;
    }

    return {
      product_id: String(product.id),
      quantity
    };
  }).filter(Boolean);

  if (rpcItems.length !== Object.keys(cart).length) {
    alert(
      "❌ One or more cart products are no longer available. Please refresh the page and add them again."
    );
    return;
  }

  const { data: orderResult, error: orderError } =
    await supabaseClient.rpc("create_customer_order", {
      p_customer_name: name,
      p_customer_phone: phone,
      p_order_type: orderType,
      p_address: orderType === "delivery" ? address : null,
      p_pin_code: orderType === "delivery" ? pin : null,
      p_latitude: customerLocation?.latitude ?? null,
      p_longitude: customerLocation?.longitude ?? null,
      p_payment_method: payment,
      p_items: rpcItems
    });

  if (orderError) {
    console.error("Secure order RPC error:", orderError);
    alert(
      "❌ Order could not be saved securely.\\n\\n" +
      orderError.message
    );
    return;
  }

  const savedOrder = Array.isArray(orderResult)
    ? orderResult[0]
    : orderResult;

  if (!savedOrder?.tracking_code) {
    alert(
      "❌ The secure order service did not return a tracking code. Please try again."
    );
    return;
  }

  const serverTotal = Number(savedOrder.total_amount || 0);

  if (!Number.isFinite(serverTotal)) {
    alert("❌ Invalid order total returned by the server.");
    return;
  }

  // Use the server-calculated total in the WhatsApp message.
  const finalTotal = serverTotal;

  const finalTrackingCode = savedOrder.tracking_code;

  // Keep the latest tracking code on this device so the customer can
  // reopen tracking without typing the code again.
  try {
    localStorage.setItem("shivam_last_tracking_code", finalTrackingCode);
  } catch (e) {
    console.warn("Could not save tracking code locally:", e);
  }

  const secureLines = rpcItems.map(item => {
    const product = products.find(
      p => String(p.id) === String(item.product_id)
    );
    return product
      ? product.name + " x " + item.quantity
      : "Product x " + item.quantity;
  });

  const secureLocationText = customerLocation
    ? "📍 Customer Location:\\nhttps://www.google.com/maps?q=" +
      customerLocation.latitude + "," + customerLocation.longitude
    : "Location not shared";

  const message =
`🛒 NEW ORDER
${STORE.name}

Customer: ${name}
Phone: ${phone}

Order Type: ${
  orderType === "delivery"
    ? "Home Delivery"
    : "Store Pickup"
}

${orderType === "delivery"
  ? "Address: " + address
  : ""}

${orderType === "delivery"
  ? "PIN: " + pin
  : ""}

Payment: ${paymentName}

Products:
${secureLines.join("\\n")}

Delivery Charge: FREE

Total: ${money(finalTotal)}

Tracking Code: ${finalTrackingCode}

Track your order on the website using this code.

${secureLocationText}

Please confirm this order.

Thank you.`;

  /* SHOW CUSTOMER TRACKING */

  if (finalTrackingCode) {
    setTimeout(() => openOrderTracking(finalTrackingCode), 50);
  }


  /* OPEN WHATSAPP */

  const whatsappUrl =
    "https://wa.me/" +
    STORE.whatsapp +
    "?text=" +
    encodeURIComponent(message);

  window.open(
    whatsappUrl,
    "_blank"
  );


  /* CLEAR CART */

  cart = {};

  saveCart();

  renderCart();

  $("checkout")
    ?.classList.add("hidden");

  $("cartPanel")
    ?.classList.add("hidden");

  alert(
    "✅ Order prepared successfully!"
  );
}


/* =========================
   SHOPKEEPER LOGIN
========================= */

function openShopkeeperLogin() {

  let modal =
    $("shopkeeperLogin");

  if (modal) {

    modal.classList.remove("hidden");

    return;
  }

  modal =
    document.createElement("div");

  modal.id =
    "shopkeeperLogin";

  modal.style.position = "fixed";

  modal.style.inset = "0";

  modal.style.background = "#0009";

  modal.style.zIndex = "100";

  modal.style.display = "grid";

  modal.style.placeItems = "center";

  modal.style.padding = "20px";

  modal.innerHTML = `

    <div style="
      background:white;
      width:min(430px,100%);
      padding:24px;
      border-radius:18px;
      position:relative;
    ">

      <button
        onclick="closeShopkeeperLogin()"
        style="
          position:absolute;
          right:15px;
          top:15px;
          border:0;
          background:#eee;
          border-radius:8px;
          padding:8px;
        ">

        ✕

      </button>

      <h2>👨‍💼 Shopkeeper Login</h2>

      <p>
        Login to manage your products.
      </p>

      <input
        id="shopEmail"
        type="email"
        placeholder="Shopkeeper email"
        style="
          width:100%;
          padding:13px;
          margin:7px 0;
          border:1px solid #ddd;
          border-radius:10px;
        "
      >

      <input
        id="shopPassword"
        type="password"
        placeholder="Password"
        style="
          width:100%;
          padding:13px;
          margin:7px 0;
          border:1px solid #ddd;
          border-radius:10px;
        "
      >

      <button
        onclick="shopkeeperLogin()"
        style="
          width:100%;
          padding:13px;
          border:0;
          border-radius:10px;
          background:#16a34a;
          color:white;
          font-weight:800;
          margin-top:8px;
        ">

        🔐 Login

      </button>

      <p
        id="shopLoginStatus"
        style="
          font-size:13px;
          color:#475569;
        ">
      </p>

    </div>
  `;

  document.body.appendChild(modal);
}

function closeShopkeeperLogin() {

  $("shopkeeperLogin")
    ?.remove();
}


/* =========================
   SHOPKEEPER AUTH
========================= */

async function shopkeeperLogin() {

  const email =
    $("shopEmail")?.value.trim();

  const password =
    $("shopPassword")?.value;

  const status =
    $("shopLoginStatus");

  if (!email || !password) {

    if (status) {
      status.textContent =
        "Please enter email and password.";
    }

    return;
  }

  if (!supabaseClient) {

    alert(
      "Database connection is not ready."
    );

    return;
  }

  if (status) {
    status.textContent =
      "Logging in...";
  }

  const {
    data,
    error
  } =
    await supabaseClient.auth
      .signInWithPassword({

        email,

        password

      });

  if (error) {

    console.error(error);

    if (status) {

      status.textContent =
        "❌ Login failed: " +
        error.message;
    }

    return;
  }

  const user =
    data.user;

  const {
    data: profile,
    error: profileError
  } =
    await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "shopkeeper"
  ) {

    await supabaseClient.auth.signOut();

    if (status) {

      status.textContent =
        profileError
          ? "❌ Login succeeded, but the shopkeeper profile could not be read. Check the profiles SELECT policy in Supabase."
          : "❌ This account is not a shopkeeper account.";
    }

    return;
  }

  shopkeeperUser =
    user;

  closeShopkeeperLogin();

  openShopkeeperPanel();
}


/* =========================
   SHOPKEEPER ORDERS
========================= */

async function loadShopkeeperOrders() {
  const box = $("shopkeeperOrders");
  if (!box) return;

  if (!shopkeeperUser || !supabaseClient) {
    box.innerHTML = "<p>Please login as shopkeeper.</p>";
    return;
  }

  box.innerHTML = "<p>Loading orders...</p>";

  const { data, error } = await supabaseClient
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    box.innerHTML = "<p>Could not load orders. Check Supabase RLS policies for the orders table.</p>";
    return;
  }

  let itemRows = [];
  const orderIds = (data || []).map(o => o.id).filter(Boolean);
  if (orderIds.length) {
    const itemsResult = await supabaseClient.from("order_items").select("*").in("order_id", orderIds);
    if (!itemsResult.error) itemRows = itemsResult.data || [];
    else console.warn("order_items is not available yet:", itemsResult.error);
  }
  const itemsByOrder = {};
  itemRows.forEach(item => {
    const key = String(item.order_id);
    if (!itemsByOrder[key]) itemsByOrder[key] = [];
    itemsByOrder[key].push(item);
  });

  if (!data || !data.length) {
    box.innerHTML = "<p>No customer orders yet.</p>";
    return;
  }

  box.innerHTML = data.map(order => {
    const status = order.status || "new";
    const date = order.created_at
      ? new Date(order.created_at).toLocaleString()
      : "Date unavailable";

    return `
      <div style="border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin:10px 0;background:#fff">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <strong>Order #${escapeHtml(String(order.id).slice(0,8))}</strong>
          <strong>${money(order.total_amount)}</strong>
        </div>
        <p style="margin:7px 0"><b>Customer:</b> ${escapeHtml(order.customer_name || "—")}</p>
        <p style="margin:7px 0"><b>Phone:</b> ${escapeHtml(order.customer_phone || "—")}</p>
        <p style="margin:7px 0"><b>Type:</b> ${order.order_type === "pickup" ? "🏪 Store Pickup" : "🚚 Home Delivery"}</p>
        ${order.address ? `<p style="margin:7px 0"><b>Address:</b> ${escapeHtml(order.address)}</p>` : ""}
        ${order.pin_code ? `<p style="margin:7px 0"><b>PIN:</b> ${escapeHtml(order.pin_code)}</p>` : ""}
        <p style="margin:7px 0"><b>Payment:</b> ${escapeHtml(order.payment_method || "—")}</p>
        <p style="margin:7px 0"><b>Placed:</b> ${escapeHtml(date)}</p>
        ${itemsByOrder[String(order.id)]?.length
          ? `<div style="margin:9px 0;padding:10px;background:#f8fafc;border-radius:10px"><b>🛍️ Products</b><ul style="margin:7px 0 0;padding-left:20px">${itemsByOrder[String(order.id)].map(item => `<li>${escapeHtml(item.product_name || "Product")} × ${Number(item.quantity || 0)} — ${money(item.line_total ?? ((Number(item.unit_price)||0) * (Number(item.quantity)||0)))}</li>`).join("")}</ul></div>`
          : `<p style="margin:7px 0;color:#64748b"><b>Products:</b> Product details will appear after the order_items table is enabled.</p>`}
        ${order.latitude && order.longitude
          ? `<a href="https://www.google.com/maps?q=${encodeURIComponent(order.latitude + "," + order.longitude)}" target="_blank" rel="noopener">📍 Open customer location</a>`
          : ""}
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px">
          <label><b>Status</b></label>
          <select onchange="updateOrderStatus('${String(order.id)}', this.value)" style="padding:9px;border:1px solid #d1d5db;border-radius:9px">
            <option value="new" ${status==="new"?"selected":""}>New / Received</option>
            <option value="confirmed" ${status==="confirmed"?"selected":""}>Confirmed</option>
            <option value="preparing" ${status==="preparing"?"selected":""}>Preparing</option>
            <option value="out_for_delivery" ${status==="out_for_delivery"?"selected":""}>Out for Delivery</option>
            <option value="delivered" ${status==="delivered"?"selected":""}>Delivered</option>
            <option value="cancelled" ${status==="cancelled"?"selected":""}>Cancelled</option>
          </select>
          ${order.tracking_code
            ? `<button onclick="startDeliveryTracking('${String(order.id)}','${escapeHtml(order.tracking_code)}')" style="padding:9px;border:0;border-radius:9px;background:#16a34a;color:white;font-weight:800">🛵 Start Live Location</button>
               <button onclick="stopDeliveryTracking()" style="padding:9px;border:0;border-radius:9px;background:#dc2626;color:white;font-weight:800">⏹ Stop Location</button>`
            : ""}
        </div>
        ${order.tracking_code
          ? `<div style="margin-top:10px;padding:12px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe">
               <div style="font-size:12px;color:#475569;font-weight:700">TRACKING ID</div>
               <div style="font-size:18px;font-weight:900;letter-spacing:.5px;color:#1d4ed8;margin-top:3px">${escapeHtml(order.tracking_code)}</div>
               <button onclick="copyShopkeeperTrackingId('${String(order.tracking_code)}')" style="margin-top:7px;padding:7px 10px;border:1px solid #93c5fd;border-radius:8px;background:white;font-weight:800">📋 Copy Tracking ID</button>
             </div>`
          : `<button onclick="generateTrackingIdForOrder('${String(order.id)}')" style="width:100%;padding:10px;margin-top:10px;border:0;border-radius:10px;background:#7c3aed;color:white;font-weight:900">🆔 Generate Tracking ID</button>`}
      </div>`;
  }).join("");
}

async function generateTrackingIdForOrder(orderId) {
  if (!shopkeeperUser || !supabaseClient) {
    alert("Please login as shopkeeper first.");
    return;
  }

  const bytes = crypto.getRandomValues(new Uint32Array(2));
  const generatedCode =
    "SK-" +
    new Date().toISOString().slice(0, 10).replace(/-/g, "") +
    "-" +
    Array.from(bytes).map(n => n.toString(36)).join("").slice(0, 10).toUpperCase();

  const { error } = await supabaseClient
    .from("orders")
    .update({ tracking_code: generatedCode })
    .eq("id", orderId);

  if (error) {
    console.error("Tracking ID generation failed:", error);
    alert("Could not generate tracking ID.\n\n" + error.message);
    return;
  }

  alert("✅ Tracking ID generated:\n\n" + generatedCode);
  await loadShopkeeperOrders();
}


function copyShopkeeperTrackingId(code) {
  const clean = String(code || "").trim();
  if (!clean) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(clean)
      .then(() => alert("✅ Tracking ID copied."))
      .catch(() => alert("Tracking ID: " + clean));
  } else {
    alert("Tracking ID: " + clean);
  }
}


async function updateOrderStatus(orderId, status) {
  if (!shopkeeperUser || !supabaseClient) return;

  const { data: order, error } = await supabaseClient
    .from("orders")
    .select("id,tracking_code,status,delivery_latitude,delivery_longitude,tracking_updated_at")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    console.error(error);
    alert("Could not read this order. Check Supabase RLS policies.");
    return;
  }

  const { error: updateError } = await supabaseClient
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (updateError) {
    console.error(updateError);
    alert("Could not update order status. Check Supabase RLS policies.");
    return;
  }

  if (order.tracking_code) {
    await broadcastTrackingUpdate(order.tracking_code, {
      status,
      delivery_latitude: order.delivery_latitude,
      delivery_longitude: order.delivery_longitude,
      tracking_updated_at: order.tracking_updated_at
    });
  }

  if (status === "delivered" || status === "cancelled") {
    if (deliveryTrackingOrderId === String(orderId)) stopDeliveryTracking();
  }

  await loadShopkeeperOrders();
}

async function broadcastTrackingUpdate(code, payload = {}) {
  if (!supabaseClient || !code) return;
  const channel = supabaseClient.channel("order:" + code);
  try {
    await channel.send({
      type: "broadcast",
      event: "tracking_update",
      payload: {
        tracking_code: code,
        ...payload
      }
    });
  } catch (error) {
    console.warn("Tracking broadcast failed:", error);
  } finally {
    await supabaseClient.removeChannel(channel);
  }
}

function startDeliveryTracking(orderId, trackingCode) {
  if (!shopkeeperUser || !supabaseClient) {
    alert("Please login as shopkeeper first.");
    return;
  }

  if (!navigator.geolocation) {
    alert("This device/browser does not support GPS location.");
    return;
  }

  stopDeliveryTracking();

  deliveryTrackingOrderId = String(orderId);
  deliveryTrackingCode = String(trackingCode);
  lastDeliveryLocationUpdate = 0;

  supabaseClient
    .from("orders")
    .update({ status: "out_for_delivery" })
    .eq("id", deliveryTrackingOrderId)
    .then(async ({ error }) => {
      if (error) {
        console.error("Could not set delivery status:", error);
      } else {
        await broadcastTrackingUpdate(deliveryTrackingCode, { status: "out_for_delivery" });
      }
      await loadShopkeeperOrders();
    });

  alert("🛵 Live location started. Keep this page open while delivering the order.");

  deliveryWatchId = navigator.geolocation.watchPosition(async position => {
    const now = Date.now();
    if (now - lastDeliveryLocationUpdate < 5000) return;
    lastDeliveryLocationUpdate = now;

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const tracking_updated_at = new Date().toISOString();

    const { error } = await supabaseClient
      .from("orders")
      .update({
        delivery_latitude: latitude,
        delivery_longitude: longitude,
        tracking_updated_at
      })
      .eq("id", deliveryTrackingOrderId);

    if (error) {
      console.error(error);
      return;
    }

    await broadcastTrackingUpdate(deliveryTrackingCode, {
      status: "out_for_delivery",
      delivery_latitude: latitude,
      delivery_longitude: longitude,
      tracking_updated_at
    });
  }, error => {
    console.error(error);
    alert("GPS could not be read. Keep location permission enabled for this device.");
    stopDeliveryTracking();
  }, {
    enableHighAccuracy: true,
    maximumAge: 3000,
    timeout: 15000
  });
}

function stopDeliveryTracking() {
  if (deliveryWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(deliveryWatchId);
  }
  deliveryWatchId = null;
  deliveryTrackingOrderId = null;
  deliveryTrackingCode = null;
  lastDeliveryLocationUpdate = 0;
}

/* =========================
   SHOPKEEPER PANEL
========================= */

function openShopkeeperPanel() {

  if (!shopkeeperUser || !supabaseClient) {
    alert("🔐 Shopkeeper access requires a valid signed-in shopkeeper session.");
    openShopkeeperLogin();
    return;
  }

  let panel =
    $("shopkeeperPanel");

  if (panel) {

    panel.classList.remove("hidden");

    renderShopkeeperProducts();
    loadShopkeeperOrders();

    return;
  }

  panel =
    document.createElement("div");

  panel.id =
    "shopkeeperPanel";

  panel.style.position = "fixed";

  panel.style.inset = "0";

  panel.style.background = "#0009";

  panel.style.zIndex = "90";

  panel.style.overflow = "auto";

  panel.innerHTML = `

    <div style="
      background:white;
      width:min(600px,100%);
      min-height:100%;
      margin:auto;
      padding:20px;
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
      ">

        <h2>
          👨‍💼 Shopkeeper
        </h2>

        <button
          onclick="closeShopkeeperPanel()"
          style="
            border:0;
            background:#eee;
            border-radius:8px;
            padding:9px;
          ">

          ✕

        </button>

      </div>

      <p>
        Manage products, stock and customer orders from one place.
      </p>

      <div id="shopkeeperStats"
        style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0;">
        <div style="padding:12px;border-radius:12px;background:#ecfdf5;text-align:center;">
          <b id="statProducts">0</b><br><small>Products</small>
        </div>
        <div style="padding:12px;border-radius:12px;background:#eff6ff;text-align:center;">
          <b id="statStock">0</b><br><small>Stock items</small>
        </div>
        <div style="padding:12px;border-radius:12px;background:#fff7ed;text-align:center;">
          <b id="statOrders">0</b><br><small>Orders</small>
        </div>
      </div>

      <button
        type="button"
        onclick="loadProductsFromDatabase();loadShopkeeperOrders();"
        style="width:100%;padding:12px;border:0;border-radius:10px;background:#0f766e;color:white;font-weight:800;margin-bottom:10px;">
        🔄 Refresh Dashboard
      </button>

      <input
        id="productName"
        placeholder="Product name"
        style="
          width:100%;
          padding:12px;
          margin:6px 0;
          border:1px solid #ddd;
          border-radius:10px;
        "
      >

      <input
        id="productPrice"
        type="number"
        min="0"
        step="0.01"
        placeholder="Price"
        style="
          width:100%;
          padding:12px;
          margin:6px 0;
          border:1px solid #ddd;
          border-radius:10px;
        "
      >

      <select
        id="productUnit"
        style="
          width:100%;
          padding:12px;
          margin:6px 0;
          border:1px solid #ddd;
          border-radius:10px;
          background:white;
        "
      >
        <option value="kg">kg — per kilogram</option>
        <option value="g">g — per gram</option>
        <option value="bottle">bottle — per bottle</option>
        <option value="litre">litre — per litre</option>
        <option value="piece">piece — per piece</option>
        <option value="packet">packet — per packet</option>
        <option value="dozen">dozen — per dozen</option>
      </select>

      <input
        id="productCategory"
        placeholder="Category e.g. Staples"
        style="
          width:100%;
          padding:12px;
          margin:6px 0;
          border:1px solid #ddd;
          border-radius:10px;
        "
      >

      <input
        id="productStock"
        type="number"
        min="0"
        step="0.01"
        placeholder="Stock quantity (0 = out of stock)"
        style="
          width:100%;
          padding:12px;
          margin:6px 0;
          border:1px solid #ddd;
          border-radius:10px;
        "
      >

      <select
        id="productStockUnit"
        style="
          width:100%;
          padding:12px;
          margin:6px 0;
          border:1px solid #ddd;
          border-radius:10px;
          background:white;
        "
      >
        <option value="kg">kg — kilograms</option>
        <option value="g">g — grams</option>
        <option value="bottle">bottle — bottles</option>
        <option value="litre">litre — litres</option>
        <option value="piece">piece — pieces</option>
        <option value="packet">packet — packets</option>
        <option value="dozen">dozen — dozens</option>
      </select>

      <input
        id="productEmoji"
        placeholder="Emoji e.g. 🍚"
        style="
          width:100%;
          padding:12px;
          margin:6px 0;
          border:1px solid #ddd;
          border-radius:10px;
        "
      >

      <input
        id="productImage"
        placeholder="Product image URL (optional)"
        style="
          width:100%;
          padding:12px;
          margin:6px 0;
          border:1px solid #ddd;
          border-radius:10px;
        "
      >

      <button
        id="saveProductButton"
        onclick="saveProduct()"
        style="
          width:100%;
          padding:13px;
          border:0;
          border-radius:10px;
          background:#16a34a;
          color:white;
          font-weight:800;
          margin:8px 0;
        ">

        ➕ Add Product

      </button>

      <button
        id="cancelEditButton"
        onclick="cancelProductEdit()"
        style="
          display:none;
          width:100%;
          padding:12px;
          border:0;
          border-radius:10px;
          background:#64748b;
          color:white;
          font-weight:700;
          margin-bottom:10px;
        ">

        Cancel Edit

      </button>

      <hr>

      <h3>
        Products
      </h3>

      <div id="shopkeeperProducts"></div>

      <hr>

      <h3>📦 Customer Orders</h3>

      <button
        onclick="loadShopkeeperOrders()"
        style="width:100%;padding:12px;border:0;border-radius:10px;background:#2563eb;color:white;font-weight:800;margin-bottom:10px;">
        🔄 Refresh Orders
      </button>

      <div id="shopkeeperOrders"></div>

      <button
        onclick="shopkeeperLogout()"
        style="
          width:100%;
          padding:13px;
          border:0;
          border-radius:10px;
          background:#dc2626;
          color:white;
          font-weight:800;
          margin-top:20px;
        ">

        🔐 Logout

      </button>

    </div>
  `;

  document.body.appendChild(panel);

  renderShopkeeperProducts();
  loadShopkeeperOrders();
}

function closeShopkeeperPanel() {

  $("shopkeeperPanel")
    ?.remove();
}


/* =========================
   SAVE PRODUCT
========================= */

async function saveProduct() {

  if (!shopkeeperUser) {

    alert(
      "Please login as shopkeeper."
    );

    return;
  }

  const name =
    $("productName")
      ?.value.trim();

  const price =
    Number(
      $("productPrice")
        ?.value
    );

  const category =
    $("productCategory")
      ?.value.trim();

  const unit =
    $("productUnit")
      ?.value || "piece";

  const stock =
    Math.max(0, Number($("productStock")?.value || 0));

  const stock_unit =
    $("productStockUnit")?.value || unit;

  const emoji =
    $("productEmoji")
      ?.value.trim() ||
    "🛒";

  const image =
    $("productImage")
      ?.value.trim() ||
    null;


  if (!name) {

    alert(
      "Enter product name."
    );

    return;
  }

  if (!Number.isFinite(price) || price < 0) {

    alert(
      "Enter a valid price."
    );

    return;
  }

  if (!category) {

    alert(
      "Enter product category."
    );

    return;
  }


  let result;


  if (editingProductId) {

    result =
      await supabaseClient
        .from("products")
        .update({

          name,

          price,

          category,

          unit,

          stock,

          stock_unit,

          emoji,

          image_url: image,

          available: true

        })
        .eq(
          "id",
          editingProductId
        );

  } else {

    result =
      await supabaseClient
        .from("products")
        .insert({

          name,

          price,

          category,

          unit,

          stock,

          stock_unit,

          emoji,

          image_url: image,

          available: true

        });
  }


  if (result.error) {

    console.error(
      result.error
    );

    alert(
      "Could not save product:\n" +
      result.error.message
    );

    return;
  }


  alert(
    editingProductId
      ? "✅ Product updated."
      : "✅ Product added."
  );


  cancelProductEdit();

  await loadProductsFromDatabase();
}

function cancelProductEdit() {

  editingProductId = null;

  if ($("productName"))
    $("productName").value = "";

  if ($("productPrice"))
    $("productPrice").value = "";

  if ($("productCategory"))
    $("productCategory").value = "";

  if ($("productUnit"))
    $("productUnit").value = "piece";

  if ($("productStock"))
    $("productStock").value = "";

  if ($("productStockUnit"))
    $("productStockUnit").value = "piece";

  if ($("productEmoji"))
    $("productEmoji").value = "";

  if ($("productImage"))
    $("productImage").value = "";

  if ($("saveProductButton")) {

    $("saveProductButton")
      .textContent =
      "➕ Add Product";
  }

  if ($("cancelEditButton")) {

    $("cancelEditButton")
      .style.display =
      "none";
  }
}


/* =========================
   SHOPKEEPER PRODUCT LIST
========================= */

function renderShopkeeperStats(orderCount = null) {
  const productCount = products.filter(p => !String(p.id).startsWith("demo")).length;
  const stockCount = products.filter(p => Number(p.stock || 0) > 0 && !String(p.id).startsWith("demo")).length;

  if ($("statProducts")) $("statProducts").textContent = productCount;
  if ($("statStock")) $("statStock").textContent = stockCount;
  if ($("statOrders") && orderCount !== null) $("statOrders").textContent = orderCount;
}

function renderShopkeeperProducts() {

  const box =
    $("shopkeeperProducts");

  if (!box) return;

  renderShopkeeperStats();

  if (!products.length) {
    box.innerHTML = "<p>No products yet.</p>";
    return;
  }

  box.innerHTML =
    products.map(p => `

      <div style="
        border:1px solid #ddd;
        border-radius:12px;
        padding:12px;
        margin:8px 0;
      ">

        <b>
          ${p.emoji || "🛒"}
          ${escapeHtml(p.name)}
        </b>

        <br>

        ${money(p.price)} / ${escapeHtml(unitLabel(p.unit))}

        <br>

        <small>
          ${escapeHtml(
            p.category ||
            "General"
          )}
        </small>

        <div style="
          display:flex;
          gap:8px;
          margin-top:8px;
        ">

          <button
            onclick="editProduct('${String(p.id)}')"
            style="
              flex:1;
              padding:9px;
              border:0;
              border-radius:8px;
              background:#2563eb;
              color:white;
            ">

            ✏️ Edit

          </button>

          <button
            onclick="deleteProduct('${String(p.id)}')"
            style="
              flex:1;
              padding:9px;
              border:0;
              border-radius:8px;
              background:#dc2626;
              color:white;
            ">

            🗑️ Delete

          </button>

        </div>

      </div>

    `).join("");
}


/* =========================
   EDIT PRODUCT
========================= */

function editProduct(id) {

  const p =
    products.find(
      x => String(x.id) === String(id)
    );

  if (!p) return;

  editingProductId =
    p.id;

  $("productName").value =
    p.name || "";

  $("productPrice").value =
    p.price || "";

  $("productCategory").value =
    p.category || "";

  $("productUnit").value =
    p.unit || "piece";

  $("productStock").value =
    p.stock == null ? "" : p.stock;

  $("productStockUnit").value =
    p.stock_unit || p.unit || "piece";

  $("productEmoji").value =
    p.emoji || "";

  $("productImage").value =
    p.image_url || "";

  $("saveProductButton")
    .textContent =
    "💾 Update Product";

  $("cancelEditButton")
    .style.display =
    "block";

  $("shopkeeperPanel")
    ?.scrollTo({
      top: 0,
      behavior: "smooth"
    });
}


/* =========================
   DELETE PRODUCT
========================= */

async function deleteProduct(id) {

  if (!shopkeeperUser) {

    alert(
      "Please login first."
    );

    return;
  }

  const p =
    products.find(
      x => String(x.id) === String(id)
    );

  if (!p) return;

  const confirmed =
    confirm(
      "Delete " +
      p.name +
      "?"
    );

  if (!confirmed) return;

  const {
    error
  } =
    await supabaseClient
      .from("products")
      .delete()
      .eq("id", id);

  if (error) {

    alert(
      "Could not delete product:\n" +
      error.message
    );

    return;
  }

  alert(
    "✅ Product deleted."
  );

  await loadProductsFromDatabase();
}


/* =========================
   SHOPKEEPER LOGOUT
========================= */

async function shopkeeperLogout() {

  if (supabaseClient) {

    await supabaseClient.auth.signOut();
  }

  shopkeeperUser = null;

  closeShopkeeperPanel();

  alert(
    "Shopkeeper logged out."
  );
}


/* =========================
   AUTH SESSION
========================= */

function updateShopkeeperInterface() {
  const button = $("shopkeeperAccessButton");
  if (!button) return;

  const params = new URLSearchParams(window.location.search);
  const shopkeeperMode =
    params.get("shopkeeper") === "1" ||
    window.location.hash === "#shopkeeper";

  // Public customers do not see the shopkeeper entry point.
  // The shopkeeper can open the private entry page with ?shopkeeper=1.
  button.style.display = shopkeeperMode ? "" : "none";

  if (shopkeeperUser) {
    button.textContent = "👨‍💼 Shopkeeper Dashboard";
    button.onclick = () => openShopkeeperPanel();
  } else {
    button.textContent = "👨‍💼 Shopkeeper Login";
    button.onclick = () => openShopkeeperLogin();
  }
}

async function checkShopkeeperSession() {

  if (!supabaseClient) return;

  const {
    data
  } =
    await supabaseClient.auth
      .getSession();

  if (!data.session) {

    shopkeeperUser = null;
    updateShopkeeperInterface();

    return;
  }

  const user =
    data.session.user;

  const {
    data: profile
  } =
    await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

  if (
    profile &&
    profile.role === "shopkeeper"
  ) {

    shopkeeperUser =
      user;
  } else {
    shopkeeperUser = null;
  }

  updateShopkeeperInterface();
}


/* =========================
   SEARCH
========================= */

function setupSearch() {

  const search =
    $("search");

  if (!search) return;

  search.addEventListener(
    "input",
    renderProducts
  );
}


/* =========================
   BUTTON CONNECTIONS
========================= */

function setupButtons() {

  $("cartBtn")?.addEventListener(
    "click",
    openCart
  );

  $("closeCart")?.addEventListener(
    "click",
    closeCart
  );

  $("closeCheckout")?.addEventListener(
    "click",
    () => {
      $("checkout")
        ?.classList.add("hidden");
    }
  );

  $("orderBtn")?.addEventListener(
    "click",
    () => {

      if (!cartItemCount()) {

        alert(
          "Please add products first."
        );

        return;
      }

      setupCheckout();

      $("checkout")
        ?.classList.remove("hidden");
    }
  );

  $("sendOrder")?.addEventListener(
    "click",
    sendOrderToWhatsApp
  );
}


/* =========================
   HOLIDAY CHECK
========================= */

function isHoliday() {

  const day =
    new Date().getDate();

  return STORE.holidays.includes(day);
}

function showHolidayNotice() {

  if (!isHoliday()) return;

  const notice =
    document.createElement("div");

  notice.style.maxWidth =
    "1100px";

  notice.style.margin =
    "10px auto";

  notice.style.padding =
    "14px";

  notice.style.borderRadius =
    "12px";

  notice.style.background =
    "#fef3c7";

  notice.style.color =
    "#92400e";

  notice.style.fontWeight =
    "700";

  notice.textContent =
    "📅 Today is a store holiday. Orders may be processed on the next working day.";

  document
    .querySelector("main")
    ?.prepend(notice);
}


/* =========================
   INITIALIZE
========================= */

async function initApp() {

  setupLogo();

  setupStoreInfo();

  setupQuickActions();

  setupButtons();
  updateShopkeeperInterface();

  setupSearch();

  setupCheckout();

  // Render a starter catalogue immediately so products are visible
  // even while Supabase is connecting.
  loadFallbackProducts();
  renderCategories();
  renderProducts();
  renderCart();

  updateCartCount();

  showHolidayNotice();

  // Private shopkeeper entry: /?shopkeeper=1
  if (new URLSearchParams(window.location.search).get("shopkeeper") === "1") {
    setTimeout(() => openShopkeeperLogin(), 250);
  }

  try {

    await loadSupabase();

    await checkShopkeeperSession();

    await loadProductsFromDatabase();

  } catch (error) {

    console.error(
      "Supabase initialization failed:",
      error
    );

    loadFallbackProducts();

    renderCategories();

    renderProducts();

    renderShopkeeperProducts();
  }
}


/* =========================
   START
========================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initApp
  );

} else {

  initApp();
}
