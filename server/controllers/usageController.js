// controllers/usageController.js
const UsageTracker = require('../utils/usageTracker');

exports.getUsageStats = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const usageStats = await UsageTracker.getUsageStats(userId);

    res.json({
      success: true,
      data: usageStats
    });

  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage statistics',
      error: error.message
    });
  }
};