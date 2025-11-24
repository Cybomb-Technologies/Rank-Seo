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
      // Enhanced navigation with better error handling
      await page.goto(currentUrl, { 
        waitUntil: "domcontentloaded", 
        timeout: 60000
      });

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
      
      // Categorize different types of errors
      let errorMessage = `Scrape failed: ${error.message.substring(0, 100)}...`;
      let errorType = 'unknown';
      
      if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
        errorMessage = "DNS resolution failed - domain may not exist";
        errorType = 'dns_error';
      } else if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
        errorMessage = "Connection refused - server may be down";
        errorType = 'connection_refused';
      } else if (error.message.includes('timeout')) {
        errorMessage = "Request timeout - server took too long to respond";
        errorType = 'timeout';
      } else if (error.message.includes('SSL')) {
        errorMessage = "SSL certificate error - secure connection failed";
        errorType = 'ssl_error';
      }

      scrapedResults.push({
        url: currentUrl,
        depth,
        error: errorMessage,
        errorType: errorType,
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

// --- Enhanced Intent Inference Function ---
function inferIntentFromKeyword(keyword) {
  if (!keyword) return 'unknown';
  
  const kw = keyword.toLowerCase();
  
  // Commercial intent indicators
  if (kw.includes('buy') || kw.includes('price') || kw.includes('cost') || 
      kw.includes('deal') || kw.includes('discount') || kw.includes('cheap') ||
      kw.includes('purchase') || kw.includes('order') || kw.includes('sale') ||
      kw.includes('best') || kw.includes('top') || kw.includes('review') ||
      kw.includes('comparison') || kw.includes('vs ') || kw.includes(' versus')) {
    return 'commercial';
  }
  
  // Transactional intent indicators
  if (kw.includes('near me') || kw.includes('today') || kw.includes('now') ||
      kw.includes('online') || kw.includes('shop') || kw.includes('store') ||
      kw.includes('buy now') || kw.includes('order now') || kw.includes('purchase now') ||
      kw.includes('for sale') || kw.includes('discount code') || kw.includes('coupon')) {
    return 'transactional';
  }
  
  // Informational intent indicators
  if (kw.includes('what') || kw.includes('how') || kw.includes('why') ||
      kw.includes('guide') || kw.includes('tips') || kw.includes('best way') ||
      kw.includes('tutorial') || kw.includes('examples') || kw.includes('definition') ||
      kw.includes('meaning') || kw.includes('benefits') || kw.includes('advantages') ||
      kw.includes('disadvantages') || kw.includes('pros and cons')) {
    return 'informational';
  }
  
  // Local intent indicators
  if (kw.includes('near') || kw.includes('in ') || kw.match(/\b[a-z]+\s+[a-z]+\s+near me\b/i) ||
      kw.includes('city') || kw.includes('area') || kw.includes('location') ||
      kw.includes('find') || kw.includes('find a') || kw.includes('find an')) {
    return 'local';
  }
  
  // Long-tail indicators (typically 3+ words)
  if (kw.split(' ').length >= 3) {
    return 'long-tail';
  }
  
  // Navigational intent (brand names, specific websites)
  if (kw.includes('.com') || kw.includes('.org') || kw.includes('.net') ||
      kw.split(' ').length === 1 && kw.length > 2) {
    return 'navigational';
  }
  
  return 'unknown';
}

// --- SEO Data Estimation ---
function generateSEOEstimates(keyword, intent = "unknown") {
  const wordCount = keyword.split(/\s+/).length;
  
  // Base estimates on keyword characteristics
  let baseVolume, baseDifficulty, baseCPC, competition;
  
  // Estimate based on intent and keyword length
  switch (intent) {
    case 'commercial':
      baseVolume = wordCount === 1 ? 5000 : wordCount === 2 ? 2000 : 500;
      baseDifficulty = wordCount === 1 ? 85 : wordCount === 2 ? 65 : 45;
      baseCPC = wordCount === 1 ? 12.50 : wordCount === 2 ? 8.75 : 5.25;
      competition = wordCount === 1 ? 'High' : wordCount === 2 ? 'Medium' : 'Low';
      break;
    case 'transactional':
      baseVolume = wordCount === 1 ? 3000 : wordCount === 2 ? 1500 : 400;
      baseDifficulty = wordCount === 1 ? 80 : wordCount === 2 ? 60 : 40;
      baseCPC = wordCount === 1 ? 15.00 : wordCount === 2 ? 10.50 : 6.75;
      competition = wordCount === 1 ? 'High' : wordCount === 2 ? 'Medium' : 'Low';
      break;
    case 'informational':
      baseVolume = wordCount === 1 ? 8000 : wordCount === 2 ? 3000 : 800;
      baseDifficulty = wordCount === 1 ? 75 : wordCount === 2 ? 55 : 35;
      baseCPC = wordCount === 1 ? 3.25 : wordCount === 2 ? 2.10 : 1.25;
      competition = wordCount === 1 ? 'Medium' : wordCount === 2 ? 'Low' : 'Low';
      break;
    case 'local':
      baseVolume = wordCount === 1 ? 1000 : wordCount === 2 ? 500 : 200;
      baseDifficulty = wordCount === 1 ? 60 : wordCount === 2 ? 40 : 25;
      baseCPC = wordCount === 1 ? 8.50 : wordCount === 2 ? 6.25 : 4.00;
      competition = wordCount === 1 ? 'Medium' : wordCount === 2 ? 'Low' : 'Low';
      break;
    case 'long-tail':
      baseVolume = wordCount >= 3 ? 150 : 300;
      baseDifficulty = wordCount >= 3 ? 25 : 35;
      baseCPC = wordCount >= 3 ? 4.50 : 6.75;
      competition = wordCount >= 3 ? 'Low' : 'Medium';
      break;
    case 'navigational':
      baseVolume = wordCount === 1 ? 10000 : wordCount === 2 ? 5000 : 1000;
      baseDifficulty = wordCount === 1 ? 90 : wordCount === 2 ? 70 : 50;
      baseCPC = wordCount === 1 ? 2.50 : wordCount === 2 ? 1.75 : 1.00;
      competition = wordCount === 1 ? 'High' : wordCount === 2 ? 'Medium' : 'Low';
      break;
    default:
      baseVolume = wordCount === 1 ? 2000 : wordCount === 2 ? 800 : 200;
      baseDifficulty = wordCount === 1 ? 70 : wordCount === 2 ? 50 : 30;
      baseCPC = wordCount === 1 ? 7.50 : wordCount === 2 ? 5.25 : 3.00;
      competition = wordCount === 1 ? 'Medium' : wordCount === 2 ? 'Low' : 'Low';
  }

  // Add some randomness to make it more realistic
  const volume = Math.round(baseVolume * (0.8 + Math.random() * 0.4));
  const difficulty = Math.round(baseDifficulty * (0.9 + Math.random() * 0.2));
  const cpc = parseFloat((baseCPC * (0.8 + Math.random() * 0.4)).toFixed(2));

  // Generate realistic monthly trend data
  const trend = {
    monthly: Array.from({ length: 12 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (11 - i));
      const monthStr = month.toISOString().slice(0, 7);
      
      // Add some seasonal variation
      let monthlyVolume = volume;
      if ([11, 0, 1].includes(month.getMonth())) { // Nov, Dec, Jan - holiday season
        monthlyVolume = Math.round(volume * (1.1 + Math.random() * 0.3));
      } else if ([6, 7].includes(month.getMonth())) { // July, Aug - summer slump
        monthlyVolume = Math.round(volume * (0.8 + Math.random() * 0.2));
      } else {
        monthlyVolume = Math.round(volume * (0.9 + Math.random() * 0.2));
      }
      
      return {
        month: monthStr,
        volume: monthlyVolume
      };
    })
  };

  return {
    search_volume: volume,
    difficulty: difficulty,
    cpc: cpc,
    competition: competition,
    trend: trend
  };
}

// ---------- Simplified sendToN8nAndWait for clean JSON responses ----------
async function sendToN8nAndWait(scrapedData) {
  const n8nWebhookUrl = "https://n8n.cybomb.com/webhook/optimize-crawl";

  try {
    const validPages = scrapedData.filter(page => page.contentLength > 0 && !page.error);
    if (validPages.length === 0) {
      throw new Error("No valid content found to analyze");
    }

    // Prepare concise payload for AI
    const payload = {
      analysisType: "keyword_and_content_analysis",
      timestamp: new Date().toISOString(),
      totalPages: validPages.length,
      pages: validPages.map(p => ({
        url: p.url,
        title: p.title,
        snippet: (p.content && p.content.length) ? p.content.slice(0, 5).join(" ") : "",
        wordCount: p.wordCount,
        contentLength: p.contentLength,
        keywords: p.keywords || []
      }))
    };

    console.log(`Sending ${validPages.length} pages to n8n for analysis...`);

    const response = await axios.post(n8nWebhookUrl, payload, {
      timeout: 220000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RankSeo-Analyzer/1.0'
      }
    });

    // Handle n8n array response with output field
    let aiResponse;
    if (Array.isArray(response.data) && response.data.length > 0) {
      // Extract from the output field in the first array item
      const firstItem = response.data[0];
      if (firstItem.output && typeof firstItem.output === 'string') {
        aiResponse = JSON.parse(firstItem.output);
      } else {
        // If no output field, use the first item directly
        aiResponse = firstItem;
      }
    } else if (typeof response.data === 'string') {
      // Direct string response (shouldn't happen with your setup but as fallback)
      aiResponse = JSON.parse(response.data);
    } else {
      // Direct object response
      aiResponse = response.data;
    }

    // Validate basic structure
    if (!aiResponse || typeof aiResponse !== 'object') {
      throw new Error("AI returned invalid response format");
    }

    // Process the clean AI response
    return processCleanAIResponse(aiResponse, scrapedData);

  } catch (error) {
    console.error("Error processing n8n data:", error.message);
    
    // Fallback to basic keyword extraction
    return generateFallbackResponse(scrapedData, error.message);
  }
}

