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
