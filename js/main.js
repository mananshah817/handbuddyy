// HandBuddyy Main Javascript File

// Initial State and Mock Data
let cart = JSON.parse(localStorage.getItem('handbuddyy_cart')) || [];

// Products Data (Simulating a Backend Response)
const defaultProducts = [
  {
    id: 'prod_1',
    name: 'Classic Urban Tote',
    description: 'A premium canvas tote perfect for everyday essentials or a trip to the studio. Features reinforced straps and minimal branding.',
    price: 3499,
    image: './assets/tote_bag.png',
    category: 'tote',
    availableQty: 10
  },
  {
    id: 'prod_2',
    name: 'Midnight Crossbody Sling',
    description: 'Sleek lines, black leather finish with subtle metallic accents. The perfect companion for city nights and tight spaces.',
    price: 4299,
    image: './assets/sling_bag.png',
    category: 'sling',
    availableQty: 5
  },
  {
    id: 'prod_3',
    name: 'Everyday Canvas Tote',
    description: 'Lightweight, durable, and highly functional. Includes an inner zipper pocket for your valuables.',
    price: 2199,
    image: './assets/tote_bag.png',
    category: 'tote',
    availableQty: 2 // Low stock simulation
  },
  {
    id: 'prod_4',
    name: 'Lux Mini Sling',
    description: 'A compact and modern sling bag crafted for minimalists. Enough space for a phone, wallet, and keys.',
    price: 2899,
    image: './assets/sling_bag.png',
    category: 'sling',
    availableQty: 0 // Out of stock simulation
  }
];

let products = [];
async function initProducts() {
  const snapshot = await db.collection('products').get();
  if (snapshot.empty) {
    products = defaultProducts;
    for (const p of products) {
      await db.collection('products').doc(p.id).set(p);
    }
  } else {
    products = snapshot.docs.map(doc => doc.data());
  }
}

// Initialize Cart Count in Navbar
function updateCartCount() {
  const countEl = document.getElementById('nav-cart-count');
  if (countEl) {
    const totalItems = cart.reduce((sum, item) => sum + item.cartQty, 0);
    countEl.textContent = totalItems;
  }
}

// Global user state
let currentUser = null;
let currentUserData = null;

// Ensure the count is updated on all pages on load
document.addEventListener('DOMContentLoaded', async () => {
  // Mobile Menu Logic
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');
  
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navLinks.classList.remove('active'));
    });

    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
        navLinks.classList.remove('active');
      }
    });
  }

  // Firebase Auth State Listener
  auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    
    if (user) {
      // User is logged in
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          currentUserData = userDoc.data();
          
          // Show Dashboard link for admins
          if (currentUserData.role === 'admin' && !document.getElementById('nav-admin-link')) {
            const adminLi = document.createElement('li');
            adminLi.id = 'nav-admin-link';
            adminLi.innerHTML = `<a href="admin.html" class="nav-link" style="color: var(--accent-color); font-weight: 600;">Dashboard</a>`;
            const navUl = document.getElementById('nav-links');
            if (navUl) navUl.insertBefore(adminLi, navUl.firstChild);
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }

      // Update UI for logged in state
      const loginLinks = document.querySelectorAll('a[href="login.html"]');
      loginLinks.forEach(link => {
        link.textContent = 'Logout';
        link.href = '#';
        link.onclick = (e) => {
          e.preventDefault();
          auth.signOut().then(() => {
            window.location.href = 'index.html';
          });
        };
      });

      // Show profile link if user is logged in
      if (!document.getElementById('nav-profile-link')) {
        const profileLi = document.createElement('li');
        profileLi.id = 'nav-profile-link';
        profileLi.innerHTML = `<a href="profile.html" class="nav-link">Profile</a>`;
        const navUl = document.getElementById('nav-links');
        if (navUl) {
           const loginLi = Array.from(navUl.children).find(li => li.querySelector('a[href="#"]'));
           navUl.insertBefore(profileLi, loginLi);
        }
      }

    } else {
      // User is logged out
      currentUserData = null;
      
      // Hide cart and private features
      const cartLinks = document.querySelectorAll('a[href="cart.html"]');
      cartLinks.forEach(link => {
        link.style.display = 'none';
        if (link.parentElement && link.parentElement.tagName === 'LI') {
          link.parentElement.style.display = 'none';
        }
      });

      // Redirect if on protected page
      const protectedPages = ['cart.html', 'address.html', 'checkout.html', 'profile.html', 'admin.html'];
      if (protectedPages.some(page => window.location.pathname.includes(page))) {
        window.location.href = 'login.html';
        return;
      }
    }
    
    // Refresh page specific content after auth is resolved
    if (window.location.pathname.includes('shop.html')) renderShop();
    if (window.location.pathname.includes('cart.html')) renderCart();
    if (window.location.pathname.includes('detail.html')) renderDetail();
    if (window.location.pathname.includes('profile.html')) typeof renderProfile === 'function' && renderProfile();
  });

  await initProducts();
  updateCartCount();
});

