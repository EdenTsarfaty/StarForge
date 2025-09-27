import express from "express";
import { checkAuth } from "./checkAuth.js";
import { checkout, recordActivity } from "../persist_module.js";

const router = express.Router();

router.get("/payment", checkAuth);

router.post("/pay", checkAuth, (req, res) => {
    const username = req.session.user;
    try {
        if (req.body.method === "credits") {}
        checkout(username, req.body.items, req.body.cost);
        recordActivity((new Date()).toISOString(), username, "Purchase");
        res.send("Payment successful");
    } catch (err) {
        res.status(500).send(err);
    }

});

export default router;