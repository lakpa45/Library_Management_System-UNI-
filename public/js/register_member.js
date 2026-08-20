function switchAuthTab(tab) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");
    const loginError = document.getElementById("loginError");
    const registerError = document.getElementById("registerError");

    loginError.classList.add("hidden");
    registerError.classList.add("hidden");

    if (tab === "login") {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        tabLogin.classList.add("border-blue-600", "text-blue-600");
        tabRegister.classList.remove("border-blue-600", "text-blue-600");
    } else {
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
        tabRegister.classList.add("border-blue-600", "text-blue-600");
        tabLogin.classList.remove("border-blue-600", "text-blue-600");
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const first_name = document.getElementById("regFirstName").value.trim();
    const last_name = document.getElementById("regLastName").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirmPassword").value;
    const error = document.getElementById("registerError");

    error.classList.add("hidden");

    if (password !== confirmPassword) {
        error.textContent = "Passwords do not match.";
        error.classList.remove("hidden");
        return;
    }

    if (phone.length !== 10) {
        error.textContent = "Enter a valid 10 digit phone number.";
        error.classList.remove("hidden");
        return;
    }

    try {
        const { ok, result } = await registerUser({ first_name, last_name, email, password, phone });

        if (ok) {
            alert("Registration successful!");
            document.getElementById("registerForm").reset();
            switchAuthTab("login");
        } else {
            error.textContent = result.message;
            error.classList.remove("hidden");
        }
    } catch (err) {
        console.error(err);
        error.textContent = "Something went wrong. Please try again.";
        error.classList.remove("hidden");
    }
}


// login 
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const loginError = document.getElementById("loginError");

    loginError.classList.add("hidden");

    try {
        const { ok, result } = await loginUser({ email, password });

        if (ok) {
            localStorage.setItem("token", result.token);
            window.location.href = "f1library.html";
        } else {
            loginError.textContent = result.message;
            loginError.classList.remove("hidden");
        }
    } catch (err) {
        console.error(err);
        loginError.textContent = "Something went wrong. Please try again.";
        loginError.classList.remove("hidden");
    }
}

window.onload = function () {
    switchAuthTab("login");
};