document.addEventListener('DOMContentLoaded', () => {
    const authLinks = document.getElementById('navbarAuth');
    const userBlock = document.getElementById('navbarUser');
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userAvatar = document.getElementById('userAvatar');
    const userAvatarLg = document.getElementById('userAvatarLg');
    const userMenuName = document.getElementById('userMenuName');
    const userMenuEmail = document.getElementById('userMenuEmail');
    const logoutBtn = document.getElementById('logoutBtn');

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

    const getInitials = (email) => email ? email.slice(0, 2).toUpperCase() : 'U';

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
        }
    };

    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userBlock.classList.toggle('is-open');
        });
    }

    document.addEventListener('click', (e) => {
        if (userBlock && userBlock.classList.contains('is-open') && !userBlock.contains(e.target)) {
            userBlock.classList.remove('is-open');
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/';
        });
    }

    renderAuthState();
});