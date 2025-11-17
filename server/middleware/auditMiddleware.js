// middleware/auditMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

// 🔹 Plan-based limits for the auditing tool.
// Match this with your pricing page.
const PLAN_LIMITS = {
  starter: {
    maxAuditsPerMonth: 5,
    maxTrackedKeywords: 50,
    label: "Starter",
  },
  professional: {
    maxAuditsPerMonth: 20,
    maxTrackedKeywords: 200,
    label: "Professional",
  },
  enterprise: {
    maxAuditsPerMonth: Infinity,     // treat as unlimited in code
    maxTrackedKeywords: Infinity,
    label: "Enterprise",
  },
};

const verifyUser = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized - token missing" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");

    const userId = decoded.user?.id || decoded.id;
    const role = decoded.user?.role || decoded.role || "user";

    // 🔹 Get plan from token if present, else default to starter
    const planFromToken =
      decoded.user?.plan ||
      decoded.plan ||
      "starter";

    const planKey = ["starter", "professional", "enterprise"].includes(
      planFromToken
    )
      ? planFromToken
      : "starter";

    const limits = PLAN_LIMITS[planKey];

    // Attach everything onto req.user
    req.user = {
      _id: userId,
      role,
      plan: planKey,
      limits, // { maxAuditsPerMonth, maxTrackedKeywords, label }
    };

    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    return res.status(403).json({ message: "Forbidden - invalid token" });
  }
};

module.exports = { verifyUser, PLAN_LIMITS };
