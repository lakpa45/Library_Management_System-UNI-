const password = document.getElementById('password');
const confirm_password = document.getElementById('confirm_password');
const matchMsg  = document.getElementById('passwordMatchMsg');
const strengthMsg = document.getElementById('passwordStrengthMsg');

// password strength check
const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;

function isPasswordStrong(value) {
    return password.Regex.test(value);
}

password.addEventListener('keyup', () => {
    if(password.value == '') {
        strengthMsg.textContent = '';
        return;
    }

    if(isPasswordStrong(password.value)) {
        strengthMsg.textContent = 'Strong password';
        strengthMsg.style.color = 'green';
    } else {
        strengthMsg.textContent = 'Must be 8+ characters, 1 uppercase , 1 number, 1 special character';
        strengthMsg.style.color = 'red';
    }
})

// pasword match check
confirm_password.addEventListener('keyup', () => {
    if (confirm_password.value === '') {
        matchMsg.textContent = '';
        return;
    }

    if(password.value === confirm_password.value) {
        matchMsg.TextContent = 'password match';
        matchMsg.style.color = 'green';
    } else {
        matchMsg.textContent = 'Password do not match';
        matchMsg.style.color = 'red';
    }
})

// form submission

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if(!isPasswordStrong(password.value)) {
        alert('Password must be 8+ characters, with 1 uppercase letter, 1 number, and 1 special character');
        return;
    }

    if(password.value !== confirm_password.value) {
        alert('Passwords do not match');
        return;
    }
    
    const data = {
        first_name: document.getElementById('first_name').value,
        last_name:  document.getElementById('last_name').value,
        email:      document.getElementById('email').value,
        password:   password.value,
        phone:      document.getElementById('phone').value
    };

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json()

        if(response.ok) {
            alert('Sign up successfule!');
            window.location.href = '/login.html';
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    }
});