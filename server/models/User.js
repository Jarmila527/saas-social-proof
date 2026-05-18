const mongoose = require('mongoose');
const crypto = require('crypto');

// Defining the schema for our SaaS users/clients
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    apiKey: {
        type: String,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-generate a unique API key before saving a new user
userSchema.pre('save', function (next) {
    if (!this.apiKey) {
        this.apiKey = 'spw_' + crypto.randomBytes(16).toString('hex');
    }
    next();
});

module.exports = mongoose.model('User', userSchema);