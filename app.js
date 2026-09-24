/* =========================================
   SHIVAM KIRANA STORE - COMPLETE APP
   ========================================= */

const STORE = {
  name: "Shivam Kirana Store",
  whatsapp: "917231927995",
  upi: "Sethishivam04@ybl",
  deliveryPin: "301604",
  deliveryFee: 0,
  minOrder: 0,
  pickup: true
};


/* =========================================
   PRODUCTS
   ========================================= */

const products = [
  {id:1,name:"Rice 5 kg",price:320,cat:"Staples",emoji:"🍚"},
  {id:2,name:"Wheat Flour 5 kg",price:260,cat:"Staples",emoji:"🌾"},
  {id:3,name:"Sugar 1 kg",price:48,cat:"Staples",emoji:"🧂"},
  {id:4,name:"Toor Dal 1 kg",price:140,cat:"Staples",emoji:"🫘"},
  {id:5,name:"Milk 1 L",price:60,cat:"Dairy",emoji:"🥛"},
  {id:6,name:"Bread",price:40,cat:"Dairy",emoji:"🍞"},
  {id:7,name:"Biscuits",price:30,cat:"Snacks",emoji:"🍪"},
  {id:8,name:"Tea 250 g",price:120,cat:"Beverages",emoji:"🍵"},
  {id:9,name:"Cooking Oil 1 L",price:150,cat:"Staples",emoji:"🫗"},
  {id:10,name:"Bath Soap",price:45,cat:"Household",emoji:"🧼"},
  {id:11,name:"Shampoo",price:90,cat:"Personal Care",emoji:"🧴"},
  {id:12,name:"Cold Drink",price:50,cat:"Beverages",emoji:"🥤"}
];


/* =========================================
   CART
   ========================================= */

let cart = JSON.parse(
  localStorage.getItem("shivamCart") || "{}"
);

let category = "All";
let customerLocation = null;
let orderType = "delivery";
let paymentMethod = "cod";


/* =========================================
   SHORTCUT
   ========================================= */

const $ = id => document.getElementById(id);


/* =========================================
   SAVE CART
   ========================================= */

function save() {

  localStorage.setItem(
    "shivamCart",
    JSON.stringify(cart)
  );

  renderCart();

  $("cartCount").textContent =
    Object.values(cart).reduce(
      (a,b) => a + b,
      0
    );
}


/* =========================================
   CART TOTAL
   ========================================= */

function cartTotal() {

  return Object.keys(cart).reduce(
    (sum,id) => {

      const product =
        products.find(
          p => p.id == id
        );

      return sum +
        product.price * cart[id];

    },
    0
  );
}


/* =========================================
   CATEGORIES
   ========================================= */

function renderCategories() {

  const cats = [
    "All",
    ...new Set(
      products.map(
        p => p.cat
      )
    )
  ];

  $("categories").innerHTML =
    cats.map(
      c => `
        <button
          class="chip ${c === category ? "active" : ""}"
          onclick="setCat('${c}')">
          ${c}
        </button>
      `
    ).join("");
}


function setCat(c) {

  category = c;

  renderCategories();

  renderProducts();
}


/* =========================================
   PRODUCTS
   ========================================= */

function renderProducts() {

  const q =
    $("search").value
      .toLowerCase()
      .trim();

  const list =
    products.filter(
      p =>
        (category === "All" ||
         p.cat === category) &&
        p.name
          .toLowerCase()
          .includes(q)
    );

  $("products").innerHTML =
    list.map(
      p => `
        <article class="card">

          <div class="emoji">
            ${p.emoji}
          </div>

          <h3>
            ${p.name}
          </h3>

          <div class="price">
            ₹${p.price}
          </div>

          <button
            class="add"
            onclick="add(${p.id})">
            Add to Cart
          </button>

        </article>
      `
    ).join("")
    ||
    "<p>No products found.</p>";
}


/* =========================================
   ADD PRODUCT
   ========================================= */

function add(id) {

  cart[id] =
    (cart[id] || 0) + 1;

  save();

  openCart();
}


/* =========================================
   CHANGE QUANTITY
   ========================================= */

function change(id,d) {

  cart[id] =
    (cart[id] || 0) + d;

  if(cart[id] <= 0) {

    delete cart[id];

  }

  save();
}


