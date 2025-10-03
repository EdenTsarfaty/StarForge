import express from "express";
import { checkAuth } from "./checkAuth.js";
import { users, saveUsers, recordActivity } from "../persist_module.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.get('/profile/load', checkAuth, (req, res) => {
    const username = req.session.user;
    const user = users[username];
    if (user) {
        return res.json({username:username, ...user})
    }
    return res.status(404).send("User not found");
});

router.post('/profile/edit', checkAuth, async (req, res) => {
    const username = req.session.user;
    const field = req.body.field;
    const user = users[username];
    if (field === "password") {
        const existingPass = req.body.existing;
        const newPass = req.body.new;
        await handlePasswordUpdate(user, existingPass, newPass, res);
    } else {
        const value = req.body.value;
        
        // No checks for values (simplicity)
        user[field] = value;

        res.sendStatus(200);
    }
    await recordActivity(new Date().toISOString(), username, `Changed ${field}`);
    saveUsers();
    return;

});

async function handlePasswordUpdate(user, existingPass, newPass, res) {
    const passMatch = await bcrypt.compare(existingPass, user.password);
    if (!passMatch) {
        res.status(401).send("Existing password doesn't match");
        return;
    }
    if (
        /[A-Z]/.test(newPass) &&
        /[a-z]/.test(newPass) &&
        /\d/.test(newPass) &&
        /[!@#$%^&*]/.test(newPass) &&
        newPass.length >= 8
    ) {
        const hashedPassword = await bcrypt.hash(newPass, 10);
        user.password = hashedPassword;        
        res.sendStatus(200);
    } else {
        res.send(400).send("Password does not meet policy");
    }
}

export default router;