import express from "express";
import { users, carts } from "../persist_module.js";
const router = express.Router();

export function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized"); 
  }
  next();
}

export function checkAdmin(req, res, next) {
  if (!req.session.user || !req.session.isAdmin) {
    return res.status(403).send('Forbidden'); 
  }
  next();
}

router.get("/session", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ username: req.session.user, isAdmin: !!req.session.isAdmin });
});

router.get("/navbar", (req, res) => {
  const username = req.session.user;
  if (!username) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ username,
    isAdmin: !!req.session.isAdmin,
    credits: users[username]?.credits || 0,
    cart: carts[username]?.length || 0
   });
})

export default router;