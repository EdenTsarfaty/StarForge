#!/usr/bin/env node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
/**
 * Full project test runner (restored full suite)
 * - Spawns `node server.js`, waits for "Server running…"
 * - Backs up ./data and restores it after the run (no leftovers)
 * - Uses a fixed test user
 * - Runs all tests sequentially (does not stop on failure)
 * - Prints colored ✅ / ❌ per test and a final summary
 * - Gracefully terminates the server at the end
 * - Supports --quiet to suppress server logs
 * - Final DoS test expects 429 after rate-limit
 *
 * Node: v22.19.0
 */

import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";

const BASE = "https://localhost:3000";
const QUIET = process.argv.includes("--quiet");

// ---------- Color helpers ----------
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};
const ok = (msg) => console.log(`${C.green}✅ ${msg}${C.reset}`);
const bad = (msg) => console.log(`${C.red}❌ ${msg}${C.reset}`);
const head = (label) => console.log(`\n${C.bold}${C.cyan}====== ${label} ======${C.reset}`);

// ---------- backup/restore data ----------
const DATA_DIR = path.resolve("./data");
const BACKUP_DIR = path.resolve(`./data.backup_${Date.now()}`);

function backupData() {
  try {
    if (fs.existsSync(DATA_DIR)) {
      fs.cpSync(DATA_DIR, BACKUP_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn("Failed to back up data folder:", e.message);
  }
}
function restoreData() {
  try {
    if (fs.existsSync(BACKUP_DIR)) {
      if (fs.existsSync(DATA_DIR)) fs.rmSync(DATA_DIR, { recursive: true, force: true });
      fs.renameSync(BACKUP_DIR, DATA_DIR);
    }
  } catch (e) {
    console.warn("Failed to restore data folder:", e.message);
  }
}

// ---------- Simple cookie client (per session) ----------
class Client {
  constructor(name = "client") {
    this.name = name;
    this.cookie = "";
  }
  _captureCookies(res) {
    const sc = res.headers.get('set-cookie');
    if (!sc) return;
    const sid = Array.isArray(sc) ? sc.find(v => v && v.includes("connect.sid")) : sc;
    if (sid) this.cookie = sid.split(";")[0];
  }
  async request(path, { method="GET", json, headers={}, raw=false } = {}) {
    const init = { method, headers: { ...headers } };
    if (this.cookie) init.headers["Cookie"] = this.cookie;
    if (json !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(json);
    }
    const res = await fetch(BASE + path, init);
    this._captureCookies(res);

    if (raw) return res;

    // Try JSON then text
    let body;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      body = await res.json().catch(async () => await res.text());
    } else {
      body = await res.text();
      try { body = JSON.parse(body); } catch {}
    }
    return { res, body };
  }
}

// ---------- Server control ----------
async function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["server.js"], { stdio: ["ignore", "pipe", "pipe"] });
    let ready = false;
    const onData = (chunk) => {
      const s = chunk.toString();
      if (!QUIET) process.stdout.write(`${C.gray}[server] ${s}${C.reset}`);
      if (!ready && s.includes("HTTP redirect server running")) {
        ready = true;
        resolve(child);
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => {
      if (!ready) reject(new Error(`Server exited before ready. Code ${code}`));
    });
  });
}
async function stopServer(child) {
  return new Promise((resolve) => {
    try {
      child.once("exit", () => resolve());
      child.kill("SIGINT");
      setTimeout(() => { try { child.kill("SIGKILL"); } catch {} }, 1000).unref();
    } catch {
      resolve();
    }
  });
}

// ---------- Test harness ----------
let passed = 0, failed = 0;
async function test(label, fn) {
  try {
    await fn();
    ok(label);
    passed++;
  } catch (err) {
    bad(`${label} — ${err.message || err}`);
    failed++;
  }
}

// ---------- Helpers ----------
async function computeCartCost(client) {
  const { body } = await client.request("/cart-load");
  if (!Array.isArray(body)) return 0;
  return body.reduce((sum, p) => sum + Number(p.price || 0), 0);
}
function partCondition(telemetry, part) {
  if (!telemetry) return null;
  if (telemetry[part]?.condition != null) return telemetry[part].condition;
  if (telemetry.health != null) return telemetry.health;
  return null;
}

