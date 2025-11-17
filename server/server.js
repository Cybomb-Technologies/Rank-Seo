const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const auditRoutes = require("./routes/auditRoutes");
const adminRoutes = require("./routes/adminRoutes");
const pricingRoutes = require("./routes/pricingRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const scraperRoutes = require("./routes/scraperRoutes"); 
const contactRoutes = require("./routes/contactRoutes.js");
const keyRoutes = require("./routes/keyRoutes");
const businessNameRoutes = require('./routes/businessNames');
const keywordRoutes = require('./routes/keywordRoutes');
const paymentRoutes = require("./routes/paymentRoutes"); // Import payment routes
const adminPricingRoutes = require("./routes/adminPricingRoutes");
const publicPricingRoutes = require("./routes/publicPricingRoutes");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

console.log("JWT_SECRET loaded:", process.env.JWT_SECRET);

const app = express();
const PORT = process.env.PORT || 5000;

// Body parser
app.use(express.json());

// CORS - allow frontend to send credentials
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "https://rankseo.in"], // Added localhost:3000
    credentials: true,
  })
);

// Connect to MongoDB
connectDB();

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// Root route
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// Routes
app.use("/api/admin", adminPricingRoutes);

// Public routes (for frontend pricing page)
app.use("/api/pricing", publicPricingRoutes);
app.use("/api", authRoutes);
app.use("/api", auditRoutes);
app.use("/api", adminRoutes);
app.use("/api", pricingRoutes);
app.use("/api", subscriptionRoutes);
app.use("/api", scraperRoutes);
app.use("/api", contactRoutes);
app.use("/api", keyRoutes);
app.use('/api/business', businessNameRoutes);
app.use('/api/keywords', keywordRoutes);
app.use("/api/payments", paymentRoutes); // ✅ Fixed: changed from "/api/payment" to "/api/payments"

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);