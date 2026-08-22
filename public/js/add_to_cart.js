const BOOKS = [
    {
      id: "b1",
      title: "The Jungle Book",
      author: "Rudyard Kipling",
      price: null,
      img: "./images/Economics of Hotel Management.png",
      tag: "New"
    }
  ];
  const grid = document.getElementById("grid");
  const cartCountEl = document.getElementById("cartCount");
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("overlay");
  const drawerItems = document.getElementById("drawerItems");
  const subtotalEl = document.getElementById("subtotal");
  let cart = {};
  function rupee(n) {
    return "₹" + n.toLocaleString("en-IN");
  }
  function stars() {
    return '<i class="fa-solid fa-star"></i>'.repeat(5);
  }
  BOOKS.forEach(book => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-media">
        ${book.tag ? `<span class="card-tag">${book.tag}</span>` : ""}
      
        <img 
          src="${book.img}" 
          alt="${book.title}"
          onerror="this.style.display='none';"
        >
      </div>
      <div class="card-body">
        <div class="stars">
          ${stars()}
        </div>
        <div class="card-title">
          ${book.title}
        </div>
        <div class="card-author">
          ${book.author}
        </div>
        <div class="card-price ${book.price === null ? "label" : ""}">
          ${book.price !== null ? rupee(book.price) : "Available"}
        </div>
        <button class="add-btn" data-id="${book.id}">
          <i class="fa-solid fa-bag-shopping"></i>
          Add to Cart
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-btn");
    if (!btn) return;
    const id = btn.dataset.id;
    cart[id] = (cart[id] || 0) + 1;
    renderCart();
    bumpBadge();
    openDrawer();
    const original = btn.innerHTML;
    btn.innerHTML = `
      <i class="fa-solid fa-check"></i>
      Added
    `;
    btn.classList.add("added");
    setTimeout(() => {
      btn.innerHTML = original;
      btn.classList.remove("added");
    }, 900);
  });
  function renderCart() {
    const ids = Object.keys(cart);
    const totalQty = ids.reduce(
      (sum, id) => sum + cart[id],
      0
    );
    cartCountEl.textContent = totalQty;
    cartCountEl.hidden = totalQty === 0;
    if (ids.length === 0) {
      drawerItems.innerHTML = `
        <div class="drawer-empty">
          Your cart is empty
        </div>
      `;
    } 
    else {
      drawerItems.innerHTML = ids.map(id => {
        const book = BOOKS.find(b => b.id === id);
        const priceDisplay =
          book.price !== null
            ? rupee(book.price * cart[id])
            : "Available";
        return `
          <div class="cart-row">
            <div class="cart-thumb">
              <img 
                src="${book.img}" 
                alt="${book.title}"
                onerror="this.style.display='none';"
              >
            </div>
            <div class="cart-info">
              <h4>
                ${book.title}
              </h4>
              <span class="cart-price">
                ${priceDisplay}
              </span>
              <div class="qty">
                <button 
                  data-action="dec" 
                  data-id="${id}"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span>
                  ${cart[id]}
                </span>
                <button 
                  data-action="inc" 
                  data-id="${id}"
                  aria-label="Increase quantity">+</button>
              </div>
            </div>
            <button 
              class="cart-remove"
              data-action="remove"
              data-id="${id}"
              aria-label="Remove"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        `;
      }).join("");
    }
    let total = 0;
    ids.forEach(id => {
      const book = BOOKS.find(b => b.id === id);
      if (book.price !== null) {
        total += book.price * cart[id];
      }
    });
    subtotalEl.textContent = rupee(total);
  }
  drawerItems.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const id = el.dataset.id;
    const action = el.dataset.action;
    if (action === "inc") {
      cart[id]++;
    }
    if (action === "dec") {
      cart[id]--;
      if (cart[id] <= 0) {
        delete cart[id];
      }
    }
    if (action === "remove") {
      delete cart[id];
    }
    renderCart();
  });
  function bumpBadge() {
    cartCountEl.classList.remove("bump");
    void cartCountEl.offsetWidth;
    cartCountEl.classList.add("bump");
  }
  function openDrawer() {
    drawer.classList.add("open");
    overlay.classList.add("open");
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
  }
  document
    .getElementById("cartToggle")
    .addEventListener("click", openDrawer);
  document
    .getElementById("closeDrawer")
    .addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);
  renderCart();