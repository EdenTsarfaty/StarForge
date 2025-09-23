import express from "express";
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

export default router;