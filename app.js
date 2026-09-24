/* =========================================================
   SHIVAM KIRANA STORE - COMPLETE APP.JS
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
  minimumOrder: 0,

  deliveryTime: "30 minutes",
  storeHours: "9:00 AM - 8:00 PM",
  deliveryHours: "10:00 AM - 7:00 PM",

  holidayDays: [1, 15],

  pickup: true,

  // Change this password if you want.
  shopkeeperPassword: "1234"
};


/* =========================
   DEFAULT PRODUCTS
   ========================= */

const defaultProducts = [
  {
    id: 1,
    name: "Rice 5 kg",
    price: 320,
    cat: "Staples",
    emoji: "🍚",
    active: true
  },
  {
    id: 2,
    name: "Wheat Flour 5 kg",
    price: 260,
    cat: "Staples",
    emoji: "🌾",
    active: true
  },
  {
    id: 3,
    name: "Sugar 1 kg",
    price: 48,
    cat: "Staples",
    emoji: "🧂",
    active: true
  },
  {
    id: 4,
    name: "Toor Dal 1 kg",
    price: 140,
    cat: "Pulses",
    emoji: "🫘",
    active: true
  },
  {
    id: 5,
    name: "Milk 1 L",
    price: 60,
    cat: "Dairy",
    emoji: "🥛",
    active: true
  },
  {
    id: 6,
    name: "Bread",
    price: 40,
    cat: "Bakery",
    emoji: "🍞",
    active: true
  },
  {
    id: 7,
    name: "Biscuits",
    price: 30,
    cat: "Snacks",
    emoji: "🍪",
    active: true
  },
  {
    id: 8,
    name: "Tea 250 g",
    price: 120,
    cat: "Beverages",
    emoji: "🍵",
    active: true
  },
  {
    id: 9,
    name: "Cooking Oil 1 L",
    price: 150,
    cat: "Staples",
    emoji: "🫗",
    active: true
  },
  {
    id: 10,
    name: "Bath Soap",
    price: 45,
    cat: "Personal Care",
    emoji: "🧼",
    active: true
  },
  {
    id: 11,
    name: "Shampoo",
    price: 90,
    cat: "Personal Care",
    emoji: "🧴",
    active: true
  },
  {
    id: 12,
    name: "Cold Drink",
    price: 50,
    cat: "Beverages",
    emoji: "🥤",
    active: true
  }
];


/* =========================
   LOAD PRODUCTS
   ========================= */

let products;

try {
  products = JSON.parse(
    localStorage.getItem("shivamProducts")
  );
} catch (e) {
  products = null;
}

if (!Array.isArray(products)) {
  products = defaultProducts;
}

products = products.map(product => ({
  ...product,
  active: product.active !== false
}));


/* =========================
   LOAD CART
   ========================= */

let cart;

try {
  cart = JSON.parse(
    localStorage.getItem("shivamCart") || "{}"
  );
} catch (e) {
  cart = {};
}


let category = "All";
let customerLocation = null;
let selectedOrderType = "delivery";


/* =========================
   HELPER
   ========================= */

const $ = id =>
  document.getElementById(id);


/* =========================
   ESCAPE HTML
   ========================= */

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================
   SAVE PRODUCTS
   ========================= */

function saveProducts() {
  localStorage.setItem(
    "shivamProducts",
    JSON.stringify(products)
  );
}


/* =========================
   SAVE CART
   ========================= */

function save() {
  localStorage.setItem(
    "shivamCart",
    JSON.stringify(cart)
  );

  renderCart();
  updateCartCount();
}


/* =========================
   ACTIVE PRODUCTS
   ========================= */

function activeProducts() {
  return products.filter(
    product => product.active !== false
  );
}


/* =========================
   CART COUNT
   ========================= */

function updateCartCount() {
  const count = Object.values(cart)
    .reduce(
      (total, quantity) =>
        total + Number(quantity),
      0
    );

  if ($("cartCount")) {
    $("cartCount").textContent = count;
  }
}


/* =========================
   CART TOTAL
   ========================= */

function cartTotal() {
  return Object.keys(cart)
    .reduce((total, id) => {

      const product =
        products.find(
          p => p.id == id
        );

      if (!product) {
        return total;
      }

      return total +
        Number(product.price) *
        Number(cart[id]);

    }, 0);
}


