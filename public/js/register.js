const form = document.getElementById("register-form");

const password = document.getElementsByName("password")[0];
const confirmation = document.getElementsByName("confirm-password")[0];

const passPolicy = document.getElementById("pass-policy");
const passPolicyLowercase = passPolicy.querySelector("#lowercase");
const passPolicyUppercase = passPolicy.querySelector("#uppercase");
const passPolicyNumber = passPolicy.querySelector("#number");
const passPolicySpecial = passPolicy.querySelector("#special");
const passPolicyMatch = passPolicy.querySelector("#match");
const passPolicyLength = passPolicy.querySelector("#length");

// Password policy check
function checkPasswordPolicy(pass = password.value, confirmPass = confirmation.value) {
    const rules = {
        hasUpper: /[A-Z]/.test(pass),
        hasLower: /[a-z]/.test(pass),
        hasNumber: /\d/.test(pass),
        hasSpecial: /[!@#$%^&*]/.test(pass),
        length: pass.length >= 8,
        matches: pass === confirmPass
    };

    rules.hasUpper ? passPolicyUppercase.classList.add("satisfied") : passPolicyUppercase.classList.remove("satisfied");
    rules.hasLower ? passPolicyLowercase.classList.add("satisfied") : passPolicyLowercase.classList.remove("satisfied");
    rules.hasNumber ? passPolicyNumber.classList.add("satisfied") : passPolicyNumber.classList.remove("satisfied");
    rules.hasSpecial ? passPolicySpecial.classList.add("satisfied") : passPolicySpecial.classList.remove("satisfied");
    rules.length ? passPolicyLength.classList.add("satisfied") : passPolicyLength.classList.remove("satisfied");
    rules.matches ? passPolicyMatch.classList.add("satisfied") : passPolicyMatch.classList.remove("satisfied");

    return Object.values(rules).every(Boolean);
}

password.addEventListener("input", () => {
    checkPasswordPolicy();
});

confirmation.addEventListener("input", (e) => {
    const val = e.target.value;
    (val === confirmation.value) ? passPolicyMatch.classList.add("satisfied") : passPolicyMatch.classList.remove("satisfied");
});


// Enables the password toggle button
const toggle_pass_visibility = document.getElementById("togglePassword"); 
const eye_open = document.getElementById("eye");
const eye_closed = document.getElementById("eye-slash");
toggle_pass_visibility.addEventListener("click", () => {
    if (password.type === "password") {
        password.type = "text";
        confirmation.type = "text";
        eye_open.style.display = "none";
        eye_closed.style.display = "inline"
    } else {
        password.type = "password";
        confirmation.type = "password";
        eye_open.style.display = "inline";
        eye_closed.style.display = "none"
    }
});


// Collects all form fields
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (checkPasswordPolicy()) {
        const data = new FormData(e.target);
        const username = data.get("username");
        const password = data.get("password");
        const vessel = data.get("vessel");
        const phone = data.get("phone");
        const dateOfBirth = data.get("date_of_birth");
        const email = data.get("email");
        
        const res = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, vessel, phone, dateOfBirth, email }),
            credentials: "include"
        });

        if (res.ok) {
            window.location.href = "/login.html";
        }
        else {
            const error = document.getElementById("err-msg");
            const msg = await res.text();
            error.innerText = msg;
            error.hidden = false;
        }
    }
});