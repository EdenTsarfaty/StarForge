const searchbox = document.getElementById("search");
let products;

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

async function loadProducts() {
  try {
    const res = await fetch('/products');
    if (!res.ok) throw new Error("Failed to load products");
    const fetchedProducts = await res.json();

    const container = document.getElementById("product-list");

    fetchedProducts.forEach(product => {
      // create card
      const card = document.createElement("div");
      card.className = "product-card";

      // title
      const title = document.createElement("h2");
      title.className = "product-title";
      title.textContent = product.title;
      card.appendChild(title);

      // image
      const img = document.createElement("img");
      img.src = product.image;
      img.alt = product.title;
      card.appendChild(img);

      // price
      const price = document.createElement("h3");
      price.className = "product-price";
      price.textContent = product.price + " ⚛";
      card.appendChild(price);

      // description
      const desc = document.createElement("p");
      desc.className = "product-desc";
      desc.textContent = product.description;
      card.appendChild(desc);

      // add-to-cart button
      const btn = document.createElement("button");
      btn.textContent = "Add to Cart";
      // btn.addEventListener("click", async () => {
      //   try {
      //     const res = await fetch("/cart/add", {
      //       method: "POST",
      //       headers: { "Content-Type": "application/json" },
      //       body: JSON.stringify({ productId: product.id })
      //     });
      //     if (res.ok) {
      //       alert(`${product.title} added to cart`);
      //     } else if (res.status === 401) {
      //       window.location = "login.html"; // redirect if not logged in
      //     } else {
      //       alert("Failed to add to cart");
      //     }
      //   } catch (err) {
      //     console.error(err);
      //     alert("Error adding to cart");
      //   }
      // });
      card.appendChild(btn);

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading products:", err);
  }
  products = document.querySelectorAll(".product-card");
}

updateNavbar();

loadProducts();

searchbox.addEventListener("input", () => {
  const query = searchbox.value.toLowerCase();
  products.forEach(card => {
    const title = card.querySelector(".product-title").innerText.toLowerCase();
    const desc  = card.querySelector(".product-desc").innerText.toLowerCase();
    const match = title.startsWith(query) || desc.startsWith(query);
    card.style.display = match ? "block" : "none";
  });
});