/* =========================
   CATEGORIES
   ========================= */

function renderCategories() {

  const box =
    $("categories");

  if (!box) return;

  const categories = [
    "All",
    ...new Set(
      activeProducts()
        .map(p => p.cat)
        .filter(Boolean)
    )
  ];

  box.innerHTML =
    categories.map(cat => `

      <button
        class="chip ${cat === category ? "active" : ""}"
        onclick="setCat('${escapeHTML(cat)}')">

        ${escapeHTML(cat)}

      </button>

    `).join("");
}


/* =========================
   CATEGORY
   ========================= */

function setCat(cat) {
  category = cat;

  renderCategories();
  renderProducts();
}


/* =========================
   RENDER PRODUCTS
   ========================= */

function renderProducts() {

  const box =
    $("products");

  if (!box) return;

  const search =
    $("search")
      ? $("search")
          .value
          .toLowerCase()
          .trim()
      : "";

  const list =
    activeProducts()
      .filter(product => {

        const categoryMatch =
          category === "All" ||
          product.cat === category;

        const searchMatch =
          product.name
            .toLowerCase()
            .includes(search);

        return categoryMatch &&
          searchMatch;
      });


  if (!list.length) {
    box.innerHTML =
      "<p>No products found.</p>";
    return;
  }


  box.innerHTML =
    list.map(product => `

      <article class="card">

        <div class="emoji">
          ${product.emoji || "🛒"}
        </div>

        <h3>
          ${escapeHTML(product.name)}
        </h3>

        <div class="price">
          ₹${Number(product.price)}
        </div>

        <button
          class="add"
          onclick="add(${product.id})">

          Add to Cart

        </button>

      </article>

    `).join("");
}


/* =========================
   ADD TO CART
   ========================= */

function add(id) {

  const product =
    products.find(
      p => p.id == id
    );

  if (!product) return;

  if (product.active === false) return;

  cart[id] =
    Number(cart[id] || 0) + 1;

  save();
}


/* =========================
   CHANGE QUANTITY
   ========================= */

function change(id, amount) {

  cart[id] =
    Number(cart[id] || 0) +
    Number(amount);

  if (cart[id] <= 0) {
    delete cart[id];
  }

  save();
}


/* =========================
   RENDER CART
   ========================= */

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

      const product =
        products.find(
          p => p.id == id
        );

      if (!product) return "";

      return `

        <div class="item">

          <div>

            <b>
              ${product.emoji || "🛒"}
              ${escapeHTML(product.name)}
            </b>

            <br>

            ₹${Number(product.price) *
              Number(cart[id])}

          </div>

          <div class="qty">

            <button
              onclick="change(${id}, -1)">
              −
            </button>

            ${cart[id]}

            <button
              onclick="change(${id}, 1)">
              +
            </button>

          </div>

        </div>

      `;

    }).join("");


  if ($("total")) {
    $("total").textContent =
      "₹" + cartTotal();
  }
}


/* =========================
   OPEN CART
   ========================= */

function openCart() {

  closeCheckout();
  closeShopkeeper();

  if ($("cartPanel")) {
    $("cartPanel")
      .classList
      .remove("hidden");
  }

  renderCart();
}


/* =========================
   CLOSE CART
   ========================= */

function closeCart() {

  if ($("cartPanel")) {
    $("cartPanel")
      .classList
      .add("hidden");
  }
}


/* =========================
   OPEN CHECKOUT
   ========================= */

function openCheckout() {

  if (!Object.keys(cart).length) {

    alert(
      "Please add products to your cart first."
    );

    return;
  }

  closeCart();
  closeShopkeeper();

  const checkout =
    $("checkout");

  if (!checkout) return;

  checkout.classList.remove("hidden");

  checkout.style.display = "grid";

  customerLocation = null;

  setupCheckout();
}


/* =========================
   CLOSE CHECKOUT
   ========================= */

function closeCheckout() {

  const checkout =
    $("checkout");

  if (!checkout) return;

  checkout.classList.add("hidden");

  checkout.style.display = "none";
}


