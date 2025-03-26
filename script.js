// Data Structures
const products = [
  { 
    id: 1, 
    name: "Laptop 1", 
    price: 999, 
    images: ["./images/laptop1.jpg", "images/laptop2.jpg", "images/laptop3.jpg"],
    description: "High-performance laptop with 16GB RAM",
    sellerId: 1 
  },
  { 
    id: 2, 
    name: "Phone 1", 
    price: 699, 
    images: ["./images/phone1.jpg", "images/phone2.jpg"],
    description: "Latest smartphone with 128GB storage",
    sellerId: 1
  }
];

// Application State
let cart = [];
let currentUser = null;
const users = JSON.parse(localStorage.getItem('users')) || [];
const sellersProducts = JSON.parse(localStorage.getItem('sellersProducts')) || products.filter(p => p.sellerId);

// Utility Functions
function generateUniqueId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString();
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function validateCreditCard(cardNumber, expDate, cvv) {
  if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
    return { valid: false, message: 'Invalid card number' };
  }
  
  if (!/^\d{2}\/\d{2}$/.test(expDate)) {
    return { valid: false, message: 'Invalid expiration date (MM/YY)' };
  }
  
  if (!/^\d{3,4}$/.test(cvv)) {
    return { valid: false, message: 'Invalid CVV' };
  }
  
  return { valid: true };
}

// DOM Manipulation Functions
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function closeModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
  });
}

function updateUserUI() {
  const greeting = document.getElementById('user-greeting');
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  
  if (currentUser) {
    document.getElementById('username-display').textContent = currentUser.name;
    greeting.style.display = 'block';
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'none';
  } else {
    greeting.style.display = 'none';
    loginBtn.style.display = 'inline-block';
    signupBtn.style.display = 'inline-block';
  }
}

// Cart Management
function loadCart() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartCount();
  }
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  document.getElementById('cart-count').textContent = totalItems;
}

function addToCart(productId, quantity = 1) {
  const product = products.find(p => p.id === productId);
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({...product, quantity});
  }
  
  updateCartCount();
  saveCart();
  showToast(`${product.name} added to cart!`, 'success');
}

function removeFromCart(productId) {
  const index = cart.findIndex(item => item.id === productId);
  if (index !== -1) {
    const removedItem = cart.splice(index, 1)[0];
    updateCartCount();
    saveCart();
    showToast(`${removedItem.name} removed from cart`, 'success');
    showCartPage();
  }
}

function clearCart() {
  if (cart.length === 0) return;
  
  if (confirm('Are you sure you want to clear your cart?')) {
    cart = [];
    updateCartCount();
    saveCart();
    showToast('Cart cleared', 'success');
    showCartPage();
  }
}

// Product Management
function addNewProduct() {
  const name = document.getElementById('product-name').value;
  const price = parseFloat(document.getElementById('product-price').value);
  const description = document.getElementById('product-description').value;
  const images = document.getElementById('product-images').value
    .split('\n')
    .map(url => url.trim())
    .filter(url => url);
  
  const newProduct = {
    id: generateUniqueId(),
    name: escapeHtml(name),
    price,
    description: escapeHtml(description),
    images: images.map(escapeHtml),
    sellerId: currentUser.id
  };
  
  sellersProducts.push(newProduct);
  products.push(newProduct);
  localStorage.setItem('sellersProducts', JSON.stringify(sellersProducts));
  
  showToast('Product added successfully!', 'success');
  loadSellerProducts();
  document.getElementById('product-form').reset();
}

function loadSellerProducts() {
  if (!currentUser) return;
  
  const sellerProductsContainer = document.getElementById('seller-products');
  const myProducts = sellersProducts.filter(p => p.sellerId === currentUser.id);
  
  sellerProductsContainer.innerHTML = myProducts.length === 0 
    ? '<p>You have no products yet.</p>'
    : myProducts.map(product => `
        <div class="seller-product">
          <img src="${product.images[0]}" alt="${product.name}">
          <div class="product-info">
            <h4>${product.name}</h4>
            <p>$${product.price.toFixed(2)}</p>
            <p>${product.description}</p>
          </div>
          <button onclick="deleteProduct(${product.id})" class="delete-btn">Delete</button>
        </div>
      `).join('');
}

