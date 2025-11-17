// controllers/adminPricingController.js
const PricingPlan = require("../models/PricingPlan");

// Get all pricing plans (admin)
exports.getPricingPlans = async (req, res) => {
  try {
    const plans = await PricingPlan.find()
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    
    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load pricing plans"
    });
  }
};

// Get active pricing plans (public)
exports.getPublicPricingPlans = async (req, res) => {
  try {
    const plans = await PricingPlan.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .select('-stripePriceIdMonthly -stripePriceIdAnnual')
      .lean();
    
    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error("Error fetching public pricing plans:", error);
    // Return empty array if DB query fails
    res.json({
      success: true,
      plans: []
    });
  }
};

// Create new pricing plan
exports.createPricingPlan = async (req, res) => {
  try {
    const {
      name,
      description,
      monthlyUSD,
      annualUSD,
      custom,
      highlight,
      features,
      maxAuditsPerMonth,
      maxTrackedKeywords,
      sortOrder
    } = req.body;

    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "Name and description are required"
      });
    }

    if (!custom && (monthlyUSD === undefined || annualUSD === undefined)) {
      return res.status(400).json({
        success: false,
        message: "Non-custom plans must have monthlyUSD and annualUSD"
      });
    }

    const newPlan = new PricingPlan({
      name,
      description,
      monthlyUSD: custom ? undefined : monthlyUSD,
      annualUSD: custom ? undefined : annualUSD,
      custom: custom || false,
      highlight: highlight || false,
      features: features || [],
      maxAuditsPerMonth: maxAuditsPerMonth || 0,
      maxTrackedKeywords: maxTrackedKeywords || 0,
      sortOrder: sortOrder || 0
    });

    const savedPlan = await newPlan.save();

    res.status(201).json({
      success: true,
      message: "Pricing plan created successfully",
      plan: savedPlan
    });
  } catch (error) {
    console.error("Error creating pricing plan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create pricing plan"
    });
  }
};

// Update pricing plans (bulk update)
exports.updatePricingPlans = async (req, res) => {
  try {
    const { plans } = req.body;
    
    if (!Array.isArray(plans)) {
      return res.status(400).json({
        success: false,
        message: "Plans must be an array"
      });
    }

    // Validate required fields and prepare operations
    const bulkOperations = [];
    
    for (const plan of plans) {
      if (!plan.name || !plan.description) {
        return res.status(400).json({
          success: false,
          message: "Each plan must have name and description"
        });
      }

      if (!plan.custom && (plan.monthlyUSD === undefined || plan.annualUSD === undefined)) {
        return res.status(400).json({
          success: false,
          message: "Non-custom plans must have monthlyUSD and annualUSD"
        });
      }

      const updateFields = {
        name: plan.name,
        description: plan.description,
        monthlyUSD: plan.custom ? undefined : plan.monthlyUSD,
        annualUSD: plan.custom ? undefined : plan.annualUSD,
        custom: plan.custom || false,
        highlight: plan.highlight || false,
        features: plan.features || [],
        maxAuditsPerMonth: plan.maxAuditsPerMonth || 0,
        maxTrackedKeywords: plan.maxTrackedKeywords || 0,
        sortOrder: plan.sortOrder || 0,
        isActive: plan.isActive !== undefined ? plan.isActive : true
      };

      if (plan._id) {
        // Update existing plan
        bulkOperations.push({
          updateOne: {
            filter: { _id: plan._id },
            update: { $set: updateFields }
          }
        });
      } else {
        // Create new plan
        bulkOperations.push({
          insertOne: {
            document: updateFields
          }
        });
      }
    }

    // Execute bulk operations
    if (bulkOperations.length > 0) {
      await PricingPlan.bulkWrite(bulkOperations);
    }

    // Fetch updated plans
    const updatedPlans = await PricingPlan.find().sort({ sortOrder: 1, createdAt: 1 });

    res.json({
      success: true,
      message: "Pricing plans updated successfully",
      plans: updatedPlans
    });
  } catch (error) {
    console.error("Error updating pricing plans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update pricing plans"
    });
  }
};

// Update single pricing plan
exports.updatePricingPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove MongoDB _id from update data if present
    delete updateData._id;

    const updatedPlan = await PricingPlan.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found"
      });
    }

    res.json({
      success: true,
      message: "Pricing plan updated successfully",
      plan: updatedPlan
    });
  } catch (error) {
    console.error("Error updating pricing plan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update pricing plan"
    });
  }
};

// Delete pricing plan
exports.deletePricingPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPlan = await PricingPlan.findByIdAndDelete(id);

    if (!deletedPlan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found"
      });
    }

    res.json({
      success: true,
      message: "Pricing plan deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting pricing plan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete pricing plan"
    });
  }
};

// Toggle plan active status
exports.togglePlanStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await PricingPlan.findById(id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found"
      });
    }

    plan.isActive = !plan.isActive;
    await plan.save();

    res.json({
      success: true,
      message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
      plan
    });
  } catch (error) {
    console.error("Error toggling plan status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update plan status"
    });
  }
};