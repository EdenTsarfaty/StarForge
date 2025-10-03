(async function updateNavbar() {
  const res = await fetch("/navbar");
  const logButton = document.getElementById("btn-log");
  if (res.ok) {
    const data = await res.json();

    logButton.innerText = "Logout";
    logButton.href = "/logout";

    const userGreeting = document.getElementById("user-greeting");
    userGreeting.innerText = `Hello ${data.username}!`

    const creditAmount = document.getElementById("credits");
    creditAmount.innerHTML = `<strong>${data.credits}</strong>`;

    const loggedInElements = document.querySelectorAll(".logged-link");
    loggedInElements.forEach(element => {
        element.style.display = "inline";
    });

    const creditsLogo = document.getElementById("credits-logo");
    creditsLogo.style.display = "inline-block";

    const cartLink = document.getElementById("cart-link");
    cartLink.textContent = `Cart(${data.cart})`;

    if (data.isAdmin) {
      const adminLink = document.getElementById("admin-link");
      adminLink.style.display = "inline";
    }
  } else if (res.status === 401) {
      logButton.innerText = "Login";
      logButton.href = "/login.html";
  }
})();

async function updateCredits(amount) {
    const creditAmount = document.getElementById("credits");
    creditAmount.textContent = Number(creditAmount.textContent) + amount;
}