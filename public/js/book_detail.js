document.addEventListener('DOMContentLoaded', loadBookDetail);

async function loadBookDetail() {
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get('id');

  const loading = document.getElementById('bookLoading');
  const content = document.getElementById('bookDetailContent');
  const notFound = document.getElementById('bookNotFound');

  if (!bookId) {
    loading.hidden = true;
    notFound.hidden = false;
    return;
  }

  try {
    const res = await fetch(`/api/books/${bookId}`);

    if (!res.ok) {
      loading.hidden = true;
      notFound.hidden = false;
      return;
    }

    const book = await res.json();
    populateBookDetail(book);

    loading.hidden = true;
    content.hidden = false;
  } catch (err) {
    console.error('Failed to load book:', err);
    loading.hidden = true;
    notFound.hidden = false;
  }
}

function populateBookDetail(book) {
  document.getElementById('bookCover').src = book.cover_image || '/images/placeholder-book.jpg';
  document.getElementById('bookCover').alt = book.title;
  document.getElementById('bookCategory').textContent = book.category_name || '';
  document.getElementById('bookTitle').textContent = book.title;
  document.getElementById('bookIsbn').textContent = book.isbn ? `ISBN: ${book.isbn}` : '';
  document.getElementById('bookDescription').textContent = book.description || '';

  const availEl = document.getElementById('bookAvailability');
  const available = Number(book.available_copies) > 0;
  availEl.textContent = available
    ? `${book.available_copies} of ${book.total_copies} copies available`
    : 'Currently unavailable';
  availEl.className = available
    ? 'mt-4 font-semibold text-sm inline-block px-3 py-1 rounded-full bg-green-100 text-green-700'
    : 'mt-4 font-semibold text-sm inline-block px-3 py-1 rounded-full bg-red-100 text-red-700';

  const btn = document.getElementById('bookAddToCart');
  const alreadyInCart = isInCart(book.book_id);
  updateAddToCartButton(btn, alreadyInCart);

  btn.addEventListener('click', () => {
    addToCart(book);
    window.location.href = '/add_to_cart.html';
  });
}

function updateAddToCartButton(btn, inCart) {
  btn.disabled = inCart;
  btn.innerHTML = inCart
    ? '<i class="fa-solid fa-check"></i> In Cart'
    : '<i class="fa-solid fa-bag-shopping"></i> Add to cart';
}