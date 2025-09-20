const express = require('express');
const fs = require("fs");
const session = require("express-session");
const pm = require("./persist_module");


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

const persist = require('./persist_module');
// persist.loadAll();

const loginRoutes = require("./modules/login_server");
app.use('/', loginRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});