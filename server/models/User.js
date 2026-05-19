const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

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
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err; 
    }
});

module.exports = mongoose.model('User', userSchema);