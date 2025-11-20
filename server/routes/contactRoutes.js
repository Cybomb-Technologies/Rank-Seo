// routes/contactRoutes.js
const express = require("express");
const nodemailer = require("nodemailer");
const ContactMessage = require("../models/contactMessage.js");
const auth = require("../middleware/auth.js"); // Regular auth middleware for users

const router = express.Router();

// Contact route - for users to submit support messages
router.post("/", auth, async (req, res) => {
  try {
    console.log("Received /contact request");
    console.log("Request body:", req.body);
    console.log("Authenticated user:", req.user);

    const { subject, message, priority, type } = req.body;

    // Validate input
    if (!subject || !message) {
      console.error("Validation error: missing required fields");
      return res.status(400).json({ success: false, error: "Subject and message are required" });
    }

    // Check if user exists from middleware
    if (!req.user || !req.user.id) {
      console.error("Auth error: req.user is missing", req.user);
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Fetch user details from database
    const User = require("../models/User.js");
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.error("User not found in database");
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Use user data for the contact message
    let contactDoc;
    try {
      contactDoc = await ContactMessage.create({
        subject,
        message,
        priority: priority || "medium",
        type: type || "general",
        user: req.user.id,
        userEmail: user.email,
        userName: user.name || user.username || "User"
      });
      console.log("Saved to DB:", contactDoc);
    } catch (dbErr) {
      console.error("DB save error:", dbErr);
      return res.status(500).json({ success: false, error: "Failed to save message to database" });
    }

    // Configure Nodemailer (only if SMTP credentials are available)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        // Send email with complete user information
        await transporter.sendMail({
          from: `"RankSEO Support" <${process.env.SMTP_USER}>`,
          to: process.env.SMTP_USER,
          replyTo: user.email,
          subject: `[${(priority || 'medium').toUpperCase()}] ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                New Support Message
              </h2>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>From:</strong> ${user.name || user.username || "User"} &lt;${user.email}&gt;</p>
                <p><strong>Type:</strong> ${(type || 'general').charAt(0).toUpperCase() + (type || 'general').slice(1)}</p>
                <p><strong>Priority:</strong> <span style="color: ${
                  priority === 'urgent' ? '#dc3545' : 
                  priority === 'high' ? '#fd7e14' : 
                  priority === 'medium' ? '#ffc107' : '#28a745'
                }">${(priority || 'medium').charAt(0).toUpperCase() + (priority || 'medium').slice(1)}</span></p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <div style="background: #fff; padding: 15px; border: 1px solid #dee2e6; border-radius: 5px;">
                <h3 style="color: #333; margin-top: 0;">Message:</h3>
                <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
              </div>
              <div style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 5px;">
                <p style="margin: 0; font-size: 14px; color: #6c757d;">
                  Message ID: ${contactDoc._id}<br>
                  User ID: ${req.user.id}
                </p>
              </div>
            </div>
          `,
          text: `
New Support Message
==================

From: ${user.name || user.username || "User"} <${user.email}>
Type: ${type || 'general'}
Priority: ${priority || 'medium'}
Subject: ${subject}
Submitted: ${new Date().toLocaleString()}

Message:
${message}

---
Message ID: ${contactDoc._id}
User ID: ${req.user.id}
          `
        });
        console.log("Email sent successfully");
      } catch (mailErr) {
        console.error("Email send error:", mailErr);
        // Don't return error here - the message was saved to DB successfully
        console.log("Message saved to DB but email failed to send");
      }
    } else {
      console.log("SMTP credentials not configured - skipping email send");
    }

    res.json({ 
      success: true, 
      message: "Support message submitted successfully",
      messageId: contactDoc._id
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get user's messages route - REMOVED connectDB call since MongoDB is already connected
router.get("/my-messages", auth, async (req, res) => {
  try {
    // No need to call connectDB here since MongoDB is already connected globally
    const messages = await ContactMessage.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('subject message priority type status createdAt');
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching user messages:", error);
    res.status(500).json({ success: false, error: "Failed to fetch messages" });
  }
});

module.exports = router;