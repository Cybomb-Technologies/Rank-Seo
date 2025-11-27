// server/models/Admin.js
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true,
      lowercase: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    plainPassword: {
      type: String,
      required: false // Store plain text password for admin visibility
    }
  },
  { 
    timestamps: true 
  }
);

// Index for better query performance
adminSchema.index({ email: 1 });
adminSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Admin", adminSchema);