const form = document.getElementById('resetPasswordForm');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const submitBtn = document.getElementById('submitBtn');
const buttonText = document.getElementById('buttonText');
const alertBox = document.getElementById('alertBox');

const queryParameters = new URLSearchParams(window.location.search);
const token = queryParameters.get('token');

// Prevent the form from being used without a reset token.
if (!token) {
    showMessage(
        'This reset link is invalid. Please request a new link.',
        'error'
    );

    disableForm();
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!token) {
        showMessage('The reset token is missing.', 'error');
        return;
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
        showMessage(
            'Your password must contain between 8 and 72 characters.',
            'error'
        );
        return;
    }

    if (newPassword !== confirmPassword) {
        showMessage('The passwords do not match.', 'error');
        return;
    }

    setLoading(true);

    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token,
                newPassword
            })
        });

        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json')
            ? await response.json()
            : {};

        if (!response.ok) {
            throw new Error(
                data.message || 'Unable to reset your password.'
            );
        }

        showMessage(
            'Password reset successfully. Redirecting to login...',
            'success'
        );

        form.reset();
        disableForm();

        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    } catch (error) {
        showMessage(
            error.message || 'Something went wrong. Please try again.',
            'error'
        );

        setLoading(false);
    }
});

function showMessage(message, type) {
    alertBox.textContent = message;

    alertBox.classList.remove(
        'hidden',
        'bg-green-100',
        'text-green-700',
        'border-green-200',
        'bg-red-100',
        'text-red-700',
        'border-red-200'
    );

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
    submitBtn.disabled = isLoading;
    buttonText.textContent = isLoading
        ? 'Resetting...'
        : 'Reset Password';
}

function disableForm() {
    newPasswordInput.disabled = true;
    confirmPasswordInput.disabled = true;
    submitBtn.disabled = true;
}
