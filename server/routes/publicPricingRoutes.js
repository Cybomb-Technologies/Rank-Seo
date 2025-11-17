// routes/publicPricingRoutes.js
const express = require("express");
const { getPublicPricingPlans } = require("../controllers/adminPricingController");

const router = express.Router();

router.get("/plans", getPublicPricingPlans);

module.exports = router;