import express from "express";
import bcrypt from "bcrypt";
import { recordActivity, users } from "../persist_module.js";

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password, remember } = req.body;
  const user = users[username];
  if (!user) {
    recordActivity(new Date().toISOString(), username, "Bad Login (username)");
    return res.status(401).send("Invalid credentials");
  }

  const passMatch = await bcrypt.compare(password, user.password);
  if (!passMatch) {
    recordActivity(new Date().toISOString(), username, "Bad Login (password)");
    return res.status(401).send("Invalid credentials");
  }
  req.session.user = username;
  req.session.isAdmin = req.session.isAdmin = (username.isAdmin === "admin");
  if (remember) {
    req.session.cookie.maxAge = 12 * 24 * 60 * 60 * 1000; // 12 days
  } else {
    req.session.cookie.maxAge = 30 * 60 * 1000; // 30 minutes
  }

  recordActivity(new Date().toISOString(), username, "Login");
  res.redirect('/store.html');
});

router.post('/logout', (req, res) => {
  const username = req.session.user;
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).send("Could not log out");
    }
    res.clearCookie('connect.sid');
    // TODO: Log for activity log
    res.redirect('/store.html');
  });
});

export default router;