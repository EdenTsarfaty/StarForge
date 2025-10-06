import readline from "readline";
import express from "express";
import session from "express-session";
import fs from "fs";
import http from "http";
import https from "https";
import * as persist from "./persist_module.js";
import loginRoutes from "./modules/login_server.js";
import registerRoutes from "./modules/register_server.js";
import checkSession from "./modules/checkAuth.js";
import storeRoutes from "./modules/store_server.js";
import cartRoutes from "./modules/cart_server.js";
import paymentRoutes from "./modules/payment_server.js";
import adminRoutes from "./modules/admin_server.js";
import myitemsRoutes from "./modules/myitems_server.js";
import cargoRoutes from "./modules/cargo_server.js";
import shipRoutes from "./modules/shiphangar_server.js";
import marketRoutes from "./modules/market_server.js";
import profileRoutes from "./modules/profile_server.js";
import rateLimit from "express-rate-limit";

const app = express();
const HTTPSPORT = 3000;
const HTTPPORT = 8081;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.use(session({
  secret: '71175dc2719847cd8886fed79b744048',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true
  }
}));

// limit each IP to 200 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
});

app.use(apiLimiter);

await persist.loadAll();

app.use('/', loginRoutes);
app.use('/', registerRoutes);
app.use('/', checkSession);
app.use('/', storeRoutes);
app.use('/', cartRoutes);
app.use('/', paymentRoutes);
app.use('/', adminRoutes);
app.use('/', myitemsRoutes);
app.use('/', cargoRoutes);
app.use('/', shipRoutes);
app.use('/', marketRoutes);
app.use('/', profileRoutes);

const options = {
  key: fs.readFileSync("./certs/key.pem"),
  cert: fs.readFileSync("./certs/cert.pem")
};

https.createServer(options, app).listen(HTTPSPORT, () => {
  console.log(`HTTPS server running at https://localhost:${HTTPSPORT}`);
});

http.createServer((req, res) => {
  const host = req.headers.host.replace(/:\d+$/, "");
  const redirectURL = `https://${host}:${HTTPSPORT}${req.url}`;

  res.writeHead(301, { Location: redirectURL });
  res.end();
}).listen(HTTPPORT, () => {
  console.log(`HTTP redirect server running at http://localhost:${HTTPPORT}`);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on("line", async (input) => {
  const [cmd, arg] = input.trim().split(" ");

  if (cmd === "makeadmin") {
    const username = arg;
    if (!username) {
      return console.log("Usage: makeadmin <username>");
    }
    if (!persist.users[username]) {
      return console.log(`User ${username} not found`);
    }
    persist.users[username].isAdmin = true;
    await persist.saveUsers();
    console.log(`${username} is now an admin.`);
  }

  
  if (cmd === "demote") {
    const username = arg;
    if (!username) {
      return console.log("Usage: demote <username>");
    }
    if (!persist.users[username]) {
      return console.log(`User ${username} not found`);
    }
    persist.users[username].isAdmin = false;
    await persist.saveUsers();
    console.log(`${username} is now a user.`);
  }

  if (cmd === "shutdown") {
    console.log("Saving all data...");
    await persist.saveAll();
    console.log("Save successful");
    process.exit(0);
  }
});