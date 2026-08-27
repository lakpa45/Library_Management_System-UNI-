(function () {
    const adminToken = localStorage.getItem('adminToken');
    const librarianToken = localStorage.getItem('librarianToken');
    const token = adminToken || librarianToken;

    if (!token) {
        window.location.replace('/');
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp && Date.now() >= payload.exp * 1000;
        const isStaff = payload.role === 'admin' || payload.role === 'librarian';

        if (isExpired || !isStaff) {
            if (adminToken) localStorage.removeItem('adminToken');
            if (librarianToken) localStorage.removeItem('librarianToken');
            window.location.replace('/');
        }
    } catch (err) {
        if (adminToken) localStorage.removeItem('adminToken');
        if (librarianToken) localStorage.removeItem('librarianToken');
        window.location.replace('/');
    }
})();
