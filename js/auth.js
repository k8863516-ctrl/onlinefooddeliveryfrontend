/**
 * Online Food Delivery System - Authentication Logic (auth.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (!email || !password) {
        App.showToast('Please enter both email and password', 'warning');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      try {
        const response = await App.apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        App.setSession(response.token, {
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role
        });

        App.showToast(`Welcome back, ${response.name}!`, 'success');
        redirectAfterLogin(response.role);
      } catch (err) {
        console.warn('API login failed, checking demo credentials fallback:', err);
        // Fallback for offline demo mode
        handleDemoLogin(email, password, submitBtn);
      }
    });
  }

  // Handle Registration
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const phone = document.getElementById('phone') ? document.getElementById('phone').value.trim() : '';
      const address = document.getElementById('address') ? document.getElementById('address').value.trim() : '';
      const role = document.getElementById('role') ? document.getElementById('role').value : 'ROLE_CUSTOMER';
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      if (!name || !email || !password) {
        App.showToast('Please fill out all required fields', 'warning');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      try {
        const response = await App.apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, phone, address, role })
        });

        App.setSession(response.token, {
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role
        });

        App.showToast('Account created successfully!', 'success');
        redirectAfterLogin(response.role);
      } catch (err) {
        // Fallback demo registration
        App.setSession('demo-jwt-token-' + Date.now(), {
          id: 99,
          name,
          email,
          role: role || 'ROLE_CUSTOMER',
          phone,
          address
        });
        App.showToast('Demo account created!', 'success');
        redirectAfterLogin(role);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }
});

function redirectAfterLogin(role) {
  setTimeout(() => {
    if (role === 'ROLE_ADMIN') {
      window.location.href = 'admin.html';
    } else if (role === 'ROLE_RESTAURANT') {
      window.location.href = 'restaurant-portal.html';
    } else {
      window.location.href = 'restaurants.html';
    }
  }, 1000);
}

// Quick Demo autofill buttons
function quickFillLogin(role) {
  const emailInput = document.getElementById('email');
  const passInput = document.getElementById('password');
  if (!emailInput || !passInput) return;

  if (role === 'admin') {
    emailInput.value = 'admin@fooddelivery.com';
    passInput.value = 'admin123';
  } else if (role === 'restaurant') {
    emailInput.value = 'owner@burgercraft.com';
    passInput.value = 'owner123';
  } else {
    emailInput.value = 'customer@gmail.com';
    passInput.value = 'customer123';
  }
  App.showToast(`Prefilled ${role} demo credentials`, 'info');
}

function handleDemoLogin(email, password, submitBtn) {
  const demoUsers = {
    'admin@fooddelivery.com': { id: 1, name: 'System Administrator', role: 'ROLE_ADMIN' },
    'owner@burgercraft.com': { id: 2, name: 'Marco Rossi', role: 'ROLE_RESTAURANT' },
    'customer@gmail.com': { id: 3, name: 'Alex Johnson', role: 'ROLE_CUSTOMER' }
  };

  const user = demoUsers[email.toLowerCase()];
  if (user) {
    App.setSession('demo-jwt-token-' + Date.now(), {
      id: user.id,
      name: user.name,
      email: email.toLowerCase(),
      role: user.role
    });
    App.showToast(`Demo Sign-in successful as ${user.name}!`, 'success');
    redirectAfterLogin(user.role);
  } else {
    App.showToast('Invalid credentials or backend unreachable', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  }
}
