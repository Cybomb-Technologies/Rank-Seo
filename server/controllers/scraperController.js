// controllers/scraperController.js
const { chromium } = require("playwright");
const { URL } = require("url");
const axios = require("axios");
const KeyScrapeReport = require("../models/keyscrapeReport");
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
  const n8nWebhookUrl = "https://n8n.cybomb.com/webhook/optimize-crawl2";
  try {
    const payload = {
      analysisType: "keyword_and_content_analysis",
      timestamp: new Date().toISOString(),
      totalPages: scrapedData.length,
      data: scrapedData,
    };

    const response = await axios.post(n8nWebhookUrl, payload, { timeout: 220000 });

    if (!response.data || typeof response.data !== 'object' || !response.data.output) {
      console.warn("n8n response is not in the expected format:", response.data);
      throw new Error("Invalid n8n response format.");
    }

    let jsonStr = response.data.output.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.substring(7);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }

    const parsed = JSON.parse(jsonStr);

    const normalizeKeywords = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map((k) => (typeof k === "object" && k !== null ? k.keyword || k.word : typeof k === 'string' ? k : null))
        .filter(Boolean);
    };

    const intentData = parsed.keyword_intent || {};

    return {
      primary_keywords: normalizeKeywords(parsed.primary_keywords),
      secondary_keywords: normalizeKeywords(parsed.secondary_keywords),
      long_tail_keywords: normalizeKeywords(parsed.long_tail_keywords),
      related_keywords: normalizeKeywords(parsed.related_keywords),
      keyword_intent: {
        informational: normalizeKeywords(intentData.informational),
        navigational: normalizeKeywords(intentData.navigational),
        transactional: normalizeKeywords(intentData.transactional),
        commercial: normalizeKeywords(intentData.commercial),
      },
    };
  } catch (error) {
    console.error("Error processing n8n data:", error.message);
    const allKeywords = scrapedData.flatMap((r) => r.keywords.map((k) => k.word));
    return {
      primary_keywords: [...new Set(allKeywords)].slice(0, 10),
      secondary_keywords: [],
      long_tail_keywords: [],
      related_keywords: [],
      keyword_intent: { informational: [], navigational: [], transactional: [], commercial: [] },
      error: "Could not fetch detailed analysis from Provided URL. Displaying basic keywords.",
    };
  }
}

// --- Save Report to Database ---
async function saveScrapeReport(userId, mainUrl, scrapedResults, n8nData, totalScraped) {
  try {
    const domain = new URL(mainUrl).hostname;
    
    const totalKeywordsFound = 
      (n8nData.primary_keywords?.length || 0) +
      (n8nData.secondary_keywords?.length || 0) +
      (n8nData.long_tail_keywords?.length || 0) +
      (n8nData.related_keywords?.length || 0);

    const reportData = {
      user: userId,
      mainUrl,
      domain,
      keywordData: {
        primary_keywords: n8nData.primary_keywords || [],
        secondary_keywords: n8nData.secondary_keywords || [],
        long_tail_keywords: n8nData.long_tail_keywords || [],
        related_keywords: n8nData.related_keywords || [],
        keyword_intent: {
          informational: n8nData.keyword_intent?.informational || [],
          navigational: n8nData.keyword_intent?.navigational || [],
          transactional: n8nData.keyword_intent?.transactional || [],
          commercial: n8nData.keyword_intent?.commercial || [],
        }
      },
      scrapedPages: scrapedResults.map(page => ({
        url: page.url,
        depth: page.depth,
        title: page.title || '',
        content: page.content || [],
        foundLinks: page.foundLinks || 0,
        keywords: page.keywords || [],
        contentLength: page.contentLength || 0,
        wordCount: page.wordCount || 0,
        error: page.error,
        timestamp: page.timestamp ? new Date(page.timestamp) : new Date()
      })),
      totalPagesScraped: totalScraped,
      totalKeywordsFound,
      analysisType: n8nData.error ? 'fallback_analysis' : 'n8n_analysis',
      analysisError: n8nData.error || undefined,
      completedAt: new Date()
    };

    const report = new KeyScrapeReport(reportData);
    await report.save();
    
    return report.reportId;
    
  } catch (error) {
    console.error('Error saving report to database:', error);
    return null;
  }
}

// --- Get Usage Stats ---
exports.getUsageStats = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User authentication required" 
      });
    }

    const usageStats = await UsageTracker.getUsageStats(userId);
    
    res.status(200).json({
      success: true,
      usage: {
        used: usageStats.keywordScrapes?.used || 0,
        limit: usageStats.keywordScrapes?.limit || 10,
        remaining: Math.max(0, (usageStats.keywordScrapes?.limit || 10) - (usageStats.keywordScrapes?.used || 0))
      }
    });
    
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch usage stats" 
    });
  }
};

