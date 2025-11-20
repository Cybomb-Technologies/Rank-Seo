const mongoose = require('mongoose');

const keywordIntentSchema = new mongoose.Schema({
  informational: [{ type: String }],
  navigational: [{ type: String }],
  transactional: [{ type: String }],
  commercial: [{ type: String }]
}, { _id: false });

const scrapedPageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  depth: { type: Number, required: true },
  title: { type: String, default: '' },
  content: [{ type: String }],
  foundLinks: { type: Number, default: 0 },
  keywords: [{
    word: { type: String, required: true },
    count: { type: Number, required: true }
  }],
  contentLength: { type: Number, default: 0 },
  wordCount: { type: Number, default: 0 },
  error: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const keyScrapeReportSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Report Metadata
  reportId: {
    type: String,
    unique: true,
    default: () => Math.random().toString(36).substring(2) + Date.now().toString(36)
  },
  mainUrl: {
    type: String,
    required: true,
    index: true
  },
  domain: {
    type: String,
    required: true,
    index: true
  },
  
  // Analysis Results
  keywordData: {
    primary_keywords: [{ type: String }],
    secondary_keywords: [{ type: String }],
    long_tail_keywords: [{ type: String }],
    related_keywords: [{ type: String }],
    keyword_intent: keywordIntentSchema
  },
  
  // Raw Scraped Data
  scrapedPages: [scrapedPageSchema],
  
  // Analysis Metadata
  totalPagesScraped: { type: Number, required: true },
  totalKeywordsFound: { type: Number, required: true },
  analysisType: {
    type: String,
    enum: ['n8n_analysis', 'fallback_analysis'],
    required: true
  },
  analysisError: { type: String },
  
  // Timestamps
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true
});

// Updated indexes
keyScrapeReportSchema.index({ user: 1 });
keyScrapeReportSchema.index({ createdAt: -1 });
keyScrapeReportSchema.index({ domain: 1, createdAt: -1 });
keyScrapeReportSchema.index({ 'keywordData.primary_keywords': 'text' });
keyScrapeReportSchema.index({ user: 1, createdAt: -1 });

// Virtual for report duration
keyScrapeReportSchema.virtual('duration').get(function() {
  return this.completedAt - this.startedAt;
});

// Method to get summary
keyScrapeReportSchema.methods.getSummary = function() {
  return {
    reportId: this.reportId,
    mainUrl: this.mainUrl,
    domain: this.domain,
    totalPages: this.totalPagesScraped,
    totalKeywords: this.totalKeywordsFound,
    primaryKeywords: this.keywordData.primary_keywords.length,
    analysisType: this.analysisType,
    duration: this.duration,
    createdAt: this.createdAt
  };
};

// Static method to find recent reports for a user and domain
keyScrapeReportSchema.statics.findByUserAndDomain = function(userId, domain, limit = 5) {
  return this.find({ user: userId, domain })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('reportId mainUrl totalPagesScraped totalKeywordsFound createdAt');
};

// Static method to find user reports
keyScrapeReportSchema.statics.findByUser = function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get all reports with pagination
keyScrapeReportSchema.statics.getUserReports = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('reportId mainUrl domain totalPagesScraped totalKeywordsFound analysisType createdAt completedAt');
};

// Static method to count user reports
keyScrapeReportSchema.statics.countUserReports = function(userId) {
  return this.countDocuments({ user: userId });
};

module.exports = mongoose.model('KeyScrapeReport', keyScrapeReportSchema);