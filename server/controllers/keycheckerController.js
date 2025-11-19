// controllers/keycheckerController.js
const { chromium } = require("playwright");
const { URL } = require("url");
const axios = require("axios");
const KeycheckReport = require("../models/keycheckReport");
const UsageTracker = require('../utils/usageTracker');

const MAX_DEPTH = 3;
const MAX_PAGES = 500;

// --- Core Scraper Function ---
async function processCrawlQueue(startUrl, page) {
  const baseUrl = new URL(startUrl).origin;
  const visitedUrls = new Set();
  const urlsToVisit = new Map();
  const scrapedResults = [];

  urlsToVisit.set(startUrl, 0);

  while (urlsToVisit.size > 0 && visitedUrls.size < MAX_PAGES) {
    const [currentUrl, depth] = urlsToVisit.entries().next().value;
    urlsToVisit.delete(currentUrl);

    if (visitedUrls.has(currentUrl) || depth > MAX_DEPTH) {
      continue;
    }
    visitedUrls.add(currentUrl);

    try {
      await page.goto(currentUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

      const pageData = await page.evaluate((bUrl) => {
        const title = document.title || "";
        const elements = document.querySelectorAll("h1, h2, h3, p, li, span");
        const content = Array.from(elements)
          .map((el) => el.innerText.trim())
          .filter((text) => text.length > 15 && text.length < 800)
          .slice(0, 25);

        const allLinks = Array.from(document.querySelectorAll("a[href]"))
          .map((a) => a.href)
          .filter((href) => {
            try {
              const linkUrl = new URL(href);
              return (
                linkUrl.protocol.startsWith("http") &&
                linkUrl.hostname === new URL(bUrl).hostname &&
                !href.endsWith("#")
              );
            } catch {
              return false;
            }
          });

        return { pageTitle: title, allContent: content, links: [...new Set(allLinks)] };
      }, baseUrl);

      const fullText = pageData.allContent.join(" ");
      const keywords = extractKeywords(fullText);

      scrapedResults.push({
        url: currentUrl,
        depth,
        title: pageData.pageTitle,
        content: pageData.allContent.slice(0, 15),
        foundLinks: pageData.links.length,
        keywords,
        contentLength: fullText.length,
        wordCount: fullText.split(/\s+/).filter(Boolean).length,
        timestamp: new Date().toISOString(),
      });

      if (depth < MAX_DEPTH) {
        for (const link of pageData.links) {
          if (!visitedUrls.has(link) && !urlsToVisit.has(link)) {
            urlsToVisit.set(link, depth + 1);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to scrape ${currentUrl}:`, error.message);
      scrapedResults.push({
        url: currentUrl,
        depth,
        error: `Scrape failed: ${error.message.substring(0, 100)}...`,
        keywords: [],
        contentLength: 0,
        wordCount: 0,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return { scrapedResults, totalScraped: visitedUrls.size };
}

// --- Keyword Extraction (Local Fallback) ---
function extractKeywords(text, maxKeywords = 10) {
  if (!text) return [];
  const stopWords = new Set([
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves",
    "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
    "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are",
    "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an",
    "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about",
    "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up",
    "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when",
    "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor",
    "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now",
    "also", "get", "like", "use"
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  const wordFreq = {};
  words.forEach((word) => (wordFreq[word] = (wordFreq[word] || 0) + 1));

  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word, count]) => ({ word, count }));
}

// --- Send data to n8n and wait for response ---
async function sendToN8nAndWait(scrapedData) {
  const n8nWebhookUrl = "https://n8n.cybomb.com/webhook/optimize-crawl";
  try {
    const payload = {
      analysisType: "keyword_and_content_analysis",
      timestamp: new Date().toISOString(),
      totalPages: scrapedData.length,
      data: scrapedData,
    };

    const response = await axios.post(n8nWebhookUrl, payload, { timeout: 220000 });

    let parsedData;
    if (response.data && typeof response.data === 'object' && response.data.output) {
      let jsonStr = response.data.output.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.substring(7);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      parsedData = JSON.parse(jsonStr);
    } else {
      console.warn("n8n response is not in the expected format:", response.data);
      throw new Error("Invalid n8n response format.");
    }

    // Normalize keywords for the frontend
    const normalizeKeywords = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map((k) => (typeof k === "object" && k !== null ? k.keyword || k.word : typeof k === 'string' ? k : null))
        .filter(Boolean);
    };

    const combinedKeywords = [];
    
    // Process all intent categories
    if (parsedData.keyword_intent && typeof parsedData.keyword_intent === 'object') {
      Object.entries(parsedData.keyword_intent).forEach(([intentType, keywordsArray]) => {
        if (Array.isArray(keywordsArray)) {
          keywordsArray.forEach(kw => {
            if (kw && typeof kw === 'object' && kw.keyword) {
              combinedKeywords.push({
                keyword: kw.keyword,
                intent: intentType,
                difficulty: kw.keyword_difficulty || "N/A",
                frequency: "N/A",
                relevance_score: 0,
                search_volume: kw.search_volume || "N/A",
                related_keywords: parsedData.related_keywords || []
              });
            }
          });
        }
      });
    }

    // If no keywords from intent structure, fallback to primary and secondary keywords
    if (combinedKeywords.length === 0) {
      const primaryKeywords = normalizeKeywords(parsedData.primary_keywords);
      const secondaryKeywords = normalizeKeywords(parsedData.secondary_keywords);
      
      [...primaryKeywords, ...secondaryKeywords].forEach(keyword => {
        combinedKeywords.push({
          keyword: keyword,
          intent: "commercial", // default intent
          difficulty: "N/A",
          frequency: "N/A", 
          relevance_score: 0,
          search_volume: "N/A",
          related_keywords: parsedData.related_keywords || []
        });
      });
    }

    return {
      keywords: combinedKeywords,
      summary: {
        primary_keywords: normalizeKeywords(parsedData.primary_keywords),
        secondary_keywords: normalizeKeywords(parsedData.secondary_keywords),
        keyword_gaps: [], // Not provided in the sample
      },
      recommendations: [], // Not provided in the sample
      pages: {}, // Not provided in the sample
      error: null
    };
  } catch (error) {
    console.error("Error processing n8n data:", error.message);
    console.error("Error stack:", error.stack);
    
    const allKeywords = scrapedData.flatMap((r) => r.keywords.map((k) => k.word));
    return {
      keywords: allKeywords.slice(0, 10).map(k => ({
        keyword: k,
        intent: "N/A",
        difficulty: "N/A",
        frequency: "N/A",
        relevance_score: 0,
        search_volume: "N/A",
        related_keywords: []
      })),
      summary: {
        primary_keywords: [...new Set(allKeywords)].slice(0, 10),
        secondary_keywords: [],
        keyword_gaps: [],
      },
      recommendations: [],
      pages: {},
      error: "Could not fetch detailed analysis from Provided URL. Displaying basic keywords.",
    };
  }
}

// --- Save report to MongoDB ---
async function saveReportToDB(reportData) {
  try {
    const report = new KeycheckReport(reportData);
    await report.save();
    console.log(`Report saved successfully with ID: ${reportData.reportId}`);
    return report;
  } catch (error) {
    console.error("Error saving report to database:", error);
    throw error;
  }
}

// --- Main Controller ---
exports.crawlAndScrape = async (req, res) => {
  let browser;
  const startTime = Date.now();
  let reportId;
  
  try {
    const startUrl = req.body.url;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User authentication required" 
      });
    }

    // Check usage limit BEFORE starting the crawl
    const usageCheck = await UsageTracker.checkUsageLimit(userId, 'keyword-check');
    if (!usageCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: usageCheck.message,
        usage: {
          used: usageCheck.used,
          limit: usageCheck.limit,
          remaining: usageCheck.remaining
        }
      });
    }

    if (!startUrl) {
      return res.status(400).json({ success: false, error: "Starting URL is required" });
    }
    try {
      new URL(startUrl);
    } catch {
      return res.status(400).json({ success: false, error: "Invalid URL format" });
    }

    // Generate report ID
    reportId = KeycheckReport.generateReportId();
    
    // Create initial report in database with processing status
    await saveReportToDB({
      user: userId,
      reportId,
      mainUrl: startUrl,
      totalScraped: 0,
      status: 'processing',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Increment usage count BEFORE processing
    await UsageTracker.incrementUsage(userId, 'keyword-check');

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      route: (route) => {
        const type = route.request().resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
          route.abort();
        } else {
          route.continue();
        }
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    const page = await context.newPage();

    const { scrapedResults, totalScraped } = await processCrawlQueue(startUrl, page);

    if (scrapedResults.length === 0) {
      // Update report status to failed
      await KeycheckReport.findOneAndUpdate(
        { reportId, user: userId },
        { 
          status: 'failed',
          updatedAt: new Date(),
          processingTime: Date.now() - startTime
        }
      );
      return res.status(404).json({ success: false, error: "Could not find any content on the provided URL." });
    }

    const n8nData = await sendToN8nAndWait(scrapedResults);

    // Prepare complete report data
    const completeReportData = {
      user: userId,
      reportId,
      mainUrl: startUrl,
      totalScraped,
      keywords: n8nData.keywords,
      summary: n8nData.summary,
      recommendations: n8nData.recommendations,
      pages: scrapedResults,
      analysis: {
        sentToN8n: !n8nData.error,
        dataOptimized: !n8nData.error,
        fallback: !!n8nData.error,
        n8nError: n8nData.error || null
      },
      status: 'completed',
      processingTime: Date.now() - startTime
    };

    // Update the report in database with complete data
    await KeycheckReport.findOneAndUpdate(
      { reportId, user: userId },
      completeReportData,
      { new: true }
    );

    // Get updated usage stats
    const updatedUsage = await UsageTracker.getUsageStats(userId);

    res.status(200).json({
      success: true,
      data: n8nData,
      mainUrl: startUrl,
      totalScraped: totalScraped,
      reportId: reportId,
      usage: updatedUsage.keywordChecks,
      analysis: {
        sentToN8n: !n8nData.error,
        dataOptimized: !n8nData.error,
        fallback: !!n8nData.error,
      },
    });
  } catch (error) {
    console.error("Crawler failed:", error);
    
    // Update report status to failed if reportId exists
    if (reportId) {
      await KeycheckReport.findOneAndUpdate(
        { reportId, user: req.user.id },
        { 
          status: 'failed',
          updatedAt: new Date(),
          processingTime: Date.now() - startTime,
          'analysis.n8nError': error.message
        }
      );
    }
    
    res.status(500).json({ success: false, error: "An internal server error occurred during the crawl." });
  } finally {
    if (browser) await browser.close();
  }
};

// --- Additional controller methods for report management ---

// Get report by ID for the authenticated user
exports.getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User authentication required" 
      });
    }
    
    const report = await KeycheckReport.findOne({ reportId, user: userId });
    
    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }
    
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Get reports by URL for the authenticated user
exports.getReportsByUrl = async (req, res) => {
  try {
    const { url } = req.params;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User authentication required" 
      });
    }

    const { limit = 10, page = 1 } = req.query;
    
    const reports = await KeycheckReport.find({ mainUrl: url, user: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('reportId mainUrl totalScraped status createdAt processingTime');
    
    const total = await KeycheckReport.countDocuments({ mainUrl: url, user: userId });
    
    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Delete report by ID for the authenticated user
exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User authentication required" 
      });
    }
    
    const result = await KeycheckReport.deleteOne({ reportId, user: userId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }
    
    res.status(200).json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Get all reports for the authenticated user with pagination
exports.getAllReports = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User authentication required" 
      });
    }

    const { limit = 10, page = 1, status } = req.query;
    
    const query = { user: userId };
    if (status && ['processing', 'completed', 'failed'].includes(status)) {
      query.status = status;
    }
    
    const reports = await KeycheckReport.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('reportId mainUrl totalScraped status createdAt processingTime');
    
    const total = await KeycheckReport.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching all reports:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};