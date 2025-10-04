import express from "express";
import { checkAdmin } from "./checkAuth.js";
import { activityLog, products, addProduct, removeProduct } from "../persist_module.js";

const router = express.Router();

router.get("/admin/log/load", checkAdmin, (req, res) => {
    res.json( activityLog );
});

router.get('/admin/product/get', checkAdmin, (req, res) => {
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
});

router.delete("/admin/product/delete/:id", checkAdmin, (req, res) => {
    const query = req.params.id;
    // Here assumes ID is in products cuz of frontend design, if not, nothing happens
    removeProduct(query);
    return res.sendStatus(200);
});

router.post("/admin/product/add", checkAdmin, (req, res) => {
    const title = req.body.title;
    if (!title || title === "") {
        return res.status(400).send("Title required for new product");
    }
    const price = req.body.price;
    if (!price || price < 0) {
        return res.status(400).send("Price must be non-negative integer");
    }
    const description = req.body.description;
    //Trust admin to view image is ok before sending + frontend
    const img_url = req.body.url;
    addProduct(title, description, price, img_url);
    return res.sendStatus(200);
})

export default router;