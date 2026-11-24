<p align="center">
  <img src="public/svg/logo-light.svg" alt="StarForge logo" width="120">
</p>

<h1 align="center">StarForge</h1>
<p align="center"><em>Precision Parts for Infinite Horizons</em></p>

StarForge is a full-stack web store set in a lighthearted sci-fi universe. Pilots sign up, buy parts for their spacecraft, unload and sell salvaged cargo, keep their ship repaired in the hangar, and trade with each other in a live auction house. Admins manage the catalog and watch the activity log.

It was built by **Eden Tsarfaty** as a solo final project for a Full-Stack Web Development course (September–October 2025). The stack is plain HTML/CSS/JavaScript on the frontend and Node.js + Express on the backend, with JSON files used as the database.

<p align="center">
  <img src="public/img/ship_hangar.png" alt="Ship Hangar artwork" width="640">
</p>

---

## Table of contents

- [Features](#features)
- [Game mechanics](#game-mechanics)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Server console commands](#server-console-commands)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Security](#security)
- [Testing](#testing)
- [Credits and AI usage](#credits-and-ai-usage)

---

## Features

### For every visitor
- **Landing page:** a hero page with a space backdrop, the StarForge logo and tagline, and links to log in, register, or go straight to the store.
- **Store:** the full parts catalog with live search-as-you-type. You can browse without an account, but you need to log in to add items to your cart.
- **Light / Dark / System theme:** a selector in the header. Your choice is saved in `localStorage` and applied *before* the page renders, so the page doesn't flash the wrong theme.

### For registered pilots
| Page | What it does |
|---|---|
| **Register / Login** | Sign-up form with a live password-policy checklist, a show/hide password toggle, and a "Remember me" option (12-day session instead of 30 minutes). After logging in you go back to the page you were trying to open (`login.html?next=…`). |
| **Cart → Checkout → Payment** | Add parts to the cart, pick which cart items to buy at checkout, then pay by **credit card** (a mock that accepts any card) or with in-game **credits (⚛)**. Items you didn't select stay in the cart. |
| **Thank You** | Confirmation page with an animated success graphic. |
| **My Items** | Your full purchase history, including auctions you won. |
| **Cargo Bay** | Once per visit, *unload* your ship's cargo: a random haul of exotic goods based on each item's rarity. Sell items one at a time or all at once for credits. |
| **Ship Hangar** | A picture of your ship with five components (hull, weapons, cloaking, landing gear, engine). Each one wears down every day. Spend credits to repair it, and once it's at 100% condition, to upgrade it (up to level 3). |
| **Market** | A player-to-player auction house. Post an item with a starting price and an end time, bid on other players' auctions, and watch the live countdowns. |
| **Profile** | View and edit your vessel name, phone, date of birth, email and password. Changing your password requires your current one. |

### For admins
- **Admin panel:** a searchable **user activity log** (logins, failed logins, purchases, cart changes, profile edits, auctions posted) and **product management** (look up a product by title, add new ones with an image-URL preview, delete existing ones).
- **Auction settlement:** when an auction expires it shows as "Pending admin approval". An admin then closes it, which gives the item to the highest bidder and pays the seller.

---

## Game mechanics

StarForge works like a small economy game. Credits are the in-game currency that connects all the features:

```
 Cargo Bay ──unload──▶ random loot ──sell──▶ ⚛ credits
                                               │
         ┌─────────────────────────────────────┼──────────────────────────┐
         ▼                                     ▼                          ▼
  Store checkout (pay with ⚛)      Ship Hangar repairs/upgrades     Market bids
                                                                          │
                                                   seller receives ⚛ ◀────┘
```

New accounts start with **0 credits**. The cargo bay is the main way to earn them.

### Cargo Bay
Each cargo item has a `rarity` between 0 and 1. On every unload, each item is rolled once and is found if `Math.random() > rarity`. If it's found, you get a random quantity within that item's range. You can unload once per login: logging in again resets `unloadAvailable`.

| Item | Rarity | Qty | Sell price |
|---|---|---|---|
| Xenon Energy Cells | 0.40 | 3–10 | 20 ⚛ |
| Unobtanium Ore Fragments | 0.60 | 1–5 | 50 ⚛ |
| Mysterious Crystal Shards | 0.65 | 1–3 | 200 ⚛ |
| Encrypted Datacore | 0.75 | 1–2 | 150 ⚛ |
| Telepathic Fish Eggs | 0.80 | 1 | 800 ⚛ |
| Stabilized Antimatter Canisters | 0.85 | 1 | 300 ⚛ |
| Cosmic Mix Tape (Indestructible Edition) | 0.90 | 1 | 2000 ⚛ |

### Ship Hangar
Each component stores the date it was last repaired and its level. The server works out the current condition from those:

```
condition    = floor(100 × decayRate ^ daysSinceRepair)
repairPrice  = floor(baseCost × (1 − condition / 100))
upgradePrice = floor(baseCost × 2.5 ^ level)
```

| Component | Daily decay | Base cost |
|---|---|---|
| Hull | 0.95 | 500 |
| Weapons Systems | 0.98 | 300 |
| Cloaking Device | 0.99 | 700 |
| Landing Gear | 0.94 | 200 |
| Engine | 0.97 | 500 |

The first time you visit the hangar, a level-1 ship in perfect condition is created for you. You can only upgrade a component when it is at 100% condition, and the maximum level is 3.

### Market (auctions)
- When you bid, the credits are **held in escrow right away**: they're taken from your balance, and the previous highest bidder gets their bid back in full.
- If you raise your own bid, you only need enough credits to cover the difference.
- Once an auction's end time passes, bidding stops and the card shows "Pending admin approval". An admin closes it, the winner gets a purchase record, and the seller is paid the winning bid.

### Store catalog
| ID | Product | Price |
|---|---|---|
| 100 | Quantum Drive | 250 |
| 101 | Plasma Shield | 100 |
| 102 | Dice Good Luck Charm | 2 |
| 103 | Laser Cannon Turrets | 80 |
| 104 | Stellar Map Index Upgrade | 40 |
| 105 | Holo Communication Array | 120 |
| 106 | Escape Pod | 60 |
| 107 | Temporal Flux Stabilizer | 500 |
| 108 | Mineral Drill | 75 |
| 109 | Mineral Tether | 55 |

---

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES modules; developed on v22) |
| Web server | [Express 5](https://expressjs.com/), served over HTTPS, with an HTTP → HTTPS redirect |
| Sessions | [`express-session`](https://github.com/expressjs/session) (in-memory store, `httpOnly` cookie) |
| Passwords | [`bcrypt`](https://github.com/kelektiv/node.bcrypt.js) (10 salt rounds) |
| Rate limiting | [`express-rate-limit`](https://github.com/express-rate-limit/express-rate-limit): 200 requests per 15 min per IP |
| Persistence | JSON files in `data/`, loaded into memory at startup and written back on every change |
| Frontend | Vanilla HTML, CSS and JavaScript (ES modules); no framework and no build step |
| Typography | [Exo 2](https://fonts.google.com/specimen/Exo+2), self-hosted as `.woff2` |
| Tests | Custom end-to-end runner (`test.js`) using `node-fetch` |

---

## Getting started

### Prerequisites
- Node.js 18+ (v22 recommended)
- `openssl`, to generate a local TLS certificate

### 1. Install dependencies
```bash
npm install
```

### 2. Create a self-signed certificate
The server runs over HTTPS and reads `certs/key.pem` and `certs/cert.pem` at startup. These files are **not** in the repository, so generate your own:

```bash
mkdir -p certs && openssl req -x509 -newkey rsa:2048 -nodes -days 365 -keyout certs/key.pem -out certs/cert.pem -subj "/O=StarForge/CN=localhost"
```

### 3. Run the server
```bash
node server.js
```

| URL | Purpose |
|---|---|
| `https://localhost:3000` | The app (HTTPS) |
| `http://localhost:8081` | Redirects to the HTTPS app |

Because the certificate is self-signed, your browser will show a warning the first time. Accept it to continue.

### 4. Log in
The first time the server starts, it creates a default admin account if none exists:

| Username | Password |
|---|---|
| `admin` | `admin` |

> ⚠️ Change this password from the Profile page (or replace the account) before exposing the server anywhere.

---

## Server console commands

While `server.js` is running, you can type these commands into its terminal:

| Command | Effect |
|---|---|
| `makeadmin <username>` | Gives a user admin rights (they need to log in again to pick it up) |
| `demote <username>` | Removes a user's admin rights |
| `shutdown` | Saves all data to disk and exits cleanly |

---

## Project structure

```
.
├── server.js              # Entry point: middleware, routers, HTTPS + redirect servers, console commands
├── persist_module.js      # In-memory state + JSON file persistence + core business operations
├── modules/               # Express routers, one per feature
│   ├── checkAuth.js       #   checkAuth / checkAdmin middleware, /session, /navbar
│   ├── login_server.js    #   /login, /logout
│   ├── register_server.js #   /register
│   ├── store_server.js    #   /products
│   ├── cart_server.js     #   /cart/*
│   ├── payment_server.js  #   /pay
│   ├── myitems_server.js  #   /myitems/load
│   ├── cargo_server.js    #   /cargo/*
│   ├── shiphangar_server.js # /ship/*  (decay & pricing formulas live here)
│   ├── market_server.js   #   /market/load, /auction/*
│   ├── profile_server.js  #   /profile/*
│   └── admin_server.js    #   /admin/*
├── data/                  # JSON "database" (see Data model)
├── certs/                 # Local TLS key/cert (git-ignored; generate your own)
├── public/                # Static frontend served by Express
│   ├── *.html             #   One page per feature (index, store, cart, checkout, payment, …)
│   ├── js/                #   Page scripts; navbar.js & theme.js are shared by every page
│   ├── css/               #   common.css + per-page stylesheets
│   ├── img/               #   Product, cargo, hero and hangar artwork
│   ├── svg/               #   Logo and credit-icon (light/dark variants)
│   ├── fonts/             #   Exo 2
│   ├── readme.html        #   In-app project readme (course submission)
│   └── llm.html           #   Disclosure of LLM-assisted work
└── test.js                # End-to-end API test suite
```

---

## Data model

The server reads every file in `data/` into memory when it starts. Any file that's missing is created with an empty default.

| File | Shape | Contents |
|---|---|---|
| `users.json` | `{ [username]: { password, vessel, phone, DoB, email, credits, isAdmin } }` | Accounts (bcrypt-hashed passwords) |
| `products.json` | `{ [id]: { title, description, price, image } }` | Store catalog |
| `carts.json` | `{ [username]: [productId, …] }` | Current cart per user |
| `purchases.json` | `{ [username]: [{ date, items: [title, …], cost }] }` | Purchase history (titles are stored, not IDs, so history still makes sense after a product is deleted) |
| `cargo_items.json` | `{ [id]: { title, description, rarity, price, quantityRange, image } }` | Cargo loot table |
| `cargo_users.json` | `{ [username]: { unloadAvailable, items: { [id]: qty } } }` | Each user's cargo hold |
| `ships.json` | `{ [username]: { [part]: { repaired: "YYYY-MM-DD", level } } }` | Hangar state |
| `auctions.json` | `[{ id, title, description, currentBid, currentBidder, endTime, auctionCreator, isOpen }]` | Market auctions |
| `activity_log.json` | `[{ datetime, username, action }]` | Audit log shown in the admin panel |

---

## API reference

Every endpoint uses JSON. 🔒 means you must be logged in (otherwise `401`). 🛡️ means you must be an admin (otherwise `403`).

### Auth & session
| Method | Path | | Description |
|---|---|---|---|
| POST | `/register` | | Create an account `{ username, password, vessel, phone, dateOfBirth, email }` |
| POST | `/login` | | `{ username, password, remember }`; the username is case-insensitive |
| GET | `/logout` | | Destroy the session and redirect to the store |
| GET | `/session` | 🔒 | `{ username, isAdmin }` |
| GET | `/navbar` | 🔒 | `{ username, isAdmin, credits, cart }` for the shared header |

### Store, cart & payment
| Method | Path | | Description |
|---|---|---|---|
| GET | `/products` | | List the catalog |
| POST | `/cart/add` | 🔒 | `{ productId }`; returns `409` if it's already in the cart |
| DELETE | `/cart/:id` | 🔒 | Remove a product from the cart |
| GET | `/cart-load` | 🔒 | Products currently in the cart |
| POST | `/pay` | 🔒 | `{ method: "card" \| "credits", items, cost }`; the server recalculates the total and rejects it if it doesn't match |
| GET | `/myitems/load` | 🔒 | Purchase history |

### Cargo
| Method | Path | | Description |
|---|---|---|---|
| GET | `/cargo/load-log` | 🔒 | Current cargo hold |
| POST | `/cargo/unload` | 🔒 | Roll new loot (`429` if you already unloaded this visit) |
| POST | `/cargo/sell` | 🔒 | `{ itemId }`: sell every unit of that item |
| POST | `/cargo/sellAll` | 🔒 | Sell everything in the hold |

### Ship Hangar
| Method | Path | | Description |
|---|---|---|---|
| GET | `/ship/telemetry` | 🔒 | Each part's condition, level, repair price and upgrade price |
| POST | `/ship/repair` | 🔒 | `{ part }`: restore the part to 100% |
| POST | `/ship/upgrade` | 🔒 | `{ part }`: +1 level (needs 100% condition; max level 3) |

### Market
| Method | Path | | Description |
|---|---|---|---|
| GET | `/market/load` | 🔒 | Open auctions (expired ones are flagged `pendingAdmin`) |
| POST | `/auction/post` | 🔒 | `{ title, description, currentBid, endTime }` |
| POST | `/auction/bid` | 🔒 | `{ auctionId, amount }` |
| POST | `/auction/close` | 🛡️ | `{ auctionId }`: settle an expired auction |

### Profile
| Method | Path | | Description |
|---|---|---|---|
| GET | `/profile/load` | 🔒 | Profile details |
| POST | `/profile/edit` | 🔒 | `{ field, value }` or, for a password, `{ field: "password", existing, new }` |

### Admin
| Method | Path | | Description |
|---|---|---|---|
| GET | `/admin/log/load` | 🛡️ | Full activity log |
| GET | `/admin/product/get?title=` | 🛡️ | Find a product by its exact title (case-insensitive) |
| POST | `/admin/product/add` | 🛡️ | `{ title, description, price, url }` |
| DELETE | `/admin/product/delete/:id` | 🛡️ | Delete a product (it's also removed from every cart) |

---

## Security

- **HTTPS everywhere:** port 8081 only redirects to the TLS server on port 3000.
- **Hashed passwords:** bcrypt with a per-password salt. Password policy: at least 8 characters, with upper- and lower-case letters, a digit, and one of `!@#$%^&*`. It's enforced on both the client and the server.
- **Server-side authorization:** `checkAuth` / `checkAdmin` middleware protects every private route. Protected pages also run `checkProtected.js` to redirect visitors who aren't logged in.
- **Server-calculated prices:** `/pay` recalculates the total from the server's catalog, checks that every item is actually in your cart, and rejects any mismatch, so tampered prices from the client are refused.
- **Rate limiting:** 200 requests per 15 minutes per IP to slow down brute-force and DoS attempts.
- **Activity audit log:** logins, failed logins, purchases and profile changes are all recorded.
- **Session cookies** are `httpOnly`, and their lifetime depends on "Remember me".

> **Note for deployment:** the session secret is set in `server.js`, and the TLS key is generated locally. Before running this anywhere public, move the secret into an environment variable, use a real certificate, and set `cookie.secure: true`.

---

## Testing

`test.js` is an end-to-end suite with **49 tests**, grouped A–K: auth, cart and checkout, purchase history, cargo, ship hangar, market, profile, admin, malformed input, logout, and the DoS rate limit. It:

1. Backs up `data/`,
2. Starts `node server.js` as a child process,
3. Runs every test in order against `https://localhost:3000` and prints ✅ / ❌ for each,
4. Shuts down the server and restores `data/`, so the run leaves nothing behind.

```bash
node test.js
```

Add `--quiet` to hide the server's own logs.

---

## Credits and AI usage

- **Design & development:** Eden Tsarfaty
- **Font:** Exo 2 by Natanael Gama (SIL Open Font License)
- **AI assistance:** ChatGPT helped plan the roadmap, write the first HTML skeletons, review code, debug, and generate `test.js`. It also produced the creative assets: the hero background, logo, product and cargo artwork, item names and descriptions, and the color palette. The full disclosure is in [`public/llm.html`](public/llm.html) (also linked in the site footer).

The in-app [`readme.html`](public/readme.html) includes the original course-submission Q&A.
