// models/contactMessage.js
const mongoose = require("mongoose");

const ReplySchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  emailMessageId: {
    type: String,
    default: null
  }
});

const ContactMessageSchema = new mongoose.Schema(
  {
    subject: { 
      type: String, 
      required: true,
      trim: true
    },
    message: { 
      type: String, 
      required: true,
      trim: true
    },
    priority: { 
      type: String, 
      enum: ["low", "medium", "high", "urgent"], 
      default: "medium" 
    },
    type: { 
      type: String, 
      enum: ["technical", "billing", "general", "feature"], 
      default: "general" 
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    userName: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved", "closed"],
      default: "new"
    },
    replies: [ReplySchema]
  },
  { 
    timestamps: true 
  }
);

// Index for better query performance
ContactMessageSchema.index({ createdAt: -1 });
ContactMessageSchema.index({ status: 1 });
ContactMessageSchema.index({ priority: 1 });
ContactMessageSchema.index({ type: 1 });
ContactMessageSchema.index({ user: 1 });

module.exports = mongoose.model("ContactMessage", ContactMessageSchema);