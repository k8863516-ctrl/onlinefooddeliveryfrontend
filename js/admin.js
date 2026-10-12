/**
 * Online Food Delivery System - Admin Management Operations (admin.js)
 */

let adminStats = null;
let adminRestaurants = [];
let adminOrders = [];
let adminUsers = [];
let activeAdminTab = 'overview';

document.addEventListener('DOMContentLoaded', () => {
  if (!App.isLoggedIn() || !App.hasRole('ROLE_ADMIN')) {
    App.showToast('Access restricted: Admin authentication required', 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    return;
  }

  setupAdminTabs();
  loadDashboardStats();
  loadAllData();
});

function setupAdminTabs() {
  const tabs = document.querySelectorAll('.admin-nav-item');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetSection = tab.dataset.tab;
      activeAdminTab = targetSection;

      document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = sec.id === `section-${targetSection}` ? 'block' : 'none';
      });
    });
  });
}

async function loadDashboardStats() {
  try {
    adminStats = await App.apiFetch('/api/admin/stats');
  } catch (err) {
    adminStats = {
      totalOrders: 148,
      totalRevenue: 3840.50,
      totalUsers: 52,
      totalRestaurants: 6,
      deliveredOrders: 132,
      pendingOrders: 12
    };
  }

  renderStats();
}

function renderStats() {
  if (!adminStats) return;

  const ordersEl = document.getElementById('stat-total-orders');
  const revenueEl = document.getElementById('stat-total-revenue');
  const usersEl = document.getElementById('stat-total-users');
  const restEl = document.getElementById('stat-total-restaurants');

  if (ordersEl) ordersEl.textContent = adminStats.totalOrders;
  if (revenueEl) revenueEl.textContent = `$${Number(adminStats.totalRevenue).toFixed(2)}`;
  if (usersEl) usersEl.textContent = adminStats.totalUsers;
  if (restEl) restEl.textContent = adminStats.totalRestaurants;
}

async function loadAllData() {
  // Load Restaurants
  try {
    adminRestaurants = await App.apiFetch('/api/admin/restaurants');
  } catch {
    adminRestaurants = [
      { id: 1, name: "Burger Craft", cuisine: "Burgers", rating: 4.8, deliveryFee: 1.99, isOpen: true },
      { id: 2, name: "Bella Italia", cuisine: "Italian", rating: 4.9, deliveryFee: 2.49, isOpen: true },
      { id: 3, name: "Spice Symphony", cuisine: "Indian", rating: 4.7, deliveryFee: 2.99, isOpen: true }
    ];
  }
  renderRestaurantsTable();

  // Load Orders
  try {
    adminOrders = await App.apiFetch('/api/admin/orders');
  } catch {
    adminOrders = [
      { id: 1, orderNumber: "ORD-984210", customerName: "Alex Johnson", restaurantName: "Burger Craft", totalAmount: 23.97, status: "DELIVERED", paymentMethod: "CARD", createdAt: new Date().toISOString() },
      { id: 2, orderNumber: "ORD-519203", customerName: "Sarah Davis", restaurantName: "Bella Italia", totalAmount: 35.49, status: "PREPARING", paymentMethod: "COD", createdAt: new Date().toISOString() }
    ];
  }
  renderOrdersTable();

  // Load Users
  try {
    adminUsers = await App.apiFetch('/api/admin/users');
  } catch {
    adminUsers = [
      { id: 1, name: "System Administrator", email: "admin@fooddelivery.com", role: "ROLE_ADMIN", phone: "+1 555-0100" },
      { id: 2, name: "Marco Rossi", email: "owner@burgercraft.com", role: "ROLE_RESTAURANT", phone: "+1 555-0101" },
      { id: 3, name: "Alex Johnson", email: "customer@gmail.com", role: "ROLE_CUSTOMER", phone: "+1 555-0102" }
    ];
  }
  renderUsersTable();
}

