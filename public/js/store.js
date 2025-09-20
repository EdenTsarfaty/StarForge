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