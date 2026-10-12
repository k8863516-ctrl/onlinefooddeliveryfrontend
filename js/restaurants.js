/**
 * Online Food Delivery System - Restaurants Directory (restaurants.js)
 */

let allRestaurants = [];
let activeCuisine = 'all';

const MOCK_RESTAURANTS = [
  {
    id: 1,
    name: "Burger Craft",
    description: "Artisan gourmet burgers made with 100% prime Angus beef and fresh Brioche buns.",
    cuisine: "Burgers",
    address: "124 Broadway St, Downtown",
    imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80",
    rating: 4.8,
    deliveryTime: "20-30 min",
    deliveryFee: 1.99,
    isOpen: true
  },
  {
    id: 2,
    name: "Bella Italia",
    description: "Authentic wood-fired Neapolitan pizzas and handcrafted pasta dishes made daily.",
    cuisine: "Italian",
    address: "58 Little Italy Blvd",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
    rating: 4.9,
    deliveryTime: "25-35 min",
    deliveryFee: 2.49,
    isOpen: true
  },
  {
    id: 3,
    name: "Spice Symphony",
    description: "Traditional aromatic Indian curries, rich biryanis, and tandoori sizzlers.",
    cuisine: "Indian",
    address: "204 Curry Corner Way",
    imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80",
    rating: 4.7,
    deliveryTime: "30-45 min",
    deliveryFee: 2.99,
    isOpen: true
  },
  {
    id: 4,
    name: "Tokyo Sushi Bar",
    description: "Freshly sliced sashimi, signature maki rolls, and piping hot tonkotsu ramen.",
    cuisine: "Japanese",
    address: "88 Sakura Avenue",
    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80",
    rating: 4.9,
    deliveryTime: "35-45 min",
    deliveryFee: 3.49,
    isOpen: true
  },
  {
    id: 5,
    name: "Taco Fiesta",
    description: "Vibrant Mexican street tacos, cheesy quesadillas, and slow-cooked carnitas.",
    cuisine: "Mexican",
    address: "312 Sunset Strip",
    imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80",
    rating: 4.6,
    deliveryTime: "20-30 min",
    deliveryFee: 1.99,
    isOpen: true
  },
  {
    id: 6,
    name: "Green Bowl & Co.",
    description: "Organic nutrient-dense grain bowls, superfood salads, and cold-pressed juices.",
    cuisine: "Healthy",
    address: "15 Healthy Living Way",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80",
    rating: 4.7,
    deliveryTime: "15-25 min",
    deliveryFee: 1.49,
    isOpen: true
  }
];

document.addEventListener('DOMContentLoaded', () => {
  loadRestaurants();
  setupFilters();
  setupSearch();
});

async function loadRestaurants() {
  const container = document.getElementById('restaurant-list');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
      <p style="font-size: 1.2rem; color: var(--text-secondary);">🍽️ Finding restaurants near you...</p>
    </div>
  `;

  try {
    const data = await App.apiFetch('/api/restaurants');
    allRestaurants = data && data.length > 0 ? data : MOCK_RESTAURANTS;
  } catch (err) {
    allRestaurants = MOCK_RESTAURANTS;
  }

  renderRestaurants(allRestaurants);
}

function renderRestaurants(restaurants) {
  const container = document.getElementById('restaurant-list');
  if (!container) return;

  if (restaurants.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
        <div style="font-size: 3.5rem; margin-bottom: 1rem;">🔍</div>
        <h3>No restaurants match your search</h3>
        <p style="color: var(--text-secondary); margin-top: 0.5rem;">Try adjusting your cuisine filter or search keyword.</p>
        <button onclick="resetFilters()" class="btn btn-primary" style="margin-top: 1rem;">Clear Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = restaurants.map(r => `
    <div class="card restaurant-card" onclick="location.href='food-menu.html?id=${r.id}'" style="cursor: pointer;">
      <div style="position: relative; height: 190px; overflow: hidden;">
        <img src="${r.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'}" alt="${r.name}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;">
        <span style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.75); color: white; padding: 0.25rem 0.6rem; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 700;">
          ⏱️ ${r.deliveryTime || '30 min'}
        </span>
        <span style="position: absolute; bottom: 1rem; left: 1rem; background: var(--primary); color: white; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 800; text-transform: uppercase;">
          ${r.cuisine}
        </span>
      </div>
      <div style="padding: 1.4rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
          <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--secondary);">${r.name}</h3>
          <span style="display: flex; align-items: center; gap: 0.25rem; background: #fff8e1; color: #d68910; font-weight: 800; font-size: 0.85rem; padding: 0.2rem 0.5rem; border-radius: 6px;">
            ⭐ ${r.rating || 4.5}
          </span>
        </div>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${r.description || 'Delicious freshly prepared culinary specials'}
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 0.9rem; font-size: 0.88rem; color: var(--text-secondary);">
          <span>🛵 Delivery: <strong>$${(r.deliveryFee || 2.99).toFixed(2)}</strong></span>
          <span style="color: var(--primary); font-weight: 700;">View Menu →</span>
        </div>
      </div>
    </div>
  `).join('');
}

function setupFilters() {
  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCuisine = pill.dataset.cuisine.toLowerCase();
      applyFilters();
    });
  });
}

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    applyFilters(e.target.value);
  });
}

function applyFilters(query) {
  const q = (query !== undefined ? query : (document.getElementById('search-input')?.value || '')).toLowerCase().trim();

  let filtered = allRestaurants;

  if (activeCuisine && activeCuisine !== 'all') {
    filtered = filtered.filter(r => r.cuisine && r.cuisine.toLowerCase() === activeCuisine);
  }

  if (q) {
    filtered = filtered.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.cuisine && r.cuisine.toLowerCase().includes(q))
    );
  }

  renderRestaurants(filtered);
}

function resetFilters() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(p => {
    if (p.dataset.cuisine === 'all') p.classList.add('active');
    else p.classList.remove('active');
  });

  activeCuisine = 'all';
  renderRestaurants(allRestaurants);
}
