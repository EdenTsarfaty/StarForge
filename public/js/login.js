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

const params = new URLSearchParams(window.location.search);
const next = params.get("next") || "/store.html";

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const username = data.get("username");
    const password = data.get("password");
    const remember = data.get("remember") !== null;
    
    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, remember }),
        credentials: "include"
    });

    if (res.ok) {
        window.location.href = next;
    } else {
        error = document.getElementById("err-msg");
        const msg = await res.text();
        error.innerText = msg;
        error.hidden = false;
    }
});