function deleteProduct(productId) {
  if (confirm('Are you sure you want to delete this product?')) {
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex !== -1) products.splice(productIndex, 1);
    
    const sellerProductIndex = sellersProducts.findIndex(p => p.id === productId);
    if (sellerProductIndex !== -1) sellersProducts.splice(sellerProductIndex, 1);
    
    localStorage.setItem('sellersProducts', JSON.stringify(sellersProducts));
    loadSellerProducts();
    showToast('Product deleted', 'success');
  }
}

// Page Navigation
function showHomePage() {
  document.getElementById('main-content').innerHTML = `
    <section class="welcome-section">
      <h2>Welcome to MyShop</h2>
      <p>Discover our premium selection of products</p>
    </section>
    <section class="featured-products">
      <h3>Featured Products</h3>
      <div class="products">
        ${products.slice(0, 4).map(product => `
          <div class="product">
            <img src="${product.images[0]}" alt="${product.name}" onclick="showProductDetail(${product.id})">
            <h4>${product.name}</h4>
            <p>$${product.price.toFixed(2)}</p>
            <button onclick="addToCart(${product.id})">Add to Cart</button>
          </div>
        `).join('')}
      </div>
      <button class="view-all-btn" onclick="showProductsPage()">View All Products</button>
    </section>
  `;
  document.getElementById('main-content').dataset.view = 'home';
}

function showProductsPage() {
  document.getElementById('main-content').innerHTML = `
    <h2>Our Products</h2>
    <div class="products">
      ${products.map(product => `
        <div class="product">
          <img src="${product.images[0]}" alt="${product.name}" onclick="showProductDetail(${product.id})">
          <h3>${product.name}</h3>
          <p>$${product.price.toFixed(2)}</p>
          <button onclick="addToCart(${product.id})">Add to Cart</button>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('main-content').dataset.view = 'products';
}

function showProductDetail(productId) {
  const product = products.find(p => p.id === productId);
  document.getElementById('main-content').innerHTML = `
    <div class="product-detail">
      <button onclick="showProductsPage()" class="back-btn">← Back to Products</button>
      <h2>${product.name}</h2>
      <div class="image-gallery">
        <img src="${product.images[0]}" class="main-image" id="main-product-image">
        <div class="thumbnails">
          ${product.images.map(img => `
            <img src="${img}" onclick="changeMainImage('${img}')" class="thumbnail">
          `).join('')}
        </div>
      </div>
      <p class="description">${product.description}</p>
      <p class="price">$${product.price.toFixed(2)}</p>
      <div class="quantity-selector">
        <label for="quantity-${product.id}">Quantity:</label>
        <select id="quantity-${product.id}" class="quantity-select">
          ${Array.from({length: 10}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
        </select>
      </div>
      <button onclick="addToCart(${product.id}, parseInt(document.getElementById('quantity-${product.id}').value))" 
              class="add-to-cart-btn">
        Add to Cart
      </button>
    </div>
  `;
}

function changeMainImage(imgSrc) {
  document.getElementById('main-product-image').src = imgSrc;
}