// --- Main Controller ---
exports.crawlAndScrape = async (req, res) => {
  let browser;
  let reportId = null;
  
  try {
    const startUrl = req.body.url;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User authentication required" 
      });
    }

    // Check usage limit
    const usageCheck = await UsageTracker.checkUsageLimit(userId, 'keyword-scrape');
    if (!usageCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: usageCheck.message,
        usage: {
          used: usageCheck.used,
          limit: usageCheck.limit,
          remaining: Math.max(0, usageCheck.limit - usageCheck.used)
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
      return res.status(404).json({ success: false, error: "Could not find any content on the provided URL." });
    }

    const n8nData = await sendToN8nAndWait(scrapedResults);

    // Save to database with user reference
    reportId = await saveScrapeReport(userId, startUrl, scrapedResults, n8nData, totalScraped);

    // Increment usage
    await UsageTracker.incrementUsage(userId, 'keyword-scrape');

    // Get updated usage stats
    const updatedUsage = await UsageTracker.getUsageStats(userId);

    res.status(200).json({
      success: true,
      data: n8nData,
      mainUrl: startUrl,
      totalScraped: totalScraped,
      reportId: reportId,
      usage: {
        used: updatedUsage.keywordScrapes?.used || 0,
        limit: updatedUsage.keywordScrapes?.limit || 10,
        remaining: Math.max(0, (updatedUsage.keywordScrapes?.limit || 10) - (updatedUsage.keywordScrapes?.used || 0))
      },
      analysis: {
        sentToN8n: !n8nData.error,
        dataOptimized: !n8nData.error,
        fallback: !!n8nData.error,
        savedToDb: !!reportId
      },
    });
    
  } catch (error) {
    console.error("Crawler failed:", error);
    res.status(500).json({ 
      success: false, 
      error: "An internal server error occurred during the crawl.",
      reportId: reportId
    });
  } finally {
    if (browser) await browser.close();
  }
};

// --- Get report by ID for the authenticated user ---
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
    
    const report = await KeyScrapeReport.findOne({ reportId, user: userId });
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: "Report not found" 
      });
    }

    res.status(200).json({
      success: true,
      report: {
        reportId: report.reportId,
        mainUrl: report.mainUrl,
        domain: report.domain,
        keywordData: report.keywordData,
        scrapedPages: report.scrapedPages,
        totalPagesScraped: report.totalPagesScraped,
        totalKeywordsFound: report.totalKeywordsFound,
        analysisType: report.analysisType,
        analysisError: report.analysisError,
        createdAt: report.createdAt,
        completedAt: report.completedAt,
        duration: report.duration
      }
    });
    
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch report" 
    });
  }
};

// --- Get recent reports for a domain for the authenticated user ---
exports.getDomainReports = async (req, res) => {
  try {
    const { domain } = req.params;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User authentication required" 
      });
    }

    const { limit = 5 } = req.query;
    
    const reports = await KeyScrapeReport.findByUserAndDomain(userId, domain, parseInt(limit));
    
    res.status(200).json({
      success: true,
      domain,
      reports
    });
    
  } catch (error) {
    console.error("Error fetching domain reports:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch domain reports" 
    });
  }
};

// --- Get all scraper reports for the authenticated user ---
exports.getAllReports = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User authentication required" 
      });
    }

    const { limit = 10, page = 1 } = req.query;
    
    const reports = await KeyScrapeReport.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('reportId mainUrl domain totalPagesScraped totalKeywordsFound analysisType createdAt completedAt');
    
    const total = await KeyScrapeReport.countDocuments({ user: userId });
    
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
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch reports" 
    });
  }
};

// --- Get reports by URL for the authenticated user ---
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
    
    const reports = await KeyScrapeReport.find({ mainUrl: url, user: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('reportId mainUrl domain totalPagesScraped totalKeywordsFound analysisType createdAt completedAt');
    
    const total = await KeyScrapeReport.countDocuments({ mainUrl: url, user: userId });
    
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
    console.error("Error fetching reports by URL:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch reports" 
    });
  }
};

// --- Delete report by ID for the authenticated user ---
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
    
    const result = await KeyScrapeReport.deleteOne({ reportId, user: userId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Report not found" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Report deleted successfully" 
    });
    
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete report" 
    });
  }
};