import express from "express";
import fs from "fs";
import session from "express-session";
import * as persist from "./persist_module.js";
import loginRoutes from "./modules/login_server.js";


const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.use(session({
  secret: '123',
  resave: false,
  saveUninitialized: false,
}));

await persist.loadAll();

app.use('/', loginRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});