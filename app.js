/* =========================================
   SHIVAM KIRANA STORE
   ========================================= */

const STORE = {

  name: "Shivam Kirana Store",

  whatsapp: "917231927995",

  upi: "Sethishivam04@ybl",

  deliveryPin: "301604",

  deliveryFee: 0,

  deliveryStart: 10,

  deliveryEnd: 19,

  storeStart: 9,

  storeEnd: 20,

  deliveryMinutes: 30

};


/* =========================================
   DEFAULT PRODUCTS
   ========================================= */

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
    cat: "Staples",
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
    cat: "Dairy",
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
    cat: "Household",
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


/* =========================================
   LOAD PRODUCTS
   ========================================= */

let products =
  JSON.parse(
    localStorage.getItem(
      "shivamProducts"
    )
  ) || defaultProducts;


/* =========================================
   CART
   ========================================= */

let cart =
  JSON.parse(
    localStorage.getItem(
      "shivamCart"
    ) || "{}"
  );


let category = "All";

let customerLocation = null;

let orderType = "delivery";

let paymentMethod = "upi";


/* =========================================
   SHORTCUT
   ========================================= */

const $ =
  id => document.getElementById(id);


/* =========================================
   SAVE PRODUCTS
   ========================================= */

function saveProducts() {

  localStorage.setItem(
    "shivamProducts",
    JSON.stringify(products)
  );

}


/* =========================================
   SAVE CART
   ========================================= */

function saveCart() {

  localStorage.setItem(
    "shivamCart",
    JSON.stringify(cart)
  );

  renderCart();

  $("cartCount").textContent =
    Object.values(cart)
      .reduce(
        (a,b) => a + b,
        0
      );

}


/* =========================================
   CART TOTAL
   ========================================= */

function cartTotal() {

  return Object.keys(cart)
    .reduce(
      (total,id) => {

        const p =
          products.find(
            x => x.id == id
          );

        if(!p) return total;

        return total +
          p.price * cart[id];

      },
      0
    );

}


/* =========================================
   CATEGORIES
   ========================================= */

function renderCategories() {

  const activeProducts =
    products.filter(
      p => p.active !== false
    );

  const cats = [

    "All",

    ...new Set(
      activeProducts.map(
        p => p.cat
      )
    )

  ];


  $("categories").innerHTML =

    cats.map(

      c => `

        <button
          class="chip ${
            c === category
              ? "active"
              : ""
          }"
          onclick="setCategory('${c}')">

          ${c}

        </button>

      `

    ).join("");

}


function setCategory(c) {

  category = c;

  renderCategories();

  renderProducts();

}


/* =========================================
   PRODUCTS
   ========================================= */

