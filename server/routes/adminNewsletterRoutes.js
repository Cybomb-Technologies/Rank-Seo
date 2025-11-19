// routes/admin/adminNewsletterRoutes.js
const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/authMiddleware');
const {
  getAllSubscribers,
  getSubscriptionStats,
  addSubscriber,
  removeSubscriber,
  removeMultipleSubscribers,
  exportSubscribers,
  checkSubscription
} = require('../controllers/adminNewsletterController');

// Public route for checking subscription status
router.get('/check/:email', checkSubscription);



// Get all subscribers with pagination
router.get('/', getAllSubscribers);

// Get subscription statistics
router.get('/stats', getSubscriptionStats);

// Add new subscriber
router.post('/', addSubscriber);

// Remove subscriber
router.delete('/:id', removeSubscriber);

// Remove multiple subscribers
router.delete('/', removeMultipleSubscribers);

// Export subscribers
router.get('/export', exportSubscribers);

module.exports = router;