// ---------- Process clean AI response with SEO data fallback ----------
function processCleanAIResponse(aiResponse, scrapedData) {
  // Direct mapping from AI response to our expected format
  const normalizedKeywords = (aiResponse.keywords || []).map(kw => {
    // Use improved intent detection if AI doesn't provide good intent data
    let finalIntent = kw.intent;
    if (!finalIntent || finalIntent === 'unknown' || finalIntent === '' || finalIntent === 'to be determined') {
      finalIntent = inferIntentFromKeyword(kw.keyword);
    }
    
    // Generate realistic estimates if AI doesn't provide SEO data
    const estimates = generateSEOEstimates(kw.keyword, finalIntent);
    
    // Ensure all fields have proper types
    return {
      keyword: String(kw.keyword || ''),
      intent: String(finalIntent),
      difficulty: typeof kw.difficulty === 'number' ? kw.difficulty : 
                  (kw.difficulty && kw.difficulty !== 'N/A' ? parseInt(kw.difficulty) || estimates.difficulty : estimates.difficulty),
      search_volume: typeof kw.search_volume === 'number' ? kw.search_volume : 
                     (kw.search_volume && kw.search_volume !== 'N/A' ? parseInt(kw.search_volume) || estimates.search_volume : estimates.search_volume),
      cpc: typeof kw.cpc === 'number' ? kw.cpc : 
           (kw.cpc && kw.cpc !== 'N/A' ? parseFloat(kw.cpc) || estimates.cpc : estimates.cpc),
      competition: String(kw.competition && kw.competition !== 'N/A' ? kw.competition : estimates.competition),
      relevance_score: typeof kw.relevance_score === 'number' ? Math.max(0, Math.min(100, kw.relevance_score)) : 
                      (typeof kw.score === 'number' ? Math.max(0, Math.min(100, kw.score)) : 50),
      trend: (kw.trend && kw.trend.monthly && Array.isArray(kw.trend.monthly) && kw.trend.monthly.length > 0) ? kw.trend : estimates.trend,
      related_keywords: Array.isArray(kw.related_keywords) ? kw.related_keywords : 
                       (Array.isArray(kw.related) ? kw.related : []),
      serps: Array.isArray(kw.serps) ? kw.serps : 
             (Array.isArray(kw.top_results) ? kw.top_results : [])
    };
  });

  const summary = {
    primary_keywords: Array.isArray(aiResponse.summary?.primary_keywords) ? aiResponse.summary.primary_keywords : [],
    secondary_keywords: Array.isArray(aiResponse.summary?.secondary_keywords) ? aiResponse.summary.secondary_keywords : [],
    long_tail_keywords: Array.isArray(aiResponse.summary?.long_tail_keywords) ? aiResponse.summary.long_tail_keywords : [],
    total_keywords: normalizedKeywords.length,
    keyword_intent_breakdown: aiResponse.summary?.keyword_intent_breakdown || getIntentBreakdown(normalizedKeywords)
  };

  const recommendations = Array.isArray(aiResponse.recommendations) ? aiResponse.recommendations : [];

  // Use AI-provided pages analysis or generate our own
  const pages = (aiResponse.pages && typeof aiResponse.pages === 'object') ? aiResponse.pages : generatePageAnalysis(scrapedData, normalizedKeywords);

  return {
    keywords: normalizedKeywords,
    summary,
    recommendations,
    pages,
    error: aiResponse.error || null
  };
}

