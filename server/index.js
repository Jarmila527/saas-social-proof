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
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please provide both email and password." });
        }

        // Pronalazimo korisnika u bazi
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password." });
        }

        // Poredimo unetu šifru sa hešovanom šifrom iz baze pomoću bcrypt-a
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password." });
        }

        // Generišemo JWT token (koristimo JWT_SECRET iz okruženja ili fallback)
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'super-tajna-sifra',
            { expiresIn: '24h' }
        );

        // Vraćamo token i automatski njegov API ključ frontendu!
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

// 1. API route: Gets the latest notification for a SPECIFIC client using apiKey
app.get('/api/last-purchases', async (req, res) => { // Promenio sam naziv u "last-purchases" (množina)
    try {
        let { apiKey } = req.query;  // Reads ?apiKey=something from the URL

        if (!apiKey) {
            return res.status(400).json({ message: "Missing apiKey parameter" });
        }

        apiKey = apiKey.trim();

        // 1. Koristimo .find() umesto .findOne() jer želimo niz (listu)
        // 2. Dodajemo .limit(5) da dobijemo samo poslednjih 5
        const notifications = await Notification.find({ apiKey: apiKey })
            .sort({ createdAt: -1 })
            .limit(5);

        // Vraćamo niz notifikacija
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

// ROUTE FOR NEW CLIENT REGISTRATION
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body; // Sad backend prepoznaje 'name'

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists." });
        }

        const generatedApiKey = 'client_' + crypto.randomBytes(16).toString('hex');

        const newUser = new User({
            name: name,
            email: email.toLowerCase().trim(),
            password: password, // Model automatski hešuje šifru pre čuvanja
            apiKey: generatedApiKey
        });

        await newUser.save();

        res.status(201).json({
            message: "Registration successful!",
            apiKey: generatedApiKey
        });
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});


// 2. Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 3. API route: Adds a new purchase linked to a specific client apiKey
app.post('/api/add-purchase', async (req, res) => {
    try {
        // 1. Uzimamo podatke iz forme i čistimo razmake
        const cleanedData = {
            apiKey: req.body.apiKey ? req.body.apiKey.trim() : '',
            customerName: req.body.customerName ? req.body.customerName.trim() : '',
            city: req.body.city ? req.body.city.trim() : '',
            productName: req.body.productName ? req.body.productName.trim() : '',
            languageText: req.body.languageText ? req.body.languageText.trim() : '',
            bgColor: req.body.bgColor,
            textColor: req.body.textColor
        };

        // 2. Bezbednosna provera: Da li uopšte imamo API ključ?
        if (!cleanedData.apiKey) {
            return res.status(401).json({ message: "Access denied. API Key is missing!" });
        }

        // 3. Proveravamo u bazi da li taj API ključ pripada nekom korisniku
        const userExists = await User.findOne({ apiKey: cleanedData.apiKey });
        if (!userExists) {
            return res.status(401).json({ message: "Access denied. Invalid API Key!" });
        }

        // 4. Ako je ključ ispravan, pravimo novu notifikaciju i vezujemo je za tog korisnika
        const newNotif = new Notification({
            userId: userExists._id, // povezujemo kupovinu sa korisnikom koji je vlasnik vidžeta
            ...cleanedData
        });

        await newNotif.save();
        res.status(201).json({ message: "Added successfully!" });

    } catch (err) {
        console.error("Greška pri čuvanju:", err);
        res.status(500).send("Error saving.");
    }
});

// RUTA KOJU ĆE VIDŽET POZIVATI DA PREUZME PODATKE ZA PRIKAZ
app.get('/api/get-purchases', async (req, res) => {
    try {
        const { apiKey } = req.query; // Vidžet šalje ključ kroz URL (npr. ?apiKey=client_...)

        if (!apiKey) {
            return res.status(400).json({ error: "API Key is required!" });
        }
        // 1. Proveri korisnika
        const user = await User.findOne({ apiKey: apiKey.trim() });
        if (!user) return res.status(404).json({ error: "Invalid API Key" });

        // 2. Logika za ograničenje
        let query = { apiKey: apiKey.trim() };

        // Ako NIJE premium, ograniči broj notifikacija na npr. 3
        const limit = user.plan === 'premium' ? 50 : 3;

        // 🎯 Vratile smo bezbednost! Tražimo kupovine koje imaju TAČNO ovaj apiKey
        const purchases = await Notification.find({ apiKey: apiKey.trim() })
            .sort({ createdAt: -1 })
            .limit(limit);

        res.json(purchases);

    } catch (err) {
        console.error("Greška pri preuzimanju kupovina:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ The server is running on http://localhost:${PORT}`);
});