const Admin = require("../models/Admin");
const User = require("../models/User");
const Audit = require("../models/auditModel"); 
const BusinessName = require("../models/BusinessName");
const KeycheckReport = require("../models/keycheckReport");
const KeyScrapeReport = require("../models/keyscrapeReport");
const KeywordReport = require("../models/KeywordReport");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

exports.createAdmin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email & password required" });

  try {
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: "Admin already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const admin = new Admin({ email, password: hashed });
    await admin.save();

    return res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email & password required" });

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, { expiresIn: "1d" });
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Protected: returns dashboard data with all tool information
exports.getDashboardData = async (req, res) => {
  try {
    // Get user data first to populate all logs
    const users = await User.find()
      .select('-password -otp -otpExpiresAt') // Select all but these
      .sort({ createdAt: -1 })
      .lean();

    // Get data from all models in parallel for better performance
    const [
      audits,
      businessNames,
      keycheckReports,
      keyScrapeReports,
      keywordReports
    ] = await Promise.all([
      // Audit data
      Audit.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('userId', 'name email')
        .lean(),
      
      // Business Name Generator data - FIXED: Added populate
      BusinessName.find()
        .sort({ generatedAt: -1 })
        .limit(50)
        .populate('user', 'name email') // Added populate
        .lean(),
      
      // Keycheck Report data - FIXED: Added populate
      KeycheckReport.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('user', 'name email') // Added populate
        .lean(),
      
      // Key Scrape Report data - FIXED: Added populate
      KeyScrapeReport.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('user', 'name email') // Added populate
        .lean(),
      
      // Keyword Report data - FIXED: Added populate
      KeywordReport.find()
        .sort({ generatedAt: -1 })
        .limit(50)
        .populate('user', 'name email') // Added populate
        .lean()
    ]);

    // Create a map of user IDs to user data for quick lookup
    const userMap = {};
    const formattedUsers = users.map(user => {
        // Add login method for the frontend
        const loginMethod = user.githubId ? 'GitHub' : user.googleId ? 'Google' : 'Email';
        const formattedUser = {
            ...user,
            _id: user._id.toString(),
            name: user.name || 'N/A',
            plan: user.plan || null,
            planName: user.planName || 'Free',
            lastLogin: user.lastLogin || user.createdAt || new Date().toISOString(),
            loginMethod,
            // Add a random usage for display if needed, but it's not from DB
            usage: Math.floor(Math.random() * 100), 
        };
        userMap[formattedUser._id] = formattedUser;
        return formattedUser;
    });


    // Helper function to extract user info from populated data
    const getUserInfo = (item, userField = 'user') => {
      if (!item[userField]) return { email: 'Unknown', name: 'Anonymous User', id: null };
      
      // Handle populated user object
      if (item[userField]._id) {
        return {
          email: item[userField].email || 'Unknown',
          name: item[userField].name || 'Anonymous User',
          id: item[userField]._id.toString()
        };
      }
      
      // Handle user ID string
      if (typeof item[userField] === 'string') {
        const user = userMap[item[userField]];
        return {
          email: user ? user.email : 'Unknown',
          name: user ? user.name : 'Anonymous User',
          id: item[userField]
        };
      }
      
      return { email: 'Unknown', name: 'Anonymous User', id: null };
    };

    // Format audit data with user information
    const formattedAuditData = audits.map(audit => {
      const userInfo = getUserInfo(audit, 'userId');
      
      return {
        _id: audit._id.toString(),
        userEmail: userInfo.email,
        userName: userInfo.name,
        userId: userInfo.id,
        url: audit.url,
        timestamp: audit.createdAt,
        action: 'seo_audit',
        tool: 'seo_audit'
      };
    });

    // Format Business Name Generator data - FIXED: User info
    const formattedBusinessNameData = businessNames.map(item => {
      const userInfo = getUserInfo(item, 'user');
      
      return {
        _id: item._id.toString(),
        userEmail: userInfo.email,
        userName: userInfo.name,
        userId: userInfo.id,
        sessionId: item.sessionId,
        industry: item.industry,
        audience: item.audience,
        stylePreference: item.stylePreference,
        nameCount: item.nameCount,
        names: item.names || [],
        timestamp: item.generatedAt,
        tool: 'business_name_generator',
        action: 'name_generation'
      };
    });

    // Format Keycheck Report data - FIXED: User info
    const formattedKeycheckData = keycheckReports.map(report => {
      const userInfo = getUserInfo(report, 'user');
      
      return {
        _id: report._id.toString(),
        userEmail: userInfo.email,
        userName: userInfo.name,
        userId: userInfo.id,
        reportId: report.reportId,
        mainUrl: report.mainUrl,
        totalScraped: report.totalScraped,
        keywordCount: report.keywords?.length || 0,
        status: report.status,
        analysisType: report.analysis?.fallback ? 'fallback' : 'n8n',
        timestamp: report.createdAt,
        tool: 'keyword_checker',
        action: 'keyword_analysis'
      };
    });

    // Format Key Scrape Report data - FIXED: User info
    const formattedKeyScrapeData = keyScrapeReports.map(report => {
      const userInfo = getUserInfo(report, 'user');
      
      return {
        _id: report._id.toString(),
        userEmail: userInfo.email,
        userName: userInfo.name,
        userId: userInfo.id,
        reportId: report.reportId,
        mainUrl: report.mainUrl,
        domain: report.domain,
        totalPagesScraped: report.totalPagesScraped,
        totalKeywordsFound: report.totalKeywordsFound,
        primaryKeywords: report.keywordData?.primary_keywords?.length || 0,
        analysisType: report.analysisType,
        timestamp: report.createdAt,
        tool: 'keyword_scraper',
        action: 'keyword_scraping'
      };
    });

    // Format Keyword Report data - FIXED: User info
    const formattedKeywordData = keywordReports.map(report => {
      const userInfo = getUserInfo(report, 'user');
      
      return {
        _id: report._id.toString(),
        userEmail: userInfo.email,
        userName: userInfo.name,
        userId: userInfo.id,
        sessionId: report.sessionId,
        topic: report.topic,
        industry: report.industry,
        audience: report.audience,
        keywordCount: report.keywordCount,
        totalSearchVolume: report.totalSearchVolume,
        averageCPC: report.averageCPC,
        timestamp: report.generatedAt,
        tool: 'keyword_generator',
        action: 'keyword_generation'
      };
    });

    // Combine all data for unified view
    const allToolData = [
      ...formattedAuditData,
      ...formattedBusinessNameData,
      ...formattedKeycheckData,
      ...formattedKeyScrapeData,
      ...formattedKeywordData
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Calculate comprehensive statistics
    const totalActivities = allToolData.length;
    
    // Count by tool
    const toolCounts = allToolData.reduce((acc, item) => {
      acc[item.tool] = (acc[item.tool] || 0) + 1;
      return acc;
    }, {});

    // Count active users (users with activities in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = new Set(
      allToolData
        .filter(a => a.timestamp >= sevenDaysAgo && a.userEmail !== 'Unknown')
        .map(a => a.userEmail)
    ).size;

    // Count premium users
    const premiumUsers = formattedUsers.filter(user => 
      user.planName && user.planName !== 'Free'
    ).length;

    return res.json({
      // Overall statistics
      totalActivities,
      uniqueUsers: new Set(allToolData.map((a) => a.userEmail).filter(email => email !== 'Unknown')).size,
      activeUsers,
      premiumUsers,
      
      // Tool-specific statistics
      toolStats: {
        seo_audit: toolCounts.seo_audit || 0,
        business_name_generator: toolCounts.business_name_generator || 0,
        keyword_checker: toolCounts.keyword_checker || 0,
        keyword_scraper: toolCounts.keyword_scraper || 0,
        keyword_generator: toolCounts.keyword_generator || 0
      },
      
      // All data for admin panel
      auditData: formattedAuditData,
      businessNameData: formattedBusinessNameData,
      keycheckData: formattedKeycheckData,
      keyScrapeData: formattedKeyScrapeData,
      keywordData: formattedKeywordData,
      allToolData, // Combined data for unified view
      
      // User data
      users: formattedUsers // Return fully formed user data
    });
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Additional endpoint for user management
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -otp -otpExpiresAt') // Select all but these
      .sort({ createdAt: -1 })
      .lean();

    const formattedUsers = users.map(user => ({
      ...user,
      _id: user._id.toString(),
      name: user.name || 'N/A',
      plan: user.plan || null,
      planName: user.planName || 'Free',
      lastLogin: user.lastLogin || user.createdAt || new Date().toISOString(),
      loginMethod: user.githubId ? 'GitHub' : user.googleId ? 'Google' : 'Email',
      usage: Math.floor(Math.random() * 100),
    }));

    return res.json({ users: formattedUsers });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get detailed data for specific tools
exports.getToolData = async (req, res) => {
  try {
    const { tool } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let data = [];
    let total = 0;

    switch (tool) {
      case 'business_name_generator':
        data = await BusinessName.find()
          .sort({ generatedAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('user', 'name email') // Added populate
          .lean();
        total = await BusinessName.countDocuments();
        break;

      case 'keyword_checker':
        data = await KeycheckReport.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('user', 'name email') // Added populate
          .lean();
        total = await KeycheckReport.countDocuments();
        break;

      case 'keyword_scraper':
        data = await KeyScrapeReport.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('user', 'name email') // Added populate
          .lean();
        total = await KeyScrapeReport.countDocuments();
        break;

      case 'keyword_generator':
        data = await KeywordReport.find()
          .sort({ generatedAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('user', 'name email') // Added populate
          .lean();
        total = await KeywordReport.countDocuments();
        break;

      case 'seo_audit':
        data = await Audit.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('userId', 'name email')
          .lean();
        total = await Audit.countDocuments();
        break;

      default:
        return res.status(400).json({ message: "Invalid tool specified" });
    }

    return res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Error fetching tool data:", err);
    return res.status(500).json({ message: "Server error" });
  }
};