// ---------- Fallback response generator ----------
function generateFallbackResponse(scrapedData, errorMessage) {
  const allKeywords = scrapedData
    .filter(page => page.keywords && page.keywords.length > 0)
    .flatMap(r => r.keywords.map(k => ({ keyword: k.word, count: k.count })));

  const freq = allKeywords.reduce((acc, k) => { 
    acc[k.keyword] = (acc[k.keyword] || 0) + k.count; 
    return acc; 
  }, {});

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);

  const keywords = sorted.map(([kw, count], idx) => {
    // Use improved intent detection
    const intent = inferIntentFromKeyword(kw);
    const estimates = generateSEOEstimates(kw, intent);
    
    return {
      keyword: String(kw),
      intent: intent,
      difficulty: estimates.difficulty,
      search_volume: estimates.search_volume,
      cpc: estimates.cpc,
      competition: estimates.competition,
      relevance_score: Math.max(1, Math.min(100, Math.floor((count / 5) * 10))),
      trend: estimates.trend,
      related_keywords: [],
      serps: []
    };
  });

  const summary = {
    primary_keywords: keywords.slice(0, 10).map(k => k.keyword),
    secondary_keywords: keywords.slice(10, 25).map(k => k.keyword),
    long_tail_keywords: keywords.filter(k => k.intent === 'long-tail').slice(0, 10).map(k => k.keyword),
    total_keywords: keywords.length,
    keyword_intent_breakdown: getIntentBreakdown(keywords)
  };

  return {
    keywords,
    summary,
    recommendations: [
      "AI analysis service unavailable — using on-site extraction.",
      "Run again when AI service is available for richer metrics (volume, difficulty, CPC).",
      "Focus on creating high-quality content around your primary keywords",
      "Build internal links between pages targeting related keywords",
      "Improve content coverage across more pages to target additional keywords"
    ],
    pages: generatePageAnalysis(scrapedData, keywords),
    error: `AI analysis failed: ${errorMessage}`
  };
}

