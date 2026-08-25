function renderProductCard(book) {
  const inCart = isInCart(book.book_id);
  const availText = Number(book.available_copies) > 0
    ? `${book.available_copies} available`
    : 'Currently unavailable';

  return `
    <article class="product" data-book-id="${book.book_id}">
      <div class="product__media">
        <img src="${book.cover_image || '/images/placeholder-book.jpg'}" alt="${book.title}">
        <button class="product__add add-to-cart-btn" data-id="${book.book_id}" ${inCart ? 'disabled' : ''}>
          <i class="fa-solid fa-bag-shopping"></i>
          ${inCart ? 'In Cart' : 'Add to Cart'}
        </button>
      </div>
      <div class="product__info">
        <span class="product__category">${book.category_name || ''}</span>
        <h3>${book.title}</h3>
        <p class="product__price">${availText}</p>
      </div>
    </article>`;
}

function wireAddToCartButtons(scope = document) {
  scope.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-book-id]');
      addToCart({
        book_id: Number(btn.dataset.id),
        title: card.querySelector('h3').textContent,
        cover_image: card.querySelector('img').src,
        category_name: card.querySelector('.product__category')?.textContent || '',
        available_copies: card.querySelector('.product__price').textContent,
      });
      window.location.href = '/add_to_cart.html';
    });
  });
}