/* =========================================
   RENDER CART
   ========================================= */

function renderCart() {

  const ids =
    Object.keys(cart);

  $("cartItems").innerHTML =
    ids.length

      ? ids.map(
          id => {

            const p =
              products.find(
                x => x.id == id
              );

            return `
              <div class="item">

                <div>
                  <b>
                    ${p.emoji}
                    ${p.name}
                  </b>

                  <br>

                  ₹${p.price * cart[id]}
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
          }
        ).join("")

      : "<p>Your cart is empty.</p>";

  $("total").textContent =
    "₹" + cartTotal();
}


/* =========================================
   CART OPEN/CLOSE
   ========================================= */

function openCart() {

  $("cartPanel")
    .classList
    .remove("hidden");

  renderCart();
}


function closeCart() {

  $("cartPanel")
    .classList
    .add("hidden");
}


/* =========================================
   QUICK ACTIONS
   ========================================= */

function createQuickActions() {

  const box =
    document.createElement("section");

  box.id = "quickActions";

  box.style.cssText = `
    max-width:1100px;
    margin:15px auto;
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:10px;
    padding:0 5%;
  `;

  box.innerHTML = `

    <button onclick="openCart()"
      style="${actionStyle()}">
      🛒 Order Now
    </button>

    <button onclick="showDelivery()"
      style="${actionStyle()}">
      🚚 Delivery
    </button>

    <button onclick="showPickup()"
      style="${actionStyle()}">
      🏪 Pickup
    </button>

    <button onclick="showPayment()"
      style="${actionStyle()}">
      💳 Payment
    </button>

    <button onclick="showHelp()"
      style="${actionStyle()}">
      ❓ Help
    </button>

    <button onclick="openWhatsApp()"
      style="${actionStyle()}">
      💬 WhatsApp
    </button>

  `;

  document
    .querySelector("main")
    .insertBefore(
      box,
      document.querySelector(".search")
    );
}


function actionStyle() {

  return `
    border:0;
    padding:12px 6px;
    border-radius:12px;
    background:#ecfdf5;
    color:#166534;
    font-weight:700;
    cursor:pointer;
  `;
}


/* =========================================
   STORE INFORMATION
   ========================================= */

function showDelivery() {

  alert(
`🚚 HOME DELIVERY

Delivery Area PIN:
${STORE.deliveryPin}

Delivery Charge:
FREE

Minimum Order:
NO MINIMUM

Please enter your correct PIN code during checkout.`
  );
}


function showPickup() {

  alert(
`🏪 STORE PICKUP

Store pickup is available.

Choose "Store Pickup" during checkout.

You can pay at the store or use UPI.`
  );
}


/* =========================================
   PAYMENT INFORMATION
   ========================================= */

function showPayment() {

  alert(
`💳 PAYMENT OPTIONS

UPI:
${STORE.upi}

Cash on Delivery:
Available

Pay at Store:
Available for pickup

Delivery Charge:
FREE`
  );
}


/* =========================================
   HELP
   ========================================= */

function showHelp() {

  alert(
`❓ HELP

1. Search for your product.
2. Tap "Add to Cart".
3. Open Cart.
4. Tap "Place Order on WhatsApp".
5. Enter your name and phone.
6. Select Delivery or Store Pickup.
7. For delivery, enter PIN ${STORE.deliveryPin}.
8. You can share your current location.
9. Select your payment method.
10. Send the order on WhatsApp.

For help:
WhatsApp ${STORE.whatsapp}`
  );
}


/* =========================================
   WHATSAPP
   ========================================= */

function openWhatsApp() {

  const url =
    "https://wa.me/" +
    STORE.whatsapp;

  window.open(
    url,
    "_blank"
  );
}


/* =========================================
   CHECKOUT SETUP
   ========================================= */

function setupCheckout() {

  const modal =
    document.querySelector(
      "#checkout .modalBox"
    );

  const sendButton =
    $("sendOrder");

  const extra =
    document.createElement("div");

  extra.id =
    "extraCheckout";

  extra.innerHTML = `

    <div style="
      margin:10px 0;
      font-weight:700;
    ">
      Order Type
    </div>

    <label style="
      display:block;
      padding:10px;
      border:1px solid #ddd;
      border-radius:10px;
      margin-bottom:8px;
    ">

      <input
        type="radio"
        name="orderType"
        value="delivery"
        checked
        onchange="updateCheckoutType()">

      🚚 Home Delivery

    </label>

    <label style="
      display:block;
      padding:10px;
      border:1px solid #ddd;
      border-radius:10px;
      margin-bottom:10px;
    ">

      <input
        type="radio"
        name="orderType"
        value="pickup"
        onchange="updateCheckoutType()">

      🏪 Store Pickup

    </label>

    <div id="deliveryExtra">

      <input
        id="pin"
        placeholder="Delivery PIN code"
        inputmode="numeric"
        maxlength="6"
      >

      <button
        type="button"
        onclick="checkPin()"
        style="
          width:100%;
          padding:11px;
          margin:5px 0;
          border:0;
          border-radius:10px;
          background:#0f766e;
          color:white;
          font-weight:700;
        ">
        📍 Check Delivery Area
      </button>

      <p
        id="pinStatus"
        style="
          font-size:13px;
          margin:5px 0;
        ">
      </p>

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

    <div style="
      margin:12px 0 6px;
      font-weight:700;
    ">
      Payment Method
    </div>

    <select
      id="paymentMethod"
      onchange="updatePaymentMethod()"
      style="
        width:100%;
        padding:12px;
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
      id="upiBox"
      style="
        display:none;
        margin-top:8px;
        padding:12px;
        background:#f0fdf4;
        border-radius:10px;
      ">

      <b>UPI ID:</b>
      ${STORE.upi}

      <button
        type="button"
        onclick="payByUPI()"
        style="
          width:100%;
          padding:11px;
          margin-top:8px;
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

  modal.insertBefore(
    extra,
    sendButton
  );
}


/* =========================================
   CHECKOUT ORDER TYPE
   ========================================= */

function updateCheckoutType() {

  const selected =
    document.querySelector(
      'input[name="orderType"]:checked'
    );

  orderType =
    selected
      ? selected.value
      : "delivery";

  const deliveryExtra =
    $("deliveryExtra");

  if(orderType === "pickup") {

    deliveryExtra.style.display =
      "none";

    $("address").style.display =
      "none";

    $("pin").value = "";

    customerLocation = null;

  } else {

    deliveryExtra.style.display =
      "block";

    $("address").style.display =
      "block";
  }
}


/* =========================================
   PAYMENT METHOD
   ========================================= */

function updatePaymentMethod() {

  paymentMethod =
    $("paymentMethod").value;

  if(paymentMethod === "upi") {

    $("upiBox").style.display =
      "block";

  } else {

    $("upiBox").style.display =
      "none";
  }
}


/* =========================================
   PIN CHECK
   ========================================= */

function checkPin() {

  const pin =
    $("pin").value.trim();

  const status =
    $("pinStatus");

  if(!pin) {

    status.textContent =
      "❌ Please enter PIN code.";

    status.style.color =
      "#dc2626";

    return;
  }

  if(pin === STORE.deliveryPin) {

    status.textContent =
      "✅ Delivery available in your area.";

    status.style.color =
      "#16a34a";

  } else {

    status.textContent =
      "❌ Delivery is currently unavailable for this PIN.";

    status.style.color =
      "#dc2626";
  }
}


/* =========================================
   CUSTOMER LOCATION
   ========================================= */

function getCustomerLocation() {

  const status =
    $("locationStatus");

  if(!navigator.geolocation) {

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

      const accuracy =
        position.coords.accuracy;

      customerLocation = {

        latitude,
        longitude,
        accuracy

      };

      status.innerHTML =
        "✅ Location added<br>" +
        "Accuracy: about " +
        Math.round(accuracy) +
        " metres";

    },

    error => {

      let message =
        "❌ Location could not be added.";

      if(error.code === 1) {

        message =
          "❌ Location permission denied. Please allow location access.";

      }

      status.textContent =
        message;

    },

    {

      enableHighAccuracy:true,

      timeout:15000,

      maximumAge:0

    }

  );
}


/* =========================================
   UPI PAYMENT
   ========================================= */

function payByUPI() {

  const total =
    cartTotal();

  if(total <= 0) {

    alert(
      "Please add products to cart first."
    );

    return;
  }

  const upiUrl =
    "upi://pay" +
    "?pa=" +
    encodeURIComponent(
      STORE.upi
    ) +
    "&pn=" +
    encodeURIComponent(
      STORE.name
    ) +
    "&am=" +
    total.toFixed(2) +
    "&cu=INR";

  window.location.href =
    upiUrl;
}


/* =========================================
   SEND ORDER TO WHATSAPP
   ========================================= */

function sendOrderToWhatsApp() {

  const name =
    $("name").value.trim();

  const phone =
    $("phone").value.trim();

  const address =
    $("address").value.trim();

  if(!name || !phone) {

    alert(
      "Please enter your name and phone number."
    );

    return;
  }


  /* DELIVERY VALIDATION */

  if(orderType === "delivery") {

    const pin =
      $("pin").value.trim();

    if(!address) {

      alert(
        "Please enter your delivery address."
      );

      return;
    }

    if(pin !== STORE.deliveryPin) {

      alert(
        "Delivery is currently available only for PIN " +
        STORE.deliveryPin
      );

      return;
    }
  }


  /* ORDER ITEMS */

  const ids =
    Object.keys(cart);

  if(!ids.length) {

    alert(
      "Your cart is empty."
    );

    return;
  }


  const lines =
    ids.map(id => {

      const p =
        products.find(
          x => x.id == id
        );

      return (
        p.name +
        " x " +
        cart[id] +
        " = ₹" +
        (p.price * cart[id])
      );

    });


  /* TOTAL */

  const subtotal =
    cartTotal();

  const delivery =
    orderType === "delivery"
      ? STORE.deliveryFee
      : 0;

  const total =
    subtotal + delivery;


  /* LOCATION */

  let locationText =
    "Location not shared";

  if(customerLocation) {

    const lat =
      customerLocation.latitude;

    const lng =
      customerLocation.longitude;

    const mapsUrl =
      "https://www.google.com/maps?q=" +
      lat +
      "," +
      lng;

    locationText =
      "📍 Customer Location:\n" +
      mapsUrl;
  }


  /* ORDER TYPE */

  const typeText =
    orderType === "delivery"
      ? "🚚 Home Delivery"
      : "🏪 Store Pickup";


  /* PAYMENT */

  let paymentText =
    "Cash on Delivery";

  if(paymentMethod === "upi") {

    paymentText =
      "💳 UPI - " +
      STORE.upi;

  } else if(paymentMethod === "store") {

    paymentText =
      "🏪 Pay at Store";
  }


  /* ADDRESS */

  const addressText =
    orderType === "delivery"
      ? "Address: " + address
      : "Address: Store Pickup";


  /* WHATSAPP MESSAGE */

  const message =
`Hello ${STORE.name},

🛒 NEW ORDER

Customer: ${name}
Phone: ${phone}

Order Type:
${typeText}

${addressText}

Payment:
${paymentText}

Products:
${lines.join("\n")}

Subtotal: ₹${subtotal}
Delivery: ₹${delivery}
TOTAL: ₹${total}

${locationText}

Please confirm my order.

Thank you.`;

  const url =
    "https://wa.me/" +
    STORE.whatsapp +
    "?text=" +
    encodeURIComponent(
      message
    );

  window.open(
    url,
    "_blank"
  );
}


/* =========================================
   EVENTS
   ========================================= */

$("search").oninput =
  renderProducts;

$("cartBtn").onclick =
  openCart;

$("closeCart").onclick =
  closeCart;

$("orderBtn").onclick =
  () => {

    if(
      !Object.keys(cart).length
    ) {

      alert(
        "Please add products first."
      );

      return;
    }

    $("checkout")
      .classList
      .remove("hidden");

    updateCheckoutType();
  };


$("closeCheckout").onclick =
  () => {

    $("checkout")
      .classList
      .add("hidden");
  };


$("sendOrder").onclick =
  sendOrderToWhatsApp;


/* =========================================
   START APP
   ========================================= */

createQuickActions();

setupCheckout();

renderCategories();

renderProducts();

save();
