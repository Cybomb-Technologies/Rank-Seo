// middleware/auditMiddleware.js
const jwt = require("jsonwebtoken");
const PricingPlan = require("../models/PricingPlan");
const User = require("../models/User");
require("dotenv").config();

// 🔹 Fetch plan limits from database
const getPlanLimits = async (planId) => {
  try {
    const plan = await PricingPlan.findById(planId);
    if (!plan) {
      // Return default free tier limits
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
      maxAuditsPerMonth: plan.maxAuditsPerMonth || 5,
      maxKeywordReportsPerMonth: plan.maxKeywordReportsPerMonth || 10,
      maxBusinessNamesPerMonth: plan.maxBusinessNamesPerMonth || 5,
      maxKeywordChecksPerMonth: plan.maxKeywordChecksPerMonth || 10,
      maxKeywordScrapesPerMonth: plan.maxKeywordScrapesPerMonth || 5,
      
      label: plan.name || "Free",
      planId: plan._id,
    };
  } catch (error) {
    console.error("Error fetching plan limits:", error);
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