// controllers/businessNameController.js
const BusinessName = require('../models/BusinessName');
const UsageTracker = require('../utils/usageTracker');

// Generate names with usage limit check
exports.generateNames = async (req, res) => {
  try {
    const { industry, audience, style } = req.body;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Check usage limit BEFORE generating
    const usageCheck = await UsageTracker.checkUsageLimit(userId, 'business-name');
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

    if (!industry || !audience || !style) {
      return res.status(400).json({
        success: false,
        message: 'Industry, audience, and style are required'
      });
    }

    // Call the n8n webhook
    const n8nResponse = await fetch('https://n8n.cybomb.com/webhook/Business-name-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry, audience, style }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n request failed: ${n8nResponse.status}`);
    }

    const responseData = await n8nResponse.json();
    let namesArray = [];

    if (Array.isArray(responseData)) {
      namesArray = responseData;
    } else if (responseData.output) {
      const outputString = responseData.output
        .replace(/```json\n?|```/g, "")
        .trim();
      namesArray = JSON.parse(outputString);
    } else {
      throw new Error("Invalid response format from n8n");
    }

    const businessNames = namesArray.map((item) => ({
      name: item.name || "Unnamed",
      style: item.style || "General",
      tagline: item.tagline || "",
    }));

    // Increment usage count
    await UsageTracker.incrementUsage(userId, 'business-name');

    // Get updated usage stats
    const updatedUsage = await UsageTracker.getUsageStats(userId);

    res.json({
      success: true,
      message: 'Names generated successfully',
      data: {
        names: businessNames,
        count: businessNames.length
      },
      usage: updatedUsage.businessNames
    });

  } catch (error) {
    console.error('Error generating names:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate names',
      error: error.message
    });
  }
};

// Save generated names as a single document
exports.saveGeneratedNames = async (req, res) => {
  try {
    const { names, industry, audience, stylePreference, sessionId } = req.body;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    if (!names || !Array.isArray(names) || names.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No names provided to save'
      });
    }

    // Check if session already exists for this user
    const existingSession = await BusinessName.findOne({ sessionId, user: userId });
    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'Session ID already exists'
      });
    }

    // Create single document with all names
    const businessNameDoc = new BusinessName({
      user: userId,
      sessionId,
      industry,
      audience,
      stylePreference,
      names: names.map(name => ({
        name: name.name,
        style: name.style,
        tagline: name.tagline
      })),
      nameCount: names.length
    });

    const savedDoc = await businessNameDoc.save();

    // Get updated usage stats
    const updatedUsage = await UsageTracker.getUsageStats(userId);

    res.status(201).json({
      success: true,
      message: 'Names saved successfully as single document',
      data: {
        sessionId: savedDoc.sessionId,
        objectId: savedDoc._id,
        nameCount: savedDoc.nameCount,
        generatedAt: savedDoc.generatedAt
      },
      usage: updatedUsage.businessNames
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Session ID already exists',
        error: 'Duplicate session'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to save names to database',
      error: error.message
    });
  }
};

// Get names by session ID
exports.getNamesBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await BusinessName.findOne({ sessionId, user: userId });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        objectId: session._id,
        industry: session.industry,
        audience: session.audience,
        stylePreference: session.stylePreference,
        names: session.names,
        nameCount: session.nameCount,
        generatedAt: session.generatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session',
      error: error.message
    });
  }
};

// Get all sessions for the authenticated user
exports.getAllSessions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const sessions = await BusinessName.find({ user: userId })
      .sort({ generatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('sessionId industry audience stylePreference nameCount generatedAt');

    const total = await BusinessName.countDocuments({ user: userId });

    // Get usage stats
    const usageStats = await UsageTracker.getUsageStats(userId);

    res.json({
      success: true,
      data: sessions,
      usage: usageStats.businessNames,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalSessions: total
      }
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions',
      error: error.message
    });
  }
};

// Get analytics data for the authenticated user
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalSessions = await BusinessName.countDocuments({ user: userId });
    const totalNames = await BusinessName.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: '$nameCount' }
        }
      }
    ]);
    
    const industryStats = await BusinessName.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$industry',
          sessionCount: { $sum: 1 },
          nameCount: { $sum: '$nameCount' }
        }
      },
      { $sort: { sessionCount: -1 } }
    ]);

    const styleStats = await BusinessName.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$stylePreference',
          sessionCount: { $sum: 1 },
          nameCount: { $sum: '$nameCount' }
        }
      },
      { $sort: { sessionCount: -1 } }
    ]);

    const recentActivity = await BusinessName.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$generatedAt'
            }
          },
          sessions: { $sum: 1 },
          names: { $sum: '$nameCount' }
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
        totalSessions,
        totalNames: totalNames[0]?.total || 0,
        industryStats,
        styleStats,
        recentActivity
      },
      usage: usageStats.businessNames
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

// Delete session by sessionId for the authenticated user
exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const result = await BusinessName.deleteOne({ sessionId, user: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      error: error.message
    });
  }
};