// server/routes/pricingRoutes.js
const express = require("express");
const router = express.Router();
const PricingPlan = require("../models/PricingPlan");

// Get all active pricing plans
router.get("/plans", async (req, res) => {
  try {
    const plans = await PricingPlan.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .select('-__v');
    
    res.json({
      success: true,
      plans: plans
    });
  } catch (error) {
    console.error("Error loading pricing plans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load pricing plans"
    });
  }
});

// Get specific plan by ID
router.get("/plans/:id", async (req, res) => {
  try {
    const plan = await PricingPlan.findOne({
      $or: [
        { _id: req.params.id },
        { id: req.params.id }
      ],
      isActive: true
    }).select('-__v');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    res.json({
      success: true,
      plan: plan
    });
  } catch (error) {
    console.error("Error loading pricing plan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load pricing plan"
    });
  }
});

module.exports = router;