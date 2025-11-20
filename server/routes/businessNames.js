// routes/businessNameRoutes.js
const express = require('express');
const router = express.Router();
const businessNameController = require('../controllers/businessNameController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Generate names (with usage limit check)
router.post('/generate', businessNameController.generateNames);

// Save names to database
router.post('/names', businessNameController.saveGeneratedNames);

// Get names by session ID
router.get('/names/:sessionId', businessNameController.getNamesBySession);

// Get all sessions for user
router.get('/sessions', businessNameController.getAllSessions);

// Get analytics
router.get('/analytics', businessNameController.getAnalytics);

// Delete session
router.delete('/sessions/:sessionId', businessNameController.deleteSession);

module.exports = router;