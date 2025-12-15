// middleware/auditMiddleware.js
const jwt = require("jsonwebtoken");
const PricingPlan = require("../models/PricingPlan");
const User = require("../models/User");
require("dotenv").config();

// 🔹 Fetch plan limits from database
const getPlanLimits = async (planId) => {
  try {
    let plan = null;
    
    // Try to find plan by ID if valid
    const planIdStr = planId ? planId.toString() : "";
    if (planId && planIdStr.match(/^[0-9a-fA-F]{24}$/)) {
      plan = await PricingPlan.findById(planId);
    }
    
    // If no plan found (or invalid ID), try to find the Free plan
    if (!plan) {
      plan = await PricingPlan.findOne({ isFree: true });
    }

    if (!plan) {
      console.warn("⚠️ No plan found in DB (even Free plan). Using hardcoded defaults.");
      // Return default free tier limits as fallback
      return {
        maxAuditsPerMonth: 5,
        maxKeywordReportsPerMonth: 10,
        maxBusinessNamesPerMonth: 5,
        maxKeywordChecksPerMonth: 10,
        maxKeywordScrapesPerMonth: 5,
        label: "Free",
      };
    }

    return {
      maxAuditsPerMonth: plan.maxAuditsPerMonth || 0,
      maxKeywordReportsPerMonth: plan.maxKeywordReportsPerMonth || 0,
      maxBusinessNamesPerMonth: plan.maxBusinessNamesPerMonth || 0,
      maxKeywordChecksPerMonth: plan.maxKeywordChecksPerMonth || 0,
      maxKeywordScrapesPerMonth: plan.maxKeywordScrapesPerMonth || 0,

      label: plan.name || "Free",
      planId: plan._id,
    };
  } catch (error) {
    console.error("Error fetching plan limits:", error);
    // Attempt one last time to find Free plan if error wasn't related to DB connection
    try {
        const freePlan = await PricingPlan.findOne({ isFree: true });
        if (freePlan) {
            return {
              maxAuditsPerMonth: freePlan.maxAuditsPerMonth || 0,
              maxKeywordReportsPerMonth: freePlan.maxKeywordReportsPerMonth || 0,
              maxBusinessNamesPerMonth: freePlan.maxBusinessNamesPerMonth || 0,
              maxKeywordChecksPerMonth: freePlan.maxKeywordChecksPerMonth || 0,
              maxKeywordScrapesPerMonth: freePlan.maxKeywordScrapesPerMonth || 0,
              label: freePlan.name || "Free",
              planId: freePlan._id,
            };
        }
    } catch (innerErr) {
        console.error("Double failure fetching plan:", innerErr);
    }

    return {
      maxAuditsPerMonth: 5,
      maxKeywordReportsPerMonth: 10,
      maxBusinessNamesPerMonth: 5,
      maxKeywordChecksPerMonth: 10,
      maxKeywordScrapesPerMonth: 5,
      label: "Free",
    };
  }
};

const verifyUser = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized - token missing" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");

    const userId = decoded.user?.id || decoded.id;
    const role = decoded.user?.role || decoded.role || "user";

    if (!userId) {
      return res.status(401).json({ message: "Invalid token - user ID missing" });
    }

    // 🔹 Get user data from database to get current plan
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Reset monthly usage if it's a new month
    await resetMonthlyUsage(user);

    // 🔹 Get plan limits from database
    const planId = user.plan || "starter";
    const limits = await getPlanLimits(planId);

    // Update user limits based on plan
    await User.findByIdAndUpdate(userId, {
      maxAuditsPerMonth: limits.maxAuditsPerMonth,
      maxKeywordReportsPerMonth: limits.maxKeywordReportsPerMonth,
      maxBusinessNamesPerMonth: limits.maxBusinessNamesPerMonth,
      maxKeywordChecksPerMonth: limits.maxKeywordChecksPerMonth,
      maxKeywordScrapesPerMonth: limits.maxKeywordScrapesPerMonth,

    });

    // Attach everything onto req.user
    req.user = {
      _id: userId,
      id: userId,
      role,
      plan: planId,
      planName: user.planName || limits.label,
      subscriptionStatus: user.subscriptionStatus || "inactive",
      limits, // { maxAuditsPerMonth, maxKeywordReportsPerMonth, etc. }
      // Usage counts
      auditsUsed: user.auditsUsed || 0,
      keywordReportsUsed: user.keywordReportsUsed || 0,
      businessNamesUsed: user.businessNamesUsed || 0,
      keywordChecksUsed: user.keywordChecksUsed || 0,
      keywordScrapesUsed: user.keywordScrapesUsed || 0,
    };

    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    return res.status(403).json({ message: "Forbidden - invalid token" });
  }
};

// Reset monthly usage
async function resetMonthlyUsage(user) {
  const now = new Date();
  const lastReset = new Date(user.lastUsageReset);
  
  // Check if we're in a different month
  if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
    await User.findByIdAndUpdate(user._id, {
      auditsUsed: 0,
      keywordReportsUsed: 0,
      businessNamesUsed: 0,
      keywordChecksUsed: 0,
      keywordScrapesUsed: 0,
      lastUsageReset: now
    });
  }
}

module.exports = { verifyUser, getPlanLimits, resetMonthlyUsage };