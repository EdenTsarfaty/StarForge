import express from "express";
import { checkAuth } from "./checkAuth.js";
import { carts, products, updateCart, recordActivity } from "../persist_module.js";

const router = express.Router();

router.post('/cart/add', checkAuth, async (req, res) => {
  const username = req.session.user;
  const productId = req.body.productId;
  if (!productId || !products[productId]) {
    return res.status(400).send("Invalid product id");
  }
  let cart = carts[username] || [];
  if (!cart.includes(productId)) {
    cart.push(productId);
    try {
        await updateCart(username, cart);

        await recordActivity( new Date().toISOString(), username, `Added to cart (ID: ${productId})` );
        res.json({ cartCount: cart.length });
    } catch (err) {
        console.error("Internal error: ", err);
        res.status(500).send(`Internal error: ${err}`);
    }
  } else {
    res.status(409).send(`${products[productId].title} already in cart`);
  }
});

router.delete('/cart/:id', checkAuth, async (req, res) => {
  const username = req.session.user;
  const productId = req.params.id;
  if (!productId || !products[productId]) {
    return res.status(400).send("Invalid product id");
  }
  try {
    let cart = carts[username] || [];
    cart = cart.filter(id => id !== productId);
    await updateCart(username, cart);
    res.send(`${products[productId].title} removed from cart`);
  } catch (err) {
    console.error("Internal error: ", err);
    res.status(500).send(`Internal error: ${err}`);
  }
});

router.get('/cart-load', checkAuth, (req, res) => {
  try {
    const username = req.session.user;
    const cart = carts[username] || []; 
    const productsInCart = cart.map(id => ({id, ...products[id]}));
    res.json( productsInCart );
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal server error:", err);
  }
});

export default router;