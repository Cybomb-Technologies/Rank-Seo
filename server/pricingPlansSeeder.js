// seeders/pricingPlansSeeder.js
const mongoose = require("mongoose");
const PricingPlan = require("./models/PricingPlan");

const initialPlans = [
  {
    name: "Starter",
    description: "Perfect for small businesses and bloggers",
    monthlyUSD: 29,
    annualUSD: 24,
    custom: false,
    highlight: false,
    features: [
      { name: "5 SEO Audits per month", included: true },
      { name: "50 Keyword Tracking", included: true },
      { name: "Basic Technical SEO Analysis", included: true },
      { name: "Competitor Analysis", included: false },
      { name: "White-label Reports", included: false },
      { name: "API Access", included: false },
      { name: "Dedicated Support", included: false }
    ],
    maxAuditsPerMonth: 5,
    maxTrackedKeywords: 50,
    isActive: true,
    sortOrder: 1
  },
  {
    name: "Professional",
    description: "Ideal for growing businesses and agencies",
    monthlyUSD: 79,
    annualUSD: 66,
    custom: false,
    highlight: true,
    features: [
      { name: "20 SEO Audits per month", included: true },
      { name: "200 Keyword Tracking", included: true },
      { name: "Comprehensive Technical SEO Analysis", included: true },
      { name: "Up to 3 Competitors Analysis", included: true },
      { name: "White-label Reports", included: true },
      { name: "API Access", included: false },
      { name: "Priority Support", included: true }
    ],
    maxAuditsPerMonth: 20,
    maxTrackedKeywords: 200,
    isActive: true,
    sortOrder: 2
  },
  {
    name: "Enterprise",
    description: "For large organizations with custom needs",
    monthlyUSD: undefined,
    annualUSD: undefined,
    custom: true,
    highlight: false,
    features: [
      { name: "Unlimited SEO Audits", included: true },
      { name: "Custom Keyword Tracking", included: true },
      { name: "Advanced Technical SEO Analysis", included: true },
      { name: "Advanced Competitor Analysis", included: true },
      { name: "White-label Reports", included: true },
      { name: "Full API Access", included: true },
      { name: "24/7 Dedicated Support", included: true }
    ],
    maxAuditsPerMonth: 0, // 0 means unlimited
    maxTrackedKeywords: 0, // 0 means unlimited
    isActive: true,
    sortOrder: 3
  }
];

const seedPricingPlans = async () => {
  try {
    // Clear existing plans
    await PricingPlan.deleteMany({});
    
    // Insert new plans
    await PricingPlan.insertMany(initialPlans);
    
    console.log("Pricing plans seeded successfully");
  } catch (error) {
    console.error("Error seeding pricing plans:", error);
  }
};

module.exports = seedPricingPlans;