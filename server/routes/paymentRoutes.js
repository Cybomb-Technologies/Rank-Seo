// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();

const { 
  createOrder, 
  verifyPayment, 
  getPaymentStatus, 
  handlePaymentWebhook,
  toggleAutoRenewal,
  getAutoRenewalStatus,
  processAutoRenewals,
  getBillingHistory,
  getUserProfile,
  generateInvoicePDF
} = require("../controllers/paymentController");
const { verifyUser } = require("../middleware/auditMiddleware");

// ✅ Protect payment routes with verifyUser
router.post("/create", verifyUser, createOrder);
router.post("/verify", verifyUser, verifyPayment);
router.get("/status/:orderId", verifyUser, getPaymentStatus);
router.post("/webhook", handlePaymentWebhook);

// ✅ Auto-renewal routes
router.post("/auto-renewal/toggle", verifyUser, toggleAutoRenewal);
router.get("/auto-renewal/status", verifyUser, getAutoRenewalStatus);

// ✅ Admin route for manual renewal processing (for testing)
router.post("/process-renewals", processAutoRenewals);

// ✅ User data and billing routes
router.get("/history", verifyUser, getBillingHistory);
router.get("/user/profile", verifyUser, getUserProfile);

// ⭐️ Invoice download route
router.get("/invoice/:transactionId", verifyUser, generateInvoicePDF);

module.exports = router;