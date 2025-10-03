async function loadPurchases() {
    try {
        const res = await fetch("/myitems/load");
        if (res.ok) {
            const fetchedPurchases = await res.json();
            console.log(fetchedPurchases);
            const numberOfPurchases = fetchedPurchases.length;
            if (numberOfPurchases !== 0) {         
                const container = document.getElementById("purchased-items");

                fetchedPurchases.forEach(purchase => {
                    let cell;
                    // create row
                    const row = document.createElement("tr");

                    // purchase date
                    cell = document.createElement("td");
                    const formattedDate = (new Date(purchase.date)).toLocaleDateString();
                    cell.textContent = formattedDate;
                    row.appendChild(cell);

                    // products
                    cell = document.createElement("td");
                    const list = document.createElement("ul");
                    const products = purchase.items;
                    products.forEach( (product) => {
                        const item = document.createElement("li");
                        item.textContent = product;
                        list.appendChild(item);
                    })
                    cell.appendChild(list);
                    row.appendChild(cell);

                    // price
                    cell = document.createElement("td");
                    cell.textContent = purchase.cost + " ⚛";
                    row.appendChild(cell);

                    container.appendChild(row);
                });
            } else {
                const noPurchasesWarn = document.getElementById("warning-no-items");
                noPurchasesWarn.style.display = "inline";
            }
        }
    } catch (err) {
        console.error("Error loading products:", err);
    }
}

loadPurchases();