function renderProducts() {

  const search =
    $("search")
      .value
      .toLowerCase()
      .trim();


  const list =
    products.filter(

      p =>

        p.active !== false &&

        (
          category === "All" ||
          p.cat === category
        ) &&

        p.name
          .toLowerCase()
          .includes(search)

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
            onclick="addToCart(${p.id})">

            Add to Cart

          </button>

        </article>

      `

    ).join("")

    ||

    "<p>No products found.</p>";

}


/* =========================================
   ADD TO CART
   ========================================= */

function addToCart(id) {

  cart[id] =
    (cart[id] || 0) + 1;

  saveCart();

  openCart();

}


/* =========================================
   CHANGE QUANTITY
   ========================================= */

function changeQuantity(id,change) {

  cart[id] =
    (cart[id] || 0) + change;


  if(cart[id] <= 0) {

    delete cart[id];

  }


  saveCart();

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


            if(!p) return "";


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
                    onclick="changeQuantity(${id},-1)">
                    −
                  </button>

                  ${cart[id]}

                  <button
                    onclick="changeQuantity(${id},1)">
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
   CART
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
   DELIVERY INFORMATION
   ========================================= */

function showDeliveryInfo() {

  alert(

`🚚 SHIVAM KIRANA STORE

Delivery Time:
10:00 AM – 7:00 PM

Delivery:
Within 30 minutes

Delivery Charge:
FREE

Delivery PIN:
301604

Holiday:
1st and 15th of every month`

  );

}


/* =========================================
   PICKUP INFORMATION
   ========================================= */

function showPickupInfo() {

  alert(

`🏪 STORE PICKUP

Store timing:
9:00 AM – 8:00 PM

Pickup is available.

Holiday:
1st and 15th of every month.`

  );

}


/* =========================================
   PAYMENT INFORMATION
   ========================================= */

function showPaymentInfo() {

  alert(

`💳 PAYMENT

UPI:
Sethishivam04@ybl

Cash on Delivery:
Available

Pay at Store:
Available for pickup

Delivery:
FREE`

  );

}


/* =========================================
   HELP
   ========================================= */

function showHelp() {

  alert(

`❓ HELP

1. Search your product.
2. Add it to Cart.
3. Open Cart.
4. Tap Place Order.
5. Enter your name and phone.
6. Select Delivery or Pickup.
7. For delivery use PIN 301604.
8. You can share your location.
9. Select payment method.
10. Send the order.

Delivery:
10 AM – 7 PM

Store:
9 AM – 8 PM

Delivery:
Within 30 minutes

WhatsApp:
7231927995`

  );

}


/* =========================================
   WHATSAPP
   ========================================= */

function openWhatsApp() {

  window.open(

    "https://wa.me/" +
    STORE.whatsapp,

    "_blank"

  );

}


/* =========================================
   CHECK STORE HOLIDAY
   ========================================= */

function isHoliday() {

  const day =
    new Date().getDate();

  return day === 1 ||
         day === 15;

}


/* =========================================
   CHECK DELIVERY HOURS
   ========================================= */

function deliveryOpen() {

  if(isHoliday()) {

    return false;

  }


  const hour =
    new Date().getHours();


  return (
    hour >= STORE.deliveryStart &&
    hour < STORE.deliveryEnd
  );

}


/* =========================================
   CHECK STORE HOURS
   ========================================= */

function storeOpen() {

  if(isHoliday()) {

    return false;

  }


  const hour =
    new Date().getHours();


  return (
    hour >= STORE.storeStart &&
    hour < STORE.storeEnd
  );

}


/* =========================================
   CHECKOUT
   ========================================= */

function openCheckout() {

  if(
    Object.keys(cart).length === 0
  ) {

    alert(
      "Please add products first."
    );

    return;

  }


  if(
    isHoliday()
  ) {

    alert(
      "Today is a store holiday. The store is closed on the 1st and 15th of every month."
    );

    return;

  }


  $("checkout")
    .classList
    .remove("hidden");


  updateOrderType();

  updatePayment();

}


/* =========================================
   ORDER TYPE
   ========================================= */

function updateOrderType() {

  const selected =
    document.querySelector(
      'input[name="orderType"]:checked'
    );


  orderType =
    selected
      ? selected.value
      : "delivery";


  const fields =
    $("deliveryFields");


  if(orderType === "delivery") {

    fields.style.display =
      "block";

  } else {

    fields.style.display =
      "none";

    customerLocation =
      null;

  }

}


/* =========================================
   PIN CHECK
   ========================================= */

function checkDeliveryPin() {

  const pin =
    $("pin")
      .value
      .trim();


  if(
    pin === STORE.deliveryPin
  ) {

    $("pinStatus").textContent =
      "✅ Delivery available in your area.";

    $("pinStatus").style.color =
      "#16a34a";

  } else {

    $("pinStatus").textContent =
      "❌ Delivery is unavailable for this PIN.";

    $("pinStatus").style.color =
      "#dc2626";

  }

}


/* =========================================
   LOCATION
   ========================================= */

function getCustomerLocation() {

  const status =
    $("locationStatus");


  if(
    !navigator.geolocation
  ) {

    status.textContent =
      "❌ Location is not supported.";

    return;

  }


  status.textContent =
    "📍 Getting location...";


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


      status.textContent =
        "✅ Location added.";

    },


    () => {

      status.textContent =
        "❌ Location permission denied.";

    },


    {

      enableHighAccuracy: true,

      timeout: 15000,

      maximumAge: 0

    }

  );

}


/* =========================================
   PAYMENT
   ========================================= */

function updatePayment() {

  paymentMethod =
    $("paymentMethod").value;


  if(
    paymentMethod === "upi"
  ) {

    $("upiBox").style.display =
      "block";

  } else {

    $("upiBox").style.display =
      "none";

  }

}


/* =========================================
   UPI
   ========================================= */

function payByUPI() {

  const total =
    cartTotal();


  if(total <= 0) {

    alert(
      "Your cart is empty."
    );

    return;

  }


  const url =

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
    url;

}


/* =========================================
   SEND ORDER
   ========================================= */

function sendOrder() {

  const name =
    $("name")
      .value
      .trim();


  const phone =
    $("phone")
      .value
      .trim();


  const address =
    $("address")
      .value
      .trim();


  if(!name || !phone) {

    alert(
      "Please enter your name and phone number."
    );

    return;

  }


  if(
    orderType === "delivery"
  ) {

    if(!deliveryOpen()) {

      alert(
        "Delivery is available from 10 AM to 7 PM. Delivery is also closed on the 1st and 15th of every month."
      );

      return;

    }


    if(!address) {

      alert(
        "Please enter your delivery address."
      );

      return;

    }


    if(
      $("pin").value.trim() !==
      STORE.deliveryPin
    ) {

      alert(
        "Delivery is available only for PIN 301604."
      );

      return;

    }

  }


  const ids =
    Object.keys(cart);


  const items =
    ids.map(

      id => {

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

      }

    );


  const subtotal =
    cartTotal();


  const orderTypeText =
    orderType === "delivery"
      ? "🚚 Home Delivery"
      : "🏪 Store Pickup";


  let paymentText =
    "💵 Cash on Delivery";


  if(
    paymentMethod === "upi"
  ) {

    paymentText =
      "💳 UPI - " +
      STORE.upi;

  }


  if(
    paymentMethod === "store"
  ) {

    paymentText =
      "🏪 Pay at Store";

  }


  let locationText =
    "Location not shared";


  if(customerLocation) {

    const map =

      "https://www.google.com/maps?q=" +

      customerLocation.latitude +
      "," +
      customerLocation.longitude;


    locationText =
      "📍 Customer Location:\n" +
      map;

  }


  const addressText =
    orderType === "delivery"
      ? address
      : "Store Pickup";


  const message =

`Hello Shivam Kirana Store,

🛒 NEW WEBSITE ORDER

Customer:
${name}

Phone:
${phone}

Order:
${orderTypeText}

Address:
${addressText}

Payment:
${paymentText}

Products:
${items.join("\n")}

Subtotal:
₹${subtotal}

Delivery:
FREE

Expected delivery:
Within 30 minutes

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
   SHOPKEEPER
   ========================================= */


/* =========================================
   FIXED SHOPKEEPER
   ========================================= */

function openShopkeeper() {

  // Close cart
  if ($("cartPanel")) {
    $("cartPanel").classList.add("hidden");
  }

  // Close checkout
  if ($("checkout")) {
    $("checkout").classList.add("hidden");
  }

  // Ask shopkeeper password
  const password = prompt(
    "Enter shopkeeper password:"
  );

  if (password !== "1234") {
    alert("Incorrect password.");
    return;
  }

  // Open shopkeeper only
  $("shopkeeper")
    .classList
    .remove("hidden");

  // Show all products
  renderAdminProducts();
}


/* =========================================
   CLOSE SHOPKEEPER
   ========================================= */

function closeShopkeeper() {

  $("shopkeeper")
    .classList
    .add("hidden");

}


/* =========================================
   SHOW PRODUCTS TO SHOPKEEPER
   ========================================= */

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

      <div class="adminProduct">

        <div>

          <b>
            ${p.emoji || "🛒"}
            ${p.name}
          </b>

          <br>

          ₹${p.price}

          <br>

          <small>
            Category: ${p.cat}
          </small>

          <br>

          <small>
            ${
              p.active !== false
                ? "✅ Available"
                : "❌ Hidden"
            }
          </small>

        </div>

        <div>

          <button
            onclick="editProduct(${p.id})">
            ✏️
          </button>

          <button
            onclick="toggleProduct(${p.id})">

            ${
              p.active !== false
                ? "🙈"
                : "👁️"
            }

          </button>

          <button
            onclick="deleteProduct(${p.id})">
            🗑️
          </button>

        </div>

      </div>

    `).join("");
}


/* =========================================
   ADD PRODUCT
   ========================================= */

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
      .trim() || "🛒";


  if (!name || !price || !category) {

    alert(
      "Please enter product name, price and category."
    );

    return;
  }


  products.push({

    id: Date.now(),

    name: name,

    price: price,

    cat: category,

    emoji: emoji,

    active: true

  });


  saveProducts();

  renderAdminProducts();

  renderCategories();

  renderProducts();


  $("adminProductName").value = "";

  $("adminProductPrice").value = "";

  $("adminProductCategory").value = "";

  $("adminProductEmoji").value = "";


  alert(
    "✅ Product added successfully."
  );
}


/* =========================================
   EDIT PRODUCT
   ========================================= */

function editProduct(id) {

  const product =
    products.find(
      p => p.id === id
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


  product.name =
    name.trim();

  product.price =
    Number(price);

  product.cat =
    category.trim();


  saveProducts();

  renderAdminProducts();

  renderCategories();

  renderProducts();
}


/* =========================================
   HIDE / SHOW PRODUCT
   ========================================= */

function toggleProduct(id) {

  const product =
    products.find(
      p => p.id === id
    );

  if (!product) return;


  product.active =
    product.active === false;


  saveProducts();

  renderAdminProducts();

  renderCategories();

  renderProducts();
}


/* =========================================
   DELETE PRODUCT
   ========================================= */

function deleteProduct(id) {

  const product =
    products.find(
      p => p.id === id
    );

  if (!product) return;


  if (
    !confirm(
      `Delete "${product.name}"?`
    )
  ) {
    return;
  }


  products =
    products.filter(
      p => p.id !== id
    );


  saveProducts();

  renderAdminProducts();

  renderCategories();

  renderProducts();
}

/* =========================================
   ADD PRODUCT
   ========================================= */

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


  const cat =
    $("adminProductCategory")
      .value
      .trim();


  const emoji =
    $("adminProductEmoji")
      .value
      .trim() || "🛒";


  if(
    !name ||
    !price ||
    !cat
  ) {

    alert(
      "Please fill product name, price and category."
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
      cat,

    emoji:
      emoji,

    active:
      true

  });


  saveProducts();


  $("adminProductName").value = "";

  $("adminProductPrice").value = "";

  $("adminProductCategory").value = "";

  $("adminProductEmoji").value = "";


  renderAdminProducts();

  renderCategories();

  renderProducts();


  alert(
    "Product added successfully."
  );

}


/* =========================================
   ADMIN PRODUCTS
   ========================================= */

function renderAdminProducts() {

  $("adminProducts").innerHTML =

    products.map(

      p => `

        <div class="adminProduct">

          <div>

            ${p.emoji}
            <b>${p.name}</b>

            <br>

            ₹${p.price}

            <br>

            ${p.cat}

            <br>

            ${
              p.active !== false
                ? "✅ Available"
                : "❌ Hidden"
            }

          </div>


          <div>

            <button
              onclick="editProduct(${p.id})">

              ✏️

            </button>


            <button
              onclick="toggleProduct(${p.id})">

              ${
                p.active !== false
                  ? "🙈"
                  : "👁️"
              }

            </button>


            <button
              onclick="deleteProduct(${p.id})">

              🗑️

            </button>

          </div>

        </div>

      `

    ).join("");

}


/* =========================================
   EDIT PRODUCT
   ========================================= */

function editProduct(id) {

  const p =
    products.find(
      x => x.id === id
    );


  if(!p) return;


  const name =
    prompt(
      "Product name:",
      p.name
    );


  if(name === null) return;


  const price =
    prompt(
      "Price:",
      p.price
    );


  if(price === null) return;


  const category =
    prompt(
      "Category:",
      p.cat
    );


  if(category === null) return;


  p.name =
    name.trim();


  p.price =
    Number(price);


  p.cat =
    category.trim();


  saveProducts();

  renderAdminProducts();

  renderCategories();

  renderProducts();

}


/* =========================================
   HIDE / SHOW PRODUCT
   ========================================= */

function toggleProduct(id) {

  const p =
    products.find(
      x => x.id === id
    );


  if(!p) return;


  p.active =
    p.active === false;


  saveProducts();

  renderAdminProducts();

  renderCategories();

  renderProducts();

}


/* =========================================
   DELETE PRODUCT
   ========================================= */

function deleteProduct(id) {

  if(
    !confirm(
      "Delete this product?"
    )
  ) {

    return;

  }


  products =
    products.filter(
      p => p.id !== id
    );


  saveProducts();

  renderAdminProducts();

  renderCategories();

  renderProducts();

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
  openCheckout;


$("closeCheckout").onclick =

  () => {

    $("checkout")
      .classList
      .add("hidden");

  };


$("sendOrder").onclick =
  sendOrder;


/* =========================================
   START
   ========================================= */

renderCategories();

renderProducts();

saveCart();
