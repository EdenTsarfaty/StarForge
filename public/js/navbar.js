export let availableCredits;
let itemsInCart;

const creditAmount = document.getElementById("credits");
const cartLink = document.getElementById("cart-link");

export const navbarReady = (async function updateNavbar() {
  const res = await fetch("/navbar");
  const logButton = document.getElementById("btn-log");
  if (res.ok) {
    const data = await res.json();

    logButton.innerText = "Logout";
    logButton.href = "/logout";

    const userGreeting = document.getElementById("user-greeting");
    userGreeting.innerText = `Hello ${data.username}!`

    availableCredits = Number(data.credits);
    creditAmount.textContent = `${availableCredits}`;

    const loggedInElements = document.querySelectorAll(".logged-link");
    loggedInElements.forEach(element => {
        element.style.display = "inline";
    });

    const creditsLogo = document.getElementById("credits-logo");
    creditsLogo.style.display = "inline-block";
    
    itemsInCart = Number(data.cart);
    cartLink.textContent = `Cart(${itemsInCart})`;

    if (data.isAdmin) {
      const adminLink = document.getElementById("admin-link");
      adminLink.style.display = "inline";
    }
  } else if (res.status === 401) {
      logButton.innerText = "Login";
      logButton.href = "/login.html";
  }
})();

export function updateCredits(amount) {
    availableCredits += amount;
    creditAmount.textContent = availableCredits;
}

export function updateCart(amount) {
    itemsInCart += amount;
    cartLink.textContent = `Cart(${itemsInCart})`;
}