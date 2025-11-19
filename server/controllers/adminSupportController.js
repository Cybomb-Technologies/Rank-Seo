// controllers/adminSupportController.js
const ContactMessage = require("../models/contactMessage");

// Try to require nodemailer
let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch (error) {
  console.log('Nodemailer not available');
  nodemailer = null;
}

// Configure email transporter with your SMTP settings
const createTransporter = () => {
  // Check if SMTP credentials are properly configured
  if (!nodemailer || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('SMTP credentials not configured - emails will not be sent');
    return null;
  }

  // Use real nodemailer with your SMTP configuration
  try {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: process.env.SMTP_PORT || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } catch (error) {
    console.error('Error creating nodemailer transport:', error);
    return null;
  }
};

// Get all contact messages with filtering and pagination
exports.getContactMessages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      priority,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (type && type !== "all") {
      filter.type = type;
    }
    
    if (priority && priority !== "all") {
      filter.priority = priority;
    }
    
    if (status && status !== "all") {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Get messages with pagination and populate user data
    const messages = await ContactMessage.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email planName subscriptionStatus lastLogin')
      .populate('replies.sentBy', 'name email')
      .lean();

    // Get total count for pagination
    const total = await ContactMessage.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalMessages: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact messages"
    });
  }
};

// Get message by ID
exports.getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await ContactMessage.findById(id)
      .populate('user', 'name email planName subscriptionStatus lastLogin')
      .populate('replies.sentBy', 'name email');
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error("Error fetching message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch message"
    });
  }
};

// Update message status
exports.updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ["new", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }
    
    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
    .populate('user', 'name email')
    .populate('replies.sentBy', 'name email');
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    res.json({
      success: true,
      message: "Status updated successfully",
      updatedMessage: message
    });
  } catch (error) {
    console.error("Error updating message status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update message status"
    });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await ContactMessage.findByIdAndDelete(id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    res.json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message"
    });
  }
};

// Get message statistics
exports.getMessageStats = async (req, res) => {
  try {
    const totalMessages = await ContactMessage.countDocuments();
    
    const priorityStats = await ContactMessage.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await ContactMessage.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = await ContactMessage.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const recentMessages = await ContactMessage.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      stats: {
        total: totalMessages,
        recent: recentMessages,
        byPriority: priorityStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        byType: typeStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        byStatus: statusStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error("Error fetching message stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch message statistics"
    });
  }
};

// Send reply to contact message
exports.sendReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message: replyMessage, subject } = req.body;

    if (!replyMessage || !replyMessage.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required"
      });
    }

    // Find the original message with user data
    const originalMessage = await ContactMessage.findById(id)
      .populate('user', 'name email planName subscriptionStatus');

    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Get the receiver email from the user who created the support ticket
    const receiverEmail = originalMessage.userEmail || originalMessage.user?.email;
    
    if (!receiverEmail) {
      return res.status(400).json({
        success: false,
        message: "Cannot send reply: User email not found"
      });
    }

    // Create email content
    const emailSubject = subject || `Re: ${originalMessage.subject}`;
    const emailText = `${replyMessage}\n\n---\nOriginal Message:\n${originalMessage.message}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin-bottom: 20px; }
          .original-message { color: #6c757d; font-size: 14px; margin: 0; }
          .reply-content { white-space: pre-line; background: white; padding: 15px; border: 1px solid #e9ecef; border-radius: 5px; }
          .footer { border-top: 1px solid #e9ecef; margin-top: 20px; padding-top: 15px; color: #6c757d; font-size: 12px; }
          .signature { margin-top: 20px; padding-top: 15px; border-top: 1px solid #e9ecef; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="original-message">
            <strong>Original Message:</strong><br>
            ${originalMessage.message.replace(/\n/g, '<br>')}
          </p>
        </div>
        
        <div class="reply-content">${replyMessage.replace(/\n/g, '<br>')}</div>
        
        <div class="signature">
          <p>Best regards,<br>Support Team</p>
        </div>
        
        <div class="footer">
          <p>This is a response to your support inquiry submitted on ${new Date(originalMessage.createdAt).toLocaleDateString()}.</p>
          <p>Please do not reply directly to this email. If you need further assistance, please submit a new support ticket.</p>
        </div>
      </body>
      </html>
    `;

    // Send email
    const transporter = createTransporter();
    let emailResult = null;
    let emailSent = false;
    
    if (transporter) {
      try {
        // Verify transporter connection first
        await transporter.verify();
        console.log('✅ SMTP connection verified');

        const mailOptions = {
          from: process.env.SMTP_FROM || `Support Team <${process.env.SMTP_USER}>`,
          to: receiverEmail,
          subject: emailSubject,
          text: emailText,
          html: emailHtml
        };

        emailResult = await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log('✅ Email sent successfully via SMTP:');
        console.log('   To:', receiverEmail);
        console.log('   Subject:', emailSubject);
        console.log('   Message ID:', emailResult.messageId);
      } catch (emailError) {
        console.error('❌ SMTP Email sending failed:', emailError);
        emailSent = false;
        emailResult = { 
          messageId: 'error-' + Date.now(),
          error: emailError.message 
        };
      }
    } else {
      console.log('❌ Email not sent - SMTP not configured');
      console.log('   SMTP_USER exists:', !!process.env.SMTP_USER);
      console.log('   SMTP_PASS exists:', !!process.env.SMTP_PASS);
      emailResult = { 
        messageId: 'not-sent-' + Date.now(),
        error: 'SMTP not configured' 
      };
    }

    // Get admin ID from request (use actual admin ID from authentication)
    const adminId = req.admin?._id || req.user?._id;

    // Update message status and store reply
    const updatedMessage = await ContactMessage.findByIdAndUpdate(
      id,
      { 
        status: "resolved",
        $push: {
          replies: {
            message: replyMessage,
            sentBy: adminId,
            sentAt: new Date(),
            emailMessageId: emailResult?.messageId || null,
            emailError: emailResult?.error || null,
            emailSent: emailSent,
            sentTo: receiverEmail
          }
        }
      },
      { new: true }
    )
    .populate('user', 'name email planName subscriptionStatus')
    .populate('replies.sentBy', 'name email');

    // Determine success message based on email result
    let successMessage;
    if (emailSent) {
      successMessage = `Reply sent successfully to ${receiverEmail}!`;
    } else if (!transporter) {
      successMessage = `Reply saved but email not sent - SMTP not configured. Would send to: ${receiverEmail}`;
    } else {
      successMessage = `Reply saved but email to ${receiverEmail} failed. Status updated to resolved.`;
    }

    res.json({
      success: true,
      message: successMessage,
      updatedMessage,
      emailInfo: {
        messageId: emailResult?.messageId,
        to: receiverEmail,
        subject: emailSubject,
        emailSent: emailSent,
        smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
      }
    });

  } catch (error) {
    console.error("❌ Error in sendReply:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to process reply",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get reply history for a message
exports.getReplyHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await ContactMessage.findById(id)
      .populate('replies.sentBy', 'name email')
      .select('replies');
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    res.json({
      success: true,
      replies: message.replies || []
    });
  } catch (error) {
    console.error("Error fetching reply history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reply history"
    });
  }
};

// Bulk update message statuses
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { messageIds, status } = req.body;
    
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message IDs array is required"
      });
    }

    const validStatuses = ["new", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const result = await ContactMessage.updateMany(
      { _id: { $in: messageIds } },
      { status }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} messages to ${status}`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error in bulk status update:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update messages"
    });
  }
};