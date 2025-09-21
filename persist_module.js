import fs from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Build dataDir
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

// Exports
export { loadAll, users, products, carts, purchases, activityLog };