function renderRestaurantsTable() {
  const tbody = document.getElementById('admin-restaurants-tbody');
  if (!tbody) return;

  tbody.innerHTML = adminRestaurants.map(r => `
    <tr>
      <td><strong>#${r.id}</strong></td>
      <td><strong>${r.name}</strong></td>
      <td><span class="badge-tag badge-cuisine">${r.cuisine}</span></td>
      <td>⭐ ${r.rating || 4.5}</td>
      <td>$${(r.deliveryFee || 2.99).toFixed(2)}</td>
      <td>
        <span class="status-pill ${r.isOpen ? 'status-delivered' : 'status-cancelled'}">
          ${r.isOpen ? 'Open' : 'Closed'}
        </span>
      </td>
      <td>
        <button onclick="deleteRestaurant(${r.id})" class="btn btn-sm btn-outline" style="color: var(--danger); border-color: var(--danger);">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderOrdersTable() {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  tbody.innerHTML = adminOrders.map(o => {
    const statusClass = `status-${(o.status || 'PENDING').toLowerCase().replace(/\s+/g, '_')}`;

    return `
      <tr>
        <td><strong>${o.orderNumber}</strong></td>
        <td>${o.customerName || 'Customer'}</td>
        <td>${o.restaurantName || 'Restaurant'}</td>
        <td><strong>$${Number(o.totalAmount).toFixed(2)}</strong></td>
        <td><span class="status-pill ${statusClass}">${o.status}</span></td>
        <td>${o.paymentMethod || 'COD'}</td>
        <td>
          <button onclick="openOrderStatusModal(${o.id}, '${o.status}')" class="btn btn-sm btn-secondary">
            Update Status
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderUsersTable() {
  const tbody = document.getElementById('admin-users-tbody');
  if (!tbody) return;

  tbody.innerHTML = adminUsers.map(u => `
    <tr>
      <td>#${u.id}</td>
      <td><strong>${u.name}</strong></td>
      <td>${u.email}</td>
      <td><span class="user-role-tag">${u.role.replace('ROLE_', '')}</span></td>
      <td>${u.phone || 'N/A'}</td>
    </tr>
  `).join('');
}

// Order Status Modal
let targetOrderId = null;

function openOrderStatusModal(orderId, currentStatus) {
  targetOrderId = orderId;
  const modal = document.getElementById('order-status-modal');
  const select = document.getElementById('modal-status-select');
  if (modal && select) {
    select.value = currentStatus;
    modal.classList.add('active');
  }
}

function closeOrderStatusModal() {
  const modal = document.getElementById('order-status-modal');
  if (modal) modal.classList.remove('active');
  targetOrderId = null;
}

async function saveOrderStatusUpdate() {
  if (!targetOrderId) return;
  const select = document.getElementById('modal-status-select');
  const newStatus = select.value;

  try {
    await App.apiFetch(`/api/orders/${targetOrderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    App.showToast(`Order status updated to ${newStatus}`, 'success');
  } catch (err) {
    App.showToast(`Status updated (demo mode): ${newStatus}`, 'info');
    const ord = adminOrders.find(o => o.id === targetOrderId);
    if (ord) ord.status = newStatus;
  }

  closeOrderStatusModal();
  loadAllData();
  loadDashboardStats();
}

async function deleteRestaurant(id) {
  if (!confirm(`Are you sure you want to remove restaurant #${id}?`)) return;

  try {
    await App.apiFetch(`/api/restaurants/${id}`, { method: 'DELETE' });
    App.showToast('Restaurant removed', 'info');
  } catch (err) {
    App.showToast('Restaurant deleted (demo mode)', 'info');
    adminRestaurants = adminRestaurants.filter(r => r.id !== id);
  }

  renderRestaurantsTable();
}

// Add Restaurant Modal
function openAddRestaurantModal() {
  const modal = document.getElementById('add-restaurant-modal');
  if (modal) modal.classList.add('active');
}

function closeAddRestaurantModal() {
  const modal = document.getElementById('add-restaurant-modal');
  if (modal) modal.classList.remove('active');
}

async function saveNewRestaurant(e) {
  if (e) e.preventDefault();

  const name = document.getElementById('new-rest-name').value;
  const cuisine = document.getElementById('new-rest-cuisine').value;
  const address = document.getElementById('new-rest-address').value;
  const fee = parseFloat(document.getElementById('new-rest-fee').value) || 2.99;
  const img = document.getElementById('new-rest-img').value;

  const newR = {
    name,
    cuisine,
    address,
    deliveryFee: fee,
    imageUrl: img || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    description: `Fresh & authentic ${cuisine} dining.`,
    rating: 4.8,
    deliveryTime: '25-35 min',
    isOpen: true
  };

  try {
    await App.apiFetch('/api/restaurants', {
      method: 'POST',
      body: JSON.stringify(newR)
    });
    App.showToast('Restaurant added successfully!', 'success');
  } catch (err) {
    newR.id = adminRestaurants.length + 1;
    adminRestaurants.push(newR);
    App.showToast('Restaurant created (demo mode)', 'success');
  }

  closeAddRestaurantModal();
  renderRestaurantsTable();
}
