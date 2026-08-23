document.addEventListener('DOMContentLoaded', () => {
    /* ---- sticky header ---- */
    const header = document.querySelector('.header');
    const onScroll = () => {
        header.classList.toggle('is-stuck', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();

    /* ---- mobile menu overlay + close on link click ---- */
    const menuBtn = document.getElementById('menu-btn');
    document.querySelectorAll('.menu a').forEach((link) => {
        link.addEventListener('click', () => {
            if (menuBtn) menuBtn.checked = false;
        });
    });

    /* ---- animated stat counters ---- */
    const counters = document.querySelectorAll('.hero__stat .count');
    const animateCounter = (el) => {
        const target = parseInt(el.dataset.target, 10) || 0;

        const duration = 1400;
        const start = performance.now();

        const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target);
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target;
            }
        };
        requestAnimationFrame(step);
    };

    if (counters.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });

        counters.forEach((counter) => observer.observe(counter));
    }

    /* ---- auth: login / register / user menu ---- */
    initAuth();

    /* ---- testimonials: reviews + star ratings ---- */
    initReviews();

    /* ---- swiper sliders ---- */
    buildSlider('picks', {
        minSlides: 8,
        slidesPerView: 1.2,
        breakpoints: {
            560: { slidesPerView: 2 },
            900: { slidesPerView: 3 },
            1200: { slidesPerView: 4 }
        }
    });
});

// For swiper sliders ===============================//
function buildSlider(name, options) {
    if (typeof Swiper === 'undefined') return;
    const container = document.querySelector('.' + name + '-swiper');
    if (!container) return;

    // clone slides so loop has enough to work with (keeps the markup clean)
    const wrapper = container.querySelector('.swiper-wrapper');
    const minSlides = options.minSlides || 0;
    delete options.minSlides;
    const originals = Array.prototype.slice.call(wrapper.children);
    let i = 0;
    while (wrapper.children.length < minSlides && originals.length) {
        wrapper.appendChild(originals[i % originals.length].cloneNode(true));
        i++;
    }

    const nav = document.querySelector('.slider-nav[data-slider="' + name + '"]');
    return new Swiper('.' + name + '-swiper', Object.assign({
        loop: true,
        spaceBetween: 22,
        grabCursor: true,
        navigation: nav ? {
            nextEl: nav.querySelector('[data-dir="next"]'),
            prevEl: nav.querySelector('[data-dir="prev"]')
        } : false
    }, options));
}

// ======Shared storage keys + session helpers (used by auth and reviews) ========//
//=====const LIB_USERS_KEY = 'icfai_library_users';
//=== const LIB_SESSION_KEY = 'icfai_library_session'; ====//
const LIB_REVIEWS_KEY = 'icfai_library_reviews';

function libGetSession() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { name: payload.email, email: payload.email };
    } catch (err) {
        return null;
    }
}

function libGetInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    const initials = parts.length > 1
        ? parts[0][0] + parts[parts.length - 1][0]
        : parts[0].slice(0, 2);
    return initials.toUpperCase();
}

