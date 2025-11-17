const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: String,
        required: false
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
    default: "inactive"
  },
  planExpiry: {
    type: Date,
    default: null
  },
  maxAuditsPerMonth: {
    type: Number,
    default: 1 // Free tier limit
  },
  maxTrackedKeywords: {
    type: Number,
    default: 10 // Free tier limit
  }
}, {
    timestamps: true // This adds createdAt and updatedAt fields
});

// Remove the pre-save hook as password hashing is now handled in the controller.
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;