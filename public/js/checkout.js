checkedOut = []
const container = document.querySelector(".tbl-wrapper");
const paymentButton = document.getElementById("payment-btn");

async function updateNavbar() {
  const res = await fetch("/session");
  if (res.ok) {
    const data = await res.json();

    const userGreeting = document.getElementById("user-greeting");
    userGreeting.innerText = `Hello ${data.username}!`

    if (data.isAdmin) {
      const adminLink = document.getElementById("admin-link");
      adminLink.style.display = "inline";
    }
  }
}

function noItemsInCart() {
    container.remove(); // Nukes all children of main div

    const warning = document.getElementById("warning-no-items");
    warning.style.display = "block";

    checkoutButton.remove()
}

async function loadCart() {
    try {
        const res = await fetch("/cart-load");
        if (res.ok) {
            const fetchedProducts = await res.json();
            numberOfItems = fetchedProducts.length;
            if (numberOfItems === 0) {
                noItemsInCart();
            } else {            
                const cartContainer = document.getElementById("cart-items");
                const subtotalAmount = document.getElementById("subtotal-amount");

                let sum = 0;
                fetchedProducts.forEach(product => {
                    let cell;
                    // create row
                    const row = document.createElement("tr");

                    // image
                    cell = document.createElement("td");
                    const img = document.createElement("img");
                    img.src = product.image;
                    img.alt = product.title;
                    cell.appendChild(img);
                    row.appendChild(cell);

                    // title
                    cell = document.createElement("td");
                    const title = document.createElement("h3");
                    const description = document.createElement("p");
                    title.textContent = product.title;
                    description.textContent = product.description;
                    cell.appendChild(title);
                    cell.appendChild(description);
                    row.appendChild(cell);

                    // price
                    cell = document.createElement("td");
                    const price = document.createElement("span");
                    price.textContent = product.price + " ⚛";
                    cell.appendChild(price);
                    row.appendChild(cell);
                    sum += product.price;

                    // checkbox
                    cell = document.createElement("td");
                    const confirmBuyCB = document.createElement("input");
                    confirmBuyCB.type = "checkbox";
                    confirmBuyCB.checked = true;
                    confirmBuyCB.addEventListener("change", async () => {
                        try {
                            if (confirmBuyCB.checked) {
                                sum += product.price;
                                checkedOut.push(product);
                            } else {
                                sum -= product.price;
                                checkedOut = checkedOut.filter(p => p.id !== product.id);
                            }
                            sessionStorage.setItem("checkedOut", JSON.stringify({amount: sum, items: checkedOut}));
                            subtotalAmount.textContent = sum + " ⚛";
                        }
                        catch (err) {
                            console.error(err);
                            throw err;
                        }
                    });
                    cell.appendChild(confirmBuyCB);
                    row.appendChild(cell);
                    row.className = `product-${product.id}`;

                    cartContainer.appendChild(row);
                    
                });

                checkedOut = fetchedProducts;
                sessionStorage.setItem("checkedOut", JSON.stringify({amount: sum, items: checkedOut}));
                subtotalAmount.textContent = sum + " ⚛";
                container.style.display = "block";
                paymentButton.style.display = "block";
            }
        }
    } catch (err) {
        console.error("Error loading products:", err);
    }
}

updateNavbar();

loadCart();