function showCartPage() {
  const mainContent = document.getElementById('main-content');
  
  if (cart.length === 0) {
    mainContent.innerHTML = `
      <div class="empty-cart">
        <h2>Your Cart</h2>
        <p>Your cart is currently empty</p>
        <button onclick="showProductsPage()">Continue Shopping</button>
      </div>
    `;
    return;
  }

  const subtotal = cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  const shipping = subtotal > 100 ? 0 : 15;
  const total = subtotal + shipping;

  mainContent.innerHTML = `
    <div class="cart-page">
      <div class="cart-header">
        <h2>Your Shopping Cart</h2>
        <button onclick="clearCart()" class="clear-cart-btn">Clear Cart</button>
      </div>
      <div class="cart-items">
        ${cart.map(item => `
          <div class="cart-item">
            <img src="${item.images[0]}" alt="${item.name}">
            <div class="item-info">
              <h3>${item.name}</h3>
              <p>$${item.price.toFixed(2)}</p>
              <div class="item-quantity">
                <button onclick="updateQuantity(${item.id}, ${(item.quantity || 1) - 1})">-</button>
                <span>${item.quantity || 1}</span>
                <button onclick="updateQuantity(${item.id}, ${(item.quantity || 1) + 1})">+</button>
              </div>
            </div>
            <button onclick="removeFromCart(${item.id})">Remove</button>
          </div>
        `).join('')}
      </div>
      <div class="cart-summary">
        <h3>Order Summary</h3>
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Shipping:</span>
          <span>${shipping === 0 ? 'FREE' : '$'+shipping.toFixed(2)}</span>
        </div>
        <div class="summary-row total">
          <span>Total:</span>
          <span>$${total.toFixed(2)}</span>
        </div>
        
        <div class="payment-methods">
          <h3>Payment Method</h3>
          <div class="payment-options">
            <label class="payment-option">
              <input type="radio" name="payment" value="credit" checked>
              <div class="payment-content">
                <i class="fas fa-credit-card"></i>
                <span>Credit Card</span>
              </div>
            </label>
            <label class="payment-option">
              <input type="radio" name="payment" value="paypal">
              <div class="payment-content">
                <i class="fab fa-paypal"></i>
                <span>PayPal</span>
              </div>
            </label>
            <label class="payment-option">
              <input type="radio" name="payment" value="bank">
              <div class="payment-content">
                <i class="fas fa-university"></i>
                <span>Bank Transfer</span>
              </div>
            </label>
          </div>
          
          <div id="credit-card-form" class="payment-form">
            <div class="form-group">
              <label>Card Number</label>
              <input type="text" placeholder="1234 5678 9012 3456" pattern="[\d\s]{16,19}" required>
            </div>
            <div class="form-group">
              <label>Expiration Date</label>
              <input type="text" placeholder="MM/YY" pattern="\d{2}/\d{2}" required>
            </div>
            <div class="form-group">
              <label>CVV</label>
              <input type="text" placeholder="123" pattern="\d{3,4}" required>
            </div>
            <div class="form-group">
              <label>Cardholder Name</label>
              <input type="text" placeholder="John Doe" required>
            </div>
          </div>
          
          <div id="paypal-form" class="payment-form" style="display:none">
            <p>You will be redirected to PayPal to complete your payment</p>
          </div>
          
          <div id="bank-form" class="payment-form" style="display:none">
            <p>Our bank account details will be shown after order confirmation</p>
          </div>
        </div>
        
        <button class="checkout-btn" onclick="processPayment()">Complete Payment</button>
      </div>
    </div>
  `;
  
  document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', function() {
      document.querySelectorAll('.payment-form').forEach(form => {
        form.style.display = 'none';
      });
      document.getElementById(`${this.value}-form`).style.display = 'block';
    });
  });
}

function updateQuantity(productId, newQuantity) {
  if (newQuantity < 1) {
    removeFromCart(productId);
    return;
  }
  
  const item = cart.find(item => item.id === productId);
  if (item) {
    item.quantity = newQuantity;
    updateCartCount();
    saveCart();
    showCartPage();
  }
}

function processPayment() {
  const paymentMethod = document.querySelector('input[name="payment"]:checked');
  if (!paymentMethod) {
    showToast('Please select a payment method', 'error');
    return;
  }

  const method = paymentMethod.value;
  
  if (method === 'credit') {
    const cardNumber = document.querySelector('#credit-card-form input:nth-of-type(1)').value;
    const expDate = document.querySelector('#credit-card-form input:nth-of-type(2)').value;
    const cvv = document.querySelector('#credit-card-form input:nth-of-type(3)').value;
    
    const validation = validateCreditCard(cardNumber, expDate, cvv);
    if (!validation.valid) {
      showToast(validation.message, 'error');
      return;
    }
  }
  
  showToast(`Payment successful with ${method}! Order confirmed.`, 'success');
  
  setTimeout(() => {
    cart = [];
    updateCartCount();
    saveCart();
    showHomePage();
  }, 2000);
}

