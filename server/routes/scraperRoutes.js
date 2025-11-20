// routes/scraperRoutes.js
const express = require('express');
const router = express.Router();
const scraperController = require('../controllers/scraperController');
const auth = require('../middleware/auth');

// Main crawl endpoint
router.post('/crawl', auth, scraperController.crawlAndScrape);

// Usage stats route
router.get('/usage', auth, scraperController.getUsageStats);

// Report routes
router.get('/report/:reportId', auth, scraperController.getReportById);
router.get('/reports/domain/:domain', auth, scraperController.getDomainReports);
router.get('/reports', auth, scraperController.getAllReports);
router.get('/reports/url/:url', auth, scraperController.getReportsByUrl);
router.delete('/report/:reportId', auth, scraperController.deleteReport);

module.exports = router;