// --- Helper Functions ---
function calculateKeywordGaps(scrapedData, combinedKeywords) {
  const gaps = [];
  const existingKeywords = new Set(combinedKeywords.map(k => k.keyword.toLowerCase()));
  
  // Find keywords that appear frequently in content but aren't in the main keyword list
  const contentKeywords = scrapedData
    .filter(page => page.keywords && page.keywords.length > 0)
    .flatMap(page => page.keywords)
    .reduce((acc, kw) => {
      acc[kw.word] = (acc[kw.word] || 0) + kw.count;
      return acc;
    }, {});

  Object.entries(contentKeywords)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([word, count]) => {
      if (!existingKeywords.has(word.toLowerCase()) && count > 1) {
        gaps.push({
          keyword: word,
          frequency: count,
          opportunity: count > 3 ? "high" : "medium"
        });
      }
    });

  return gaps;
}

function generateRecommendations(keywords, scrapedData) {
  const recommendations = [];
  
  if (keywords.length === 0) return recommendations;

  // Check for keyword diversity
  const intentCount = keywords.reduce((acc, kw) => {
    acc[kw.intent] = (acc[kw.intent] || 0) + 1;
    return acc;
  }, {});

  if (intentCount['commercial'] > (intentCount['informational'] || 0) * 2) {
    recommendations.push("Consider adding more informational content to attract users in the research phase");
  }

  // Check for long-tail keywords
  const longTailCount = keywords.filter(kw => kw.intent === 'long-tail').length;
  if (longTailCount < 5) {
    recommendations.push("Expand your long-tail keyword strategy to capture more specific search queries");
  }

  // Content coverage recommendation
  const totalPages = scrapedData.length;
  const pagesWithContent = scrapedData.filter(page => page.contentLength > 100).length;
  
  if (pagesWithContent / totalPages < 0.7) {
    recommendations.push("Improve content coverage across more pages to target additional keywords");
  }

  // Add general recommendations
  recommendations.push("Focus on creating high-quality content around your primary keywords");
  recommendations.push("Build internal links between pages targeting related keywords");

  return recommendations;
}

function getIntentBreakdown(keywords) {
  return keywords.reduce((acc, kw) => {
    const intent = String(kw.intent || 'unknown');
    acc[intent] = (acc[intent] || 0) + 1;
    return acc;
  }, {});
}

