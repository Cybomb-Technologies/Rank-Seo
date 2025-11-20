// middleware/checkAuditLimit.js
const GuestUsage = require("../models/guestUsageModel");
const User = require("../models/User");
const { getPlanLimits } = require("./auditMiddleware");

async function checkAuditLimit(req, res, next) {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Logged-in user: check plan limits
    if (req.user && req.user._id) {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(401).json({ success: false, message: "User not found" });
      }

      // Get current plan limits
      const planLimits = await getPlanLimits(user.plan);
      
      // 🔥 STRICT LIMIT CHECK: Block if auditsUsed >= limit
      if (user.auditsUsed >= planLimits.maxAuditsPerMonth) {
        return res.status(403).json({ 
          success: false, 
          message: `❌ Monthly audit limit reached! You've used ${user.auditsUsed} out of ${planLimits.maxAuditsPerMonth} audits. Please upgrade your plan or wait until next month.` 
        });
      }

      // Check subscription status for paid plans
      if (user.subscriptionStatus !== "active" && planLimits.maxAuditsPerMonth > 5) {
        return res.status(403).json({ 
          success: false, 
          message: "Your subscription is not active. Please renew your subscription." 
        });
      }

      return next();
    }

    // Guest user: check IP-based limits
    const todayDateString = today.toLocaleDateString("en-GB");
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    if (!ip) {
      console.error("❌ Could not detect IP");
      return res.status(400).json({ success: false, message: "IP is required" });
    }

    let guest = await GuestUsage.findOne({ ip, date: todayDateString });

    if (!guest) {
      guest = new GuestUsage({ ip, count: 1, date: todayDateString });
      await guest.save();
      return next();
    }

    if (guest.count >= 3) {
      return res.status(403).json({ 
        success: false, 
        message: "🚀 Free audits used up for today! Please login or register to continue." 
      });
    }

    guest.count += 1;
    await guest.save();
    next();

  } catch (err) {
    console.error("Audit limit check failed:", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { checkAuditLimit };