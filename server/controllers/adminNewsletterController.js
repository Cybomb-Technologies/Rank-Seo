// controllers/admin/adminNewsletterController.js
const Subscription = require("../models/Subscription");
const User = require("../models/User");

// Get all newsletter subscribers with pagination and filters
const getAllSubscribers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.email = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get subscribers
    const subscribers = await Subscription.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Subscription.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Get subscription stats
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: await Subscription.countDocuments(),
      today: await Subscription.countDocuments({
        createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) }
      }),
      thisWeek: await Subscription.countDocuments({
        createdAt: { $gte: lastWeek }
      }),
      thisMonth: await Subscription.countDocuments({
        createdAt: { $gte: lastMonth }
      })
    };

    res.json({
      success: true,
      subscribers,
      stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalSubscribers: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching newsletter subscribers'
    });
  }
};

// Get subscription statistics
const getSubscriptionStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Basic counts
    const total = await Subscription.countDocuments();
    const todayCount = await Subscription.countDocuments({
      createdAt: { $gte: startOfToday }
    });
    const weekCount = await Subscription.countDocuments({
      createdAt: { $gte: lastWeek }
    });
    const monthCount = await Subscription.countDocuments({
      createdAt: { $gte: lastMonth }
    });

    // Monthly growth data for charts
    const monthlyData = await Subscription.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount,
        monthlyData
      }
    });
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription statistics'
    });
  }
};

// Add new subscriber (admin manual add)
const addSubscriber = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if already subscribed
    const existingSubscriber = await Subscription.findOne({ email: email.toLowerCase() });
    if (existingSubscriber) {
      return res.status(409).json({
        success: false,
        message: 'Email is already subscribed'
      });
    }

    const subscriber = new Subscription({
      email: email.toLowerCase().trim()
    });

    await subscriber.save();

    res.status(201).json({
      success: true,
      message: 'Subscriber added successfully',
      subscriber
    });
  } catch (error) {
    console.error('Error adding subscriber:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email is already subscribed'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error adding subscriber'
    });
  }
};

// Remove subscriber
const removeSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await Subscription.findByIdAndDelete(id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    res.json({
      success: true,
      message: 'Subscriber removed successfully'
    });
  } catch (error) {
    console.error('Error removing subscriber:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing subscriber'
    });
  }
};

// Remove multiple subscribers
const removeMultipleSubscribers = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Subscriber IDs are required'
      });
    }

    const result = await Subscription.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} subscriber(s) removed successfully`
    });
  } catch (error) {
    console.error('Error removing subscribers:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing subscribers'
    });
  }
};

// Export subscribers to CSV
const exportSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscription.find()
      .sort({ createdAt: -1 })
      .lean();

    // Create CSV content
    let csvContent = 'Email,Subscription Date\n';
    subscribers.forEach(subscriber => {
      const date = new Date(subscriber.createdAt).toLocaleDateString();
      csvContent += `"${subscriber.email}","${date}"\n`;
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=newsletter-subscribers.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting subscribers:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting subscribers'
    });
  }
};

// Check if email is subscribed
const checkSubscription = async (req, res) => {
  try {
    const { email } = req.params;

    const subscriber = await Subscription.findOne({ email: email.toLowerCase() });

    res.json({
      success: true,
      isSubscribed: !!subscriber
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking subscription status'
    });
  }
};

module.exports = {
  getAllSubscribers,
  getSubscriptionStats,
  addSubscriber,
  removeSubscriber,
  removeMultipleSubscribers,
  exportSubscribers,
  checkSubscription
};