/* =========================
   CHECKOUT SETUP
   ========================= */

function setupCheckout() {

  const checkout =
    $("checkout");

  if (!checkout) return;

  const box =
    checkout.querySelector(".modalBox");

  if (!box) return;


  /* Remove previous dynamic section */

  const old =
    $("checkoutExtra");

  if (old) {
    old.remove();
  }


  const extra =
    document.createElement("div");

  extra.id =
    "checkoutExtra";


  extra.innerHTML = `

    <h3>
      Order Type
    </h3>


    <label style="
      display:flex;
      align-items:center;
      gap:10px;
      padding:15px;
      border:1px solid #ddd;
      border-radius:12px;
      margin:8px 0;
      cursor:pointer;
    ">

      <input
        type="radio"
        name="orderType"
        value="delivery"
        checked
        onchange="setOrderType('delivery')">

      🚚 Home Delivery

    </label>


    <label style="
      display:flex;
      align-items:center;
      gap:10px;
      padding:15px;
      border:1px solid #ddd;
      border-radius:12px;
      margin:8px 0;
      cursor:pointer;
    ">

      <input
        type="radio"
        name="orderType"
        value="pickup"
        onchange="setOrderType('pickup')">

      🏪 Store Pickup

    </label>


    <div id="deliveryExtra">

      <textarea
        id="address"
        placeholder="Delivery address"></textarea>


      <input
        id="pin"
        placeholder="Delivery PIN code"
        inputmode="numeric"
        maxlength="6">


      <button
        type="button"
        onclick="checkDeliveryArea()"
        style="
          width:100%;
          padding:12px;
          margin:7px 0;
          border:0;
          border-radius:10px;
          background:#0f766e;
          color:white;
          font-weight:700;
        ">

        📍 Check Delivery Area

      </button>


      <p
        id="areaStatus"
        style="
          font-size:13px;
          margin:5px 0;
        "></p>


      <button
        type="button"
        onclick="getCustomerLocation()"
        style="
          width:100%;
          padding:12px;
          margin:7px 0;
          border:0;
          border-radius:10px;
          background:#2563eb;
          color:white;
          font-weight:700;
        ">

        📍 Use My Location

      </button>


      <p
        id="locationStatus"
        style="
          font-size:13px;
          color:#475569;
          margin:5px 0;
        ">

        Location not added

      </p>

    </div>


    <div
      id="pickupExtra"
      style="display:none;">

      <div style="
        background:#f0fdf4;
        padding:12px;
        border-radius:10px;
        margin:10px 0;
      ">

        🏪 <b>Store Pickup</b>

        <br><br>

        Store timing:
        ${STORE.storeHours}

      </div>

    </div>


    <h3>
      Payment
    </h3>


    <select
      id="paymentMethod"
      onchange="showPayment()">

      <option value="upi">
        💳 UPI
      </option>

      <option value="cod">
        💵 Cash on Delivery
      </option>

      <option value="store">
        🏪 Pay at Store
      </option>

    </select>


    <div id="paymentInfo"></div>

  `;


  const sendButton =
    $("sendOrder");

  if (sendButton) {

    box.insertBefore(
      extra,
      sendButton
    );

  } else {

    box.appendChild(extra);
  }


  selectedOrderType =
    "delivery";

  showPayment();


  /* Force checkout close button */

  const closeButton =
    $("closeCheckout");

  if (closeButton) {

    closeButton.style.zIndex =
      "99999";

    closeButton.style.pointerEvents =
      "auto";

    closeButton.onclick =
      function(event) {

        event.preventDefault();
        event.stopPropagation();

        closeCheckout();

      };
  }
}


/* =========================
   ORDER TYPE
   ========================= */

function setOrderType(type) {

  selectedOrderType =
    type;


  const delivery =
    $("deliveryExtra");

  const pickup =
    $("pickupExtra");


  if (delivery) {

    delivery.style.display =
      type === "delivery"
        ? "block"
        : "none";
  }


  if (pickup) {

    pickup.style.display =
      type === "pickup"
        ? "block"
        : "none";
  }
}


/* =========================
   DELIVERY AREA
   ========================= */

