document.addEventListener('DOMContentLoaded', loadBookDetail);

async function loadBookDetail() {
  const bookId = Number(new URLSearchParams(window.location.search).get('id'));
  const loading = document.getElementById('bookLoading');
  const content = document.getElementById('bookDetailContent');
  const notFound = document.getElementById('bookNotFound');

  loading.hidden = false;
  content.hidden = true;
  notFound.hidden = true;

  if (!Number.isInteger(bookId) || bookId <= 0) {
    showBookNotFound(loading, content, notFound);
    return;
  }

  try {
    const response = await fetch(`/api/books/${bookId}`);
    if (!response.ok) {
      showBookNotFound(loading, content, notFound);
      return;
    }
    const book = await response.json();
    populateBookDetail(book);
    loading.hidden = true;
    notFound.hidden = true;
    content.hidden = false;
    await initialiseWishlist(bookId);
  } catch (error) {
    console.error('Failed to load book:', error);
    showBookNotFound(loading, content, notFound);
  }
}

function showBookNotFound(loading, content, notFound) {
  loading.hidden = true;
  content.hidden = true;
  notFound.hidden = false;
}

function populateBookDetail(book) {
  const cover = document.getElementById('bookCover');
  cover.src = book.cover_image || '/images/placeholder-book.svg';
  cover.alt = `Cover of ${book.title}`;
  cover.onerror = () => { cover.onerror = null; cover.src = '/images/placeholder-book.svg'; };
  document.getElementById('bookCategory').textContent = book.category_name || '';
  document.getElementById('bookTitle').textContent = book.title;
  document.getElementById('bookIsbn').textContent = book.isbn ? `ISBN: ${book.isbn}` : '';
  document.getElementById('bookDescription').textContent = book.description || '';

  const readPdf = document.getElementById('bookReadPdf');
  if (typeof book.pdf_file === 'string' && book.pdf_file.trim()) {
    readPdf.href = book.pdf_file;
    readPdf.hidden = false;
  } else {
    readPdf.removeAttribute('href');
    readPdf.hidden = true;
  }

  const availability = document.getElementById('bookAvailability');
  const available = Number(book.available_copies) > 0;
  availability.textContent = available ? `${book.available_copies} of ${book.total_copies} copies available` : 'Currently unavailable';
  availability.className = available
    ? 'mt-4 font-semibold text-sm inline-block px-3 py-1 rounded-full bg-green-100 text-green-700'
    : 'mt-4 font-semibold text-sm inline-block px-3 py-1 rounded-full bg-red-100 text-red-700';
}

async function initialiseWishlist(bookId) {
  const button = document.getElementById('bookWishlistButton');
  const message = document.getElementById('bookWishlistMessage');
  const token = localStorage.getItem('token');
  let wishlisted = false;

  const render = () => {
    button.setAttribute('aria-pressed', String(wishlisted));
    button.innerHTML = wishlisted
      ? '<i class="fa-solid fa-heart" aria-hidden="true"></i><span>Remove from Wishlist</span>'
      : '<i class="fa-regular fa-heart" aria-hidden="true"></i><span>Add to Wishlist</span>';
  };

  render();
  if (token) {
    button.disabled = true;
    try {
      const response = await fetch(`/api/wishlist/${bookId}/status`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (response.ok) wishlisted = Boolean(result.wishlisted);
      else if (response.status !== 401 && response.status !== 403) message.textContent = result.message || 'Unable to load wishlist status.';
      render();
    } catch {
      message.textContent = 'Unable to load wishlist status.';
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener('click', async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      message.textContent = 'Please log in to add books to your wishlist.';
      if (window.confirm('Please log in to add books to your wishlist. Open the login form now?')) window.location.href = '/#login';
      return;
    }

    button.disabled = true;
    message.textContent = wishlisted ? 'Removing from wishlist…' : 'Adding to wishlist…';
    try {
      const response = await fetch(`/api/wishlist/${bookId}`, {
        method: wishlisted ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const result = await response.json();
      if (!response.ok && response.status !== 409) throw new Error(result.message || 'Unable to update wishlist.');
      wishlisted = response.status === 409 ? true : Boolean(result.wishlisted);
      render();
      message.textContent = result.message;
    } catch (error) {
      message.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}
