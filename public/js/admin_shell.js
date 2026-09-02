(() => {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('mobileMenuBtn');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !toggle || !overlay) return;
    if (!sidebar.id) sidebar.id = 'sidebar';
    toggle.setAttribute('aria-controls', sidebar.id);

    const setOpen = (open) => {
        sidebar.classList.toggle('open', open);
        overlay.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
        const icon = toggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars', !open);
            icon.classList.toggle('fa-xmark', open);
        }
    };

    toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('open')));
    overlay.addEventListener('click', () => setOpen(false));
    document.querySelectorAll('.side-nav a').forEach((link) => {
        link.addEventListener('click', () => setOpen(false));
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && sidebar.classList.contains('open')) {
            setOpen(false);
            toggle.focus();
        }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => {
        if (event.matches) setOpen(false);
    });
})();