function checkDeliveryArea() {

  const pin =
    $("pin");

  const status =
    $("areaStatus");

  if (!pin || !status) return;


  const value =
    pin.value.trim();


  if (value === STORE.deliveryPin) {

    status.textContent =
      "✅ Delivery is available in your area.";

    status.style.color =
      "#15803d";

  } else {

    status.textContent =
      "❌ Delivery is available only for PIN " +
      STORE.deliveryPin +
      ".";

    status.style.color =
      "#dc2626";
  }
}


/* =========================
   CUSTOMER LOCATION
   ========================= */

function getCustomerLocation() {

  const status =
    $("locationStatus");

  if (!status) return;


  if (!navigator.geolocation) {

    status.textContent =
      "❌ Location is not supported on this device.";

    return;
  }


  status.textContent =
    "📍 Getting your location...";


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


      status.innerHTML =
        "✅ Location added<br>" +
        "Accuracy: about " +
        Math.round(
          position.coords.accuracy
        ) +
        " metres";

      status.style.color =
        "#15803d";
    },


    error => {

      if (error.code === 1) {

        status.textContent =
          "❌ Location permission denied. Please allow location access.";

      } else {

        status.textContent =
          "❌ Could not get your location.";

      }

      status.style.color =
        "#dc2626";
    },


    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}


/* =========================
   PAYMENT
   ========================= */

function showPayment() {

  const select =
    $("paymentMethod");

  const info =
    $("paymentInfo");

  if (!select || !info) return;


  if (select.value === "upi") {

    info.innerHTML = `

      <div style="
        background:#f0fdf4;
        padding:12px;
        border-radius:10px;
        margin:8px 0;
      ">

        <b>UPI ID</b>

        <br>

        ${escapeHTML(STORE.upi)}

        <br><br>

        <button
          type="button"
          onclick="payByUPI()"
          style="
            width:100%;
            padding:12px;
            border:0;
            border-radius:10px;
            background:#16a34a;
            color:white;
            font-weight:700;
          ">

          💳 Pay by UPI

        </button>

      </div>

    `;

  } else if (select.value === "cod") {

    info.innerHTML = `

      <div style="
        background:#fff7ed;
        padding:12px;
        border-radius:10px;
        margin:8px 0;
      ">

        💵 <b>Cash on Delivery</b>

        <br>

        Pay when your order is delivered.

      </div>

    `;

  } else {

    info.innerHTML = `

      <div style="
        background:#eff6ff;
        padding:12px;
        border-radius:10px;
        margin:8px 0;
      ">

        🏪 <b>Pay at Store</b>

        <br>

        Pay when collecting your order.

      </div>

    `;
  }
}


/* =========================
   UPI
   ========================= */

function payByUPI() {

  if (!Object.keys(cart).length) {

    alert(
      "Please add products first."
    );

    return;
  }


  const amount =
    cartTotal();


  const url =
    "upi://pay" +
    "?pa=" +
    encodeURIComponent(STORE.upi) +
    "&pn=" +
    encodeURIComponent(STORE.name) +
    "&am=" +
    encodeURIComponent(amount) +
    "&cu=INR";


  window.location.href =
    url;
}


/* =========================
   SEND ORDER TO WHATSAPP
   ========================= */

