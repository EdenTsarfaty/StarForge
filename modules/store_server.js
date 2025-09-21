import express from "express";
import { products } from "../persist_module.js";

const router = express.Router();

router.get('/products', (req, res) => {
    //Array destructuring for frontend
    const productArray = Object.entries(products).map(([id, data]) => ({id, ...data}));
    res.json(productArray);
});

export default router;