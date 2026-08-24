(function () {
  "use strict";

  /* ---------- toast ---------- */
  const toastHost = document.createElement("div");
  toastHost.setAttribute("aria-live", "polite");
  Object.assign(toastHost.style, {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    zIndex: "999",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  });
  document.body.appendChild(toastHost);

  function toast(message) {
    const el = document.createElement("div");
    el.textContent = message;
    Object.assign(el.style, {
      background: "#0e0e10",
      color: "#fff",
      fontFamily: "'Chakra Petch', sans-serif",
      fontWeight: "600",
      fontSize: "0.82rem",
      padding: "12px 18px",
      borderRadius: "40px",
      boxShadow: "0 14px 34px rgba(0,0,0,.25)",
      opacity: "0",
      transform: "translateY(8px)",
      transition: "opacity .25s ease, transform .25s ease",
    });
    toastHost.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      setTimeout(() => el.remove(), 250);
    }, 2600);
  }

  /* ---------- stat card helpers ---------- */
  const statCards = document.querySelectorAll(".stat-card strong");
  // order in the markup: Books Borrowed, Due Soon, Wishlist Items, Books This Year
  const stat = {
    borrowed: statCards[0],
    dueSoon: statCards[1],
    wishlist: statCards[2],
    yearTotal: statCards[3],
  };

  function bumpStat(el, delta) {
    if (!el) return;
    const val = parseInt(el.textContent, 10) || 0;
    el.textContent = Math.max(0, val + delta);
  }

  /* ---------- due-date handling ---------- */
  function parseDue(text) {
    const d = new Date(text.trim());
    return isNaN(d) ? null : d;
  }

  function daysUntil(date) {
    const ms = date.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
    return Math.round(ms / 86400000);
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function refreshCardStatus(card) {
    const dueEl = card.querySelector(".book-card__due strong");
    const statusEl = card.querySelector(".book-card__status");
    if (!dueEl || !statusEl) return;
    const due = parseDue(dueEl.textContent);
    if (!due) return;
    const days = daysUntil(due);
    statusEl.classList.remove("book-card__status--warn");
    if (days < 0) {
      statusEl.textContent = "Overdue";
      statusEl.classList.add("book-card__status--warn");
    } else if (days <= 2) {
      statusEl.textContent = days === 0 ? "Due today" : `Due in ${days} day${days === 1 ? "" : "s"}`;
      statusEl.classList.add("book-card__status--warn");
    } else {
      statusEl.textContent = "On time";
    }
  }

  function countDueSoon() {
    const cards = document.querySelectorAll(".book-card");
    let count = 0;
    cards.forEach((card) => {
      const dueEl = card.querySelector(".book-card__due strong");
      if (!dueEl) return;
      const due = parseDue(dueEl.textContent);
      if (due && daysUntil(due) <= 2) count++;
    });
    if (stat.dueSoon) stat.dueSoon.textContent = count;
  }

  /* ---------- renew a loan ---------- */
  function renewCard(card) {
    const dueEl = card.querySelector(".book-card__due strong");
    if (!dueEl) return;
    const due = parseDue(dueEl.textContent) || new Date();
    due.setDate(due.getDate() + 14);
    dueEl.textContent = formatDate(due);
    refreshCardStatus(card);

    const title = card.querySelector("h3")?.textContent ?? "Book";
    toast(`Renewed "${title}" — new due date ${formatDate(due)}`);
    countDueSoon();
  }

  document.querySelectorAll(".book-card__actions .primary").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".book-card");
      if (card) renewCard(card);
    });
  });

  document.querySelectorAll(".book-card__actions button:not(.primary)").forEach((btn) => {
    btn.addEventListener("click", () => {
      const title = btn.closest(".book-card")?.querySelector("h3")?.textContent ?? "this book";
      toast(`Details for "${title}" coming soon`);
    });
  });

  /* ---------- top "due soon" alert banner ---------- */
  const alertBanner = document.querySelector(".alert");
  const alertRenewBtn = alertBanner?.querySelector(".btn");
  if (alertRenewBtn) {
    alertRenewBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // renew whichever card is currently flagged due-soon/overdue
      const flagged = document.querySelector(".book-card__status--warn")?.closest(".book-card");
      if (flagged) renewCard(flagged);
      alertBanner.style.transition = "opacity .25s ease, transform .25s ease";
      alertBanner.style.opacity = "0";
      alertBanner.style.transform = "translateY(-6px)";
      setTimeout(() => alertBanner.remove(), 250);
    });
  }

  /* ---------- wishlist: move an item into "borrowed" ---------- */
  document.querySelectorAll(".wish-item__action").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".wish-item");
      const title = item?.querySelector("strong")?.textContent ?? "Book";

      item.style.transition = "opacity .25s ease, transform .25s ease";
      item.style.opacity = "0";
      item.style.transform = "translateX(8px)";
      setTimeout(() => {
        item.remove();
        bumpStat(stat.wishlist, -1);
        bumpStat(stat.borrowed, 1);
        toast(`"${title}" moved to your borrowed books`);
      }, 250);
    });
  });

  /* ---------- account settings form ---------- */
  const accountForm = document.querySelector(".account__fields");
  if (accountForm) {
    accountForm.addEventListener("submit", (e) => {
      e.preventDefault();
      toast("Account details saved");
    });
    const changePwBtn = accountForm.querySelector(".btn--ghost");
    changePwBtn?.addEventListener("click", () => {
      toast("Password reset link sent to your email");
    });
  }

  /* ---------- nav scrollspy ---------- */
  const navLinks = Array.from(document.querySelectorAll(".menu a"));
  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      return id && id.startsWith("#") && id.length > 1
        ? document.querySelector(id)
        : null;
    })
    .filter(Boolean);

  function updateActiveLink() {
    let currentId = null;
    const scrollPos = window.scrollY + 120;
    sections.forEach((section) => {
      if (section.offsetTop <= scrollPos) currentId = "#" + section.id;
    });
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      link.classList.toggle("is-active", href === currentId || (!currentId && href === "#"));
    });
  }

  window.addEventListener("scroll", updateActiveLink, { passive: true });

  /* ---------- init ---------- */
  document.querySelectorAll(".book-card").forEach(refreshCardStatus);
  countDueSoon();
})();