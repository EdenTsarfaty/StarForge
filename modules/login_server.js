import express from "express";
import bcrypt from "bcrypt";
import { recordActivity, users, cargo } from "../persist_module.js";

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password, remember } = req.body;

    // find matching username ignoring case
    const userKey = Object.keys(users).find(key => key.toLowerCase() === username.toLowerCase());

    const user = userKey ? users[userKey] : null;

    if (!user) {
      await recordActivity(new Date().toISOString(), username, "Bad Login (username)");
      return res.status(401).send("Invalid credentials");
    }

    const passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch) {
      await recordActivity(new Date().toISOString(), username, "Bad Login (password)");
      return res.status(401).send("Invalid credentials");
    }
    req.session.user = userKey;
    req.session.isAdmin = (user.isAdmin === true);
    if (remember) {
      req.session.cookie.maxAge = 12 * 24 * 60 * 60 * 1000; // 12 days
    } else {
      req.session.cookie.maxAge = 30 * 60 * 1000; // 30 minutes
    }

    await recordActivity(new Date().toISOString(), username, "Login");
    cargo[username].unloadAvailable = true;
    res.status(200).send("Login successful");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal server error:", err);
  }
});

router.get('/logout', async (req, res) => {
  try {
    const username = req.session.user;
    req.session.destroy(async err => {
      if (err) {
        console.error(err);
        return res.status(500).send("Could not log out");
      }
      res.clearCookie('connect.sid');
      await recordActivity(new Date().toISOString(), username, "Logout");
      res.redirect("store.html");
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal server error:", err);
  }
});

export default router;