// For auth (login / register / user menu) ===============================//
function initAuth() {
    const overlay = document.getElementById('authOverlay');
    const modal = overlay ? overlay.querySelector('.auth-modal') : null;
    const closeBtn = document.getElementById('authClose');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const tabs = document.querySelectorAll('.auth-tab');
    const switchLinks = document.querySelectorAll('.auth-switch__link');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');

    const authLinks = document.getElementById('navbarAuth');
    const userBlock = document.getElementById('navbarUser');
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenu = document.getElementById('userMenu');
    const logoutBtn = document.getElementById('logoutBtn');
    const userAvatar = document.getElementById('userAvatar');
    const userAvatarLg = document.getElementById('userAvatarLg');
    const userMenuName = document.getElementById('userMenuName');
    const userMenuEmail = document.getElementById('userMenuEmail');

    if (!overlay || !loginForm || !registerForm) return;

    /* --- real session helpers (based on JWT) --- */
    const getSession = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return { email: payload.email };
        } catch (err) {
            return null;
        }
    };
    const clearSession = () => localStorage.removeItem('token');
    const getInitials = libGetInitials;

    /* --- header state --- */
    const renderAuthState = () => {
        const session = getSession();
        if (session) {
            if (authLinks) authLinks.hidden = true;
            if (userBlock) userBlock.hidden = false;
            const initials = getInitials(session.email);
            if (userAvatar) userAvatar.textContent = initials;
            if (userAvatarLg) userAvatarLg.textContent = initials;
            if (userMenuName) userMenuName.textContent = session.email;
            if (userMenuEmail) userMenuEmail.textContent = session.email;
        } else {
            if (authLinks) authLinks.hidden = false;
            if (userBlock) userBlock.hidden = true;
            if (userBlock) userBlock.classList.remove('is-open');
        }
        document.dispatchEvent(new CustomEvent('libauthchange'));
    };

    /* --- modal open/close --- */
    const clearErrors = () => {
        if (loginError) loginError.textContent = '';
        if (registerError) registerError.textContent = '';
    };

    const switchTab = (tab) => {
        clearErrors();
        tabs.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === tab));
        loginForm.classList.toggle('is-active', tab === 'login');
        registerForm.classList.toggle('is-active', tab === 'register');
        const activeForm = tab === 'login' ? loginForm : registerForm;
        const firstInput = activeForm.querySelector('input');
        if (firstInput) firstInput.focus();
    };

    const openModal = (tab) => {
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        switchTab(tab || 'login');
    };

    const closeModal = () => {
        overlay.classList.remove('is-open');
        document.body.style.overflow = '';
        loginForm.reset();
        registerForm.reset();
        clearErrors();
    };

    if (loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); openModal('login'); });
    if (registerBtn) registerBtn.addEventListener('click', (e) => { e.preventDefault(); openModal('register'); });
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    tabs.forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
    switchLinks.forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

    /* --- register (real backend) --- */
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();
        const formData = new FormData(registerForm);
        const fullName = (formData.get('name') || '').trim();
        const email = (formData.get('email') || '').trim().toLowerCase();
        const password = formData.get('password') || '';

        if (!fullName || !email || password.length < 6) {
            registerError.textContent = 'Please fill every field (password: min 6 characters).';
            return;
        }

        const nameParts = fullName.split(' ');
        const first_name = nameParts[0];
        const last_name = nameParts.slice(1).join(' ') || first_name;

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ first_name, last_name, email, password })
            });

            const result = await response.json();

            if (response.ok) {
                const loginResponse = await fetch('/api/auth/signin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const loginResult = await loginResponse.json();

                if (loginResponse.ok) {
                    localStorage.setItem('token', loginResult.token);
                    closeModal();
                    renderAuthState();
                }
            } else {
                registerError.textContent = result.message;
            }
        } catch (err) {
            console.error(err);
            registerError.textContent = 'Something went wrong. Please try again.';
        }
    });

    /* --- login (real backend) --- */
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();
        const formData = new FormData(loginForm);
        const email = (formData.get('email') || '').trim().toLowerCase();
        const password = formData.get('password') || '';

        try {
            const response = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('token', result.token);
                closeModal();
                renderAuthState();
            } else {
                loginError.textContent = result.message;
            }
        } catch (err) {
            console.error(err);
            loginError.textContent = 'Something went wrong. Please try again.';
        }
    });

    /* --- user dropdown --- */
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = userBlock.classList.toggle('is-open');
            userMenuBtn.setAttribute('aria-expanded', isOpen);
        });
    }
    document.addEventListener('click', (e) => {
        if (userBlock && userBlock.classList.contains('is-open') && !userBlock.contains(e.target)) {
            userBlock.classList.remove('is-open');
            userMenuBtn.setAttribute('aria-expanded', 'false');
        }
    });

    /* --- logout --- */
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearSession();
            renderAuthState();
        });
    }

    /* --- init state on load --- */
    renderAuthState();
}

