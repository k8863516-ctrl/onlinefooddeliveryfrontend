/**
 * Online Food Delivery System - Cart Operations (cart.js)
 */

let cartItems = [];
const DELIVERY_FEE = 2.99;
const TAX_RATE = 0.08;

document.addEventListener('DOMContentLoaded', () => {
  loadCart();
});

async function loadCart() {
  const container = document.getElementById('cart-items-container');
  if (!container) return;

  if (App.isLoggedIn()) {
    try {
      cartItems = await App.apiFetch('/api/cart');
    } catch (err) {
      cartItems = App.getLocalCart();
    }
  } else {
    cartItems = App.getLocalCart();
  }

  renderCart();
}

function renderCart() {
  const container = document.getElementById('cart-items-container');
  const summaryBox = document.getElementById('cart-summary-box');
  if (!container) return;

  if (!cartItems || cartItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p style="color: var(--text-secondary); margin: 0.5rem 0 1.5rem;">Explore great restaurants and discover your next favorite meal.</p>
        <a href="restaurants.html" class="btn btn-primary">Browse Restaurants</a>
      </div>
    `;
    if (summaryBox) summaryBox.style.display = 'none';
    App.updateCartBadge();
    return;
  }

  if (summaryBox) summaryBox.style.display = 'block';

  container.innerHTML = `
    <div class="cart-header-row">
      <h2 class="cart-title">Your Order Items (${cartItems.length})</h2>
      <button onclick="clearCart()" class="btn btn-sm btn-outline" style="color: var(--danger); border-color: var(--danger);">Clear Cart</button>
    </div>
    <div class="cart-items-list">
      ${cartItems.map((item, index) => {
        const itemPrice = Number(item.price || 0);
        const itemQty = Number(item.quantity || 1);
        const itemTotal = (itemPrice * itemQty).toFixed(2);
        const itemId = item.id || index;

        return `
          <div class="cart-item">
            <div class="cart-item-info">
              <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}" alt="${item.foodName}" class="cart-item-img">
              <div class="cart-item-details">
                <h4>${item.foodName}</h4>
                <div class="cart-item-price">$${itemPrice.toFixed(2)} each</div>
              </div>
            </div>

            <div class="quantity-control">
              <button class="qty-btn" onclick="updateItemQuantity(${item.id || null}, ${index}, ${itemQty - 1})">−</button>
              <span class="qty-val">${itemQty}</span>
              <button class="qty-btn" onclick="updateItemQuantity(${item.id || null}, ${index}, ${itemQty + 1})">+</button>
            </div>

            <div class="item-total-price">$${itemTotal}</div>

            <button class="delete-btn" onclick="deleteCartItem(${item.id || null}, ${index})" title="Remove item">🗑️</button>
          </div>
        `;
      }).join('')}
    </div>
  `;

  updateOrderSummary();
  App.updateCartBadge();
}

function updateOrderSummary() {
  const subtotal = cartItems.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  const tax = subtotal * TAX_RATE;
  const grandTotal = subtotal > 0 ? subtotal + DELIVERY_FEE + tax : 0;

  const subtotalEl = document.getElementById('summary-subtotal');
  const deliveryEl = document.getElementById('summary-delivery');
  const taxEl = document.getElementById('summary-tax');
  const totalEl = document.getElementById('summary-total');

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (deliveryEl) deliveryEl.textContent = `$${DELIVERY_FEE.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${grandTotal.toFixed(2)}`;
}

async function updateItemQuantity(backendId, localIndex, newQty) {
  if (newQty <= 0) {
    await deleteCartItem(backendId, localIndex);
    return;
  }

  if (App.isLoggedIn() && backendId) {
    try {
      await App.apiFetch(`/api/cart/item/${backendId}?quantity=${newQty}`, { method: 'PUT' });
      await loadCart();
      return;
    } catch (err) {
      console.warn('API update failed:', err);
    }
  }

  // Local fallback
  const cart = App.getLocalCart();
  if (cart[localIndex]) {
    cart[localIndex].quantity = newQty;
    App.setLocalCart(cart);
    cartItems = cart;
    renderCart();
  }
}

async function deleteCartItem(backendId, localIndex) {
  if (App.isLoggedIn() && backendId) {
    try {
      await App.apiFetch(`/api/cart/item/${backendId}`, { method: 'DELETE' });
      App.showToast('Item removed from cart', 'info');
      await loadCart();
      return;
    } catch (err) {
      console.warn('API delete failed:', err);
    }
  }

  // Local fallback
  const cart = App.getLocalCart();
  cart.splice(localIndex, 1);
  App.setLocalCart(cart);
  cartItems = cart;
  App.showToast('Item removed', 'info');
  renderCart();
}

async function clearCart() {
  if (App.isLoggedIn()) {
    try {
      await App.apiFetch('/api/cart/clear', { method: 'DELETE' });
    } catch (err) {
      console.warn(err);
    }
  }

  App.setLocalCart([]);
  cartItems = [];
  App.showToast('Cart cleared', 'info');
  renderCart();
}

function proceedToCheckout() {
  if (cartItems.length === 0) {
    App.showToast('Your cart is empty', 'warning');
    return;
  }

  if (!App.isLoggedIn()) {
    App.showToast('Please sign in to proceed with checkout', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);
    return;
  }

  window.location.href = 'checkout.html';
}
