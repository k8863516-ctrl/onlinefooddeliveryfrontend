/**
 * Online Food Delivery System - Food Menu Logic (food-menu.js)
 */

let currentRestaurant = null;
let allFoods = [];
let activeCategory = 'all';
let vegOnly = false;

const MOCK_FOODS = {
  1: [
    { id: 1, name: "The Truffle Beast Burger", description: "Angus patty, black truffle aioli, aged cheddar, arugula on brioche", price: 14.99, category: "Burgers", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600", isAvailable: true, isVeg: false },
    { id: 2, name: "Smoky Bacon & BBQ Burger", description: "Double beef patty, crispy smoked bacon, onion rings & house BBQ", price: 15.49, category: "Burgers", imageUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600", isAvailable: true, isVeg: false },
    { id: 3, name: "Crispy Avocado Veggie Burger", description: "Golden quinoa patty, mashed hass avocado, vegan chipotle mayo", price: 12.99, category: "Burgers", imageUrl: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600", isAvailable: true, isVeg: true },
    { id: 4, name: "Truffle Parmesan Fries", description: "Hand-cut Idaho potatoes tossed in white truffle oil and grated parmigiano", price: 6.99, category: "Sides", imageUrl: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600", isAvailable: true, isVeg: true }
  ],
  2: [
    { id: 5, name: "Margherita Napoletana", description: "San Marzano tomatoes, fresh buffalo mozzarella, fragrant basil leaves", price: 16.99, category: "Pizza", imageUrl: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600", isAvailable: true, isVeg: true },
    { id: 6, name: "Spicy Diavola Pizza", description: "Spicy Calabrian salami, red chili flakes, crushed garlic & mozzarella", price: 18.99, category: "Pizza", imageUrl: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600", isAvailable: true, isVeg: false },
    { id: 7, name: "Creamy Fettuccine Alfredo", description: "Fresh egg ribbons in silky garlic cream, butter, and Parmigiano-Reggiano", price: 17.50, category: "Pasta", imageUrl: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600", isAvailable: true, isVeg: true }
  ],
  3: [
    { id: 8, name: "Royal Hyderabadi Dum Biryani", description: "Slow-cooked fragrant basmati rice with tender spiced chicken & saffron", price: 15.99, category: "Biryani", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600", isAvailable: true, isVeg: false },
    { id: 9, name: "Butter Chicken & Garlic Naan", description: "Char-grilled chicken cubes simmered in velvety tomato-butter gravy", price: 16.49, category: "Curry", imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600", isAvailable: true, isVeg: false },
    { id: 10, name: "Paneer Tikka Masala", description: "Cottage cheese cubes marinated in tandoori spices with bell peppers", price: 14.99, category: "Curry", imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600", isAvailable: true, isVeg: true }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get('id') || 1;
  loadMenuData(restaurantId);
});

async function loadMenuData(restaurantId) {
  try {
    const rData = await App.apiFetch(`/api/restaurants/${restaurantId}`);
    currentRestaurant = rData;
  } catch (err) {
    currentRestaurant = {
      id: Number(restaurantId),
      name: "Burger Craft",
      description: "Artisan gourmet burgers made with 100% prime Angus beef and fresh Brioche buns.",
      cuisine: "Burgers",
      rating: 4.8,
      deliveryTime: "20-30 min",
      deliveryFee: 1.99,
      imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800"
    };
  }

  renderRestaurantHeader(currentRestaurant);

  try {
    const fData = await App.apiFetch(`/api/foods/restaurant/${restaurantId}`);
    allFoods = fData && fData.length > 0 ? fData : (MOCK_FOODS[restaurantId] || MOCK_FOODS[1]);
  } catch (err) {
    allFoods = MOCK_FOODS[restaurantId] || MOCK_FOODS[1];
  }

  renderCategories();
  renderFoodItems(allFoods);
}

function renderRestaurantHeader(r) {
  const hero = document.getElementById('restaurant-hero-placeholder');
  if (!hero) return;

  hero.innerHTML = `
    <div class="container restaurant-hero-content">
      <img src="${r.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'}" alt="${r.name}" class="restaurant-hero-img">
      <div class="restaurant-hero-info">
        <div class="restaurant-badge-row">
          <span class="badge-tag badge-cuisine">${r.cuisine}</span>
          <span class="badge-tag badge-open">🟢 Open Now</span>
          <span class="badge-tag">📍 ${r.address || 'Central City'}</span>
        </div>
        <h1 class="restaurant-hero-name">${r.name}</h1>
        <p class="restaurant-hero-desc">${r.description || 'Finest dining crafted with care and fresh ingredients'}</p>
        <div class="restaurant-meta-bar">
          <div class="meta-item meta-rating">⭐ ${r.rating || 4.5} Rating</div>
          <div class="meta-item">⏱️ ${r.deliveryTime || '30 min'} Delivery</div>
          <div class="meta-item">🛵 $${(r.deliveryFee || 2.99).toFixed(2)} Fee</div>
        </div>
      </div>
    </div>
  `;
}

function renderCategories() {
  const container = document.getElementById('menu-category-pills');
  if (!container) return;

  const categories = ['all', ...new Set(allFoods.map(f => f.category || 'Specials'))];

  container.innerHTML = categories.map(cat => `
    <button class="category-pill ${cat === 'all' ? 'active' : ''}" onclick="filterCategory('${cat}')">
      ${cat.charAt(0).toUpperCase() + cat.slice(1)}
    </button>
  `).join('');
}

function filterCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.category-pill').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === cat.toLowerCase());
  });
  applyFoodFilters();
}

function toggleVegOnly() {
  const checkbox = document.getElementById('veg-only-checkbox');
  vegOnly = checkbox ? checkbox.checked : !vegOnly;
  applyFoodFilters();
}

function applyFoodFilters() {
  let list = allFoods;

  if (activeCategory !== 'all') {
    list = list.filter(f => (f.category || '').toLowerCase() === activeCategory.toLowerCase());
  }

  if (vegOnly) {
    list = list.filter(f => f.isVeg);
  }

  renderFoodItems(list);
}

function renderFoodItems(foods) {
  const grid = document.getElementById('food-menu-grid');
  if (!grid) return;

  if (foods.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">🥗</div>
        <h3>No menu items found in this section</h3>
        <p style="color: var(--text-secondary);">Try turning off the veg-only filter or select another category.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = foods.map(f => `
    <div class="food-card">
      <div class="food-card-img-wrap">
        <img src="${f.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}" alt="${f.name}" class="food-card-img">
        <span class="veg-indicator ${f.isVeg ? '' : 'non-veg'}" title="${f.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}"></span>
      </div>
      <div class="food-card-body">
        <h4 class="food-card-title">${f.name}</h4>
        <p class="food-card-desc">${f.description || 'Prepared fresh with chef quality ingredients'}</p>
        <div class="food-card-footer">
          <span class="food-price">$${Number(f.price).toFixed(2)}</span>
          <button onclick="addToCart(${f.id})" class="btn btn-primary btn-sm">
            + Add to Cart
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

async function addToCart(foodId) {
  const item = allFoods.find(f => f.id === foodId);
  if (!item) return;

  if (App.isLoggedIn()) {
    try {
      await App.apiFetch('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ foodItemId: foodId, quantity: 1 })
      });
      App.showToast(`Added "${item.name}" to your cart!`, 'success');
      App.updateCartBadge();
      return;
    } catch (err) {
      console.warn('API cart add failed, using local cart:', err.message);
    }
  }

  // Local Cart fallback
  const cart = App.getLocalCart();
  const existing = cart.find(i => i.foodItemId === foodId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      foodItemId: item.id,
      foodName: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      quantity: 1,
      restaurantId: currentRestaurant ? currentRestaurant.id : 1,
      restaurantName: currentRestaurant ? currentRestaurant.name : 'Restaurant'
    });
  }

  App.setLocalCart(cart);
  App.showToast(`Added "${item.name}" to cart!`, 'success');
}
