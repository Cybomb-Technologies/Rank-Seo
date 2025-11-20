// controllers/keywordController.js
const KeywordReport = require('../models/KeywordReport');
const UsageTracker = require('../utils/usageTracker');

// Save generated keyword report
exports.saveKeywordReport = async (req, res) => {
  try {
    const { topic, industry, audience, keywords, sessionId } = req.body;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Check usage limit
    const usageCheck = await UsageTracker.checkUsageLimit(userId, 'keyword-report');
    if (!usageCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: usageCheck.message,
        usage: {
          used: usageCheck.used,
          limit: usageCheck.limit,
          remaining: usageCheck.remaining
        }
      });
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No keywords provided to save'
      });
    }

    if (!topic || !industry || !audience) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: topic, industry, audience'
      });
    }

    // Check if session already exists for this user
    const existingSession = await KeywordReport.findOne({ sessionId, user: userId });
    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'Session ID already exists'
      });
    }

    // Calculate values manually to ensure they're set
    const keywordCount = keywords.length;
    const totalSearchVolume = keywords.reduce((sum, keyword) => sum + (keyword.search_volume || 0), 0);
    const totalCPC = keywords.reduce((sum, keyword) => sum + (keyword.cpc || 0), 0);
    const averageCPC = keywords.length > 0 ? totalCPC / keywords.length : 0;

    // Create single document with all keywords
    const keywordReport = new KeywordReport({
      user: userId,
      sessionId,
      topic,
      industry,
      audience,
      keywords: keywords.map(keyword => ({
        keyword: keyword.keyword || "Unknown Keyword",
        type: keyword.type || "General",
        difficulty_score: keyword.difficulty_score || "Medium",
        search_volume: keyword.search_volume || 0,
        cpc: keyword.cpc || 0,
        intent: keyword.intent || "informational",
        content_type: keyword.content_type || "Blog Post",
        keyword_density: keyword.keyword_density || 0,
        content_idea: keyword.content_idea || "No content idea provided."
      })),
      keywordCount,
      totalSearchVolume,
      averageCPC
    });

    const savedReport = await keywordReport.save();

    // Increment usage
    await UsageTracker.incrementUsage(userId, 'keyword-report');
    
    // Track keywords count
    if (keywords.length > 0) {
      await UsageTracker.incrementUsage(userId, 'tracked-keywords', keywords.length);
    }

    // Get updated usage stats
    const updatedUsage = await UsageTracker.getUsageStats(userId);

    res.status(201).json({
      success: true,
      message: 'Keyword report saved successfully',
      data: {
        sessionId: savedReport.sessionId,
        objectId: savedReport._id,
        keywordCount: savedReport.keywordCount,
        totalSearchVolume: savedReport.totalSearchVolume,
        averageCPC: savedReport.averageCPC,
        generatedAt: savedReport.generatedAt
      },
      usage: updatedUsage.keywordReports
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Session ID already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to save keyword report',
      error: error.message
    });
  }
};

// Get keyword report by session ID for the authenticated user
exports.getKeywordReportBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const report = await KeywordReport.findOne({ sessionId, user: userId });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Keyword report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch keyword report',
      error: error.message
    });
  }
};

// Get all keyword reports for the authenticated user (paginated)
exports.getAllKeywordReports = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const { page = 1, limit = 10, industry, topic } = req.query;

    const filter = { user: userId };
    if (industry) filter.industry = new RegExp(industry, 'i');
    if (topic) filter.topic = new RegExp(topic, 'i');

    const reports = await KeywordReport.find(filter)
      .sort({ generatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('sessionId topic industry audience keywordCount totalSearchVolume averageCPC generatedAt');

    const total = await KeywordReport.countDocuments(filter);

    // Get usage stats
    const usageStats = await UsageTracker.getUsageStats(userId);

    res.json({
      success: true,
      data: reports,
      usage: usageStats.keywordReports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReports: total
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch keyword reports',
      error: error.message
    });
  }
};

// Get analytics data for the authenticated user
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const totalReports = await KeywordReport.countDocuments({ user: userId });
    const totalKeywords = await KeywordReport.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: '$keywordCount' }
        }
      }
    ]);

    const industryStats = await KeywordReport.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$industry',
          reportCount: { $sum: 1 },
          keywordCount: { $sum: '$keywordCount' },
          avgSearchVolume: { $avg: '$totalSearchVolume' },
          avgCPC: { $avg: '$averageCPC' }
        }
      },
      { $sort: { reportCount: -1 } }
    ]);

    const topicStats = await KeywordReport.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$topic',
          reportCount: { $sum: 1 }
        }
      },
      { $sort: { reportCount: -1 } },
      { $limit: 10 }
    ]);

    const recentActivity = await KeywordReport.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$generatedAt'
            }
          },
          reports: { $sum: 1 },
          keywords: { $sum: '$keywordCount' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);

    // Get usage stats
    const usageStats = await UsageTracker.getUsageStats(userId);

    res.json({
      success: true,
      data: {
        totalReports,
        totalKeywords: totalKeywords[0]?.total || 0,
        industryStats,
        topicStats,
        recentActivity
      },
      usage: usageStats.keywordReports
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

// Delete keyword report by sessionId for the authenticated user
exports.deleteKeywordReport = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const result = await KeywordReport.deleteOne({ sessionId, user: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Keyword report not found'
      });
    }

    res.json({
      success: true,
      message: 'Keyword report deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete keyword report',
      error: error.message
    });
  }
};

// Get keyword reports by industry for the authenticated user
exports.getKeywordReportsByIndustry = async (req, res) => {
  try {
    const { industry } = req.params;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const { page = 1, limit = 10 } = req.query;

    const reports = await KeywordReport.find({ 
      industry: new RegExp(industry, 'i'),
      user: userId
    })
      .sort({ generatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('sessionId topic industry audience keywordCount totalSearchVolume averageCPC generatedAt');

    const total = await KeywordReport.countDocuments({ 
      industry: new RegExp(industry, 'i'),
      user: userId
    });

    res.json({
      success: true,
      data: reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReports: total
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports by industry',
      error: error.message
    });
  }
};

// Get keyword reports by topic for the authenticated user
exports.getKeywordReportsByTopic = async (req, res) => {
  try {
    const { topic } = req.params;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const { page = 1, limit = 10 } = req.query;

    const reports = await KeywordReport.find({ 
      topic: new RegExp(topic, 'i'),
      user: userId
    })
      .sort({ generatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('sessionId topic industry audience keywordCount totalSearchVolume averageCPC generatedAt');

    const total = await KeywordReport.countDocuments({ 
      topic: new RegExp(topic, 'i'),
      user: userId
    });

    res.json({
      success: true,
      data: reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReports: total
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports by topic',
      error: error.message
    });
  }
};

// Health check for keyword routes
exports.healthCheck = async (req, res) => {
  try {
    // Test database connection
    const dbStatus = await KeywordReport.db.db.admin().ping();
    
    res.json({
      success: true,
      message: 'Keyword API is healthy',
      database: dbStatus.ok === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Keyword API health check failed',
      error: error.message
    });
  }
};