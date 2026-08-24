const form = document.getElementById('registerForm');
const errorEl = document.getElementById('registerError');
const successEl = document.getElementById('registerSuccess');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

    const fullName = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const phone = document.getElementById('regPhone').value.trim();
    const member_type = document.getElementById('regType').value;
    const department = document.getElementById('regDept').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match.';
        errorEl.classList.remove('hidden');
        return;
    }

    const nameParts = fullName.split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ') || first_name;

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name, last_name, email, phone, member_type, department, password })
        });

        const result = await response.json();

        if (response.ok) {
            successEl.textContent = 'Registration successful! You can now log in.';
            successEl.classList.remove('hidden');
            form.reset();
        } else {
            errorEl.textContent = result.message;
            errorEl.classList.remove('hidden');
        }
    } catch (err) {
        console.error(err);
        errorEl.textContent = 'Something went wrong. Please try again.';
        errorEl.classList.remove('hidden');
    }
});