// Save cart to local storage
function saveCart() {
  localStorage.setItem('handbuddyy_cart', JSON.stringify(cart));
  updateCartCount();
}

// Formatting price to INR
function formatPrice(price) {
  return '₹' + price.toLocaleString('en-IN');
}

// Add to Cart Function
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product || product.availableQty === 0) return;

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    if (existingItem.cartQty < product.availableQty) {
      existingItem.cartQty += 1;
      showToast(`Added another ${product.name} to cart!`);
    } else {
      showToast(`Sorry, only ${product.availableQty} available in stock!`, 'error');
    }
  } else {
    cart.push({ ...product, cartQty: 1 });
    showToast(`${product.name} added to cart!`);
  }
  
  saveCart();
  if (window.location.pathname.includes('shop.html')) renderShop();
  if (window.location.pathname.includes('cart.html')) renderCart();
}

function updateCartItemQty(productId, change) {
  const itemIndex = cart.findIndex(p => p.id === productId);
  if (itemIndex > -1) {
    const item = cart[itemIndex];
    const newQty = item.cartQty + change;
    
    if (newQty > 0 && newQty <= item.availableQty) {
      item.cartQty = newQty;
      saveCart();
      renderCart();
    } else if (newQty > item.availableQty) {
      showToast(`Only ${item.availableQty} available in stock!`, 'error');
    } else if (newQty === 0) {
      removeCartItem(productId);
    }
  }
}

function removeCartItem(productId) {
  cart = cart.filter(p => p.id !== productId);
  saveCart();
  renderCart();
  showToast('Item removed from cart');
}

// Render Shop Page
function renderShop() {
  const container = document.getElementById('shop-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (products.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 40px; grid-column: span 3;">No products available at the moment.</div>`;
    return;
  }

  products.forEach(product => {
    // Check if item is in cart to adjust "add to cart" text
    const inCart = cart.find(item => item.id === product.id);
    const cartQty = inCart ? inCart.cartQty : 0;
    const isOutOfStock = product.availableQty === 0 || cartQty >= product.availableQty;
    
    container.innerHTML += `
      <div class="card">
        <a href="detail.html?id=${product.id}" style="text-decoration: none; color: inherit; display: block;">
          <div class="product-img-wrapper">
            <img src="${product.image}" alt="${product.name}" class="product-img">
          </div>
          <div class="product-info" style="padding-bottom: 0;">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-desc" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${product.description}</p>
          </div>
        </a>
        <div class="product-info" style="padding-top: 8px;">
          <div class="product-meta">
            <span class="product-price">${formatPrice(product.price)}</span>
            ${product.availableQty === 0 
              ? '<span class="product-qty out-of-stock">Out of Stock</span>' 
              : `<span class="product-qty">${product.availableQty} Available</span>`}
          </div>
          <button 
            onclick="addToCart('${product.id}')" 
            class="btn ${isOutOfStock ? 'btn-outline' : 'btn-primary'} btn-block"
            ${isOutOfStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
          >
            ${product.availableQty === 0 ? 'Sold Out' : (inCart ? 'Add More to Cart' : 'Add to Cart')}
          </button>
        </div>
      </div>
    `;
  });
}

