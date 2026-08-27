const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const emailInput = document.getElementById('email');
const submitButton = document.getElementById('submitBtn');
const alertBox = document.getElementById('alertBox');

forgotPasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();

    if (!email) {
        displayMessage('Please enter your email address.', 'error');
        return;
    }

    setLoading(true);

    try {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const contentType = response.headers.get('content-type') || '';
        const result = contentType.includes('application/json')
            ? await response.json()
            : {};

        if (!response.ok) {
            throw new Error(
                result.message || 'Failed to send the reset link.'
            );
        }

        displayMessage(
            result.message || 'If that email exists, a reset link has been sent.',
            'success'
        );
        forgotPasswordForm.reset();
    } catch (error) {
        displayMessage(
            error.message || 'Something went wrong. Please try again.',
            'error'
        );
    } finally {
        setLoading(false);
    }
});

function displayMessage(message, type) {
    alertBox.textContent = message;

    alertBox.className =
        'mb-4 p-3.5 rounded-xl border text-sm font-medium';

    if (type === 'success') {
        alertBox.classList.add(
            'bg-green-100',
            'text-green-700',
            'border-green-200'
        );
    } else {
        alertBox.classList.add(
            'bg-red-100',
            'text-red-700',
            'border-red-200'
        );
    }
}

function setLoading(isLoading) {
    submitButton.disabled = isLoading;

    submitButton.innerHTML = isLoading
        ? '<span>Sending...</span>'
        : '<span>Send Reset Link</span>';

    submitButton.classList.toggle('opacity-60', isLoading);
    submitButton.classList.toggle('cursor-not-allowed', isLoading);
}