// Search Functionality
function handleKeyPress(e) {
  if (e.key === 'Enter') {
    searchProducts();
  }
}

function searchProducts() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
  
  if (searchTerm === '') {
   showProductsPage();
    return;
  }

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm)
  );

  
  renderFilteredProducts(filteredProducts);
}

function renderFilteredProducts(filteredProducts) {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';
  mainContent.dataset.view = 'search';
  
  if (filteredProducts.length === 0) {
    mainContent.innerHTML = '<p class="no-results">No products found matching your search.</p>';
    return;
  }

  const productsContainer = document.createElement('div');
  productsContainer.className = 'products';
  
  filteredProducts.forEach(product => {
    const productElement = document.createElement('div');
    productElement.className = 'product';
    productElement.innerHTML = `
      <img src="${product.images[0]}" alt="${product.name}" onclick="showProductDetail(${product.id})">
      <h3>${product.name}</h3>
      <p>$${product.price.toFixed(2)}</p>
      <button onclick="addToCart(${product.id})">Add to Cart</button>
    `;
    productsContainer.appendChild(productElement);
  });
  
  mainContent.appendChild(productsContainer);
}

// Authentication
function showAuthModal(type) {
  closeModals();
  document.getElementById(`${type}-modal`).style.display = 'flex';
}

document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = this.querySelector('[type="email"]').value;
  const password = this.querySelector('[type="password"]').value;
  
  const user = users.find(u => u.email === email && u.password === simpleHash(password));
  if (user) {
    currentUser = user;
    updateUserUI();
    closeModals();
    showToast(`Welcome back, ${user.name}!`);
  } else {
    showToast('Invalid email or password', 'error');
  }
});

document.getElementById('signup-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const user = {
    id: generateUniqueId(),
    name: escapeHtml(formData.get('Full Name')),
    email: formData.get('Email'),
    password: simpleHash(formData.get('Password')),
    membership: formData.get('membership')
  };
  
  if (users.some(u => u.email === user.email)) {
    showToast('Email already registered', 'error');
    return;
  }
  
  users.push(user);
  localStorage.setItem('users', JSON.stringify(users));
  currentUser = user;
  updateUserUI();
  closeModals();
  showToast('Account created successfully!');
});

function logout() {
  currentUser = null;
  updateUserUI();
  showToast('Logged out successfully');
}

// Seller Dashboard
function showSellerDashboard() {
  if (!currentUser) {
    showToast('Please login to access seller dashboard', 'error');
    return;
  }

  document.getElementById('main-content').innerHTML = `
    <div class="seller-dashboard">
      <h2>Seller Dashboard</h2>
      <div class="add-product-form">
        <h3>Add New Product</h3>
        <form id="product-form">
          <div class="form-group">
            <label>Product Name</label>
            <input type="text" id="product-name" required>
          </div>
          <div class="form-group">
            <label>Price ($)</label>
            <input type="number" id="product-price" min="0" step="0.01" required>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="product-description" required></textarea>
          </div>
          <div class="form-group">
            <label>Image URLs (one per line)</label>
            <textarea id="product-images" required></textarea>
          </div>
          <button type="submit" class="submit-btn">Add Product</button>
        </form>
      </div>
      
      <div class="my-products">
        <h3>My Products</h3>
        <div class="products-list" id="seller-products">
          <!-- Seller's products will load here -->
        </div>
      </div>
    </div>
  `;

  document.getElementById('product-form').addEventListener('submit', function(e) {
    e.preventDefault();
    addNewProduct();
  });
  
  loadSellerProducts();
}

// Initialize Application
window.onload = function() {
  loadCart();
  showHomePage();
  updateUserUI();
  
  // Close modals when clicking outside
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      closeModals();
    }
  });
};