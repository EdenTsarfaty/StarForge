import express from "express";
import fs from "fs";
import session from "express-session";
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
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.use(session({
  secret: '71175dc2719847cd8886fed79b744048',
  resave: false,
  saveUninitialized: false,
}));

// limit each IP to 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});