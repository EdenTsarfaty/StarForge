import express from "express";
import { checkAuth } from "./checkAuth.js";
import { carts, products, updateCart, recordActivity } from "../persist_module.js";

const router = express.Router();

router.get('/cart', checkAuth);

router.post('/cart/add', checkAuth, (req, res) => {
  const username = req.session.user;
  const productId = req.body.productId;
  let cart = carts[username] || [];
  if (!cart.includes(productId)) {
    cart.push(productId);
    try {
        updateCart(username, cart);

        recordActivity( new Date().toISOString(), username, `Added to cart (ID: ${productId})` );
        res.json({ cartCount: cart.length });
    } catch (err) {
        console.error("Internal error: ", err);
        res.status(500).send(`Internal error: ${err}`);
    }
  } else {
    res.status(409).send(`${products[productId].title} already in cart`);
  }
});

router.delete('/cart/:id', checkAuth, (req, res) => {
  const username = req.session.user;
  const productId = req.params.id;
  try {
    let cart = carts[username] || [];
    cart = cart.filter(id => id !== productId);
    updateCart(username, cart);
    res.send(`${products[productId].title} removed from cart`);
  } catch (err) {
    console.error("Internal error: ", err);
    res.status(500).send(`Internal error: ${err}`);
  }
});

router.get('/cart-load', checkAuth, (req, res) => {
  const username = req.session.user;
  const cart = carts[username] || []; 
  const productsInCart = cart.map(id => ({id, ...products[id]}));
  res.json( productsInCart );
});

export default router;