import express from "express";
import bcyrpt from "bcrypt";
import { users } from "../persist_module.js";

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password, remember } = req.body;
  const user = users[username];
  if (!user) {
    return res.status(401).send("Invalid credentials");
  }

  const passMatch = await bcyrpt.compare(password, user.password);
  if (!passMatch) {
    return res.status(401).send("Invalid credentials");
  }
  req.session.user = username;
  if (remember) {
    req.session.cookie.maxAge = 12 * 24 * 60 * 60 * 1000; // 12 days
  } else {
    req.session.cookie.maxAge = 30 * 60 * 1000; // 30 minutes
  }

  res.redirect('/store.html');
  // TODO: Log for activity log
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