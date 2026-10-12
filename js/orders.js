/**
 * Online Food Delivery System - Order Tracking & History (orders.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!App.isLoggedIn()) {
    App.showToast('Please sign in to view your orders', 'info');
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    return;
  }

  loadOrders();
});

async function loadOrders() {
  const container = document.getElementById('orders-list');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 3rem;">
      <p style="color: var(--text-secondary);">📦 Fetching your orders...</p>
    </div>
  `;

  let orders = [];
  try {
    orders = await App.apiFetch('/api/orders/my-orders');
  } catch (err) {
    const local = JSON.parse(localStorage.getItem('fooddelivery_demo_orders') || '[]');
    orders = local.length > 0 ? local : [
      {
        id: 1,
        orderNumber: 'ORD-984210',
        restaurantName: 'Burger Craft',
        totalAmount: 23.97,
        status: 'DELIVERED',
        deliveryAddress: '42 Wallaby Way, Suite 10',
        paymentMethod: 'CARD',
        paymentStatus: 'PAID',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        items: [
          { foodName: 'The Truffle Beast Burger', quantity: 1, priceAtOrder: 14.99 },
          { foodName: 'Truffle Parmesan Fries', quantity: 1, priceAtOrder: 6.99 }
        ]
      }
    ];
  }

  renderOrders(orders);
}

function renderOrders(orders) {
  const container = document.getElementById('orders-list');
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No orders found</h3>
        <p style="color: var(--text-secondary); margin: 0.5rem 0 1.5rem;">You haven't placed any orders yet.</p>
        <a href="restaurants.html" class="btn btn-primary">Order Food Now</a>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(o => {
    const statusClass = `status-${(o.status || 'PENDING').toLowerCase().replace(/\s+/g, '_')}`;
    const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString() : 'Recent';

    return `
      <div class="card" style="padding: 1.8rem; margin-bottom: 1.8rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.2rem;">
          <div>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">Order #${o.orderNumber}</span>
            <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--secondary); margin-top: 0.2rem;">${o.restaurantName || 'Restaurant'}</h3>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">📅 ${dateStr}</span>
          </div>
          <div style="text-align: right;">
            <span class="status-pill ${statusClass}">${o.status}</span>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary); margin-top: 0.4rem;">$${Number(o.totalAmount).toFixed(2)}</div>
          </div>
        </div>

        <!-- Tracking Progress Stepper -->
        ${renderProgressStepper(o.status)}

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.25rem; font-size: 0.9rem; color: var(--text-secondary); flex-wrap: wrap; gap: 0.8rem;">
          <div>
            <span>📍 Delivery to: <strong>${o.deliveryAddress}</strong></span> • 
            <span>💳 Payment: <strong>${o.paymentMethod || 'COD'} (${o.paymentStatus || 'PENDING'})</strong></span>
          </div>

          ${o.status !== 'DELIVERED' && o.status !== 'CANCELLED' ? `
            <button onclick="cancelOrder(${o.id})" class="btn btn-sm btn-outline" style="color: var(--danger); border-color: var(--danger);">
              Cancel Order
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderProgressStepper(status) {
  const steps = ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const statusUpper = (status || '').toUpperCase();

  if (statusUpper === 'CANCELLED') {
    return `<div style="background: #ffebee; color: #c62828; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-weight: 700; text-align: center;">This order was cancelled.</div>`;
  }

  const currentIndex = steps.indexOf(statusUpper) !== -1 ? steps.indexOf(statusUpper) : 0;

  return `
    <div style="display: flex; justify-content: space-between; position: relative; margin: 1.5rem 0 1rem; padding: 0 1rem;">
      <div style="position: absolute; top: 12px; left: 10%; right: 10%; height: 3px; background: #e9ecef; z-index: 1;">
        <div style="height: 100%; background: var(--accent); width: ${(currentIndex / (steps.length - 1)) * 100}%; transition: width 0.4s ease;"></div>
      </div>
      ${steps.map((st, idx) => {
        const isDone = idx <= currentIndex;
        const labelMap = {
          CONFIRMED: 'Order Confirmed',
          PREPARING: 'Kitchen Preparing',
          OUT_FOR_DELIVERY: 'On the Way',
          DELIVERED: 'Delivered'
        };
        return `
          <div style="position: relative; z-index: 2; text-align: center;">
            <div style="width: 26px; height: 26px; border-radius: 50%; background: ${isDone ? 'var(--accent)' : '#e9ecef'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; margin: 0 auto 0.4rem; font-weight: 700;">
              ${isDone ? '✓' : idx + 1}
            </div>
            <span style="font-size: 0.75rem; font-weight: 700; color: ${isDone ? 'var(--secondary)' : 'var(--text-muted)'};">${labelMap[st]}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order?')) return;

  try {
    await App.apiFetch(`/api/orders/${orderId}/cancel`, { method: 'POST' });
    App.showToast('Order cancelled', 'info');
    loadOrders();
  } catch (err) {
    App.showToast('Could not cancel order: ' + err.message, 'error');
  }
}