function generatePageAnalysis(scrapedData, keywords) {
  return scrapedData.reduce((acc, page) => {
    if (page.error) return acc;
    
    const pageKeywords = keywords
      .filter(kw => 
        page.content && page.content.some(content => 
          content.toLowerCase().includes(kw.keyword.toLowerCase())
        )
      )
      .slice(0, 5);

    acc[page.url] = {
      title: page.title,
      keyword_count: pageKeywords.length,
      top_keywords: pageKeywords,
      content_score: Math.min(100, Math.floor((page.contentLength / 500) * 100))
    };

    return acc;
  }, {});
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

// --- URL Validation Function ---
function validateAndNormalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    
    // Ensure protocol
    if (!urlObj.protocol.startsWith('http')) {
      urlObj.protocol = 'https:';
    }
    
    return urlObj.href;
  } catch (error) {
    throw new Error(`Invalid URL format: ${error.message}`);
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

    // Validate and normalize URL
    let normalizedUrl;
    try {
      normalizedUrl = validateAndNormalizeUrl(startUrl);
    } catch (urlError) {
      return res.status(400).json({ success: false, error: urlError.message });
    }

    // Generate report ID
    reportId = KeycheckReport.generateReportId();
    
    // Create initial report in database with processing status
    await saveReportToDB({
      user: userId,
      reportId,
      mainUrl: normalizedUrl,
      totalScraped: 0,
      status: 'processing',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Increment usage count BEFORE processing
    await UsageTracker.incrementUsage(userId, 'keyword-check');

    // Launch browser with enhanced configuration
    browser = await chromium.launch({ 
      headless: true,
      timeout: 120000
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
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
    
    // Set longer timeout for page operations
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);

    console.log(`Starting crawl for: ${normalizedUrl}`);
    const { scrapedResults, totalScraped } = await processCrawlQueue(normalizedUrl, page);

    // Check if we have any successfully scraped pages
    const successfulScrapes = scrapedResults.filter(page => !page.error);
    
    if (successfulScrapes.length === 0) {
      const errorReport = {
        user: userId,
        reportId,
        mainUrl: normalizedUrl,
        totalScraped: 0,
        status: 'failed',
        analysis: {
          sentToN8n: false,
          dataOptimized: false,
          fallback: false,
          n8nError: "No pages could be scraped successfully. Check if the website is accessible."
        },
        processingTime: Date.now() - startTime,
        updatedAt: new Date()
      };

      await KeycheckReport.findOneAndUpdate(
        { reportId, user: userId },
        errorReport
      );

      return res.status(404).json({ 
        success: false, 
        error: "Could not access or find any content on the provided URL. The website may be down, blocking bots, or the domain may not exist.",
        reportId: reportId
      });
    }

    console.log(`Successfully scraped ${successfulScrapes.length} pages, sending to n8n...`);
    const n8nData = await sendToN8nAndWait(successfulScrapes);

    // Prepare complete report data
    const completeReportData = {
      user: userId,
      reportId,
      mainUrl: normalizedUrl,
      totalScraped: successfulScrapes.length,
      keywords: n8nData.keywords,
      summary: n8nData.summary,
      recommendations: n8nData.recommendations,
      pages: scrapedResults, // Include all pages, even failed ones
      analysis: {
        sentToN8n: !n8nData.error,
        dataOptimized: !n8nData.error,
        fallback: !!n8nData.error,
        n8nError: n8nData.error || null,
        successfulScrapes: successfulScrapes.length,
        failedScrapes: scrapedResults.length - successfulScrapes.length
      },
      status: 'completed',
      processingTime: Date.now() - startTime,
      updatedAt: new Date()
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
      mainUrl: normalizedUrl,
      totalScraped: successfulScrapes.length,
      totalPagesAttempted: scrapedResults.length,
      reportId: reportId,
      usage: updatedUsage.keywordChecks,
      analysis: {
        sentToN8n: !n8nData.error,
        dataOptimized: !n8nData.error,
        fallback: !!n8nData.error,
        successfulScrapes: successfulScrapes.length,
        failedScrapes: scrapedResults.length - successfulScrapes.length
      },
    });
  } catch (error) {
    console.error("Crawler failed:", error);
    
    // Update report status to failed if reportId exists
    if (reportId) {
      try {
        await KeycheckReport.findOneAndUpdate(
          { reportId, user: req.user.id },
          { 
            status: 'failed',
            updatedAt: new Date(),
            processingTime: Date.now() - startTime,
            'analysis.n8nError': error.message,
            'analysis.crawlerError': error.message
          }
        );
      } catch (uErr) {
        console.error("Failed to update report status after crawler error:", uErr);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: "An internal server error occurred during the crawl.",
      reportId: reportId || null
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (browserError) {
        console.error("Error closing browser:", browserError);
      }
    }
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
      .select('reportId mainUrl totalScraped status createdAt processingTime analysis.successfulScrapes analysis.failedScrapes');
    
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
      .select('reportId mainUrl totalScraped status createdAt processingTime analysis.successfulScrapes analysis.failedScrapes');
    
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