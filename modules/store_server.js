import express from "express";
import { products } from "../persist_module.js";

const router = express.Router();

router.get('/products', (req, res) => {
    try {
        //Array destructuring for frontend
        const productArray = Object.entries(products).map(([id, data]) => ({id, ...data}));
        res.json(productArray);
    } catch (err) {
    console.log(err);
    return res.status(500).send("Internal server error");
    }
});

export default router;