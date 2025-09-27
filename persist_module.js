import fs from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

// Build dataDir path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, "data");


// Shared module-level variables
let users = {};
let products = [];
let carts = {};
let purchases = {};
let activityLog = [];

// Helper: read a file safely with fallback
async function readJSON(filename, fallback) {
  try {
    const data = await fs.readFile(join(dataDir, filename), "utf-8");
    return JSON.parse(data || JSON.stringify(fallback));
  } catch (err) {
    if (err.code === "ENOENT") {
      // if file is missing return fallback
      return fallback;
    }
    console.log(err);
    throw err;
  }
}

// Load all JSON files into memory
async function loadAll() {
  users = await readJSON("users.json", {});
  products = await readJSON("products.json", []);
  carts = await readJSON("carts.json", {});
  purchases = await readJSON("purchases.json", {});
  activityLog = await readJSON("activity_log.json", []);
}

async function addUser(username, password, vessel, phone, dateOfBirth, email) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        users[username] = {"password": hashedPassword, "vessel": vessel, "phone": phone, "DoB": dateOfBirth, "email": email};
        await saveUsers();
    } catch (err) {
        console.error("Error adding user:", err);
        throw err;
    }
}

async function saveUsers () {
    try {
        await fs.writeFile(join(dataDir, "users.json"), JSON.stringify(users, null, 2), "utf-8");
    } catch(err) {
        console.log("Error saving users.json:", err);
        throw err;
    }
}

async function addProduct(title, description, price, img_url) {
    // Finds next ID , gaps are allowed
    const ids = Object.keys(products).map(Number);
    const maxId = ids.length > 0 ? Math.max(...ids) : 100;
    const nextId = maxId + 1;

    const numericPrice = Number(price);

    if (isNaN(numericPrice)) {
        throw new Error("Price must be a valid number");
    }

    //Assumes admin's responsiblity that the url isn't malicious or huge (DOS), doesn't download it locally
    products[nextId] = { title, description, price: numericPrice, image: img_url};
    await saveProducts();
}

async function removeProduct(productId) {
    delete products[productId];

    // Deletes the item from every user's cart to avoid issues while purchasing
    Object.keys(carts).forEach(username => {
        carts[username] = carts[username].filter(id => id !== productId);
    });

    await saveCarts();
    await saveProducts();
}

async function saveProducts () {
    try {
        await fs.writeFile(join(dataDir, "products.json"), JSON.stringify(products, null, 2), "utf-8");
    }
    catch(err) {
        console.log("Error saving products.json:", err);
        throw err;
    }
}

async function updateCart (username, items) {
    if (!carts[username]) {
        carts[username] = [];
    }

    carts[username] = items;
    await saveCarts();
}

async function saveCarts () {
    try {
        await fs.writeFile(join(dataDir, "carts.json"), JSON.stringify(carts, null, 2), "utf-8");
    }
    catch(err) {
        console.log("Error saving carts.json:", err);
        throw err;
    }
}


async function checkout (username, selectedIds, cost) {
    const cartItems = carts[username] || [];

    if (selectedIds.length === 0) {
        throw new Error("No items selected for purchase");
    }

    // Saves just the titles to avoid having items removed in the future by admins
    const purchasedTitles = selectedIds
        .filter(id => products[id])
        .map(id => products[id].title);

    // Save to purchases
    if (!purchases[username]) {
        purchases[username] = [];
    }
    purchases[username].push({
        date: new Date().toISOString(),
        items: purchasedTitles,
        cost
    });

    // Remaining items in cart - items not selected during checkout
    carts[username] = cartItems.filter(id => !selectedIds.includes(id));

    await saveCarts();
    await savePurchases();
}

async function savePurchases () {
    try {
        await fs.writeFile(join(dataDir, "purchases.json"), JSON.stringify(purchases, null, 2), "utf-8");
    }
    catch(err) {
        console.log("Error saving purchases.json:", err);
        throw err;
    }
}

async function recordActivity (datetime, username, action) {
    activityLog.push({ datetime, username, action })
    await saveActivities();
}

async function saveActivities () {
    try {
        await fs.writeFile(join(dataDir, "activity_log.json"), JSON.stringify(activityLog, null, 2), "utf-8");
    }
    catch(err) {
        console.log("Error saving activity_log.json:", err);
        throw err;
    }
}

async function saveAll () {
    await Promise.all([
        saveUsers(),
        saveProducts(),
        saveCarts(),
        savePurchases(),
        saveActivities()
    ]);
}

// Exports
export { loadAll, addUser, addProduct, removeProduct, updateCart, checkout, recordActivity, saveAll,
    users, products, carts, purchases, activityLog };