const form = document.getElementById("register-form");

const password = document.getElementsByName("password")[0];
const confirmation = document.getElementsByName("confirm-password")[0];
const pass_match_err = document.getElementById("pass-not-match-err");
var password_match = true;

// Checks that the password field and password confirmation fields are the same
function validatePassword() {
    if (password.value !== confirmation.value) {
        pass_match_err.hidden = false;
        password_match = false;
    }
    else {
        pass_match_err.hidden = true;
        password_match = true;
    }
}
password.addEventListener("focusout", validatePassword);
confirmation.addEventListener("focusout", validatePassword);


// Enables the password toggle button
const toggle_pass_visibility = document.getElementById("togglePassword"); 
const eye_open = document.querySelector(".fa-eye");
const eye_closed = document.querySelector(".fa-eye-slash");
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
    if (password_match) {
        const data = new FormData(e.target);
        const username = data.get("username").toLowerCase();
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