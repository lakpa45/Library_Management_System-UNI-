(() => {
    'use strict';

    const DESKTOP_MEDIA = window.matchMedia('(min-width: 1025px)');

    function initPublicNavigation(root, index) {
        const checkbox = root.querySelector('.menu-btn');
        const toggle = root.querySelector('.menu-icon');
        const navigation = root.querySelector('.nav');
        const closeButton = root.querySelector('.nav-close');
        const overlay = root.querySelector('.nav-overlay');

        if (!toggle || !navigation) return;
        if (root.dataset.mobileNavigationReady === 'true') return;
        root.dataset.mobileNavigationReady = 'true';

        if (!navigation.id) navigation.id = index ? `primaryNavigation-${index + 1}` : 'primaryNavigation';
        toggle.setAttribute('aria-controls', navigation.id);
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');

        const icon = toggle.querySelector('i');
        const isOpen = () => navigation.classList.contains('is-open') || Boolean(checkbox?.checked);

        const setOpen = (open, returnFocus = false) => {
            if (checkbox) checkbox.checked = open;
            navigation.classList.toggle('is-open', open);
            overlay?.classList.toggle('is-open', open);
            document.body.classList.toggle('menu-open', open);
            toggle.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            if (icon) {
                icon.classList.toggle('fa-bars', !open);
                icon.classList.toggle('fa-xmark', open);
            }
            if (returnFocus) toggle.focus();
        };

        // Button-based current navbars use JavaScript; older label-based navbars
        // retain their native checkbox behavior and are synchronized on change.
        if (toggle.tagName === 'BUTTON') {
            toggle.addEventListener('click', () => setOpen(!isOpen()));
        }
        checkbox?.addEventListener('change', () => setOpen(checkbox.checked));
        closeButton?.addEventListener('click', () => setOpen(false));
        overlay?.addEventListener('click', () => setOpen(false));
        navigation.addEventListener('click', (event) => {
            if (event.target.closest('a')) setOpen(false);
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && isOpen()) setOpen(false, true);
        });
        DESKTOP_MEDIA.addEventListener('change', (event) => {
            if (event.matches) setOpen(false);
        });
    }

    function init() {
        document.querySelectorAll('.header').forEach(initPublicNavigation);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
