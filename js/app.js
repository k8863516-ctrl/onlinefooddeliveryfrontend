/**
 * Online Food Delivery System - Main Application Logic (app.js)
 */

// Default backend API URL. Supports Render production backend or local Spring Boot instance.
const DEFAULT_API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080'
  : 'https://online-food-delivery-backend-k886.onrender.com'; // Render production backend placeholder

const App = {
  getApiUrl() {
    return localStorage.getItem('fooddelivery_api_url') || DEFAULT_API_URL;
  },

  setApiUrl(url) {
    if (url) {
      localStorage.setItem('fooddelivery_api_url', url.trim().replace(/\/$/, ''));
    }
  },

  // Authentication Helpers
  getToken() {
    return localStorage.getItem('fooddelivery_token');
  },

  getUser() {
    const raw = localStorage.getItem('fooddelivery_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setSession(token, user) {
    localStorage.setItem('fooddelivery_token', token);
    localStorage.setItem('fooddelivery_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('fooddelivery_token');
    localStorage.removeItem('fooddelivery_user');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  hasRole(role) {
    const user = this.getUser();
    if (!user || !user.role) return false;
    const cleanRole = role.startsWith('ROLE_') ? role : 'ROLE_' + role.toUpperCase();
    return user.role === cleanRole;
  },

  // Core API Fetch Wrapper
  async apiFetch(endpoint, options = {}) {
    const url = `${this.getApiUrl()}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      if (response.status === 401) {
        // Token expired or invalid
        this.clearSession();
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
          this.showToast('Session expired. Please log in again.', 'error');
          setTimeout(() => { window.location.href = 'login.html'; }, 1200);
        }
        throw new Error('Unauthorized');
      }

      if (response.status === 204) {
        return null;
      }

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error((data && (data.message || data.error)) || `HTTP Error ${response.status}`);
      }
      return data;
    } catch (err) {
      console.warn(`[App.apiFetch] Request to ${url} failed:`, err.message);
      throw err;
    }
  },

  // Toast Notification helper
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> <div>${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  // Update Cart Count Badge across any page
  async updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (!badge) return;

    if (!this.isLoggedIn()) {
      // Local storage fallback for guests
      const guestCart = this.getLocalCart();
      const count = guestCart.reduce((acc, it) => acc + (it.quantity || 1), 0);
      badge.textContent = count;
      return;
    }

    try {
      const items = await this.apiFetch('/api/cart');
      const count = (items || []).reduce((acc, it) => acc + (it.quantity || 0), 0);
      badge.textContent = count;
    } catch (err) {
      const guestCart = this.getLocalCart();
      const count = guestCart.reduce((acc, it) => acc + (it.quantity || 1), 0);
      badge.textContent = count;
    }
  },

  // Local Cart for demo/offline fallback
  getLocalCart() {
    try {
      return JSON.parse(localStorage.getItem('fooddelivery_local_cart') || '[]');
    } catch {
      return [];
    }
  },

  setLocalCart(cart) {
    localStorage.setItem('fooddelivery_local_cart', JSON.stringify(cart));
    this.updateCartBadge();
  },

  // Navbar dynamic user status render
  renderNavbar() {
    const actions = document.querySelector('.nav-actions');
    if (!actions) return;

    const user = this.getUser();
    if (user) {
      const portalLink = user.role === 'ROLE_ADMIN'
        ? `<a href="admin.html" class="btn btn-sm btn-outline">👑 Admin</a>`
        : user.role === 'ROLE_RESTAURANT'
        ? `<a href="restaurant-portal.html" class="btn btn-sm btn-outline">🏪 My Restaurant</a>`
        : '';

      actions.innerHTML = `
        ${portalLink}
        <a href="cart.html" class="cart-btn" title="View Cart">
          🛒 Cart <span class="cart-badge">0</span>
        </a>
        <div class="user-badge">
          <span>👤 ${user.name.split(' ')[0]}</span>
          <span class="user-role-tag">${user.role.replace('ROLE_', '')}</span>
        </div>
        <button onclick="App.logout()" class="btn btn-sm btn-secondary" title="Sign out">Log Out</button>
      `;
    } else {
      actions.innerHTML = `
        <a href="cart.html" class="cart-btn" title="View Cart">
          🛒 Cart <span class="cart-badge">0</span>
        </a>
        <a href="login.html" class="btn btn-outline btn-sm">Log In</a>
        <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>
      `;
    }
    this.updateCartBadge();
  },

  logout() {
    this.clearSession();
    this.showToast('You have been logged out.', 'info');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 800);
  },

  // Render backend API connectivity badge
  renderApiStatusBadge() {
    const banner = document.getElementById('api-status-banner');
    if (!banner) return;

    fetch(`${this.getApiUrl()}/api/restaurants`, { method: 'GET' })
      .then(res => {
        if (res.ok) {
          banner.innerHTML = `
            <span class="api-status-dot online"></span>
            <span>Live Spring Boot Backend Connected (${this.getApiUrl()})</span>
            <button onclick="App.promptBackendUrl()" style="background:none;border:none;color:#74b9ff;cursor:pointer;text-decoration:underline;font-size:inherit;">Change Backend URL</button>
          `;
        } else {
          throw new Error();
        }
      })
      .catch(() => {
        banner.innerHTML = `
          <span class="api-status-dot offline"></span>
          <span>Backend not reachable at ${this.getApiUrl()}. Using responsive Interactive Demo Mode.</span>
          <button onclick="App.promptBackendUrl()" style="background:none;border:none;color:#ffeaa7;cursor:pointer;text-decoration:underline;font-size:inherit;font-weight:700;">Connect Backend URL</button>
        `;
      });
  },

  promptBackendUrl() {
    const current = this.getApiUrl();
    const next = prompt("Enter your Spring Boot Backend API Base URL (e.g., http://localhost:8080 or Render URL):", current);
    if (next && next.trim()) {
      this.setApiUrl(next.trim());
      this.showToast('Backend URL updated! Reloading...', 'info');
      setTimeout(() => location.reload(), 800);
    }
  },

  init() {
    this.renderNavbar();
    this.renderApiStatusBadge();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
