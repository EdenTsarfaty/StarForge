let numberOfItems = 0;

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

const container = document.getElementById("cargo-grid");
const sellAllButton = document.getElementById("sell-all-btn");
const warning = document.getElementById("warning-no-items");


function noItemsInCargo() {
    container.innerHTML = ""; // Nukes all children of main div

    warning.style.display = "block";

    sellAllButton.style.display = "none";
}

function loadCard(item, index, cargo, isNew = false) {
  // create container
  const cargoCard = document.createElement("div");
  cargoCard.className = "cargo-card";
  if (isNew) cargoCard.classList.add("new-card");

  const cardInner = document.createElement("div");
  cardInner.className = "card-inner";

  const cardText = document.createElement("div");

  // title
  const title = document.createElement("h3");
  title.textContent = `${item.title} x${item.qty}`;
  cardText.appendChild(title);

  // image
  const img = document.createElement("img");
  img.src = item.image;
  img.alt = title.textContent;
  cardInner.appendChild(img);

  // description
  const description = document.createElement("p");
  description.textContent = item.description;
  cardText.appendChild(description);

  // price
  const price = document.createElement("p");
  price.innerHTML = `<strong>${item.price * item.qty} ⚛</strong>`;
  cardText.appendChild(price);

  // sell button
  const sellButton = document.createElement("button");
  sellButton.textContent = "Sell";
  sellButton.addEventListener("click", async () => {
    try {
      const res = await fetch("/cargo/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id })
      });
      let msg = await res.text();
      if (res.ok) {
        numberOfItems--;
        if (numberOfItems === 0) {
          noItemsInCargo();
          msg += "\nNo more items in cargo";
        } else {
          cargoCard.remove();
        }
        alert(msg);
      } else {
        alert("Failed to remove from cargo");
        console.error(msg);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  });

  cardInner.appendChild(cardText);
  cardInner.appendChild(sellButton);
  cargoCard.appendChild(cardInner);

  // staggered animation
  cargoCard.style.animationDelay = `${index * 0.4}s`;

  cargo.appendChild(cargoCard);
}

async function loadCargo() {
  try {
    const res = await fetch("/cargo/load-log");
    if (res.ok) {
      const cargoBayLog = await res.json();
      numberOfItems = cargoBayLog.length;
      if (numberOfItems === 0) {
        noItemsInCargo();
      } else {
        const cargo = document.getElementById("cargo-grid");

        cargoBayLog.forEach((item, index) => {
          loadCard(item, index, cargo, false);
        });

        // show cargo grid + sell all button
        cargo.style.display = "grid";
        sellAllButton.style.display = "block";
      }
    }
  } catch (err) {
    console.error("Error loading products:", err);
  }
}


const unloadButton = document.getElementById("unload-btn");

unloadButton.addEventListener("click", async () => {
    try {
        const res = await fetch("/cargo/unload", {
            method: "POST"
        });
        if (res.ok) {
            const shipCargoLog = await res.json();
            const cargo = document.getElementById("cargo-grid");
            console.log(shipCargoLog);
            shipCargoLog.forEach((item, index) => {
            loadCard(item, index, cargo, true);
            });
            if (shipCargoLog.length > 0) {
                cargo.style.display = "grid";
                warning.style.display = "none";
                sellAllButton.style.display = "block";
                numberOfItems += shipCargoLog.length;
            }
        } else if (res.status === 429) {
            const data = await res.text();
            alert(data);
        }
    } catch (err) {
        console.error("Error loading products:", err);
    }
});

sellAllButton.addEventListener("click", async () => {
    try {
        const res = await fetch("/cargo/sellAll", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        if (res.ok) {
            noItemsInCargo();
        } else {
            const errText = await res.text();
            console.error("Sell all failed:", errText);
            alert("Could not sell all cargo.");
        }
    } catch (err) {
        console.error("Sell all request error:", err);
        alert("Error contacting server.");
    }
});

updateNavbar();

loadCargo();