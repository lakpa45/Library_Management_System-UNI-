const CART_KEY = 'apna_library_cart';

function getCart() {
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function isInCart(bookId) {
  return getCart().some(item => item.book_id === Number(bookId));
}

function addToCart(book) {
  const cart = getCart();
  if (cart.some(item => item.book_id === book.book_id)) {
    showToast(`"${book.title}" is already in your cart`);
    return;
  }
  cart.push({
    book_id: book.book_id,
    title: book.title,
    cover_image: book.cover_image,
    category_name: book.category_name || '',
    available_copies: book.available_copies,
  });
  saveCart(cart);
  showToast(`"${book.title}" added to cart`);
}

function removeFromCart(bookId) {
  const cart = getCart().filter(item => item.book_id !== Number(bookId));
  saveCart(cart);
}

function getCartCount() {
  return getCart().length;
}

function updateCartBadge() {
  const count = getCartCount();
  document.querySelectorAll('.cart-count-badge').forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

function showToast(message) {
  let toast = document.getElementById('cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.className = 'cart-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

document.addEventListener('DOMContentLoaded', updateCartBadge);