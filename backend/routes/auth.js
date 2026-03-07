const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
    const { first_name, last_name, email, password, role } = req.body;

    const hash = await bcrypt.hash(password, 10);

    try {
    await db.query(
        "INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
        [first_name, last_name, email, hash, role]
    );

    res.json({ message: "User created" });
    } catch (err) {
    res.status(400).json({ message: "Email already exists" });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
    );

    if (rows.length === 0) {
    return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.user = {
    id: user.user_id,
    role: user.role
    };

    res.json({ message: "Login successful" });
});

router.post("/logout", (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out" });
});

module.exports = router;