// Render Detail Page
function renderDetail() {
  const container = document.getElementById('detail-container');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  if (!productId) {
    container.innerHTML = '<h2>Product not found</h2>';
    return;
  }

  const product = products.find(p => p.id === productId);
  if (!product) {
    container.innerHTML = '<h2>Product not found in inventory</h2>';
    return;
  }

  const inCart = cart.find(item => item.id === product.id);
  const cartQty = inCart ? inCart.cartQty : 0;
  const isOutOfStock = product.availableQty === 0 || cartQty >= product.availableQty;

  container.innerHTML = `
    <div class="grid-2" style="margin-top: 40px;">
      <div style="background: var(--bg-subtle); padding: 40px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center;">
        <img src="${product.image}" alt="${product.name}" style="max-width: 100%; max-height: 500px; object-fit: contain; border-radius: var(--radius-md);">
      </div>
      <div style="display: flex; flex-direction: column; justify-content: center;">
        <div style="margin-bottom: 24px;">
          <span style="background: var(--bg-subtle); color: var(--secondary-color); padding: 4px 12px; border-radius: var(--radius-pill); font-size: 0.875rem; font-weight: 500; text-transform: uppercase;">
            ${product.category || 'Bag'}
          </span>
        </div>
        <h1 style="font-size: 2.5rem; margin-bottom: 16px;">${product.name}</h1>
        <p style="font-size: 1.5rem; color: var(--accent-color); font-weight: 700; margin-bottom: 24px;">
          ${formatPrice(product.price)}
        </p>
        
        <div style="margin-bottom: 32px;">
          <h3 style="margin-bottom: 8px;">Product Details</h3>
          <p style="color: var(--secondary-color); line-height: 1.8; font-size: 1.125rem;">
            ${product.description}
          </p>
        </div>

        <div style="margin-bottom: 24px;">
            ${product.availableQty === 0 
              ? '<span style="color: #ef4444; font-weight: 600; padding: 6px 12px; background: #fef2f2; border-radius: var(--radius-sm);">Currently Out of Stock</span>' 
              : `<span style="color: #10b981; font-weight: 600;">In Stock: ${product.availableQty} available</span>`}
        </div>

        <button 
          onclick="addToCart('${product.id}'); renderDetail();" 
          class="btn ${isOutOfStock ? 'btn-outline' : 'btn-primary'}"
          style="padding: 16px 24px; font-size: 1.125rem; max-width: 300px;"
          ${isOutOfStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
        >
          ${product.availableQty === 0 ? 'Sold Out' : (inCart ? 'Add Another to Cart' : 'Add to Cart')}
        </button>
      </div>
    </div>
  `;
}

// Render Cart Page
function renderCart() {
  const itemsContainer = document.getElementById('cart-items-wrapper');
  const summaryContainer = document.getElementById('cart-summary-wrapper');
  if (!itemsContainer || !summaryContainer) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div style="text-align: center; padding: 60px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <h2>Your cart is empty</h2>
        <p style="color: var(--text-muted); margin: 16px 0 24px;">Looks like you haven't added any bags yet.</p>
        <a href="shop.html" class="btn btn-primary">Start Shopping</a>
      </div>
    `;
    summaryContainer.innerHTML = '';
    return;
  }

  let subtotal = 0;
  
  itemsContainer.innerHTML = '<div class="card" style="padding: 24px;">' + cart.map(item => {
    subtotal += item.price * item.cartQty;
    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <h3 class="cart-item-title">${item.name}</h3>
          <div class="cart-item-price">${formatPrice(item.price)}</div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="qty-controls">
              <button onclick="updateCartItemQty('${item.id}', -1)" class="qty-btn">-</button>
              <span style="font-weight: 500; width: 20px; text-align: center;">${item.cartQty}</span>
              <button onclick="updateCartItemQty('${item.id}', 1)" class="qty-btn">+</button>
            </div>
            <button onclick="removeCartItem('${item.id}')" class="remove-btn">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('') + '</div>';

  summaryContainer.innerHTML = `
    <div class="summary-card">
      <h3 style="margin-bottom: 24px; font-size: 1.25rem;">Order Summary</h3>
      <div class="summary-row">
        <span style="color: var(--secondary-color);">Subtotal</span>
        <span style="font-weight: 600;">${formatPrice(subtotal)}</span>
      </div>
      <div class="summary-row">
        <span style="color: var(--secondary-color);">Shipping</span>
        <span style="font-weight: 600; color: #10b981;">Free</span>
      </div>
      <div class="summary-total">
        <span>Total</span>
        <span>${formatPrice(subtotal)}</span>
      </div>
      <a href="address.html" class="btn btn-primary btn-block" style="margin-top: 24px; padding: 16px; font-size: 1.125rem;">
        Proceed to Checkout
      </a>
    </div>
  `;
}

// Simple Toast Notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
  toast.style.color = '#fff';
  toast.style.padding = '12px 24px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  toast.style.zIndex = '3000'; // Higher than modals (2000)
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.3s ease';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.style.opacity = '1', 10);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}
