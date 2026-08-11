
function switchAuthTab(tab) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");
    const loginError = document.getElementById("loginError");
    const registerError = document.getElementById("registerError");
    loginError.classList.add("hidden");
    registerError.classList.add("hidden");
    if(tab === "login") {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        tabLogin.classList.add("border-blue-600","text-blue-600");
        tabRegister.classList.remove("border-blue-600","text-blue-600");
    } 
    else {
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
        tabRegister.classList.add("border-blue-600","text-blue-600");
        tabLogin.classList.remove("border-blue-600","text-blue-600");
    }
}
function handleRegister(event){
    event.preventDefault();
    const firstName = document.getElementById("regFirstName").value.trim();
    const lastName = document.getElementById("regLastName").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirmPassword").value;
    const error = document.getElementById("registerError");
    error.classList.add("hidden");
    if(password !== confirmPassword){
        error.textContent = "Passwords do not match.";
        error.classList.remove("hidden");
        return;
    }
    if(phone.length !== 10){
        error.textContent = "Enter a valid 10 digit phone number.";
        error.classList.remove("hidden");
        return;
    }
    let users = JSON.parse(localStorage.getItem("libraryUsers")) || [];
    const existingUser = users.find(
        user => user.email === email
    );
    if(existingUser){
        error.textContent = "Email already registered.";
        error.classList.remove("hidden");
        return;
    }
    const newUser = {
        firstName:firstName,
        lastName:lastName,
        phone:phone,
        email:email,
        password:password
    };
    users.push(newUser);
    localStorage.setItem(
        "libraryUsers",
        JSON.stringify(users)
    );
    alert("Registration successful!");
    document.getElementById("registerForm").reset();
    switchAuthTab("login");
}
function handleLogin(event){
    event.preventDefault();
    const email = document
    .getElementById("loginEmail")
    .value
    .trim()
    .toLowerCase();
    const password = document
    .getElementById("loginPassword")
    .value;
    const loginError = document.getElementById("loginError");
    let users = JSON.parse(
        localStorage.getItem("libraryUsers")
    ) || [];
    const user = users.find(
        user =>
        user.email === email &&
        user.password === password
    );
    if(user){
        localStorage.setItem(
            "loggedIn",
            "true"
        );
        localStorage.setItem(
            "loggedInUser",
            JSON.stringify(user)
        );
        window.location.href="f1library.html";
    }
    else{
        loginError.textContent =
        "Invalid email or password";
        loginError.classList.remove("hidden");
    }
}
window.onload=function(){
    switchAuthTab("login");
    const currentUser =
    JSON.parse(
        localStorage.getItem("loggedInUser")
    );
    if(currentUser){
        console.log(
            "Logged in as:",
            currentUser.firstName
        );
    }
};