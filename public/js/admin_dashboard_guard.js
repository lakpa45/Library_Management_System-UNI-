(function () {
    const token = localStorage.getItem('adminToken');

    if (!token) {
        window.location.replace('/admin_login.html');
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp && Date.now() >= payload.exp * 1000;
        const isAdmin = payload.role === 'admin';

        if (isExpired || !isAdmin) {
            localStorage.removeItem('adminToken');
            window.location.replace('/admin_login.html');
        }
    } catch (err) {
        localStorage.removeItem('adminToken');
        window.location.replace('/admin_login.html');
    }
})();