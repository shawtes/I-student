const express = require("express");
const cors = require("cors");

const app = express();
const db = require("./db");

const bcrypt = require("bcrypt");

app.use(express.json());

// Mock in-memory "database"
const users = [];

// Registration route
app.post("/register", async (req, res) => {
    const { first_name, last_name, email, password, role } = req.body;

    if (!first_name || !last_name || !email || !password || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Check if email already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = { id: users.length + 1, first_name, last_name, email, password_hash, role };
    users.push(newUser);

    res.status(201).json({ message: "User registered successfully", user: { id: newUser.id, email, role } });
});

const session = require("express-session");

// Session middleware (place near top, before routes)
app.use(
  session({
    secret: "your_secret_key", // change this in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set true only with HTTPS
  })
);

// Login route
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
    }

  // Look for user
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
    return res.status(401).json({ error: "Invalid email or password" });
    }

    // Save user info
    req.session.user = { id: user.id, email: user.email, role: user.role };

    res.json({ message: "Login successful", user: req.session.user });
});

// Logout route
app.post("/logout", (req, res) => {
    req.session.destroy(err => {
    if (err) return res.status(500).json({ error: "Could not log out" });
    res.json({ message: "Logout successful" });
    });
});

db.query("SELECT 1 + 1 AS result")
    .then(([rows]) => {
    console.log("MySQL test query:", rows[0].result);
    })
    .catch(err => {
    console.error("MySQL error:", err);
    });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.listen(5050, () => {
    console.log("Server running on port 5050");
});