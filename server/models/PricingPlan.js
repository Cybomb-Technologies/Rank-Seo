// server/models/PricingPlan.js
const mongoose = require("mongoose");

const featureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  included: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    default: ""
  }
});

const pricingPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  monthlyUSD: {
    type: Number,
    min: 0,
    default: null
  },
  annualUSD: {
    type: Number,
    min: 0,
    default: null
  },
  maxAuditsPerMonth: {
    type: Number,
    default: 0,
    min: 0
  },
  maxTrackedKeywords: {
    type: Number,
    default: 0,
    min: 0
  },
  features: [featureSchema],
  highlight: {
    type: Boolean,
    default: false
  },
  custom: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 999
  }
}, {
  timestamps: true
});

// Index for better query performance
pricingPlanSchema.index({ isActive: 1, sortOrder: 1 });
pricingPlanSchema.index({ name: 1 }, { unique: true });

// Virtual for formatted price display
pricingPlanSchema.virtual('formattedMonthlyUSD').get(function() {
  return this.monthlyUSD !== null ? `$${this.monthlyUSD}` : 'Custom';
});

pricingPlanSchema.virtual('formattedAnnualUSD').get(function() {
  return this.annualUSD !== null ? `$${this.annualUSD}` : 'Custom';
});

module.exports = mongoose.model("PricingPlan", pricingPlanSchema);