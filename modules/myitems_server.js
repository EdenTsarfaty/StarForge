import express from "express";
import { checkAuth } from "./checkAuth.js";
import { purchases } from "../persist_module.js";

const router = express.Router();

router.get('/myitems/load', checkAuth, (req, res) => {
  try {
    const username = req.session.user;
    const userPurchases = purchases[username] || []; 
    res.json( userPurchases );
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal server error");
  }
});

export default router;