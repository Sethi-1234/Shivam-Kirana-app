/* =========================================================
   SHIVAM KIRANA STORE - CUSTOMER FEATURES
   UI enhancements that work with the existing storefront.
   No Razorpay or secret payment credentials are used.
   ========================================================= */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function showFeatureModal(title, body, actions = "") {
    const old = $("storeFeatureModal");
    if (old) old.remove();

    const wrap = document.createElement("div");
    wrap.id = "storeFeatureModal";
    wrap.className = "modal";
    wrap.innerHTML =
      '<div class="modalBox featureModalBox">' +
        '<button class="close" type="button" onclick="closeStoreFeatureModal()">✕</button>' +
        '<h2>' + esc(title) + '</h2>' +
        '<div class="featureModalBody">' + body + '</div>' +
        actions +
      '</div>';
    document.body.appendChild(wrap);
  }

  window.closeStoreFeatureModal = function () {
    const el = $("storeFeatureModal");
    if (el) el.remove();
  };

  /* ---------------------------------------------------------
     4. MY ORDERS
     --------------------------------------------------------- */
  function getSavedTrackingCodes() {
    try {
      return JSON.parse(localStorage.getItem("shivam_order_history") || "[]");
    } catch (_) {
      return [];
    }
  }

  function saveTrackingCode(code) {
    if (!code) return;
    const list = getSavedTrackingCodes().filter(x => x !== code);
    list.unshift(code);
    localStorage.setItem("shivam_order_history", JSON.stringify(list.slice(0, 20)));
  }

  window.openMyOrders = async function () {
    const codes = getSavedTrackingCodes();

    if (!codes.length) {
      showFeatureModal(
        "📦 My Orders",
        '<div class="featureEmpty">No saved orders yet.<br>Place an order and its tracking ID will appear here.</div>',
        '<button class="primary" type="button" onclick="closeStoreFeatureModal();openCart()">🛒 Start Shopping</button>'
      );
      return;
    }

    let html = '<div class="ordersHistoryList">';
    for (const code of codes) {
      html += '<div class="historyOrder">' +
        '<div><b>Tracking ID</b><br><span class="trackingBadge">' + esc(code) + '</span></div>' +
        '<button type="button" class="secondaryButton" onclick="trackSavedOrder(\'' +
          esc(code).replace(/'/g, "\\'") +
        '\')">Track</button>' +
      '</div>';
    }
    html += '</div>';

    showFeatureModal(
      "📦 My Orders",
      html,
      '<button class="secondaryButton" type="button" onclick="closeStoreFeatureModal();openOrderTrackingPrompt()">🔎 Enter another tracking ID</button>'
    );
  };

  window.trackSavedOrder = function (code) {
    closeStoreFeatureModal();
    if (typeof window.openOrderTracking === "function") {
      localStorage.setItem("shivam_last_tracking_code", code);\n      window.openOrderTrackingPrompt();
    } else if (typeof window.openOrderTrackingPrompt === "function") {
      window.openOrderTrackingPrompt();
    }
  };

  /* ---------------------------------------------------------
     5. OFFERS + COUPONS
     --------------------------------------------------------- */
  const coupons = [
    { code: "WELCOME10", label: "Welcome offer", note: "10% off — subject to store terms." },
    { code: "SAVE20", label: "Savings offer", note: "₹20 off — subject to store terms." },
    { code: "FREESHIP", label: "Delivery offer", note: "Free delivery — subject to store terms." }
  ];

  window.openCoupons = function () {
    const body =
      '<p class="featureMuted">Enter a coupon during checkout. Offers can be changed by the shopkeeper.</p>' +
      '<div class="couponGrid">' +
      coupons.map(c =>
        '<div class="couponCard">' +
          '<b>' + esc(c.code) + '</b>' +
          '<strong>' + esc(c.label) + '</strong>' +
          '<span>' + esc(c.note) + '</span>' +
          '<button type="button" onclick="copyCoupon(\'' + c.code + '\')">Copy code</button>' +
        '</div>'
      ).join("") +
      '</div>';

    showFeatureModal("🎟️ Offers & Coupons", body);
  };

  window.copyCoupon = async function (code) {
    try {
      await navigator.clipboard.writeText(code);
      alert("Coupon copied: " + code);
    } catch (_) {
      alert("Coupon code: " + code);
    }
  };

  /* ---------------------------------------------------------
     6. REVIEWS + RATINGS
     --------------------------------------------------------- */
  function getReviews() {
    try {
      return JSON.parse(localStorage.getItem("shivam_product_reviews") || "{}");
    } catch (_) {
      return {};
    }
  }

  window.openProductReviews = function (productId, productName) {
    const reviews = getReviews()[String(productId)] || [];
    const stars = reviews.length
      ? '<div class="reviewSummary">⭐ ' +
        (reviews.reduce((a, r) => a + Number(r.rating), 0) / reviews.length).toFixed(1) +
        ' / 5 · ' + reviews.length + ' review' + (reviews.length === 1 ? "" : "s") +
        '</div>'
      : '<div class="featureMuted">No reviews yet. Be the first to review this product.</div>';

    const list = reviews.map(r =>
      '<div class="reviewItem">' +
        '<div>' + "⭐".repeat(Number(r.rating)) + '</div>' +
        '<b>' + esc(r.name || "Customer") + '</b>' +
        '<p>' + esc(r.text || "") + '</p>' +
      '</div>'
    ).join("");

    const body =
      stars +
      '<div class="reviewList">' + (list || "") + '</div>' +
      '<hr>' +
      '<h3>Write a review</h3>' +
      '<select id="reviewRating"><option value="5">⭐⭐⭐⭐⭐</option><option value="4">⭐⭐⭐⭐</option><option value="3">⭐⭐⭐</option><option value="2">⭐⭐</option><option value="1">⭐</option></select>' +
      '<input id="reviewName" placeholder="Your name">' +
      '<textarea id="reviewText" placeholder="What did you think?"></textarea>' +
      '<button class="primary" type="button" onclick="submitProductReview(\'' +
        String(productId).replace(/'/g, "\\'") + '\',\'' +
        String(productName).replace(/'/g, "\\'") + '\')">⭐ Submit Review</button>';

    showFeatureModal("⭐ " + productName, body);
  };

  window.submitProductReview = function (productId, productName) {
    const rating = Number($("reviewRating")?.value || 5);
    const text = String($("reviewText")?.value || "").trim();
    const name = String($("reviewName")?.value || "Customer").trim();

    if (!text) {
      alert("Please write a short review.");
      return;
    }

    const all = getReviews();
    const key = String(productId);
    all[key] = all[key] || [];
    all[key].unshift({
      rating,
      text: text.slice(0, 500),
      name: name.slice(0, 60),
      created_at: new Date().toISOString()
    });
    all[key] = all[key].slice(0, 20);
    localStorage.setItem("shivam_product_reviews", JSON.stringify(all));

    alert("Thank you! Your review was saved on this device.");
    openProductReviews(productId, productName);
  };

  /* ---------------------------------------------------------
     7. PAYMENT HELPERS
     --------------------------------------------------------- */
  window.showPaymentOptions = function () {
    showFeatureModal(
      "💳 Payment Options",
      '<div class="paymentFeature">' +
        '<div>📱 <b>UPI / UPI QR</b><span>Pay using your UPI app.</span></div>' +
        '<div>💵 <b>Cash on Delivery</b><span>Pay when the order is delivered, if available.</span></div>' +
        '<div>💳 <b>Card / Net Banking</b><span>Selection is shown in checkout; actual processing requires a payment gateway.</span></div>' +
      '</div>' +
      '<p class="featureMuted">Razorpay is not added.</p>'
    );
  };

  /* ---------------------------------------------------------
     3. MOBILE BOTTOM NAVIGATION
     --------------------------------------------------------- */
  function installBottomNav() {
    if ($("mobileBottomNav")) return;

    const nav = document.createElement("nav");
    nav.id = "mobileBottomNav";
    nav.innerHTML =
      '<button type="button" onclick="window.scrollTo({top:0,behavior:\'smooth\'})"><span>🏠</span>Home</button>' +
      '<button type="button" onclick="openMyOrders()"><span>📦</span>Orders</button>' +
      '<button type="button" onclick="openWishlist()"><span>❤️</span>Wishlist</button>' +
      '<button type="button" onclick="openCart()"><span>🛒</span>Cart</button>' +
      '<button type="button" onclick="openCustomerLogin()"><span>👤</span>Account</button>';
    document.body.appendChild(nav);
  }

  /* ---------------------------------------------------------
     Product review button: attaches after products render.
     --------------------------------------------------------- */
  function addReviewButtons() {
    const grid = $("products");
    if (!grid) return;

    grid.querySelectorAll(".card").forEach(card => {
      if (card.querySelector(".reviewButton")) return;

      const buttons = card.querySelector(".add");
      if (!buttons) return;

      const onclick = buttons.getAttribute("onclick") || "";
      const match = onclick.match(/addToCart\(['"]([^'"]+)['"]/);
      if (!match) return;

      const id = match[1];
      const productName = card.querySelector("h3")?.textContent?.trim() || "Product";

      const b = document.createElement("button");
      b.type = "button";
      b.className = "reviewButton";
      b.textContent = "⭐ Reviews";
      b.onclick = () => openProductReviews(id, productName);
      buttons.insertAdjacentElement("afterend", b);
    });
  }

  /* Save tracking code whenever the app's tracking UI stores it. */
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (key === "shivam_last_tracking_code" && value) {
      saveTrackingCode(value);
    }
  };

  window.addEventListener("load", () => {
    installBottomNav();
    setTimeout(addReviewButtons, 1200);
    setInterval(addReviewButtons, 2500);

    const offers = document.querySelector('[onclick="showOffers()"]');
    if (offers) {
      offers.setAttribute("onclick", "openCoupons()");
    }

    const payment = document.querySelector('[onclick="showPaymentInfo()"]');
    if (payment) {
      payment.setAttribute("onclick", "showPaymentOptions()");
    }

    const quick = $("quickActions");
    if (quick && !document.getElementById("myOrdersQuickAction")) {
      const b = document.createElement("button");
      b.id = "myOrdersQuickAction";
      b.type = "button";
      b.textContent = "📦 My Orders";
      b.onclick = openMyOrders;
      quick.appendChild(b);
    }
  });
})();