(() => {
    'use strict';

    const DESKTOP_MEDIA = window.matchMedia('(min-width: 1025px)');

    function addFallbackStyles() {
        if (document.getElementById('mobileNavigationStyles')) return;
        const style = document.createElement('style');
        style.id = 'mobileNavigationStyles';
        style.textContent = `
            @media (min-width:1025px){.mobile-navigation-generated{display:none!important}}
            @media (max-width:1024px){
                .mobile-navigation-generated.menu-icon{display:grid;place-items:center;width:42px;height:42px;flex:0 0 42px;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer;font-size:1.1rem}
                .mobile-navigation-panel{position:fixed!important;z-index:150;top:0;left:0;width:min(320px,85vw)!important;height:100dvh;margin:0!important;padding:82px 24px 30px!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:2px!important;overflow-y:auto;background:#fff;box-shadow:24px 0 60px rgba(14,14,16,.18);transform:translateX(-105%);transition:transform .3s ease}
                .mobile-navigation-panel.is-open{transform:translateX(0)}
                .mobile-navigation-panel .menu{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:2px!important}
                .mobile-navigation-panel a{display:block;padding:13px 10px!important;color:#1d1d1d!important;border-bottom:1px solid #e7e3da;text-decoration:none}
                .mobile-navigation-generated.nav-overlay{display:block;position:fixed;z-index:140;inset:0;border:0;background:rgba(14,14,16,.5);opacity:0;visibility:hidden;transition:.25s}
                .mobile-navigation-generated.nav-overlay.is-open{opacity:1;visibility:visible}
            }`;
        document.head.appendChild(style);
    }

    function initPublicNavigation(root, index) {
        const checkbox = root.querySelector('.menu-btn');
        let toggle = root.querySelector('.menu-icon');
        let navigation = root.querySelector('.nav');
        const closeButton = root.querySelector('.nav-close');
        let overlay = root.querySelector('.nav-overlay');

        if (!navigation) navigation = root.querySelector('.navbar > .menu');
        if (!navigation) return;
        if (!toggle) {
            addFallbackStyles();
            toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'menu-icon mobile-navigation-generated';
            toggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
            root.querySelector('.navbar')?.prepend(toggle);
            navigation.classList.add('mobile-navigation-panel');
        }
        if (!overlay) {
            overlay = document.createElement('button');
            overlay.type = 'button';
            overlay.className = 'nav-overlay mobile-navigation-generated';
            overlay.setAttribute('aria-label', 'Close menu');
            root.appendChild(overlay);
        }

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
        if (closeButton?.tagName === 'BUTTON') closeButton.addEventListener('click', () => setOpen(false));
        if (overlay?.tagName === 'BUTTON') overlay.addEventListener('click', () => setOpen(false));
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
        const roots = Array.from(document.querySelectorAll('.header, .navbar-bar'))
            .filter((root) => !root.parentElement?.closest('.header, .navbar-bar'));
        roots.forEach(initPublicNavigation);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
