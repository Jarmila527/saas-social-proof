const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    apiKey: String,
    customerName: { type: String, required: true },
    city: { type: String, required: true },
    productName: { type: String, required: true },
    languageText: { type: String, required: true },
    bgColor: { type: String, default: "#ffffff" }, 
    textColor: { type: String, default: "#1a202c" },
    timeAgo: { type: String, default: "2 minutes ago" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);