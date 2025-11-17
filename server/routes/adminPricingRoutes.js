// routes/adminPricingRoutes.js
const express = require("express");
const {
  getPricingPlans,
  updatePricingPlans,
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
  togglePlanStatus
} = require("../controllers/adminPricingController");
const { verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all routes with admin verification
router.get("/pricing", verifyAdmin, getPricingPlans);
router.post("/pricing", verifyAdmin, createPricingPlan);
router.put("/pricing", verifyAdmin, updatePricingPlans);
router.put("/pricing/:id", verifyAdmin, updatePricingPlan);
router.delete("/pricing/:id", verifyAdmin, deletePricingPlan);
router.patch("/pricing/:id/toggle-status", verifyAdmin, togglePlanStatus);

module.exports = router;