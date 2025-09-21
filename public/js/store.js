const searchbox = document.getElementById("search");
const products = document.querySelectorAll(".product-card");

searchbox.addEventListener("input", () => {
  const query = searchbox.value.toLowerCase();
  products.forEach(card => {
    const title = card.querySelector(".product-title").innerText.toLowerCase();
    const desc  = card.querySelector(".product-desc").innerText.toLowerCase();
    const match = title.startsWith(query) || desc.startsWith(query);
    card.style.display = match ? "block" : "none";
  });
});

async function updateNavbar() {
  const res = await fetch("/session");
  const data = await res.json();
  
  logButton = document.getElementById("btn-log");

  if (data.loggedIn) {
    logButton.innerText = "Logout";
    logButton.href = "logout";

    userGreeting = document.getElementById("user-greeting");
    userGreeting.innerText = `Hello ${data.username}!`
    
    cartLink = document.getElementById("cart-link");
    cartLink.style.display = "inline";
    
    myItemsLink = document.getElementById("my-items-link");
    myItemsLink.style.display = "inline";

  } else {
    logButton.innerText = "Login";
    logButton.href = "login.html";
  }

  if (data.isAdmin) {
    myItemsLink = document.getElementById("admin-link");
    myItemsLink.style.display = "inline";
  }
}

updateNavbar();