function sendOrderToWhatsApp() {

  if (!Object.keys(cart).length) {

    alert(
      "Your cart is empty."
    );

    return;
  }


  const name =
    $("name")
      ? $("name")
          .value
          .trim()
      : "";


  const phone =
    $("phone")
      ? $("phone")
          .value
          .trim()
      : "";


  if (!name || !phone) {

    alert(
      "Please enter your name and phone number."
    );

    return;
  }


  let address = "";
  let pin = "";


  if (
    selectedOrderType ===
    "delivery"
  ) {

    address =
      $("address")
        ? $("address")
            .value
            .trim()
        : "";


    pin =
      $("pin")
        ? $("pin")
            .value
            .trim()
        : "";


    if (!address) {

      alert(
        "Please enter your delivery address."
      );

      return;
    }


    if (
      pin !==
      STORE.deliveryPin
    ) {

      alert(
        "Delivery is available only for PIN " +
        STORE.deliveryPin +
        "."
      );

      return;
    }
  }


  const payment =
    $("paymentMethod")
      ? $("paymentMethod").value
      : "upi";


  let paymentText =
    "UPI";


  if (payment === "cod") {
    paymentText =
      "Cash on Delivery";
  }


  if (payment === "store") {
    paymentText =
      "Pay at Store";
  }


  const items =
    Object.keys(cart)
      .map(id => {

        const product =
          products.find(
            p => p.id == id
          );

        if (!product) return "";

        return (
          product.name +
          " x " +
          cart[id] +
          " = ₹" +
          (
            Number(product.price) *
            Number(cart[id])
          )
        );

      })
      .filter(Boolean);


  let locationText =
    "Location not shared";


  if (customerLocation) {

    locationText =
      "📍 Customer Location:\n" +
      "https://www.google.com/maps?q=" +
      customerLocation.latitude +
      "," +
      customerLocation.longitude;
  }


  const orderType =
    selectedOrderType ===
    "delivery"
      ? "Home Delivery"
      : "Store Pickup";


  const message =
`Hello ${STORE.name},

I want to place an order.

Customer:
${name}

Phone:
${phone}

Order Type:
${orderType}

${address ? "Address:\n" + address + "\n" : ""}
${pin ? "PIN:\n" + pin + "\n" : ""}

Products:
${items.join("\n")}

Total:
₹${cartTotal()}

Payment:
${paymentText}

${selectedOrderType === "delivery"
  ? "Delivery time: " + STORE.deliveryTime
  : "Store Pickup"}

${locationText}

Thank you.`;


  const whatsapp =
    "https://wa.me/" +
    STORE.whatsapp +
    "?text=" +
    encodeURIComponent(
      message
    );


  window.open(
    whatsapp,
    "_blank"
  );
}


/* =========================================================
   SHOPKEEPER SECTION
   ========================================================= */


/* =========================
   CREATE SHOPKEEPER BUTTON
   ========================= */

function createShopkeeperButton() {

  /*
     Remove any old shopkeeper button
     created by an earlier version.
  */

  document
    .querySelectorAll(
      ".shivam-shopkeeper-button"
    )
    .forEach(button => {
      button.remove();
    });


  const quickActions =
    $("quickActions");


  /*
     If quickActions exists,
     put the button inside it.
  */

  if (quickActions) {

    const button =
      document.createElement("button");

    button.type =
      "button";

    button.className =
      "shivam-shopkeeper-button";


    button.textContent =
      "👨‍💼 Shopkeeper - Add Products";


    button.style.cssText = `
      width:100%;
      display:block;
      padding:13px;
      margin-top:8px;
      border:2px solid #16a34a;
      border-radius:12px;
      background:#ffffff;
      color:#166534;
      font-weight:800;
      font-size:15px;
      cursor:pointer;
      position:relative;
      z-index:10;
    `;


    button.onclick =
      function(event) {

        event.preventDefault();
        event.stopPropagation();

        openShopkeeper();

      };


    quickActions.appendChild(
      button
    );

    return;
  }


  /*
     If quickActions does NOT exist,
     create a completely new visible
     shopkeeper area.
  */

  const main =
    document.querySelector("main");


  if (!main) return;


  const section =
    document.createElement("section");


  section.id =
    "shopkeeperQuickSection";


  section.style.cssText = `
    max-width:1100px;
    margin:12px auto;
    padding:0 5%;
  `;


  section.innerHTML = `

    <button
      type="button"
      class="shivam-shopkeeper-button"
      onclick="openShopkeeper()"
      style="
        width:100%;
        display:block;
        padding:13px;
        border:2px solid #16a34a;
        border-radius:12px;
        background:white;
        color:#166534;
        font-weight:800;
        font-size:15px;
        cursor:pointer;
      ">

      👨‍💼 Shopkeeper - Add Products

    </button>

  `;


  const hero =
    document.querySelector(".hero");


  if (hero) {

    hero.after(section);

  } else {

    main.prepend(section);

  }
}


/* =========================
   QUICK ACTIONS
   ========================= */

