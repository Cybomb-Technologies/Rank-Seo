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
const adminPaymentRoutes = require('./routes/adminPaymentRoutes');
const adminNewsletterRoutes = require('./routes/adminNewsletterRoutes');
const adminSupportRoutes = require("./routes/adminSupportRoutes");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
// Initialize cron jobs
require("./cronJobs");
console.log("JWT_SECRET loaded:", process.env.JWT_SECRET);

const app = express();
const PORT = process.env.PORT || 5001;

// Body parser
app.use(express.json());


app.use(cors({
  origin: [ 'http://localhost:3000',
  'http://localhost:5173',
  "http://localhost:3000", "http://localhost:3001", "https://rankseo.in",
  'https://api.cybomb.com',
  'http://147.93.111.96:5000',
  'https://admin.cybomb.com'], // your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // include PATCH method
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // include necessary headers
  credentials: true // allow cookies/auth headers if needed
}));

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
app.use('/api/admin/newsletter', adminNewsletterRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use("/api/pricing", publicPricingRoutes);
app.use("/api/admin/support", adminSupportRoutes);

app.use("/api", authRoutes);
app.use("/api", auditRoutes);
app.use("/api", adminRoutes);
app.use("/api", pricingRoutes);
app.use("/api", subscriptionRoutes);
app.use("/api/scraper", scraperRoutes);
app.use('/api/contact', contactRoutes);
app.use("/api", keyRoutes);
app.use('/api/business', businessNameRoutes);
app.use('/api/keywords', keywordRoutes);
app.use("/api/payments", paymentRoutes); // ✅ Fixed: changed from "/api/payment" to "/api/payments"
// In your main app.js file
app.use('/api/usage', require('./routes/usageRoutes'));
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);