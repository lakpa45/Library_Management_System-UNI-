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
  card.className = "bg-white border border-line rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl";
  card.innerHTML = `
    <div class="aspect-[1/0.92] bg-tile flex items-center justify-center relative">
      ${book.tag ? `<span class="absolute top-2.5 left-2.5 bg-ink text-white font-chakra font-semibold text-[0.68rem] px-2.5 py-[5px] rounded-full">${book.tag}</span>` : ""}
      <img
        src="${book.img}"
        alt="${book.title}"
        class="w-full h-full object-contain p-2.5"
        onerror="this.style.display='none';"
      >
    </div>
    <div class="p-4 pb-[18px] flex flex-col gap-1.5 flex-1">
      <div class="text-accent text-xs">
        ${stars()}
      </div>
      <div class="text-[0.98rem] font-semibold leading-[1.3]">
        ${book.title}
      </div>
      <div class="text-[0.78rem] text-muted mb-0.5">
        ${book.author}
      </div>
      <div class="font-chakra font-bold mt-auto ${book.price === null ? "text-muted font-semibold text-[0.85rem]" : ""}">
        ${book.price !== null ? rupee(book.price) : "Available"}
      </div>
      <button class="add-btn mt-3 flex items-center justify-center gap-2 bg-ink text-white border-none rounded-full py-[11px] font-chakra font-semibold text-[0.82rem] cursor-pointer transition-colors duration-200 hover:bg-accent hover:text-accent-ink" data-id="${book.id}">
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
  btn.classList.remove("bg-ink");
  btn.classList.add("bg-[#2f7d4f]");
  setTimeout(() => {
    btn.innerHTML = original;
    btn.classList.add("bg-ink");
    btn.classList.remove("bg-[#2f7d4f]");
  }, 900);
});

function renderCart() {
  const ids = Object.keys(cart);
  const totalQty = ids.reduce((sum, id) => sum + cart[id], 0);
  cartCountEl.textContent = totalQty;
  cartCountEl.hidden = totalQty === 0;

  if (ids.length === 0) {
    drawerItems.innerHTML = `
      <div class="text-muted text-sm text-center mt-[60px]">
        Your cart is empty
      </div>
    `;
  } else {
    drawerItems.innerHTML = ids.map(id => {
      const book = BOOKS.find(b => b.id === id);
      const priceDisplay =
        book.price !== null
          ? rupee(book.price * cart[id])
          : "Available";
      return `
        <div class="flex gap-3.5 py-4 border-b border-line">
          <div class="w-[52px] h-[52px] rounded-[10px] bg-tile grid place-items-center overflow-hidden flex-shrink-0">
            <img
              src="${book.img}"
              alt="${book.title}"
              class="w-full h-full object-cover"
              onerror="this.style.display='none';"
            >
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold mb-1">
              ${book.title}
            </h4>
            <span class="block font-chakra text-[0.83rem] text-accent-ink mb-2">
              ${priceDisplay}
            </span>
            <div class="inline-flex items-center gap-2.5 border border-line rounded-full px-2.5 py-1">
              <button
                class="w-5 h-5 border-none bg-transparent text-[0.9rem] cursor-pointer text-ink"
                data-action="dec"
                data-id="${id}"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span class="min-w-[14px] text-center text-[0.83rem] font-semibold">
                ${cart[id]}
              </span>
              <button
                class="w-5 h-5 border-none bg-transparent text-[0.9rem] cursor-pointer text-ink"
                data-action="inc"
                data-id="${id}"
                aria-label="Increase quantity">+</button>
            </div>
          </div>
          <button
            class="text-muted bg-transparent border-none cursor-pointer p-1.5 flex-shrink-0 hover:text-[#c1391f]"
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
  cartCountEl.classList.remove("animate-bump");
  void cartCountEl.offsetWidth;
  cartCountEl.classList.add("animate-bump");
}

function openDrawer() {
  drawer.classList.add("open");
  overlay.classList.add("open");
}
function closeDrawer() {
  drawer.classList.remove("open");
  overlay.classList.remove("open");
}

document.getElementById("cartToggle").addEventListener("click", openDrawer);
document.getElementById("closeDrawer").addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);

renderCart();