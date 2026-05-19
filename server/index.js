const cors = require('cors');
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Notification = require('./models/Notification');
const User = require('./models/User'); // Path to your User model
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Secret key used to sign and verify JSON Web Tokens (JWT)
const JWT_SECRET = "your_super_secret_key_for_saas_123";

const app = express();
app.use(cors());
app.use(express.json());

// Linking to public files (HTML, CSS and JS)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Connecting to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
    family: 4 // Forces IPv4 to prevent connection errors
})
    .then(() => console.log('🚀 We are connected to MongoDB Atlas!'))
    .catch(err => console.error('❌ Connection error:', err));

// NOVA RUTA: Ovde proveravamo lozinku sa login.html stranice
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const secretPassword = "saas516";

    if (password && password.trim() === secretPassword) {
        return res.status(200).json({ message: "Login successful" });
    } else {
        return res.status(401).json({ message: "Access denied. Incorrect password!" });
    }
});

// 1. API route: Gets the latest notification for a SPECIFIC client using apiKey
app.get('/api/last-purchase', async (req, res) => {
    try {
        let { apiKey } = req.query; // Reads ?apiKey=something from the URL

        if (!apiKey) {
            return res.status(400).json({ message: "Missing apiKey parameter" });
        }

        // Čistimo razmake za svaki slučaj
        apiKey = apiKey.trim();

        // Database finds the latest notification that matches this specific apiKey
        const lastNotif = await Notification.findOne({ apiKey: apiKey }).sort({ createdAt: -1 });
        res.json(lastNotif);
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

// ROUTE FOR NEW CLIENT REGISTRATION
const crypto = require('crypto'); 

app.post('/api/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please provide both email and password." });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ error: "A user with this email already exists." });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 🔑 GENERIŠEMO UNIKATNI API KLJUČ (npr. client_a7f3b2...)
        const generatedApiKey = 'client_' + crypto.randomBytes(16).toString('hex');

        const newUser = new User({
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            apiKey: generatedApiKey // <-- OBAVEZNO ubacujemo ključ u novog korisnika!
        });

        await newUser.save();

        res.status(201).json({
            message: "Registration successful!",
            apiKey: newUser.apiKey // Sada će ovo 100% poslati pravi ključ frontendu!
        });

    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

// ROUTE FOR EXISTING CLIENT LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please provide both email and password." });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password." });
        }

        const token = jwt.sign(
            { userId: user._id, apiKey: user.apiKey },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Login successful!",
            token: token,
            apiKey: user.apiKey
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

// 2. Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 3. API route: Adds a new purchase linked to a specific client apiKey
app.post('/api/add-purchase', async (req, res) => {
    const clientPassword = req.headers['authorization'];
    const secretPassword = "saas516";

    if (!clientPassword || clientPassword.trim() !== secretPassword) {
        return res.status(401).json({ message: "Access denied. Incorrect password!" });
    }

    try {
        // Uzimamo podatke iz forme i čistimo sve skrivene razmake pre upisa u bazu
        const cleanedData = {
            apiKey: req.body.apiKey ? req.body.apiKey.trim() : '',
            customerName: req.body.customerName ? req.body.customerName.trim() : '',
            city: req.body.city ? req.body.city.trim() : '',
            productName: req.body.productName ? req.body.productName.trim() : '',
            languageText: req.body.languageText ? req.body.languageText.trim() : '',
            bgColor: req.body.bgColor,
            textColor: req.body.textColor
        };

        const newNotif = new Notification(cleanedData);
        await newNotif.save();
        res.status(201).json({ message: "Added successfully!" });
    } catch (err) {
        res.status(500).send("Error saving.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ The server is running on http://localhost:${PORT}`);
});