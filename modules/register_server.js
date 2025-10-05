import express from "express";
import { addUser, recordActivity, users, cargo, saveCargo } from "../persist_module.js";

const router = express.Router();

function validatePassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*]/.test(password)
  );
}

router.post('/register', async (req, res) => {
  try {
    const { username, password, vessel, phone, dateOfBirth, email } = req.body;
    if (username === "") {
      return res.status(400).send("Username can't be empty");
    }
    
    if (users.hasOwnProperty(username)) {
      return res.status(400).send(`Username ${username} taken`);
    }

    if (!validatePassword(password)) {
      return res.status(400).send("Password does not meet requirements");
    }

    cargo[username] = { unloadAvailable: true, items: {} };

    try {
      await addUser(username, password, vessel, phone, dateOfBirth, email);
      await saveCargo();
    }
    catch (err) {
      console.log(err);
      res.status(500).send("Please try again later");
    }

    await recordActivity(new Date().toISOString(), username, "Created");
    res.status(200).send("User created successfully");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal server error");
  }
});


export default router;