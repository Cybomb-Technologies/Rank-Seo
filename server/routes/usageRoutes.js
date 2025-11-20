// routes/usageRoutes.js
const express = require('express');
const router = express.Router();
const usageController = require('../controllers/usageController');
const auth = require('../middleware/auth');

router.get('/usage', auth, usageController.getUsageStats);

module.exports = router;