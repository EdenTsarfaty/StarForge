import { updateCart } from "/js/navbar.js"

const searchbox = document.getElementById("search");
let products;

async function loadProducts() {
  try {
    const res = await fetch('/products');
    if (res.ok) {
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
      btn.addEventListener("click", async () => {
        try {
          const res = await fetch("/cart/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: product.id })
          });
          if (res.ok) {
            updateCart(1);
            alert(`${product.title} added to cart`);
          } else if (res.status === 409) {
            const message = await res.text();
            alert(message);
          } else if (res.status === 401) {
            window.location = "login.html"; // redirect if not logged in
          } else {
            alert("Failed to add to cart");
          }
        } catch (err) {
          console.error(err);
          throw err;
        }
      });
      card.appendChild(btn);

      container.appendChild(card);
    }
  )}
  } catch (err) {
    console.error("Error loading products:", err);
  }
  products = document.querySelectorAll(".product-card");
}

loadProducts();

const clearSearchBtn = document.getElementById("clear-search");

searchbox.addEventListener("input", () => {
  const query = searchbox.value.toLowerCase();
  products.forEach(card => {
    const title = card.querySelector(".product-title").innerText.toLowerCase();
    const desc  = card.querySelector(".product-desc").innerText.toLowerCase();
    const match = title.startsWith(query) || desc.startsWith(query);
    card.style.display = match ? "block" : "none";
  });
  if (searchbox.value !== "") {
    clearSearchBtn.style.display = "inline";
  } else {
    clearSearchBtn.style.display = "none";
  }
});

clearSearchBtn.addEventListener("click", () => {
  searchbox.value = "";
  clearSearchBtn.style.display = "none";
  products.forEach(card => {
    card.style.display = "block";
  });
})