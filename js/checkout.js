/**
 * Online Food Delivery System - Checkout Process (checkout.js)
 */

let selectedPayment = 'COD';
let orderSubtotal = 0;
const DELIVERY_FEE = 2.99;
const TAX_RATE = 0.08;

document.addEventListener('DOMContentLoaded', () => {
  if (!App.isLoggedIn()) {
    App.showToast('Please log in to checkout', 'warning');
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    return;
  }

  loadCheckoutData();
  setupPaymentSelection();
});

async function loadCheckoutData() {
  const user = App.getUser();
  if (user) {
    const nameEl = document.getElementById('checkout-name');
    const phoneEl = document.getElementById('checkout-phone');
    const addressEl = document.getElementById('checkout-address');

    if (nameEl) nameEl.value = user.name || '';
    if (phoneEl) phoneEl.value = user.phone || '';
    if (addressEl) addressEl.value = user.address || '';
  }

  // Calculate order items from API or local
  let items = [];
  try {
    items = await App.apiFetch('/api/cart');
  } catch (err) {
    items = App.getLocalCart();
  }

  if (!items || items.length === 0) {
    App.showToast('Your cart is empty!', 'warning');
    setTimeout(() => { window.location.href = 'restaurants.html'; }, 1000);
    return;
  }

  orderSubtotal = items.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  const tax = orderSubtotal * TAX_RATE;
  const grandTotal = orderSubtotal + DELIVERY_FEE + tax;

  const checkoutItemsEl = document.getElementById('checkout-items-summary');
  if (checkoutItemsEl) {
    checkoutItemsEl.innerHTML = items.map(it => `
      <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem; font-size:0.95rem;">
        <span>${it.quantity}x ${it.foodName}</span>
        <strong>$${(Number(it.price || 0) * Number(it.quantity || 1)).toFixed(2)}</strong>
      </div>
    `).join('');
  }

  const subtotalEl = document.getElementById('checkout-subtotal');
  const deliveryEl = document.getElementById('checkout-delivery');
  const taxEl = document.getElementById('checkout-tax');
  const totalEl = document.getElementById('checkout-total');

  if (subtotalEl) subtotalEl.textContent = `$${orderSubtotal.toFixed(2)}`;
  if (deliveryEl) deliveryEl.textContent = `$${DELIVERY_FEE.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${grandTotal.toFixed(2)}`;
}

function setupPaymentSelection() {
  const options = document.querySelectorAll('.payment-option-card');
  options.forEach(opt => {
    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedPayment = opt.dataset.payment;
    });
  });
}

async function placeOrder(e) {
  if (e) e.preventDefault();

  const address = document.getElementById('checkout-address').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const placeBtn = document.getElementById('place-order-btn');

  if (!address) {
    App.showToast('Please enter your delivery address', 'warning');
    return;
  }

  if (placeBtn) {
    placeBtn.disabled = true;
    placeBtn.textContent = 'Processing Order...';
  }

  try {
    const response = await App.apiFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        restaurantId: 1, // Default or active restaurant
        deliveryAddress: address,
        paymentMethod: selectedPayment
      })
    });

    App.setLocalCart([]);
    App.showToast('🎉 Order placed successfully!', 'success');
    setTimeout(() => {
      window.location.href = `my-orders.html?orderId=${response.orderNumber || ''}`;
    }, 1500);
  } catch (err) {
    console.warn('API placeOrder error, saving demo order:', err.message);

    // Save demo order locally
    const demoOrders = JSON.parse(localStorage.getItem('fooddelivery_demo_orders') || '[]');
    const newOrder = {
      id: Date.now(),
      orderNumber: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      restaurantName: 'Burger Craft',
      totalAmount: (orderSubtotal + DELIVERY_FEE + (orderSubtotal * TAX_RATE)).toFixed(2),
      status: 'CONFIRMED',
      deliveryAddress: address,
      paymentMethod: selectedPayment,
      paymentStatus: selectedPayment === 'COD' ? 'PENDING' : 'PAID',
      createdAt: new Date().toISOString()
    };
    demoOrders.unshift(newOrder);
    localStorage.setItem('fooddelivery_demo_orders', JSON.stringify(demoOrders));

    App.setLocalCart([]);
    App.showToast('🎉 Demo order placed successfully!', 'success');
    setTimeout(() => {
      window.location.href = `my-orders.html?orderId=${newOrder.orderNumber}`;
    }, 1500);
  }
}
