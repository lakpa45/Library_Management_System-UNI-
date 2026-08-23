document.querySelectorAll(".faq-item").forEach(item => {
    const q = item.querySelector(".faq-q");
    const a = item.querySelector(".faq-a");
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      document.querySelectorAll(".faq-item.is-open").forEach(open => {
        if (open !== item) {
          open.classList.remove("is-open");
          open.querySelector(".faq-a").style.maxHeight = null;
        }
      });
      item.classList.toggle("is-open", !isOpen);
      a.style.maxHeight = !isOpen ? a.scrollHeight + "px" : null;
    });
  });
  const chips = document.querySelectorAll(".chip");
  const groups = document.querySelectorAll(".faq-group");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      const filter = chip.dataset.filter;
      groups.forEach(group => {
        group.style.display = (filter === "all" || group.dataset.group === filter) ? "" : "none";
      });
      document.getElementById("faqSearchInput").value = "";
      applySearch("");
    });
  });
  const searchInput = document.getElementById("faqSearchInput");
  const searchForm = document.getElementById("faqSearchForm");
  const emptyState = document.getElementById("faqEmpty");
  function applySearch(term){
    term = term.trim().toLowerCase();
    let anyVisible = false;
    document.querySelectorAll(".faq-item").forEach(item => {
      const text = item.textContent.toLowerCase();
      const match = term === "" || text.includes(term);
      item.style.display = match ? "" : "none";
      if (match) anyVisible = true;
    });
    document.querySelectorAll(".faq-group").forEach(group => {
      const visibleItems = group.querySelectorAll('.faq-item:not([style*="display: none"])');
      if (term !== "") {
        group.style.display = visibleItems.length ? "" : "none";
      }
    });
    emptyState.classList.toggle("show", term !== "" && !anyVisible);
  }
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    chips.forEach(c => c.classList.remove("is-active"));
    document.querySelector('.chip[data-filter="all"]').classList.add("is-active");
    groups.forEach(g => g.style.display = "");
    applySearch(searchInput.value);
  });
  searchInput.addEventListener("input", () => {
    if (searchInput.value.trim() === "") {
      groups.forEach(g => g.style.display = "");
      applySearch("");
    }
  });