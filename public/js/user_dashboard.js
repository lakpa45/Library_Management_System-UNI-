(function () {
  "use strict";

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

  // expose toast globally so user-dashboard-data.js can use it too
  window.libToast = toast;

  /* wishlist: move an item into "borrowed" */
  const stat = {
    wishlist: document.querySelectorAll(".stat-card strong")[2],
  };

  function bumpStat(el, delta) {
    if (!el) return;
    const val = parseInt(el.textContent, 10) || 0;
    el.textContent = Math.max(0, val + delta);
  }

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
        toast(`"${title}" — wishlist checkout isn't connected yet`);
      }, 250);
    });
  });

  /* account settings form */
  const accountForm = document.querySelector(".account__fields");
  if (accountForm) {
    accountForm.addEventListener("submit", (e) => {
      e.preventDefault();
      toast("Account details saved");
    });
    const changePwBtn = accountForm.querySelector(".btn--ghost");
    changePwBtn?.addEventListener("click", () => {
      window.location.href = "/forget_password.html";
    });
  }

  /* nav scrollspy */
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
})();