// For testimonials (star ratings + reviews) ==============================//
function initReviews() {
    const SEED_REVIEWS = [
        {
            name: 'Ananya Rao',
            rating: 5,
            message: 'The collection is huge and the staff always help me track down obscure titles. My go-to library for years now.',
            date: '2026-06-14'
        },
        {
            name: 'Marcus Chen',
            rating: 4,
            message: 'Great range of books and a comfy reading area. Would love slightly longer weekend hours, but no real complaints.',
            date: '2026-05-02'
        },
        {
            name: 'Priya Nair',
            rating: 5,
            message: 'Fast returns process and the reservation system actually works. Renewed my membership without a second thought.',
            date: '2026-03-21'
        }
    ];

    const grid = document.getElementById('testimonialGrid');
    const avgValue = document.getElementById('avgRatingValue');
    const avgStars = document.getElementById('avgRatingStars');
    const countEl = document.getElementById('reviewCount');

    const writeBtn = document.getElementById('writeReviewBtn');
    const overlay = document.getElementById('reviewOverlay');
    const closeBtn = document.getElementById('reviewClose');
    const form = document.getElementById('reviewForm');
    const nameField = document.getElementById('reviewNameField');
    const nameInput = document.getElementById('reviewNameInput');
    const messageInput = document.getElementById('reviewMessageInput');
    const ratingInput = document.getElementById('reviewRatingInput');
    const ratingValue = document.getElementById('reviewRatingValue');
    const errorEl = document.getElementById('reviewError');
    const stars = ratingInput ? Array.from(ratingInput.querySelectorAll('.review-star')) : [];

    if (!grid || !overlay || !form) return;

    /* --- storage helpers --- */
    const getReviews = () => {
        try {
            return JSON.parse(localStorage.getItem(LIB_REVIEWS_KEY)) || [];
        } catch (err) {
            return [];
        }
    };
    const saveReviews = (reviews) => localStorage.setItem(LIB_REVIEWS_KEY, JSON.stringify(reviews));

    const formatDate = (isoDate) => {
        const d = new Date(isoDate);
        if (isNaN(d)) return '';
        return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    };

    const starsMarkup = (rating) => {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += i <= rating
                ? '<i class="fa-solid fa-star"></i>'
                : '<i class="fa-solid fa-star is-empty"></i>';
        }
        return html;
    };

    /* --- render grid + summary --- */
    const renderReviews = () => {
        const all = SEED_REVIEWS.concat(getReviews())
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (!all.length) {
            grid.innerHTML = '<p class="testimonial-empty">No reviews yet — be the first to share one.</p>';
        } else {
            grid.innerHTML = all.map((r) => (
                '<article class="testimonial-card">' +
                    '<div class="testimonial-card__head">' +
                        '<span class="testimonial-card__avatar">' + libGetInitials(r.name) + '</span>' +
                        '<div>' +
                            '<strong>' + escapeHtml(r.name) + '</strong>' +
                            '<small>' + formatDate(r.date) + '</small>' +
                        '</div>' +
                    '</div>' +
                    '<div class="testimonial-card__stars">' + starsMarkup(r.rating) + '</div>' +
                    '<p>' + escapeHtml(r.message) + '</p>' +
                '</article>'
            )).join('');
        }

        const count = all.length;
        const avg = count ? all.reduce((sum, r) => sum + r.rating, 0) / count : 5;
        if (avgValue) avgValue.textContent = avg.toFixed(1);
        if (avgStars) avgStars.innerHTML = starsMarkup(Math.round(avg));
        if (countEl) countEl.textContent = count + (count === 1 ? ' review' : ' reviews');
    };

    const escapeHtml = (str) => String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    /* --- star picker --- */
    let selectedRating = 0;

    const paintStars = (value) => {
        stars.forEach((btn) => {
            btn.classList.toggle('is-selected', Number(btn.dataset.value) <= value);
        });
    };

    stars.forEach((btn) => {
        btn.addEventListener('mouseenter', () => {
            stars.forEach((s) => s.classList.toggle('is-hover', Number(s.dataset.value) <= Number(btn.dataset.value)));
        });
        btn.addEventListener('mouseleave', () => {
            stars.forEach((s) => s.classList.remove('is-hover'));
        });
        btn.addEventListener('click', () => {
            selectedRating = Number(btn.dataset.value);
            ratingValue.value = selectedRating;
            paintStars(selectedRating);
        });
    });

    /* --- modal open/close --- */
    const openModal = () => {
        const session = libGetSession();
        if (session && nameInput) {
            nameInput.value = session.name;
            nameInput.readOnly = true;
        } else if (nameInput) {
            nameInput.readOnly = false;
        }
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        const focusTarget = session ? messageInput : nameInput;
        if (focusTarget) focusTarget.focus();
    };

    const closeModal = () => {
        overlay.classList.remove('is-open');
        document.body.style.overflow = '';
        form.reset();
        selectedRating = 0;
        ratingValue.value = 0;
        paintStars(0);
        if (errorEl) errorEl.textContent = '';
    };

    if (writeBtn) writeBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal(); });

    /* --- submit --- */
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (errorEl) errorEl.textContent = '';

        const session = libGetSession();
        const name = session ? session.name : (nameInput.value || '').trim();
        const message = (messageInput.value || '').trim();

        if (!name) {
            errorEl.textContent = 'Please tell us your name.';
            return;
        }
        if (!selectedRating) {
            errorEl.textContent = 'Please select a star rating.';
            return;
        }
        if (!message) {
            errorEl.textContent = 'Please write a short review.';
            return;
        }

        const reviews = getReviews();
        reviews.push({
            name,
            rating: selectedRating,
            message,
            date: new Date().toISOString().slice(0, 10)
        });
        saveReviews(reviews);

        closeModal();
        renderReviews();
    });

    /* --- init --- */
    renderReviews();
}