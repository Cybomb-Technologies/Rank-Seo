// routes/admin/adminPaymentRoutes.js
const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/authMiddleware');
const {
  getAllPayments,
  getPaymentStats,
  updatePaymentStatus,
  getPaymentById,
  deletePayment
} = require('../controllers/adminPaymentController');



// Get all payments with filters
router.get('/', getAllPayments);

// Get payment statistics
router.get('/stats', getPaymentStats);

// Get payment by ID
router.get('/:paymentId', getPaymentById);

// Update payment status
router.patch('/:paymentId/status', updatePaymentStatus);

// Delete payment
router.delete('/:paymentId', deletePayment);

module.exports = router;