// ---------- Main ----------
(async () => {
  backupData();
  const server = await startServer();

  // Fixed test user (safe because we restore data afterwards)
  const TEST_USER = "testuser";
  const TEST_PASS = "Abcdef1!";
  const NEW_PASS = "XyZ1234!";
  const WEAK_USER = `weak_${Date.now()}`;

  // clients
  const anon = new Client("anon");
  const user = new Client("user");
  const admin = new Client("admin");

  // ========== A. Authentication ==========
  head("Authentication");

  await test("A1 Register new user", async () => {
    const res = await anon.request("/register", {
      method: "POST",
      json: { username: TEST_USER, password: TEST_PASS, vessel: "Scout", phone: "123", dateOfBirth: "2000-01-01", email: "t@example.com" },
      raw: true
    });
  });

  await test("A2 Register duplicate username should fail", async () => {
    const { res } = await anon.request("/register", {
      method: "POST",
      json: { username: TEST_USER, password: TEST_PASS, vessel: "Scout", phone: "123", dateOfBirth: "2000-01-01", email: "t@example.com" },
    });
    if (res.status === 200) throw new Error("duplicate registration unexpectedly succeeded");
  });

  await test("A3 Register weak password should fail", async () => {
    const { res } = await anon.request("/register", {
      method: "POST",
      json: { username: WEAK_USER, password: "weak", vessel: "Scout", phone: "123", dateOfBirth: "2000-01-01", email: "w@example.com" },
    });
    if (res.status === 200) throw new Error("weak password accepted");
  });

  await test("A4 Login with correct credentials", async () => {
    const { res } = await user.request("/login", {
      method: "POST",
      json: { username: TEST_USER, password: TEST_PASS, remember: true },
    });
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  });

  await test("A5 Login with wrong password → 401", async () => {
    const { res } = await anon.request("/login", {
      method: "POST",
      json: { username: TEST_USER, password: "Wrong1!", remember: false },
    });
    if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
  });

  await test("A6 /session before login → 401 (anon)", async () => {
    const { res } = await anon.request("/session", { method: "GET" });
    if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
  });

  await test("A7 /session after login → 200 JSON", async () => {
    const { res, body } = await user.request("/session", { method: "GET" });
    if (res.status !== 200 || !body || !body.username) throw new Error(`bad session body: ${JSON.stringify(body)}`);
  });

  // ========== B. Cart ==========
  head("Cart");

  await test("B8 /cart-load before login → 401", async () => {
    const { res } = await anon.request("/cart-load");
    if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
  });

  let firstProductId = null;
  await test("B9 Fetch products and add a valid one to cart", async () => {
    const { body } = await user.request("/products");
    if (!Array.isArray(body) || body.length === 0) throw new Error("no products in catalog");
    firstProductId = body[0].id;
    const { res } = await user.request("/cart/add", { method: "POST", json: { productId: firstProductId } });
    if (res.status !== 200) throw new Error(`add failed, status ${res.status}`);
  });

  await test("B10 Add non-existent product → 400", async () => {
    const { res } = await user.request("/cart/add", { method: "POST", json: { productId: 999999 } });
    if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
  });

  await test("B11 Remove existing cart item", async () => {
    const { res } = await user.request(`/cart/${firstProductId}`, { method: "DELETE" });
    if (res.status !== 200) throw new Error(`expected 200, got ${res.status}`);
  });

  await test("B12 Remove non-existent item → graceful 404/200", async () => {
    const { res } = await user.request(`/cart/1234567`, { method: "DELETE" });
    if (![200,404].includes(res.status)) throw new Error(`expected 200 or 404, got ${res.status}`);
  });

  // Add again for payment tests
  await user.request("/cart/add", { method: "POST", json: { productId: firstProductId } });

  await test("B13 View cart contents", async () => {
    const { res, body } = await user.request("/cart-load");
    if (res.status !== 200 || !Array.isArray(body)) throw new Error("cart-load did not return array");
    if (!body.find(p => p.id == firstProductId)) throw new Error("product not found in cart");
  });

  await test("B14 Checkout with credits → insufficient funds", async () => {
    const cost = await computeCartCost(user);
    const { res } = await user.request("/pay", {
      method: "POST",
      json: { method: "credits", items: [firstProductId], cost },
    });
    if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
  });

  await test("B15 Checkout with card → success", async () => {
    const cost = await computeCartCost(user);
    const { res } = await user.request("/pay", {
      method: "POST",
      json: { method: "card", items: [firstProductId], cost },
    });
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  });

  // ========== C. Purchases ==========
  head("Purchases");

  await test("C16 /myitems/load has at least one entry", async () => {
    const { res, body } = await user.request("/myitems/load");
    if (res.status !== 200 || !Array.isArray(body) || body.length === 0) throw new Error("purchases empty");
  });

  // ========== D. Cargo ==========
  head("Cargo");

  let unloadItems = [];
  await test("D17 /cargo/load-log after login", async () => {
    const { res } = await user.request("/cargo/load-log");
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  });

  await test("D18 /cargo/unload first time → success", async () => {
    const { res, body } = await user.request("/cargo/unload", { method: "POST" });
    if (res.status !== 200 || !Array.isArray(body)) throw new Error(`bad unload response`);
    unloadItems = body;
  });

  await test("D19 /cargo/unload again same day → 429", async () => {
    const { res } = await user.request("/cargo/unload", { method: "POST" });
    if (res.status !== 429) throw new Error(`expected 429, got ${res.status}`);
  });

  await test("D20 /cargo/sell one valid item (if any)", async () => {
    if (unloadItems.length === 0) { ok("(skipped: no items received)"); return; }
    const sellId = unloadItems[0].id;
    const { res } = await user.request("/cargo/sell", { method: "POST", json: { itemId: sellId } });
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  });

  await test("D21 /cargo/sell invalid item → error", async () => {
    const { res } = await user.request("/cargo/sell", { method: "POST", json: { itemId: 999999 } });
    if (![400,404,500].includes(res.status)) throw new Error(`expected 400/404/500, got ${res.status}`);
  });

  await test("D22 /cargo/sellAll (skip if nothing left)", async () => {
    const { body } = await user.request("/cargo/load-log");
    if (!Array.isArray(body) || body.length === 0) { ok("(skipped: no cargo left)"); return; }
    const { res } = await user.request("/cargo/sellAll", { method: "POST" });
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  });

  // ========== E. Ship Hangar ==========
  head("Ship Hangar");

  const PART = "engine"; // which part to repair/upgrade
  let telemetry = null;
  await test("E23 /ship/telemetry returns stats", async () => {
    const lg = await admin.request("/login", { method: "POST", json: { username: "admin", password: "admin" } });
    if (lg.res.status !== 200) throw new Error("admin login failed");
    const { res, body } = await admin.request("/ship/telemetry");
    if (res.status !== 200 || typeof body !== "object") throw new Error("bad telemetry");
    telemetry = body;
  });

  // E24: repair with admin user (credits-safe), include 'part'
  await test(`E24 /ship/repair ${PART} works if condition < 100 (admin)`, async () => {
    const cond = partCondition(telemetry, PART);
    if (cond === 100) { ok("(skipped: already 100)"); return; }
    const { res } = await admin.request("/ship/repair", { method: "POST", json: { part: PART } });
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  });

  // E25: attempt repair past 100 should fail (admin)
  await test(`E25 /ship/repair ${PART} past 100 should fail (admin)`, async () => {
    // Try to reach 100 first (best-effort)
    for (let i = 0; i < 4; i++) {
      const t = await admin.request("/ship/telemetry");
      const c = partCondition(t.body, PART) ?? 0;
      if (c >= 100) break;
      const r = await admin.request("/ship/repair", { method: "POST", json: { part: PART } });
      if (r.res.status !== 200) break;
      await delay(40);
    }
    const extra = await admin.request("/ship/repair", { method: "POST", json: { part: PART } });
    if (extra.res.status === 200) throw new Error("unexpected 200 when repairing past 100");
  });

  // E26: upgrade once succeeds (admin)
  await test(`E26 /ship/upgrade ${PART} succeeds (admin)`, async () => {
    const lg = await admin.request("/login", { method: "POST", json: { username: "admin", password: "admin" } });
    if (lg.res.status !== 200) throw new Error("admin login failed");
    const { res } = await admin.request("/ship/upgrade", { method: "POST", json: { part: PART } });
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  });

  // E27: try upgrading past level 3 fails (admin)
  await test(`E27 /ship/upgrade ${PART} past level 3 should fail (admin)`, async () => {
    for (let i = 0; i < 3; i++) {
      await admin.request("/ship/upgrade", { method: "POST", json: { part: PART } });
      await delay(30);
    }
    const { res } = await admin.request("/ship/upgrade", { method: "POST", json: { part: PART } });
    if (res.status === 200) throw new Error("expected failure upgrading past level 3");
  });

  // ========== F. Market (Auction House) ==========
  head("Market");

  let auctionId = null;

  await test("F28 /market/load", async () => {
    const { res } = await user.request("/market/load");
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  });

  await test("F29 /auction/post ending very soon (expects 201)", async () => {
    const endTime = new Date(Date.now() + 20_000).toISOString();
    const { res } = await admin.request("/auction/post", {
      method: "POST",
      json: { title: `Lot ${Date.now()}`, description: "Test lot", currentBid: 1, endTime }
    });
    if (res.status !== 201) throw new Error(`status ${res.status}`);

    const m = await admin.request("/market/load");
    const latest = Array.isArray(m.body) && m.body.length ? m.body[m.body.length - 1] : null;
    auctionId = latest?.id ?? latest?.auctionId ?? null;
    if (!auctionId) throw new Error("could not determine auction id from /market/load");
  });

  await test("F30 /auction/bid valid bid", async () => {
    const { res } = await admin.request("/auction/bid", { method: "POST", json: { auctionId, amount: 2 } });
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  });

  await test("F31 /auction/bid lower than current → rejection", async () => {
    const { res } = await admin.request("/auction/bid", { method: "POST", json: { auctionId, amount: 1 } });
    if (![400,403].includes(res.status)) throw new Error(`expected 400/403, got ${res.status}`);
  });

  await test("F32 Place bid on expired auction → expect failure", async () => {
    await delay(21_000);
    const { res } = await admin.request("/auction/bid", { method: "POST", json: { auctionId, amount: 3 } });
    if (![404,400,410].includes(res.status)) throw new Error(`expected failure on expired auction, got ${res.status}`);
  });

  await test("F33 /auction/close (admin)", async () => {
    const { res } = await admin.request("/auction/close", { method: "POST", json: { auctionId } });
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  });

  // ========== G. Profile ==========
  head("Profile");

  await test("G34 /profile/load → success", async () => {
    const { res, body } = await user.request("/profile/load");
    if (res.status !== 200 || !body || !body.username) throw new Error("profile load failed");
  });

  await test("G35 /profile/edit (update phone)", async () => {
    const { res } = await user.request("/profile/edit", { method: "POST", json: { field: "phone", value: "999-222" } });
    if (res.status !== 200) throw new Error(`status ${res.status}`);
    const { body } = await user.request("/profile/load");
    if (body.phone !== "999-222") throw new Error("profile value not updated");
  });

  await test("G36 /profile/edit invalid field → 400", async () => {
    const { res } = await user.request("/profile/edit", { method: "POST", json: { field: "unknownField", value: "x" } });
    if (res.status !== 400) throw new Error(`expected 400 for invalid field, got ${res.status}`);
  });

  await test("G37 /profile/edit password field → can re-login", async () => {
    const { res } = await user.request("/profile/edit", { method: "POST", json: { field: "password", existing: TEST_PASS, new: NEW_PASS } });
    if (res.status !== 200) throw new Error(`password update failed status ${res.status}`);
    const fresh = new Client("fresh");
    const { res: r2 } = await fresh.request("/login", { method: "POST", json: { username: TEST_USER, password: NEW_PASS } });
    if (r2.status !== 200) throw new Error("re-login with new password failed");
  });

  // ========== H. Admin ==========
  head("Admin");

  let createdProductId = null;
  const createdTitle = `Gadget ${Date.now()}`;

  await test("H38 Login as admin", async () => {
    const { res } = await admin.request("/login", { method: "POST", json: { username: "admin", password: "admin" } });
    if (res.status !== 200) throw new Error(`admin login status ${res.status}`);
  });

  await test("H39 /admin/product/add → create product", async () => {
    const { res } = await admin.request("/admin/product/add", {
      method: "POST",
      json: { title: createdTitle, price: 123, description: "Test product", url: "/img/test.png" }
    });
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  });

  await test("H40 /admin/product/get → fetch created product by title", async () => {
    const { res, body } = await admin.request(`/admin/product/get?title=${encodeURIComponent(createdTitle)}`);
    if (res.status !== 200) throw new Error(`status ${res.status}`);
    createdProductId = body?.id ?? (Array.isArray(body) ? body[0]?.id : null);
    if (!createdProductId) throw new Error("could not determine product id");
  });

  await test("H41 /admin/product/delete/:id → remove product", async () => {
    const { res } = await admin.request(`/admin/product/delete/${createdProductId}`, { method: "DELETE" });
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  });

  await test("H42 /admin/product/get on removed product → 404", async () => {
    const { res } = await admin.request(`/admin/product/get?title=${encodeURIComponent(createdTitle)}`);
    if (res.status !== 404) throw new Error(`expected 404, got ${res.status}`);
  });

  await test("H43 /admin/log/load → activity list", async () => {
    const { res, body } = await admin.request("/admin/log/load");
    if (res.status !== 200 || !Array.isArray(body)) throw new Error("activity log not an array");
  });

  // ========== I. Edge / Bad Requests ==========
  head("Edge / Bad Requests");

  await test("I44 Missing JSON → 400", async () => {
    const { res } = await user.request("/cart/add", { method: "POST", json: {} });
    if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
  });

  await test("I45 Invalid ID format → 404/400 on delete", async () => {
    const { res } = await user.request("/cart/abc", { method: "DELETE" });
    if (![404,400].includes(res.status)) throw new Error(`expected 404/400, got ${res.status}`);
  });

  await test("I46 Unknown route → 404", async () => {
    const { res } = await user.request("/definitely-not-found");
    if (res.status !== 404) throw new Error(`expected 404, got ${res.status}`);
  });

  // ========== J. Logout ==========
  head("Logout / Cleanup");

  await test("J47 /logout → success", async () => {
    const { res } = await user.request("/logout");
    if (![200,302].includes(res.status)) throw new Error(`logout returned ${res.status}`);
  });

  await test("J48 /session after logout → 401", async () => {
    const { res } = await user.request("/session");
    if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
  });

  // ========== K. Stress / DoS (final) ==========
  head("Stress / DoS test");

  await test("K49 DoS rate-limit should yield some 429s", async () => {
    // No session cookie (post-logout). Allowed 100/15min → send 120 quick hits.
    const N = 120;
    const reqs = Array.from({ length: N }, () => fetch(`${BASE}/cargo/load-log`));
    const results = await Promise.allSettled(reqs);
    const statuses = results.map(r => r.value?.status || 0);
    const counts = statuses.reduce((m, s) => (m[s] = (m[s] || 0) + 1, m), {});
    if (!statuses.includes(429)) throw new Error(`no 429 detected (status counts: ${JSON.stringify(counts)})`);
  });

  // ---------- Summary ----------
  console.log(`\n${C.bold}Tests complete: ${passed}/${passed + failed} passed${C.reset}`);

  await stopServer(server);
  restoreData();
  process.exit(failed > 0 ? 1 : 0);
})().catch(async (err) => {
  bad(`Fatal: ${err?.message || err}`);
  process.exit(1);
});