function createQuickActions() {

  const old =
    $("quickActions");


  if (old) {

    /*
       Make sure Shopkeeper button
       is always added.
    */

    createShopkeeperButton();

    return;
  }


  const main =
    document.querySelector("main");


  if (!main) return;


  const section =
    document.createElement("section");


  section.id =
    "quickActions";


  section.style.cssText = `
    max-width:1100px;
    margin:15px auto;
    padding:0 5%;
  `;


  section.innerHTML = `

    <div style="
      display:grid;
      grid-template-columns:
      repeat(2,minmax(0,1fr));
      gap:8px;
    ">

      <button
        type="button"
        onclick="openCheckout()"
        style="
          padding:12px;
          border:0;
          border-radius:12px;
          background:#16a34a;
          color:white;
          font-weight:700;
          cursor:pointer;
        ">

        🛒 Order Now

      </button>


      <button
        type="button"
        onclick="showDeliveryInfo()"
        style="
          padding:12px;
          border:0;
          border-radius:12px;
          background:#0f766e;
          color:white;
          font-weight:700;
          cursor:pointer;
        ">

        🚚 Delivery

      </button>


      <button
        type="button"
        onclick="showPickupInfo()"
        style="
          padding:12px;
          border:0;
          border-radius:12px;
          background:#2563eb;
          color:white;
          font-weight:700;
          cursor:pointer;
        ">

        🏪 Pickup

      </button>


      <button
        type="button"
        onclick="showPaymentInfo()"
        style="
          padding:12px;
          border:0;
          border-radius:12px;
          background:#7c3aed;
          color:white;
          font-weight:700;
          cursor:pointer;
        ">

        💳 Payment

      </button>


      <button
        type="button"
        onclick="showHelp()"
        style="
          padding:12px;
          border:0;
          border-radius:12px;
          background:#475569;
          color:white;
          font-weight:700;
          cursor:pointer;
        ">

        ❓ Help

      </button>


      <button
        type="button"
        onclick="openWhatsApp()"
        style="
          padding:12px;
          border:0;
          border-radius:12px;
          background:#16a34a;
          color:white;
          font-weight:700;
          cursor:pointer;
        ">

        💬 WhatsApp

      </button>

    </div>

  `;


  const hero =
    document.querySelector(".hero");


  if (hero) {

    hero.after(section);

  } else {

    main.prepend(section);

  }


  /*
     IMPORTANT:
     Always add Shopkeeper button
     AFTER quick actions.
  */

  createShopkeeperButton();
}


/* =========================
   OPEN SHOPKEEPER
   ========================= */

function openShopkeeper() {

  /*
     Close everything else first.
  */

  closeCart();
  closeCheckout();


  const password =
    prompt(
      "👨‍💼 Enter Shopkeeper Password"
    );


  if (
    password !==
    STORE.shopkeeperPassword
  ) {

    if (password !== null) {

      alert(
        "❌ Incorrect password."
      );

    }

    return;
  }


  let panel =
    $("shopkeeper");


  if (!panel) {

    createShopkeeperPanel();

    panel =
      $("shopkeeper");
  }


  if (!panel) return;


  panel.classList.remove(
    "hidden"
  );


  panel.style.display =
    "grid";


  panel.style.zIndex =
    "99999";


  renderAdminProducts();
}


/* =========================
   CREATE SHOPKEEPER PANEL
   ========================= */

