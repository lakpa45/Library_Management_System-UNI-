const header = document.querySelector('.header');
    const onScroll = () => {
      header.classList.toggle('is-stuck', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();

    const menuBtn = document.getElementById('menu-btn');
    const menuToggle = document.getElementById('menuToggle');
    const menuClose = document.getElementById('menuClose');
    const menuOverlay = document.getElementById('menuOverlay');

    const setMenuOpen = (isOpen) => {
      if (!menuBtn) return;
      menuBtn.checked = isOpen;
      if (menuToggle) {
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      }
    };

    if (menuToggle) menuToggle.addEventListener('click', () => setMenuOpen(!menuBtn.checked));
    if (menuClose) menuClose.addEventListener('click', () => setMenuOpen(false));
    if (menuOverlay) menuOverlay.addEventListener('click', () => setMenuOpen(false));
    document.querySelectorAll('.menu a').forEach((link) => {
      link.addEventListener('click', () => setMenuOpen(false));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuBtn?.checked) {
        setMenuOpen(false);
        menuToggle?.focus();
      }
    });