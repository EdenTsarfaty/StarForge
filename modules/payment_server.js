import express from "express";
import { checkAuth } from "./checkAuth.js";
import { checkout, recordActivity } from "../persist_module.js";

const router = express.Router();

router.get("/payment", checkAuth);

router.post("/pay", checkAuth, (req, res) => {
    const username = req.session.user;
    try {
        const method = req.body.method;
        if ( !method || (method !== "card" && method !== "credits")) {
            return res.status(400).send("Method unsupported");
        }
        checkout(username, req.body.items, req.body.cost, req.body.method);
        recordActivity((new Date()).toISOString(), username, "Purchase");
        res.send("Payment successful");
    } catch (err) {
        res.status(500).send(err);
    }

});

export default router;