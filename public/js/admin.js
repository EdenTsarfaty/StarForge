const userSearchbox = document.getElementById("search");
let users;

// Local filter to the activity log
userSearchbox.addEventListener("input", () => {
  const query = userSearchbox.value.toLowerCase();
  users.forEach(row => {
    const cells = row.querySelectorAll("td");
    const username = cells[1].innerText.toLowerCase();
    const match = username.toLowerCase().startsWith(query);
    row.style.display = match ? "table-row" : "none";
  });
});

async function loadActivities() {
  try {
    const res = await fetch("/admin/log/load");
    if (res.ok) {
      const logs = await res.json();         
      const container = document.getElementById("activity-list");
      // have latest activity appear on top
      logs.reverse();

      logs.forEach(activity => {
          let cell;
          // create row
          const row = document.createElement("tr");

          // date-time
          cell = document.createElement("td");
          cell.textContent = new Date(activity.datetime).toLocaleString();
          row.appendChild(cell);

          // username
          cell = document.createElement("td");
          cell.textContent = activity.username;
          row.appendChild(cell);

          // activity type
          cell = document.createElement("td");
          cell.textContent = activity.action;
          row.appendChild(cell);

          row.appendChild(cell);

          container.appendChild(row);
          
      });
      users = document.querySelectorAll("table tbody tr");
    }
  } catch (err) {
      console.error("Error loading products:", err);
  }
}

async function isValidImage(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// Product search button by title
const productGetBtn = document.getElementById("prod-srch-btn");

// Cancel search button
const cancelBtn = document.getElementById("cancel-srch");

// Title input
const productTitle = document.getElementById("prod-title");

// Description input
const productDesc = document.getElementById("prod-desc");

// Cost input
const productCost = document.getElementById("prod-cost");

// Image URL input
const productImageURL = document.getElementById("prod-img-url");

// Image preview
const productImage = document.querySelector(".preview img");

// Add product button
const productAddBtn = document.getElementById("prod-add");

// Remove product button
const productRemoveBtn = document.getElementById("prod-remove");

//Error for product not found
const productNotFoundWarn = document.getElementById("prod-srch-err");

let productId;


productGetBtn.addEventListener("click", async () => {
  try {
    const res = await fetch(`/admin/product/get?title=${encodeURIComponent(productTitle.value)}`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (res.ok) {
      const data = await res.json();

      productTitle.value = data.title;
      productTitle.disabled = true;

      productDesc.value = data.description;
      productDesc.disabled = true;

      productCost.value = data.price;
      productCost.disabled = true;

      productImageURL.value = data.image;
      productImageURL.disabled = true;
      if (await isValidImage(data.image)) {
        productImage.src = data.image;
      } else {
        productImage.src = "svg/image-placeholder.svg";
      }

      productGetBtn.hidden = true;
      cancelBtn.hidden = false;
      
      productAddBtn.hidden = true;
      productRemoveBtn.hidden = false;

      productNotFoundWarn.hidden = true;
      prodPreviewErr.hidden = true;

      productId = data.id;
    } else if (res.status === 404) {
      productNotFoundWarn.hidden = false;
    } else {
      const msg = await res.text();
      console.error(msg);
      alert("Search unsuccessful");
    }
    } catch (err) {
      console.error(err);
    }
});

function resetForm () {
  productTitle.value = "";
  productTitle.disabled = false;

  productDesc.value = "";
  productDesc.disabled = false;

  productCost.value = "";
  productCost.disabled = false;

  productImageURL.value = "";
  productImageURL.disabled = false;
  productImage.src = "svg/image-placeholder.svg";

  productGetBtn.hidden = false;
  cancelBtn.hidden = true;
  
  productAddBtn.hidden = false;
  productRemoveBtn.hidden = true;

  productId = null;
}
cancelBtn.addEventListener("click", resetForm);

productRemoveBtn.addEventListener("click", async () => {
  if (productId) {
    try {
      const res = await fetch(`/admin/product/delete/${productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert(`${productTitle.value} deleted!`);
        resetForm();
      } else {
        alert("Could not delete product");
      }
    } catch (err) {
      console.error(err);
    }
  }
});

productAddBtn.addEventListener("click", async () => {
  try {
    if (await isValidImage(productImageURL.value)) {
      const res = await fetch("/admin/product/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: productTitle.value, description: productDesc.value,
          price: productCost.value, url: productImageURL.value })
      });
      if (res.ok) {
        alert(`${productTitle.value} added!`);
        resetForm();
      } else {
        alert("Could not add product");
      }
    } else {
      alert("Please add a valid image");
    }
  } catch (err) {
    console.error(err);
  }
});

const prodPreviewErr = document.getElementById("prod-preview-err");

productImageURL.addEventListener("focusout", async () => {
    if (await isValidImage(productImageURL.value)) {
    productImage.src = productImageURL.value;
    prodPreviewErr.hidden = true;
  } else {
    productImage.src = "svg/image-placeholder.svg";
    prodPreviewErr.hidden = false;
  }
})

loadActivities();