const cors = require('cors');
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Notification = require('./models/Notification');

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

// 1. API route: Gets the latest notification for a SPECIFIC client using apiKey
app.get('/api/last-purchase', async (req, res) => {
    try {
        const { apiKey } = req.query; // Reads ?apiKey=something from the URL

        if (!apiKey) {
            return res.status(400).json({ message: "Missing apiKey parameter" });
        }

        // Database finds the latest notification that matches this specific apiKey
        const lastNotif = await Notification.findOne({ apiKey: apiKey }).sort({ createdAt: -1 });
        res.json(lastNotif);
    } catch (err) {
        res.status(500).json({ message: "Database error" });
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

    if (!clientPassword || clientPassword !== secretPassword) {
        return res.status(401).json({ message: "Access denied. Incorrect password!" });
    }

    try {
        // req.body now automatically includes the apiKey from the form
        const newNotif = new Notification(req.body);
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