function createShopkeeperPanel() {

  /*
     Remove old panel if it somehow exists.
  */

  const old =
    $("shopkeeper");

  if (old) {
    old.remove();
  }


  const panel =
    document.createElement("div");


  panel.id =
    "shopkeeper";

  panel.className =
    "modal";


  panel.style.zIndex =
    "99999";


  panel.innerHTML = `

    <div
      class="modalBox shopkeeperBox"
      style="
        max-height:90vh;
        overflow-y:auto;
        position:relative;
      ">


      <button
        id="closeShopkeeper"
        class="close"
        type="button"
        aria-label="Close">

        ✕

      </button>


      <h2>
        👨‍💼 Shopkeeper
      </h2>


      <p style="
        color:#64748b;
      ">

        Add and manage products.

      </p>


      <input
        id="adminProductName"
        type="text"
        placeholder="Product name">


      <input
        id="adminProductPrice"
        type="number"
        min="0"
        placeholder="Price">


      <input
        id="adminProductCategory"
        type="text"
        placeholder="Category">


      <input
        id="adminProductEmoji"
        type="text"
        placeholder="Emoji e.g. 🍚">


      <button
        id="addShopProductButton"
        type="button"
        class="primary"
        style="
          margin-top:5px;
        ">

        ➕ Add Product

      </button>


      <h3
        style="
          margin-top:22px;
        ">

        Products

      </h3>


      <div
        id="adminProducts">
      </div>


    </div>

  `;


  document.body.appendChild(
    panel
  );


  const closeButton =
    $("closeShopkeeper");


  if (closeButton) {

    closeButton.onclick =
      function(event) {

        event.preventDefault();
        event.stopPropagation();

        closeShopkeeper();

      };
  }


  const addButton =
    $("addShopProductButton");


  if (addButton) {

    addButton.onclick =
      addShopProduct;

  }


  /*
     Also allow tapping outside
     the shopkeeper box to close.
  */

  panel.addEventListener(
    "click",
    function(event) {

      if (
        event.target === panel
      ) {

        closeShopkeeper();

      }

    }
  );
}


/* =========================
   CLOSE SHOPKEEPER
   ========================= */

function closeShopkeeper() {

  const panel =
    $("shopkeeper");

  if (!panel) return;


  panel.classList.add(
    "hidden"
  );


  panel.style.display =
    "none";
}


/* =========================
   ADMIN PRODUCT LIST
   ========================= */

function renderAdminProducts() {

  const box =
    $("adminProducts");

  if (!box) return;


  if (!products.length) {

    box.innerHTML =
      "<p>No products available.</p>";

    return;
  }


  box.innerHTML =
    products.map(product => `

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
        padding:12px 0;
        border-bottom:1px solid #eee;
      ">

        <div style="
          min-width:0;
          flex:1;
        ">

          <b>
            ${product.emoji || "🛒"}
            ${escapeHTML(product.name)}
          </b>

          <br>

          ₹${Number(product.price)}

          <br>

          <small>

            ${escapeHTML(
              product.cat || "General"
            )}

            <br>

            ${
              product.active !== false
                ? "✅ Available"
                : "❌ Hidden"
            }

          </small>

        </div>


        <div style="
          display:flex;
          gap:5px;
          flex-wrap:wrap;
        ">

          <button
            type="button"
            onclick="editProduct(${product.id})"
            title="Edit">

            ✏️

          </button>


          <button
            type="button"
            onclick="toggleProduct(${product.id})"
            title="Show/Hide">

            ${
              product.active !== false
                ? "🙈"
                : "👁️"
            }

          </button>


          <button
            type="button"
            onclick="deleteProduct(${product.id})"
            title="Delete">

            🗑️

          </button>

        </div>

      </div>

    `).join("");
}


/* =========================
   ADD PRODUCT
   ========================= */

function addShopProduct() {

  const name =
    $("adminProductName")
      ? $("adminProductName")
          .value
          .trim()
      : "";


  const price =
    $("adminProductPrice")
      ? Number(
          $("adminProductPrice").value
        )
      : 0;


  const category =
    $("adminProductCategory")
      ? $("adminProductCategory")
          .value
          .trim()
      : "";


  const emoji =
    $("adminProductEmoji")
      ? $("adminProductEmoji")
          .value
          .trim()
      : "";


  if (!name) {

    alert(
      "Please enter product name."
    );

    return;
  }


  if (
    !Number.isFinite(price) ||
    price < 0
  ) {

    alert(
      "Please enter a valid price."
    );

    return;
  }


  if (!category) {

    alert(
      "Please enter a category."
    );

    return;
  }


  products.push({

    id:
      Date.now(),

    name:
      name,

    price:
      price,

    cat:
      category,

    emoji:
      emoji || "🛒",

    active:
      true

  });


  saveProducts();


  $("adminProductName").value =
    "";

  $("adminProductPrice").value =
    "";

  $("adminProductCategory").value =
    "";

  $("adminProductEmoji").value =
    "";


  renderAdminProducts();

  renderCategories();

  renderProducts();


  alert(
    "✅ Product added successfully!"
  );
}


/* =========================
   EDIT PRODUCT
   ========================= */

