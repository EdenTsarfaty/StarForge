import express from "express";
import { checkAuth } from "./checkAuth.js";
import { purchases } from "../persist_module.js";

const router = express.Router();

router.get('/myitems/load', checkAuth, (req, res) => {
  const username = req.session.user;
  const userPurchases = purchases[username] || []; 
  res.json( userPurchases );
});

export default router;