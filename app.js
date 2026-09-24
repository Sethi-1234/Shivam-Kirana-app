/* =========================================================
   SHIVAM KIRANA STORE
   COMPLETE APP.JS
   ========================================================= */


/* =========================================================
   STORE SETTINGS
   ========================================================= */

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

  shopkeeperPassword: "1234"
};


/* =========================================================
   PRODUCTS
   ========================================================= */

let defaultProducts = [

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


let products = JSON.parse(
  localStorage.getItem("shivamProducts") || "null"
);

if (!Array.isArray(products)) {
  products = defaultProducts;
}


/* Make old products compatible */

products = products.map(p => ({
  ...p,
  active: p.active !== false
}));


/* =========================================================
   CART
   ========================================================= */

let cart = JSON.parse(
  localStorage.getItem("shivamCart") || "{}"
);

let category = "All";

let customerLocation = null;

let selectedOrderType = "delivery";


/* =========================================================
   SHORT ID FUNCTION
   ========================================================= */

const $ = id => document.getElementById(id);


/* =========================================================
   SAVE PRODUCTS
   ========================================================= */

function saveProducts() {

  localStorage.setItem(
    "shivamProducts",
    JSON.stringify(products)
  );

}


/* =========================================================
   SAVE CART
   ========================================================= */

function save() {

  localStorage.setItem(
    "shivamCart",
    JSON.stringify(cart)
  );

  renderCart();

  updateCartCount();

}


/* =========================================================
   CART COUNT
   ========================================================= */

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


/* =========================================================
   CART TOTAL
   ========================================================= */

function cartTotal() {

  return Object.keys(cart)
    .reduce((total, id) => {

      const product =
        products.find(
          p => p.id == id
        );

      if (!product) return total;

      return total +
        Number(product.price) *
        Number(cart[id]);

    }, 0);

}


/* =========================================================
   ACTIVE PRODUCTS
   ========================================================= */

function activeProducts() {

  return products.filter(
    p => p.active !== false
  );

}


/* =========================================================
   CATEGORIES
   ========================================================= */

function renderCategories() {

  const box = $("categories");

  if (!box) return;

  const cats = [
    "All",
    ...new Set(
      activeProducts()
        .map(p => p.cat)
        .filter(Boolean)
    )
  ];

  box.innerHTML =
    cats.map(c => `

      <button
        class="chip ${c === category ? "active" : ""}"
        onclick="setCat('${escapeHTML(c)}')">

        ${escapeHTML(c)}

      </button>

    `).join("");

}


/* =========================================================
   CATEGORY
   ========================================================= */

function setCat(c) {

  category = c;

  renderCategories();

  renderProducts();

}


/* =========================================================
   PRODUCTS
   ========================================================= */

function renderProducts() {

  const box = $("products");

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
      .filter(p => {

        const categoryMatch =
          category === "All" ||
          p.cat === category;

        const searchMatch =
          p.name
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
    list.map(p => `

      <article class="card">

        <div class="emoji">
          ${p.emoji || "🛒"}
        </div>

        <h3>
          ${escapeHTML(p.name)}
        </h3>

        <div class="price">
          ₹${Number(p.price)}
        </div>

        <button
          class="add"
          onclick="add(${p.id})">

          Add to Cart

        </button>

      </article>

    `).join("");

}


/* =========================================================
   ADD TO CART
   ========================================================= */

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


/* =========================================================
   CHANGE QUANTITY
   ========================================================= */

function change(id, amount) {

  cart[id] =
    Number(cart[id] || 0) +
    Number(amount);


  if (cart[id] <= 0) {

    delete cart[id];

  }


  save();

}


/* =========================================================
   RENDER CART
   ========================================================= */

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
      $("total").textContent =
        "₹0";
    }

    return;

  }


  box.innerHTML =
    ids.map(id => {

      const p =
        products.find(
          x => x.id == id
        );

      if (!p) return "";

      return `

        <div class="item">

          <div>

            <b>
              ${p.emoji || "🛒"}
              ${escapeHTML(p.name)}
            </b>

            <br>

            ₹${Number(p.price) *
              Number(cart[id])}

          </div>

          <div class="qty">

            <button
              onclick="change(${id},-1)">
              −
            </button>

            ${cart[id]}

            <button
              onclick="change(${id},1)">
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


/* =========================================================
   OPEN CART
   ========================================================= */

function openCart() {

  if ($("checkout")) {

    $("checkout")
      .classList
      .add("hidden");

  }

  if ($("shopkeeper")) {

    $("shopkeeper")
      .classList
      .add("hidden");

  }

  if ($("cartPanel")) {

    $("cartPanel")
      .classList
      .remove("hidden");

  }

  renderCart();

}


/* =========================================================
   CLOSE CART
   ========================================================= */

function closeCart() {

  if ($("cartPanel")) {

    $("cartPanel")
      .classList
      .add("hidden");

  }

}


/* =========================================================
   OPEN CHECKOUT
   ========================================================= */

function openCheckout() {

  if (!Object.keys(cart).length) {

    alert(
      "Please add products to your cart first."
    );

    return;

  }


  closeCart();


  if ($("shopkeeper")) {

    $("shopkeeper")
      .classList
      .add("hidden");

  }


  if ($("checkout")) {

    $("checkout")
      .classList
      .remove("hidden");

  }


  customerLocation = null;

  setupCheckout();

}


/* =========================================================
   CLOSE CHECKOUT
   ========================================================= */

function closeCheckout() {

  const checkout =
    $("checkout");

  if (!checkout) return;

  checkout.classList.add("hidden");

  checkout.style.display = "none";


  setTimeout(() => {

    checkout.style.display = "";

  }, 10);

}


/* =========================================================
   ORDER TYPE
   ========================================================= */

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


/* =========================================================
   CHECKOUT SETUP
   ========================================================= */

function setupCheckout() {

  const checkout =
    $("checkout");

  if (!checkout) return;


  const box =
    checkout.querySelector(
      ".modalBox"
    );

  if (!box) return;


  let old =
    $("checkoutExtra");


  if (old) {

    old.remove();

  }


  const sendButton =
    $("sendOrder");


  const extra =
    document.createElement("div");


  extra.id =
    "checkoutExtra";


  extra.innerHTML = `

    <h3 style="margin-top:18px;">
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


    <div
      id="deliveryExtra">

      <textarea
        id="address"
        placeholder="Delivery address"
        style="
          width:100%;
          padding:12px;
          margin:7px 0;
          border:1px solid #ddd;
          border-radius:10px;
          font:inherit;
          min-height:90px;
        "></textarea>


      <input
        id="pin"
        placeholder="Delivery PIN code"
        inputmode="numeric"
        maxlength="6"
        style="
          width:100%;
          padding:12px;
          margin:7px 0;
          border:1px solid #ddd;
          border-radius:10px;
          font:inherit;
        ">


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

        <br>

        Your order will be ready
        for pickup at the store.

        <br>

        Store timing:
        ${STORE.storeHours}

      </div>

    </div>


    <h3 style="margin-top:18px;">
      Payment
    </h3>


    <select
      id="paymentMethod"
      onchange="showPayment()"
      style="
        width:100%;
        padding:12px;
        margin:7px 0;
        border:1px solid #ddd;
        border-radius:10px;
        font:inherit;
      ">

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


    <div
      id="paymentInfo"
      style="
        background:#f0fdf4;
        padding:12px;
        border-radius:10px;
        margin:8px 0;
      "></div>

  `;


  if (sendButton) {

    box.insertBefore(
      extra,
      sendButton
    );

  } else {

    box.appendChild(extra);

  }


  showPayment();

  setOrderType("delivery");


  /* Make close button definitely clickable */

  const close =
    $("closeCheckout");

  if (close) {

    close.style.position =
      "absolute";

    close.style.zIndex =
      "9999";

    close.style.pointerEvents =
      "auto";

    close.onclick =
      closeCheckout;

  }

}


/* =========================================================
   DELIVERY AREA
   ========================================================= */

function checkDeliveryArea() {

  const pin =
    $("pin");

  const status =
    $("areaStatus");


  if (!pin || !status) return;


  const value =
    pin.value.trim();


  if (value === STORE.deliveryPin) {

    status.innerHTML =
      "✅ Delivery available in your area.";

    status.style.color =
      "#15803d";

  } else {

    status.innerHTML =
      "❌ Sorry, delivery is currently available only for PIN " +
      STORE.deliveryPin +
      ".";

    status.style.color =
      "#dc2626";

  }

}


/* =========================================================
   CUSTOMER LOCATION
   ========================================================= */

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

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;


      customerLocation = {

        latitude,

        longitude,

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

      let message =
        "❌ Could not get location.";

      if (error.code === 1) {

        message =
          "❌ Location permission was denied. Please allow location access.";

      }

      status.textContent =
        message;

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


/* =========================================================
   PAYMENT DISPLAY
   ========================================================= */

function showPayment() {

  const select =
    $("paymentMethod");

  const info =
    $("paymentInfo");


  if (!select || !info) return;


  const method =
    select.value;


  if (method === "upi") {

    info.innerHTML = `

      <b>UPI ID</b>

      <br>

      ${STORE.upi}

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

    `;

  }


  else if (method === "cod") {

    info.innerHTML = `

      💵 <b>Cash on Delivery</b>

      <br>

      Pay when your order is delivered.

    `;

  }


  else {

    info.innerHTML = `

      🏪 <b>Pay at Store</b>

      <br>

      Payment can be made when
      collecting your order.

    `;

  }

}


/* =========================================================
   UPI PAYMENT
   ========================================================= */

function payByUPI() {

  if (!Object.keys(cart).length) {

    alert(
      "Please add products first."
    );

    return;

  }


  const amount =
    cartTotal();


  const upiURL =
    "upi://pay" +
    "?pa=" +
    encodeURIComponent(STORE.upi) +
    "&pn=" +
    encodeURIComponent(STORE.name) +
    "&am=" +
    encodeURIComponent(amount) +
    "&cu=INR";


  window.location.href =
    upiURL;

}


/* =========================================================
   SEND ORDER
   ========================================================= */

function sendOrderToWhatsApp() {

  if (!Object.keys(cart).length) {

    alert(
      "Please add products first."
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
        "Delivery is currently available only for PIN " +
        STORE.deliveryPin +
        "."
      );

      return;

    }

  }


  const payment =
    $("paymentMethod")
      ? $("paymentMethod")
          .value
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


  const lines =
    Object.keys(cart)
      .map(id => {

        const p =
          products.find(
            x => x.id == id
          );

        if (!p) return "";

        return (
          p.name +
          " x " +
          cart[id] +
          " = ₹" +
          (
            Number(p.price) *
            Number(cart[id])
          )
        );

      })
      .filter(Boolean);


  const total =
    cartTotal();


  let locationText =
    "Location not shared";


  if (customerLocation) {

    const lat =
      customerLocation.latitude;

    const lng =
      customerLocation.longitude;


    locationText =
      "📍 Customer Location:\n" +
      "https://www.google.com/maps?q=" +
      lat +
      "," +
      lng;

  }


  const orderTypeText =
    selectedOrderType ===
    "delivery"
      ? "Home Delivery"
      : "Store Pickup";


  const deliveryText =
    selectedOrderType ===
    "delivery"
      ? "Delivery time: " +
        STORE.deliveryTime
      : "Pickup from store";


  const message =

`Hello ${STORE.name},

I would like to place an order.

Customer:
${name}

Phone:
${phone}

Order Type:
${orderTypeText}

${address ? "Address:\n" + address + "\n" : ""}${pin ? "PIN:\n" + pin + "\n" : ""}

Products:
${lines.join("\n")}

Total:
₹${total}

Payment:
${paymentText}

${deliveryText}

${locationText}

Thank you.`;


  const whatsappURL =
    "https://wa.me/" +
    STORE.whatsapp +
    "?text=" +
    encodeURIComponent(
      message
    );


  window.open(
    whatsappURL,
    "_blank"
  );

}


/* =========================================================
   SHOPKEEPER
   ========================================================= */

function openShopkeeper() {

  /* Close cart */

  if ($("cartPanel")) {

    $("cartPanel")
      .classList
      .add("hidden");

  }


  /* Close checkout */

  if ($("checkout")) {

    $("checkout")
      .classList
      .add("hidden");

  }


  const password =
    prompt(
      "Enter shopkeeper password:"
    );


  if (
    password !==
    STORE.shopkeeperPassword
  ) {

    alert(
      "Incorrect password."
    );

    return;

  }


  const panel =
    $("shopkeeper");


  if (!panel) {

    createShopkeeperPanel();

  }


  const finalPanel =
    $("shopkeeper");


  if (finalPanel) {

    finalPanel
      .classList
      .remove("hidden");

    finalPanel.style.display =
      "grid";

    finalPanel.style.zIndex =
      "1000";

  }


  renderAdminProducts();

}


/* =========================================================
   CREATE SHOPKEEPER PANEL
   ========================================================= */

function createShopkeeperPanel() {

  const panel =
    document.createElement("div");


  panel.id =
    "shopkeeper";


  panel.className =
    "modal";


  panel.innerHTML = `

    <div
      class="modalBox shopkeeperBox"
      style="
        max-height:90vh;
        overflow:auto;
      ">

      <button
        id="closeShopkeeper"
        class="close"
        type="button">

        ✕

      </button>


      <h2>
        👨‍💼 Shopkeeper
      </h2>


      <p
        style="
          color:#64748b;
        ">

        Manage products on this device.

      </p>


      <input
        id="adminProductName"
        placeholder="Product name">


      <input
        id="adminProductPrice"
        placeholder="Price"
        type="number"
        min="0">


      <input
        id="adminProductCategory"
        placeholder="Category">


      <input
        id="adminProductEmoji"
        placeholder="Emoji e.g. 🍚">


      <button
        id="addShopProductButton"
        class="primary"
        type="button">

        ➕ Add Product

      </button>


      <h3>
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


  $("closeShopkeeper").onclick =
    closeShopkeeper;


  $("addShopProductButton").onclick =
    addShopProduct;

}


/* =========================================================
   CLOSE SHOPKEEPER
   ========================================================= */

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


/* =========================================================
   ADMIN PRODUCTS
   ========================================================= */

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
    products.map(p => `

      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:10px;
          align-items:center;
          padding:12px 0;
          border-bottom:1px solid #eee;
        ">

        <div>

          <b>

            ${p.emoji || "🛒"}

            ${escapeHTML(p.name)}

          </b>

          <br>

          ₹${Number(p.price)}

          <br>

          <small>

            ${escapeHTML(
              p.cat || "General"
            )}

            <br>

            ${
              p.active !== false
                ? "✅ Available"
                : "❌ Hidden"
            }

          </small>

        </div>


        <div
          style="
            display:flex;
            gap:5px;
          ">

          <button
            type="button"
            onclick="editProduct(${p.id})">

            ✏️

          </button>


          <button
            type="button"
            onclick="toggleProduct(${p.id})">

            ${
              p.active !== false
                ? "🙈"
                : "👁️"
            }

          </button>


          <button
            type="button"
            onclick="deleteProduct(${p.id})">

            🗑️

          </button>

        </div>

      </div>

    `).join("");

}


/* =========================================================
   ADD PRODUCT
   ========================================================= */

function addShopProduct() {

  const name =
    $("adminProductName")
      .value
      .trim();


  const price =
    Number(
      $("adminProductPrice")
        .value
    );


  const category =
    $("adminProductCategory")
      .value
      .trim();


  const emoji =
    $("adminProductEmoji")
      .value
      .trim() ||
    "🛒";


  if (!name) {

    alert(
      "Please enter product name."
    );

    return;

  }


  if (
    !price ||
    price < 0
  ) {

    alert(
      "Please enter a valid price."
    );

    return;

  }


  if (!category) {

    alert(
      "Please enter category."
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
      emoji,

    active:
      true

  });


  saveProducts();


  $("adminProductName")
    .value = "";


  $("adminProductPrice")
    .value = "";


  $("adminProductCategory")
    .value = "";


  $("adminProductEmoji")
    .value = "";


  renderAdminProducts();

  renderCategories();

  renderProducts();


  alert(
    "✅ Product added successfully."
  );

}


/* =========================================================
   EDIT PRODUCT
   ========================================================= */

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
    !Number(price)
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
    emoji.trim() ||
    "🛒";


  saveProducts();


  renderAdminProducts();

  renderCategories();

  renderProducts();

}


