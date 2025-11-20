// utils/usageTracker.js
const User = require('../models/User');
const { getPlanLimits } = require('../middleware/auditMiddleware');

class UsageTracker {
  // Increment usage for a specific feature
  static async incrementUsage(userId, feature, count = 1) {
    let updateField;
    
    switch (feature) {
      case 'audit':
        updateField = 'auditsUsed';
        break;
      case 'keyword-report':
        updateField = 'keywordReportsUsed';
        break;
      case 'business-name':
        updateField = 'businessNamesUsed';
        break;
      case 'keyword-check':
        updateField = 'keywordChecksUsed';
        break;
      case 'keyword-scrape':
        updateField = 'keywordScrapesUsed';
        break;
      
       
      default:
        throw new Error(`Unknown feature: ${feature}`);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { [updateField]: count } },
      { new: true }
    );
    
    return user;
  }

  // Get comprehensive usage stats
  static async getUsageStats(userId) {
    const user = await User.findById(userId);
    if (!user) return null;

    const planLimits = await getPlanLimits(user.plan);

    return {
      audits: {
        used: user.auditsUsed || 0,
        limit: planLimits.maxAuditsPerMonth,
        remaining: Math.max(0, planLimits.maxAuditsPerMonth - (user.auditsUsed || 0))
      },
      keywordReports: {
        used: user.keywordReportsUsed || 0,
        limit: planLimits.maxKeywordReportsPerMonth,
        remaining: Math.max(0, planLimits.maxKeywordReportsPerMonth - (user.keywordReportsUsed || 0))
      },
      businessNames: {
        used: user.businessNamesUsed || 0,
        limit: planLimits.maxBusinessNamesPerMonth,
        remaining: Math.max(0, planLimits.maxBusinessNamesPerMonth - (user.businessNamesUsed || 0))
      },
      keywordChecks: {
        used: user.keywordChecksUsed || 0,
        limit: planLimits.maxKeywordChecksPerMonth,
        remaining: Math.max(0, planLimits.maxKeywordChecksPerMonth - (user.keywordChecksUsed || 0))
      },
      keywordScrapes: {
        used: user.keywordScrapesUsed || 0,
        limit: planLimits.maxKeywordScrapesPerMonth,
        remaining: Math.max(0, planLimits.maxKeywordScrapesPerMonth - (user.keywordScrapesUsed || 0))
      }
      
    };
  }

  // Check if user can perform an action
  static async canPerformAction(userId, feature, requiredCount = 1) {
    const user = await User.findById(userId);
    if (!user) return false;

    const planLimits = await getPlanLimits(user.plan);
    
    let usageField, limitField;
    
    switch (feature) {
      case 'audit':
        usageField = 'auditsUsed';
        limitField = 'maxAuditsPerMonth';
        break;
      case 'keyword-report':
        usageField = 'keywordReportsUsed';
        limitField = 'maxKeywordReportsPerMonth';
        break;
      case 'business-name':
        usageField = 'businessNamesUsed';
        limitField = 'maxBusinessNamesPerMonth';
        break;
      case 'keyword-check':
        usageField = 'keywordChecksUsed';
        limitField = 'maxKeywordChecksPerMonth';
        break;
      case 'keyword-scrape':
        usageField = 'keywordScrapesUsed';
        limitField = 'maxKeywordScrapesPerMonth';
        break;
      default:
        return false;
    }

    return (user[usageField] + requiredCount) <= planLimits[limitField];
  }

  // Check usage limit with detailed response
  static async checkUsageLimit(userId, feature) {
    const user = await User.findById(userId);
    if (!user) {
      return { allowed: false, message: "User not found" };
    }

    const planLimits = await getPlanLimits(user.plan);
    
    let usageField, limitField, featureName;
    
    switch (feature) {
      case 'audit':
        usageField = 'auditsUsed';
        limitField = 'maxAuditsPerMonth';
        featureName = 'audits';
        break;
      case 'keyword-report':
        usageField = 'keywordReportsUsed';
        limitField = 'maxKeywordReportsPerMonth';
        featureName = 'keyword reports';
        break;
      case 'business-name':
        usageField = 'businessNamesUsed';
        limitField = 'maxBusinessNamesPerMonth';
        featureName = 'business name generations';
        break;
      case 'keyword-check':
        usageField = 'keywordChecksUsed';
        limitField = 'maxKeywordChecksPerMonth';
        featureName = 'keyword checks';
        break;
      case 'keyword-scrape':
        usageField = 'keywordScrapesUsed';
        limitField = 'maxKeywordScrapesPerMonth';
        featureName = 'keyword scrapes';
        break;
      default:
        return { allowed: false, message: "Invalid feature specified" };
    }

    const used = user[usageField] || 0;
    const limit = planLimits[limitField];
    const remaining = Math.max(0, limit - used);

    if (used >= limit) {
      return {
        allowed: false,
        message: `❌ Monthly ${featureName} limit reached! You've used ${used} out of ${limit}. Please upgrade your plan.`,
        used,
        limit,
        remaining: 0,
        feature: featureName
      };
    }

    return {
      allowed: true,
      used,
      limit,
      remaining,
      feature: featureName
    };
  }
}

module.exports = UsageTracker;