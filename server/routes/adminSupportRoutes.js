// routes/adminSupport.js
const express = require("express");
const router = express.Router();
const adminSupportController = require("../controllers/adminSupportController");
const { verifyAdmin } = require("../middleware/authMiddleware");

// Apply admin authentication to all routes
router.use(verifyAdmin);

// Get all contact messages with filters
router.get("/messages", adminSupportController.getContactMessages);

// Get message by ID
router.get("/messages/:id", adminSupportController.getMessageById);

// Update message status
router.patch("/messages/:id/status", adminSupportController.updateMessageStatus);

// Delete message
router.delete("/messages/:id", adminSupportController.deleteMessage);

// Send reply to message
router.post("/messages/:id/reply", adminSupportController.sendReply);

// Get reply history
router.get("/messages/:id/replies", adminSupportController.getReplyHistory);

// Bulk update statuses
router.patch("/messages/bulk-status", adminSupportController.bulkUpdateStatus);

// Get message statistics
router.get("/stats", adminSupportController.getMessageStats);

module.exports = router;