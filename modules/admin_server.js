import express from "express";
import { checkAdmin } from "./checkAuth.js";
import { activityLog, products, addProduct, removeProduct } from "../persist_module.js";

const router = express.Router();

router.get("/admin/log/load", checkAdmin, (req, res) => {
    res.json( activityLog );
});

router.get('/admin/product/get', checkAdmin, (req, res) => {
    try {
        const query = req.query.title.toLowerCase();
        const match = Object.entries(products).find(([id, p]) =>
            p.title.toLowerCase() === query
        );
        if (match) {
            const [id, product] = match;
            res.json({ id, ...product });
        } else {
            return res.sendStatus(404);
        }
    } catch (err) {
        return res.status(500).send("Internal server error:", err);
    }
});

router.delete("/admin/product/delete/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;

        if (!products[id]) {
            return res.status(404).send("Product not found");
        }

        try {
            await removeProduct(id);
            res.sendStatus(200);
        } catch (err) {
            console.error("Error deleting product:", err);
            res.status(500).send("Internal server error");
        }
    } catch (err) {
        return res.status(500).send("Internal server error:", err);
    }
});

router.post("/admin/product/add", checkAdmin, async (req, res) => {
    try {
        const title = req.body.title;
        if (!title || title.trim() === "") {
            return res.status(400).send("Title required for new product");
        }
        const price = Number(req.body.price);
        if (!Number.isFinite(numericPrice) || price < 0) {
            return res.status(400).send("Price must be non-negative integer");
        }
        const description = req.body.description;
        //Trust admin to view image is ok before sending + frontend
        const img_url = req.body.url;
        await addProduct(title, description, price, img_url);
        return res.sendStatus(200);
    } catch (err) {
        return res.status(500).send("Internal server error:", err);
    }
})

export default router;