/* =========================================================
   HIDE / SHOW PRODUCT
   ========================================================= */

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


/* =========================================================
   DELETE PRODUCT
   ========================================================= */

function deleteProduct(id) {

  const product =
    products.find(
      p => p.id == id
    );


  if (!product) return;


  const yes =
    confirm(
      'Delete "' +
      product.name +
      '"?'
    );


  if (!yes) return;


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


/* =========================================================
   QUICK ACTIONS
   ========================================================= */

function createQuickActions() {

  const main =
    document.querySelector("main");


  if (!main) return;


  if (
    $("quickActions")
  ) return;


  const section =
    document.createElement("section");


  section.id =
    "quickActions";


  section.style.cssText =
    "max-width:1100px;margin:15px auto;padding:0 5%;";


  section.innerHTML = `

    <div style="
      display:grid;
      grid-template-columns:
      repeat(2,1fr);
      gap:8px;
    ">

      <button
        onclick="openCheckout()"
        style="
          padding:12px;
          border:0;
          border-radius:12px;
          background:#16a34a;
          color:white;
          font-weight:700;
        ">

        🛒 Order Now

      </button>


      <button
        onclick="showDeliveryInfo()"
        style="
          padding:12px;
          border:0;
          border-radius:12px;
          background:#0f766e;
          color:white;
          font-weight:700;
        ">

        🚚 Delivery

      </button>


      <button
        onclick="showPickupInfo()"
        style="
          padding:12px;
          border:0;
          border-radius:12px;
          background:#2563eb;
          color:white;
          font-weight:700;
        ">

        🏪 Pickup

      </button>


      <button
        onclick="showPaymentInfo()"
        style="
          padding:12px;
          border:0;
          border-radius:12px;
          background:#7c3aed;
          color:white;
          font-weight:700;
        ">

        💳 Payment

      </button>


      <button
        onclick="showHelp()"
        style="
          padding:12px;
          border:0;
          border-radius:12px;
          background:#475569;
          color:white;
          font-weight:700;
        ">

        ❓ Help

      </button>


      <button
        onclick="openWhatsApp()"
        style="
          padding:12px;
          border:0;
          border-radius:12px;
          background:#16a34a;
          color:white;
          font-weight:700;
        ">

        💬 WhatsApp

      </button>


      <button
        onclick="openShopkeeper()"
        style="
          grid-column:1/-1;
          padding:10px;
          border:1px solid #ddd;
          border-radius:12px;
          background:white;
          color:#475569;
          font-weight:700;
        ">

        👨‍💼 Shopkeeper

      </button>

    </div>

  `;


  const hero =
    document.querySelector(
      ".hero"
    );


  if (hero) {

    hero.after(section);

  } else {

    main.prepend(section);

  }

}


/* =========================================================
   STORE INFORMATION
   ========================================================= */

function showDeliveryInfo() {

  alert(
`🚚 DELIVERY INFORMATION

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

Please place your order online and collect it from the store.`
  );

}


function showPaymentInfo() {

  alert(
`💳 PAYMENT OPTIONS

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
`❓ HELP

1. Add products to your cart.

2. Open Cart.

3. Tap Place Order.

4. Enter your name and phone number.

5. Select Home Delivery or Store Pickup.

6. For delivery, enter PIN ${STORE.deliveryPin}.

7. You can share your current location.

8. Select your payment method.

9. Tap Send Order.

Your order will be sent to Shivam Kirana Store on WhatsApp.

WhatsApp:
+91 72319 27995`
  );

}


/* =========================================================
   WHATSAPP
   ========================================================= */

function openWhatsApp() {

  const url =
    "https://wa.me/" +
    STORE.whatsapp;


  window.open(
    url,
    "_blank"
  );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   SEARCH
   ========================================================= */

if ($("search")) {

  $("search").oninput =
    renderProducts;

}


/* =========================================================
   CART BUTTON
   ========================================================= */

if ($("cartBtn")) {

  $("cartBtn").onclick =
    openCart;

}


/* =========================================================
   CART CLOSE
   ========================================================= */

if ($("closeCart")) {

  $("closeCart").onclick =
    closeCart;

}


/* =========================================================
   ORDER BUTTON
   ========================================================= */

if ($("orderBtn")) {

  $("orderBtn").onclick =
    openCheckout;

}


/* =========================================================
   CHECKOUT CLOSE
   ========================================================= */

if ($("closeCheckout")) {

  $("closeCheckout").onclick =
    closeCheckout;

}


/* =========================================================
   SEND ORDER BUTTON
   ========================================================= */

if ($("sendOrder")) {

  $("sendOrder").onclick =
    sendOrderToWhatsApp;

}


/* =========================================================
   START APP
   ========================================================= */

createQuickActions();

renderCategories();

renderProducts();

renderCart();

updateCartCount();

saveProducts();
