import express from "express";
import { checkAuth } from "./checkAuth.js";
import { checkout, recordActivity, carts, products, users } from "../persist_module.js";

const router = express.Router();

router.post("/pay", checkAuth, async (req, res) => {
  const username = req.session.user;

  try {
    const { method, items: selectedIds, cost: clientCost } = req.body;

    if (method !== "credits" && method !== "card") {
      return res.status(400).send("Unsupported payment method");
    }

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res.status(400).send("No items selected for purchase");
    }

    const userCart = carts[username] || [];
    const validIds = selectedIds.filter(id => products[id]); //verifies product ids exist
    const allInCart = validIds.every(id => userCart.includes(id)); //verifies that product ids are in user cart

    if (!allInCart) {
      return res.status(400).send("One or more items are not in your cart");
    }

    let sum = 0;
    for (const id of validIds) {
        sum = sum + products[id]?.price || 0; //Calculates the total price based on server prices
    }

    if (serverCost !== clientCost) {
      return res.status(400).send("Price mismatch, please refresh and try again");
    }

    if (method === "credits" && users[username].credits < serverCost) {
      return res.status(400).send("Not enough credits for this purchase");
    }

    await checkout(username, validIds, serverCost, method);
    await recordActivity(new Date().toISOString(), username, "Purchase");

    res.send("Payment successful");
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).send("Internal server error");
  }
});

export default router;