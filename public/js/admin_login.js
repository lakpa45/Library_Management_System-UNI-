document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('loginError');

    errorMsg.classList.add('hidden');

    try {
        const response = await fetch('/api/auth/librarian/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();

        if(response.ok) {
            localStorage.setItem('adminToken', result.token);
            window.location.href = '/admin/dashboard';
        } else {
            errorMsg.textContent = result.message;
            errorMsg.classList.remove('hidden');
        }
    } catch (err) {
        console.error(err);
        errorMsg.textContent = 'Something went wrong. Please try again.';
        errorMsg.classList.remove('hidden');
    }
});