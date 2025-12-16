// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    mobile: {
        type: String,
        required: false,
        sparse: true
    },
    password: {
        type: String,
        required: false
    },
    profilePicture: {
        type: String,
        required: false
    },
    githubId: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    googleId: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    otp: {
        type: String,
        required: false,
    },
    otpExpiresAt: {
        type: Date,
        required: false,
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PricingPlan",
        default: null
    },
    planName: {
        type: String,
        default: "Free"
    },
    billingCycle: {
        type: String,
        enum: ["monthly", "annual", null],
        default: null
    },
    subscriptionStatus: {
        type: String,
        enum: ["active", "inactive", "cancelled", "expired"],
        default: "active"
    },
    planExpiry: {
        type: Date,
        default: null
    },
    
    // Usage Tracking
    auditsUsed: {
        type: Number,
        default: 0
    },
    keywordReportsUsed: {
        type: Number,
        default: 0
    },
    businessNamesUsed: {
        type: Number,
        default: 0
    },
    keywordChecksUsed: {
        type: Number,
        default: 0
    },
    keywordScrapesUsed: {
        type: Number,
        default: 0
    },
    
    // Limits (will be populated from plan)
    maxAuditsPerMonth: {
        type: Number,
        default: 5
    },
    maxKeywordReportsPerMonth: {
        type: Number,
        default: 10
    },
    maxBusinessNamesPerMonth: {
        type: Number,
        default: 5
    },
    maxKeywordChecksPerMonth: {
        type: Number,
        default: 10
    },
    maxKeywordScrapesPerMonth: {
        type: Number,
        default: 5
    },
    
    // Reset tracking
    lastUsageReset: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add index for mobile field to be sparse (allows multiple null values)
UserSchema.index({ mobile: 1 }, { sparse: true });

// Password hashing middleware
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to check password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);
module.exports = User;