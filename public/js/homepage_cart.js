async function loadHomepageProducts() {
  const grid = document.getElementById('productsGrid');
  const picksWrapper = document.getElementById('picksWrapper');
  if (!grid && !picksWrapper) return;

  try {
    const res = await fetch('/api/books/available');
    const books = await res.json();

    if (grid) {
      grid.innerHTML = books.slice(0, 4).map(renderProductCard).join('');
    }

    if (picksWrapper) {
      picksWrapper.innerHTML = books.slice(4, 8)
        .map(book => `<div class="swiper-slide">${renderProductCard(book)}</div>`)
        .join('');
    }

    wireAddToCartButtons();
  } catch (err) {
    console.error('Failed to load books:', err);
  }
}