import { updateCart } from "/js/navbar.js"

let numberOfItems = 0;
const container = document.querySelector(".tbl-wrapper");
const checkoutButton = document.getElementById("checkout-btn");

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

                    // remove button
                    cell = document.createElement("td");
                    const removeButton = document.createElement("button");
                    removeButton.textContent = "Remove";
                    removeButton.addEventListener("click", async () => {
                        try {
                            const res = await fetch(`/cart/${product.id}`, {
                                method: "DELETE"
                            });
                            let msg = await res.text();
                            if (res.ok) {
                                numberOfItems--;
                                if (numberOfItems === 0) {
                                    noItemsInCart();
                                    msg += "\nNo more items in cart";
                                }
                                else {
                                    row.remove();
                                    sum -= product.price;
                                    subtotalAmount.textContent = sum + " ⚛";
                                }
                                updateCart(-1);
                                alert(msg);
                            } else {
                                alert("Failed to remove from cart");
                                console.error(msg);
                            }
                        }
                        catch (err) {
                            console.error(err);
                            throw err;
                        }
                    })
                    cell.appendChild(removeButton);
                    row.appendChild(cell);
                    row.className = `product-${product.id}`;

                    cartContainer.appendChild(row);
                });

                subtotalAmount.textContent = sum + " ⚛";
                container.style.display = "block";
                checkoutButton.style.display = "block";
            }
        }
    } catch (err) {
        console.error("Error loading products:", err);
    }
}

loadCart();