function editProduct(id) {

  const product =
    products.find(
      p => p.id == id
    );

  if (!product) return;


  const name =
    prompt(
      "Product name:",
      product.name
    );

  if (name === null) return;


  const price =
    prompt(
      "Price:",
      product.price
    );

  if (price === null) return;


  const category =
    prompt(
      "Category:",
      product.cat
    );

  if (category === null) return;


  const emoji =
    prompt(
      "Emoji:",
      product.emoji || "🛒"
    );

  if (emoji === null) return;


  if (
    !name.trim() ||
    !Number.isFinite(
      Number(price)
    )
  ) {

    alert(
      "Invalid product details."
    );

    return;
  }


  product.name =
    name.trim();

  product.price =
    Number(price);

  product.cat =
    category.trim();

  product.emoji =
    emoji.trim() || "🛒";


  saveProducts();

  renderAdminProducts();
  renderCategories();
  renderProducts();
}


/* =========================
   HIDE / SHOW PRODUCT
   ========================= */

function toggleProduct(id) {

  const product =
    products.find(
      p => p.id == id
    );

  if (!product) return;


  product.active =
    product.active === false;


  saveProducts();

  renderAdminProducts();
  renderCategories();
  renderProducts();
}


/* =========================
   DELETE PRODUCT
   ========================= */

function deleteProduct(id) {

  const product =
    products.find(
      p => p.id == id
    );

  if (!product) return;


  const answer =
    confirm(
      'Delete "' +
      product.name +
      '"?'
    );


  if (!answer) return;


  products =
    products.filter(
      p => p.id != id
    );


  delete cart[id];


  saveProducts();
  save();


  renderAdminProducts();
  renderCategories();
  renderProducts();


  alert(
    "✅ Product deleted."
  );
}


/* =========================
   INFORMATION
   ========================= */

function showDeliveryInfo() {

  alert(
`🚚 DELIVERY

Delivery time:
${STORE.deliveryTime}

Delivery hours:
${STORE.deliveryHours}

Delivery PIN:
${STORE.deliveryPin}

Delivery charge:
FREE

Minimum order:
NO MINIMUM ORDER

Holiday:
1st and 15th of every month`
  );
}


function showPickupInfo() {

  alert(
`🏪 STORE PICKUP

Pickup is available.

Store timing:
${STORE.storeHours}

Place your order online and collect it from the store.`
  );
}


function showPaymentInfo() {

  alert(
`💳 PAYMENT

UPI:
${STORE.upi}

Cash on Delivery:
Available

Pay at Store:
Available

Delivery charge:
FREE`
  );
}


function showHelp() {

  alert(
`❓ HOW TO ORDER

1. Add products to Cart.

2. Open Cart.

3. Tap Place Order.

4. Enter your name and phone number.

5. Select Home Delivery or Store Pickup.

6. For delivery, enter PIN ${STORE.deliveryPin}.

7. You can share your location.

8. Select payment method.

9. Tap Send Order.

WhatsApp:
+91 72319 27995`
  );
}


/* =========================
   WHATSAPP
   ========================= */

function openWhatsApp() {

  window.open(
    "https://wa.me/" +
    STORE.whatsapp,
    "_blank"
  );
}


/* =========================
   EVENT CONNECTIONS
   ========================= */

if ($("search")) {

  $("search").oninput =
    renderProducts;
}


if ($("cartBtn")) {

  $("cartBtn").onclick =
    openCart;
}


if ($("closeCart")) {

  $("closeCart").onclick =
    closeCart;
}


if ($("orderBtn")) {

  $("orderBtn").onclick =
    openCheckout;
}


if ($("closeCheckout")) {

  $("closeCheckout").onclick =
    closeCheckout;
}


if ($("sendOrder")) {

  $("sendOrder").onclick =
    sendOrderToWhatsApp;
}


/* =========================
   START APP
   ========================= */

function startShivamStore() {

  renderCategories();

  renderProducts();

  renderCart();

  updateCartCount();

  saveProducts();

  /*
     Create the quick buttons.
     This ALWAYS creates the
     Shopkeeper button afterward.
  */

  createQuickActions();

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
    startShivamStore
  );

} else {

  startShivamStore();

}
