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

// ---------- Robust AI response parsing helpers ----------
function stripMarkdownFences(s) {
  if (!s || typeof s !== 'string') return s;
  // Remove ```json ... ``` and ``` ... ``` and surrounding fences and extraneous backticks
  let out = s.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  // Also remove single backtick fences if present
  out = out.replace(/`([^`]+)`/g, '$1').trim();
  return out;
}

function tryParseJSONMaybeWrapped(input) {
  // Attempts multiple parsing strategies and returns parsed object or null
  if (input === null || input === undefined) return null;

  // If already an object, return as-is
  if (typeof input === 'object') return input;

  // Convert non-string to string
  let str = typeof input === 'string' ? input : String(input);

  // Remove markdown fences first
  str = stripMarkdownFences(str);

  // Trim common prefixes/suffixes
  str = str.trim();

  // Attempt direct parse
  try {
    return JSON.parse(str);
  } catch (e) {
    // continue with heuristics
  }

  // Sometimes the AI returns JSON inside text; try to find the first { ... } or [ ... ] segment
  const firstJsonMatch = str.match(/({[\s\S]*?\})|(\[[\s\S]*?\])/);
  if (firstJsonMatch) {
    const candidate = firstJsonMatch[0];
    try {
      return JSON.parse(candidate);
    } catch (e) {
      // fallthrough
    }
  }

  // Remove common prefixes like "output:" or "result:" then try parse
  const cleaned = str.replace(/^[\s\S]*?:\s*/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // continue
  }

  // Handle escaped JSON inside string: e.g. "{\"key\":\"value\"}"
  try {
    const unescaped = cleaned.replace(/\\"/g, '"').replace(/\\n/g, '');
    return JSON.parse(unescaped);
  } catch (e) {
    // continue
  }

  // Sometimes it's double-encoded: JSON string inside JSON: try parsing twice
  try {
    const first = JSON.parse(str);
    if (typeof first === 'string') {
      return tryParseJSONMaybeWrapped(first);
    }
    return first;
  } catch (e) {
    // give up
  }

  return null;
}

function sanitizeAndParseAIResponse(responseData) {
  // Accepts: string, object, array-of-objects, axios response.data etc.
  // Returns normalized JS object or throws an Error.
  if (responseData === null || responseData === undefined) {
    throw new Error("Empty response from AI service");
  }

  // If it's an axios-like response with data field, prefer that
  const candidate = (typeof responseData === 'object' && responseData.data) ? responseData.data : responseData;

  // If candidate is an array, try to find a promising slot with 'output' or 'body' fields
  if (Array.isArray(candidate)) {
    for (const item of candidate) {
      // common keys to look for
      if (item && typeof item === 'object') {
        if (item.output) {
          const parsed = tryParseJSONMaybeWrapped(item.output);
          if (parsed) return parsed;
        }
        if (item.body) {
          const parsed = tryParseJSONMaybeWrapped(item.body);
          if (parsed) return parsed;
        }
        // maybe the item is already the parsed object
        if (Object.keys(item).length > 0 && (item.primary_keywords || item.keywords || item.summary || item.output)) {
          return item;
        }
      } else if (typeof item === 'string') {
        const parsed = tryParseJSONMaybeWrapped(item);
        if (parsed) return parsed;
      }
    }
    // fallback: try parse the whole array (maybe it's directly JSON)
    const arrParsed = tryParseJSONMaybeWrapped(JSON.stringify(candidate));
    if (arrParsed) return arrParsed;
  }

  // If candidate is an object, check fields
  if (typeof candidate === 'object') {
    // If object already contains expected keys, return
    if (candidate.primary_keywords || candidate.keywords || candidate.summary) return candidate;

    // Sometimes API returns { output: "```json { ... } ```" }
    if (candidate.output && typeof candidate.output === 'string') {
      const parsed = tryParseJSONMaybeWrapped(candidate.output);
      if (parsed) return parsed;
    }
    if (candidate.body && typeof candidate.body === 'string') {
      const parsed = tryParseJSONMaybeWrapped(candidate.body);
      if (parsed) return parsed;
    }

    // If object contains nested string that looks like JSON, try to parse any string-valued fields
    for (const key of Object.keys(candidate)) {
      if (typeof candidate[key] === 'string') {
        const maybe = tryParseJSONMaybeWrapped(candidate[key]);
        if (maybe) return maybe;
      }
    }

    // finally, return candidate as-is (best effort) if it has any relevant keys
    if (Object.keys(candidate).length > 0) return candidate;
  }

  // If it's a string, attempt parsing
  if (typeof candidate === 'string') {
    const parsed = tryParseJSONMaybeWrapped(candidate);
    if (parsed) return parsed;
  }

  // nothing worked
  throw new Error("Unable to parse AI response into JSON");
}

// ---------- Replace sendToN8nAndWait with this version ----------
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

    // robust parse
    let parsedData = null;
    try {
      parsedData = sanitizeAndParseAIResponse(response.data);
    } catch (parseError) {
      console.error("Primary parse failed, trying fallback heuristics:", parseError.message);
      const asString = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const cleaned = stripMarkdownFences(asString);
      const tryAgain = tryParseJSONMaybeWrapped(cleaned);
      if (tryAgain) parsedData = tryAgain;
      else if (typeof response.data === 'object') parsedData = response.data;
      else throw new Error("Failed to parse any JSON from AI response");
    }

    if (!parsedData || typeof parsedData !== 'object') {
      throw new Error("Parsed AI response invalid");
    }

    // Process and normalize the n8n response to the stable schema
    return processN8nResponse(parsedData, scrapedData);
  } catch (error) {
    console.error("Error processing n8n data:", error.message, error.stack);

    // Fallback: derive basic keyword report from scraped content
    const allKeywords = scrapedData
      .filter(page => page.keywords && page.keywords.length > 0)
      .flatMap(r => r.keywords.map(k => ({ keyword: k.word, count: k.count })));

    const freq = allKeywords.reduce((acc, k) => { acc[k.keyword] = (acc[k.keyword] || 0) + k.count; return acc; }, {});
    const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0, 50);

    const keywords = sorted.map(([kw, count], idx) => ({
      keyword: kw,
      intent: "unknown",
      difficulty: "N/A",
      search_volume: "N/A",
      cpc: "N/A",
      competition: "N/A",
      relevance_score: Math.max(1, Math.min(100, Math.floor((count / 5) * 10))),
      trend: { monthly: [] },
      related_keywords: [],
      serps: []
    }));

    return {
      keywords,
      summary: {
        primary_keywords: keywords.slice(0, 10).map(k => k.keyword),
        secondary_keywords: keywords.slice(10, 25).map(k => k.keyword),
        long_tail_keywords: [],
        total_keywords: keywords.length,
        keyword_intent_breakdown: {}
      },
      recommendations: [
        "AI analysis service unavailable — using on-site extraction.",
        "Run again when AI service is available for richer metrics (volume, difficulty, CPC)."
      ],
      pages: generatePageAnalysis(scrapedData, keywords),
      error: `AI analysis failed: ${error.message}`
    };
  }
}

// ---------- Replace processN8nResponse with this version ----------
function processN8nResponse(parsedData, scrapedData) {
  // Desired final schema:
  // {
  //   keywords: [{ keyword, intent, difficulty, search_volume, cpc, competition, relevance_score, trend, related_keywords, serps }],
  //   summary: { primary_keywords:[], secondary_keywords:[], long_tail_keywords:[], total_keywords, keyword_intent_breakdown:{} },
  //   recommendations: [...],
  //   pages: { url: { title, keyword_count, top_keywords:[], content_score } },
  //   error: null
  // }

  const normalizedKeywords = [];

  // Helper - normalize a keyword entry into our canonical object
  const normalizeKeywordEntry = (k) => {
    if (!k) return null;
    if (typeof k === 'string') {
      return {
        keyword: k,
        intent: "unknown",
        difficulty: "N/A",
        search_volume: "N/A",
        cpc: "N/A",
        competition: "N/A",
        relevance_score: 50,
        trend: { monthly: [] },
        related_keywords: [],
        serps: []
      };
    }
    // assume object
    return {
      keyword: k.keyword || k.text || k.word || null,
      intent: (k.intent || k.search_intent || "unknown").toString().toLowerCase(),
      difficulty: k.difficulty || k.keyword_difficulty || "N/A",
      search_volume: k.search_volume || k.volume || "N/A",
      cpc: k.cpc || k.cost_per_click || "N/A",
      competition: k.competition || k.competitiveness || "N/A",
      relevance_score: (typeof k.relevance_score === 'number') ? k.relevance_score : (k.score || 50),
      trend: k.trend || k.monthly_trend || { monthly: [] },
      related_keywords: k.related_keywords || k.related || [],
      serps: k.serps || k.top_results || []
    };
  };

  // Accept a variety of possible fields from parsedData
  const pickArrays = [
    'keywords', 'key_words', 'primary_keywords', 'primaryKeywords', 'suggested_keywords', 'results'
  ];

  for (const field of pickArrays) {
    const val = parsedData[field];
    if (Array.isArray(val) && val.length > 0) {
      val.forEach(item => {
        const norm = normalizeKeywordEntry(item);
        if (norm && norm.keyword) normalizedKeywords.push(norm);
      });
    }
  }

  // Also check for structured groups: primary/secondary/long_tail
  const pushFromGroup = (groupField, defaultIntent) => {
    const arr = parsedData[groupField] || parsedData[groupField.replace(/_([a-z])/g, (m, c) => c.toUpperCase())];
    if (!arr) return;
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        const norm = normalizeKeywordEntry(item);
        if (norm) {
          // if intent unknown, set from group
          if (!norm.intent || norm.intent === "unknown") norm.intent = defaultIntent;
          normalizedKeywords.push(norm);
        }
      });
    }
  };

  pushFromGroup('primary_keywords', 'commercial');
  pushFromGroup('secondary_keywords', 'commercial');
  pushFromGroup('long_tail_keywords', 'long-tail');
  pushFromGroup('longTailKeywords', 'long-tail');

  // If nothing found yet, attempt to parse raw text blocks (some AIs return {output: "..."})
  if (normalizedKeywords.length === 0) {
    // look for any string fields that might contain JSON
    for (const k of Object.keys(parsedData)) {
      if (typeof parsedData[k] === 'string') {
        const tryParse = tryParseJSONMaybeWrapped(parsedData[k]);
        if (tryParse && (Array.isArray(tryParse) || tryParse.keywords)) {
          return processN8nResponse(tryParse, scrapedData); // recursive - will normalize
        }
      }
    }
  }

  // Deduplicate by keyword (keep highest relevance_score)
  const dedup = new Map();
  normalizedKeywords.forEach(kw => {
    if (!kw || !kw.keyword) return;
    const key = kw.keyword.toLowerCase();
    if (!dedup.has(key) || (kw.relevance_score && kw.relevance_score > dedup.get(key).relevance_score)) {
      dedup.set(key, kw);
    }
  });

  const uniqueKeywords = Array.from(dedup.values());

  // If still empty, fallback to extracted keywords from scrapedData (basic)
  if (uniqueKeywords.length === 0) {
    const fallback = scrapedData
      .filter(p => p.keywords && p.keywords.length)
      .flatMap(p => p.keywords.map(k => ({ keyword: k.word, relevance_score: Math.min(100, k.count * 10) })));
    const map = new Map();
    fallback.forEach(k => map.set(k.keyword.toLowerCase(), {
      keyword: k.keyword,
      intent: "unknown",
      difficulty: "N/A",
      search_volume: "N/A",
      cpc: "N/A",
      competition: "N/A",
      relevance_score: k.relevance_score || 50,
      trend: { monthly: [] },
      related_keywords: [],
      serps: []
    }));
    uniqueKeywords.push(...Array.from(map.values()).slice(0, 50));
  }

  // Ensure each keyword has all fields and types consistent
  const finalKeywords = uniqueKeywords.map(k => ({
    keyword: k.keyword,
    intent: k.intent || "unknown",
    difficulty: k.difficulty || "N/A",
    search_volume: k.search_volume || "N/A",
    cpc: k.cpc || "N/A",
    competition: k.competition || "N/A",
    relevance_score: (typeof k.relevance_score === 'number') ? k.relevance_score : 50,
    trend: k.trend || { monthly: [] },
    related_keywords: Array.isArray(k.related_keywords) ? k.related_keywords : (k.related || []),
    serps: Array.isArray(k.serps) ? k.serps : []
  }));

  // Summary
  const summary = {
    primary_keywords: (parsedData.primary_keywords || parsedData.primaryKeywords || finalKeywords.slice(0, 10).map(k => k.keyword)),
    secondary_keywords: (parsedData.secondary_keywords || parsedData.secondaryKeywords || finalKeywords.slice(10, 30).map(k => k.keyword)),
    long_tail_keywords: (parsedData.long_tail_keywords || parsedData.longTailKeywords || finalKeywords.filter(k => k.intent === 'long-tail').map(k => k.keyword)),
    total_keywords: finalKeywords.length,
    keyword_intent_breakdown: getIntentBreakdown(finalKeywords)
  };

  // Recommendations: prefer AI-provided then generate some heuristics
  const recommendations = parsedData.recommendations || parsedData.advice || [];
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    // Add heuristic recommendations
    const recs = generateRecommendations(finalKeywords, scrapedData);
    recs.forEach(r => recommendations.push(r));
  }

  // Pages analysis (reuse earlier generator but normalized to finalKeywords)
  const pages = generatePageAnalysis(scrapedData, finalKeywords);

  return {
    keywords: finalKeywords,
    summary,
    recommendations,
    pages,
    error: null
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
    const intent = kw.intent || 'unknown';
    acc[intent] = (acc[intent] || 0) + 1;
    return acc;
  }, {});
}

function generatePageAnalysis(scrapedData, keywords) {
  return scrapedData.reduce((acc, page) => {
    if (page.error) return acc;
    
    const pageKeywords = keywords
      .filter(kw => 
        page.content.some(content => 
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
