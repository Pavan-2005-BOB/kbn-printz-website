// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";

document.addEventListener("DOMContentLoaded", () => {
  // 🔥 Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyB8zDdfyDmmLkPHAVObmsqIBYqQ8DSFjM4",
    authDomain: "kbn-printz-store.firebaseapp.com",
    projectId: "kbn-printz-store",
    storageBucket: "kbn-printz-store.appspot.com",
    messagingSenderId: "1067786431485",
    appId: "1:1067786431485:web:83e1db7c5880d952574794",
    measurementId: "G-4SST0WTRMZ"
  };

  // 🚀 Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const analytics = getAnalytics(app);
  console.log("Firebase connected ✅");

  // =====================
  // 🛒 CART MANAGEMENT
  // =====================
  const cartKey = "cartItems";
  const cartItemsContainer = document.querySelector("#cartItemsContainer");
  const summaryItemsContainer = document.querySelector("#summaryItemsContainer");
  const shippingForm = document.querySelector("#shippingForm");

  // Load cart from localStorage
  let cart = JSON.parse(localStorage.getItem(cartKey)) || [];

  // Save cart
  function saveCart() {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }

  // Update cart badge
  function updateCartIcon() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartBadge = document.querySelector("#cartCount");
    if (cartBadge) cartBadge.textContent = count;
  }

  // Add item to cart
  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);

      const existing = cart.find((item) => item.id === id);
      if (existing) {
        existing.quantity++;
      } else {
        cart.push({ id, name, price, quantity: 1 });
      }

      saveCart();
      updateCartIcon();
      alert(`${name} added to cart!`);
    });
  });

  // Render cart items
  function renderCart() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `<p>Your cart is empty 🛍️</p>`;
      return;
    }

    cart.forEach((item, index) => {
      const div = document.createElement("div");
      div.classList.add("cart-item");
      div.innerHTML = `
        <div class="cart-info">
          <span>${item.name}</span>
          <span>₹${item.price.toFixed(2)}</span>
        </div>
        <div class="cart-actions">
          <input type="number" min="1" value="${item.quantity}" data-index="${index}" class="quantity-input">
          <button data-index="${index}" class="remove-btn">❌</button>
        </div>
      `;
      cartItemsContainer.appendChild(div);
    });

    renderSummary();
  }

  // Render summary (subtotal, total)
  function renderSummary() {
    if (!summaryItemsContainer) return;
    summaryItemsContainer.innerHTML = "";

    let subtotal = 0;
    cart.forEach((item) => {
      subtotal += item.price * item.quantity;
    });

    const shipping = subtotal > 0 ? 50 : 0;
    const total = subtotal + shipping;

    summaryItemsContainer.innerHTML = `
      <p>Subtotal: ₹${subtotal.toFixed(2)}</p>
      <p>Shipping: ₹${shipping.toFixed(2)}</p>
      <h4>Total: ₹${total.toFixed(2)}</h4>
    `;
  }

  // Handle quantity changes
  document.addEventListener("input", (e) => {
    if (e.target.classList.contains("quantity-input")) {
      const index = e.target.dataset.index;
      const newQty = parseInt(e.target.value);
      if (newQty > 0) {
        cart[index].quantity = newQty;
        saveCart();
        renderCart();
        updateCartIcon();
      }
    }
  });

  // Handle remove item
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-btn")) {
      const index = e.target.dataset.index;
      cart.splice(index, 1);
      saveCart();
      renderCart();
      updateCartIcon();
    }
  });

  // =====================
  // 📦 CHECKOUT FORM
  // =====================
  if (shippingForm) {
    shippingForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = shippingForm.querySelector("#name").value.trim();
      const address = shippingForm.querySelector("#address").value.trim();
      const phone = shippingForm.querySelector("#phone").value.trim();

      if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
      }

      const order = {
        name,
        address,
        phone,
        items: cart,
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0) + 50,
        createdAt: new Date().toISOString(),
      };

      try {
        await addDoc(collection(db, "orders"), order);
        alert("✅ Order placed successfully!");
        localStorage.removeItem(cartKey);
        cart = [];
        renderCart();
        updateCartIcon();
        shippingForm.reset();
      } catch (error) {
        console.error("❌ Error saving order:", error);
        alert("Failed to place order. Please try again.");
      }
    });
  }

  // =====================
  // 🔄 INITIAL LOAD
  // =====================
  renderCart();
  updateCartIcon();
});
