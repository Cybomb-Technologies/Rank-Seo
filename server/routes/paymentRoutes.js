// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();

const { createOrder, verifyPayment, getPaymentStatus, handlePaymentWebhook } = require("../controllers/paymentController");
const { verifyUser } = require("../middleware/auditMiddleware");

// ✅ Protect payment routes with verifyUser
router.post("/create", verifyUser, createOrder);
router.post("/verify", verifyUser, verifyPayment);
router.get("/status/:orderId", verifyUser, getPaymentStatus);
router.post("/webhook", handlePaymentWebhook);

module.exports = router;