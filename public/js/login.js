const form = document.getElementById("login-form");

const password = document.getElementsByName("password")[0];
const toggle_pass_visibility = document.getElementById("togglePassword"); 
const eye_open = document.querySelector(".fa-eye");
const eye_closed = document.querySelector(".fa-eye-slash");

toggle_pass_visibility.addEventListener("click", () => {
    if (password.type === "password") {
        password.type = "text";
        eye_open.style.display = "none";
        eye_closed.style.display = "inline"
    } else {
        password.type = "password";
        eye_open.style.display = "inline";
        eye_closed.style.display = "none"
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const username = data.get("username");
    const password = data.get("password");
    const remember = data.get("remember");
    
    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, remember }),
    });

    if (res.ok) {
        window.location.href = "/store.html";
    } else {
        alert("Login failed");
    }
});