"use client";

import { useState, FC, useMemo } from "react";
import axios from "axios";
import Metatags from "../../SEO/metatags";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Define the structure of the data we expect from the API
interface KeywordIntent {
  informational: string[];
  navigational: string[];
  transactional: string[];
  commercial: string[];
}

interface KeywordData {
  primary_keywords: string[];
  secondary_keywords: string[];
  long_tail_keywords: string[];
  related_keywords: string[];
  keyword_intent: KeywordIntent;
  error?: string;
}

interface ApiResponse {
  success: boolean;
  data: KeywordData;
  mainUrl: string;
  totalScraped: number;
  reportId?: string;
  analysis: {
    sentToN8n: boolean;
    dataOptimized: boolean;
    fallback: boolean;
    savedToDb?: boolean;
  };
  error?: string;
}

// Enhanced gradient configurations with teal theme
const keywordGroupConfig = {
  primary_keywords: {
    title: "Primary Keywords",
    color: "bg-gradient-to-r from-teal-500 to-teal-600",
    description: "Core topics your content revolves around.",
    icon: "⭐",
  },
  secondary_keywords: {
    title: "Secondary Keywords",
    color: "bg-gradient-to-r from-teal-400 to-teal-500",
    description: "Supporting terms that add context to primary keywords.",
    icon: "🎯",
  },
  long_tail_keywords: {
    title: "Long Tail Keywords",
    color: "bg-gradient-to-r from-cyan-500 to-teal-500",
    description: "More specific, multi-word phrases indicating higher intent.",
    icon: "📈",
  },
  related_keywords: {
    title: "Related Keywords",
    color: "bg-gradient-to-r from-emerald-500 to-teal-500",
    description:
      "Semantically linked terms that can broaden your content's reach.",
    icon: "🔗",
  },
};

const intentGroupConfig = {
  informational: {
    title: "Informational",
    color: "bg-gradient-to-r from-teal-400 to-cyan-500",
    description: "Keywords used when searching for information or answers.",
    icon: "🔍",
  },
  navigational: {
    title: "Navigational",
    color: "bg-gradient-to-r from-teal-500 to-blue-500",
    description: "Keywords used to find a specific website or page.",
    icon: "🧭",
  },
  transactional: {
    title: "Transactional",
    color: "bg-gradient-to-r from-teal-600 to-emerald-500",
    description: "Keywords indicating a strong intent to make a purchase.",
    icon: "💰",
  },
  commercial: {
    title: "Commercial",
    color: "bg-gradient-to-r from-cyan-600 to-teal-500",
    description: "Keywords showing interest in specific products or services.",
    icon: "🛒",
  },
};

// Enhanced KeywordChip component
const KeywordChip: FC<{ keyword: string; color: string }> = ({
  keyword,
  color,
}) => (
  <span
    className={`inline-block ${color} text-white text-sm font-semibold px-3 py-2 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 hover:shadow-xl hover:brightness-110`}
  >
    {keyword}
  </span>
);

// Enhanced KeywordGroup component
const KeywordGroup: FC<{
  title: string;
  keywords?: string[];
  color: string;
  description: string;
  icon: string;
  animationDelay?: number;
}> = ({ title, keywords, color, description, icon, animationDelay = 0 }) => {
  return (
    <div
      className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-5 transform transition-all duration-500 hover:shadow-3xl hover:-translate-y-1"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center shadow-lg`}
        >
          <span className="text-white font-bold text-md">{icon}</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </div>
      {!keywords || keywords.length === 0 ? (
        <div className="text-center py-4">
          <div className="text-3xl mb-1 text-gray-300">🔍</div>
          <p className="text-gray-400 italic text-sm">No keywords found</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, idx) => (
            <KeywordChip key={idx} keyword={kw} color={color} />
          ))}
        </div>
      )}
    </div>
  );
};

// Enhanced Stats Card Component
const StatsCard: FC<{
  title: string;
  value: string | number;
  description: string;
  color: string;
  icon: string;
}> = ({ title, value, description, color, icon }) => (
  <div className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-4 text-center transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
    <div
      className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg`}
    >
      <span className="text-white font-bold text-md">{icon}</span>
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
    <h3 className="text-sm font-semibold text-gray-800 mb-1">{title}</h3>
    <p className="text-xs text-gray-600">{description}</p>
  </div>
);

// Main Scraper Page component
export default function ScraperPage() {
  const [url, setUrl] = useState<string>("");
  const [jsonResult, setJsonResult] = useState<KeywordData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapeInfo, setScrapeInfo] = useState<{
    url: string;
    count: number;
    reportId?: string;
  } | null>(null);
  const [showAnimations, setShowAnimations] = useState(false);

  // Get token from localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  const handleCrawl = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL.");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("Please log in to use this feature.");
      return;
    }

    setLoading(true);
    setError(null);
    setJsonResult(null);
    setScrapeInfo(null);
    setShowAnimations(false);

    try {
      const response = await axios.post<ApiResponse>(
        `${API_URL}/api/crawl`,
        { url },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data?.success && response.data.data) {
        setJsonResult(response.data.data);
        setScrapeInfo({
          url: response.data.mainUrl,
          count: response.data.totalScraped,
          reportId: response.data.reportId,
        });
        setTimeout(() => setShowAnimations(true), 500);
      } else {
        setError(
          response.data.error || "An unexpected API response was received."
        );
      }
    } catch (err: any) {
      console.error("Crawl error:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      const errorMessage =
        err.response?.data?.error ||
        "Failed to fetch data. The server might be down or the URL is unreachable.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCrawl();
    }
  };

  const getTotalKeywordCount = (data: KeywordData | null): number => {
    if (!data) return 0;
    return (
      (data.primary_keywords?.length || 0) +
      (data.secondary_keywords?.length || 0) +
      (data.long_tail_keywords?.length || 0) +
      (data.related_keywords?.length || 0)
    );
  };

  const totalKeywordCount = useMemo(
    () => getTotalKeywordCount(jsonResult),
    [jsonResult]
  );

  const metaPropsData = {
    title: "SEO Keyword Extractor Tool | AI-Powered Keyword Analysis",
    description:
      "Extract and analyze keywords from any website with AI-powered SEO tools. Get primary, secondary, long-tail keywords and search intent analysis.",
    keyword:
      "keyword extractor, SEO keyword tool, keyword analysis, keyword research, search intent analysis",
    url: "https://rankseo.in/scraper",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 py-28 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
        {/* Enhanced Animated Background with teal theme */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          {/* Multi-color gradient orbs */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-r from-teal-400/30 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-r from-blue-400/30 to-teal-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-gradient-to-r from-emerald-400/20 to-teal-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          <div className="absolute bottom-1/4 right-1/3 w-32 h-32 bg-gradient-to-r from-cyan-400/20 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1500"></div>

          {/* Animated grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24px,#000_25px,transparent_26px)] bg-[length:50px_50px]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(transparent_24px,#000_25px,transparent_26px)] bg-[length:50px_50px]"></div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Enhanced Header */}
          <header className="text-center mb-8 relative">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2 relative">
              SEO Keyword Extractor
              <span className="absolute -top-1 -right-4 text-teal-400 text-xl">
                ✨
              </span>
            </h1>

            <div className="text-base text-gray-600 max-w-xl mx-auto relative">
              <p className="mb-1">
                Enter a website URL to crawl and analyze its complete keyword
                landscape
              </p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full mx-auto"></div>
            </div>
          </header>

          <main>
            {/* Enhanced Input Section */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-10 relative">
              <div className="relative flex-1 group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600 text-base z-10">
                    🔗
                  </span>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 text-base text-gray-700 bg-white/95 backdrop-blur-lg border-0 rounded-xl shadow-xl focus:ring-2 focus:ring-teal-300 transition-all duration-300"
                  />
                </div>
              </div>

              <button
                onClick={handleCrawl}
                disabled={loading}
                className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-xl shadow-xl relative overflow-hidden group transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                {loading ? (
                  <>
                    <span className="animate-spin inline-block mr-2">⏳</span>
                    <span className="relative z-10">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span className="mr-2 relative z-10">🔎</span>
                    <span className="relative z-10">Analyze</span>
                  </>
                )}
              </button>
            </div>

            {/* Empty Space Content */}
            {!loading && !jsonResult && !error && (
              <div className="max-w-4xl mx-auto mb-12">
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3">
                    Ready to Discover Keywords?
                  </h2>
                </div>
                {/* Call to Action */}
                <div className="text-center mt-10">
                  <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-200/50 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Start Your SEO Journey Today
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Unlock the power of data-driven keyword research to boost
                      your search engine rankings and drive targeted traffic to
                      your website.
                    </p>
                  </div>
                </div>
                {/* Additional Features Section */}
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-white font-bold text-lg">🚀</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          AI-Powered Analysis
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Our advanced AI algorithms analyze website content,
                          meta tags, and structure to extract the most relevant
                          keywords for your SEO strategy.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-white font-bold text-lg">📊</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Comprehensive Reports
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Get detailed insights including primary keywords,
                          search intent analysis, long-tail variations, and
                          competitive keyword opportunities.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Messages */}
            {error && (
              <div className="mt-4 flex items-center justify-center text-red-600 bg-red-50/95 backdrop-blur-lg p-3 rounded-xl border border-red-200 max-w-2xl mx-auto shadow-lg transform transition-all duration-300">
                <span className="mr-2">❌</span>
                <p className="font-medium text-sm">{error}</p>
              </div>
            )}

            {jsonResult?.error && (
              <div
                className="bg-yellow-100/95 backdrop-blur-lg border-l-4 border-yellow-500 text-yellow-800 p-3 rounded-xl shadow-lg mb-4 max-w-2xl mx-auto"
                role="alert"
              >
                <p className="font-bold text-sm">Analysis Notice</p>
                <p className="text-sm">{jsonResult.error}</p>
              </div>
            )}

            {/* Results Section */}
            {!loading && jsonResult && (
              <div className="space-y-6">
                {/* Enhanced Header Stats */}
                {scrapeInfo && (
                  <div
                    className={`bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-6 transition-all duration-700 transform ${
                      showAnimations
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-8"
                    }`}
                  >
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        Analysis Complete! 🎉
                      </h2>
                      <p className="text-gray-600 text-sm">
                        Successfully analyzed{" "}
                        <strong className="text-teal-600">
                          {scrapeInfo.url}
                        </strong>
                      </p>
                      {/* {scrapeInfo.reportId && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200 rounded-lg">
                        <span className="text-teal-600 text-xs">Report ID:</span>
                        <code className="text-teal-800 text-xs font-mono bg-teal-100 px-2 py-1 rounded">
                          {scrapeInfo.reportId}
                        </code>
                      </div>
                    )} */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <StatsCard
                        title="Pages Scanned"
                        value={scrapeInfo.count}
                        description="Total pages analyzed"
                        color="bg-gradient-to-r from-teal-400 to-cyan-400"
                        icon="📄"
                      />
                      <StatsCard
                        title="Total Keywords"
                        value={totalKeywordCount}
                        description="Keywords identified"
                        color="bg-gradient-to-r from-cyan-400 to-teal-400"
                        icon="🔑"
                      />
                      <StatsCard
                        title="Search Intents"
                        value={4}
                        description="Different search intent types"
                        color="bg-gradient-to-r from-teal-500 to-cyan-500"
                        icon="🎯"
                      />
                    </div>
                  </div>
                )}

                {/* Enhanced Keyword Categories */}
                <div
                  className={`transition-all duration-700 delay-200 ${
                    showAnimations
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center border-b pb-2 border-gray-200">
                    Keyword Analysis 📊
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(keywordGroupConfig).map(
                      ([key, config], index) => (
                        <KeywordGroup
                          key={key}
                          title={config.title}
                          keywords={
                            jsonResult[key as keyof KeywordData] as string[]
                          }
                          color={config.color}
                          description={config.description}
                          icon={config.icon}
                          animationDelay={index * 100}
                        />
                      )
                    )}
                  </div>
                </div>

                {/* Enhanced Search Intent Section */}
                <div
                  className={`transition-all duration-700 delay-400 ${
                    showAnimations
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center border-b pb-2 border-gray-200">
                    Search Intent Analysis 🎯
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(intentGroupConfig).map(
                      ([key, config], index) => (
                        <KeywordGroup
                          key={key}
                          title={config.title}
                          keywords={
                            jsonResult.keyword_intent[
                              key as keyof KeywordIntent
                            ]
                          }
                          color={config.color}
                          description={config.description}
                          icon={config.icon}
                          animationDelay={index * 100 + 400}
                        />
                      )
                    )}
                  </div>
                </div>

                {/* Enhanced Success Animation */}
                {showAnimations && (
                  <div className="text-center py-6 transition-all duration-1000">
                    <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl mb-3 shadow-xl border border-white/20">
                      <div className="relative">
                        <div className="absolute inset-0 bg-teal-400/20 rounded-full animate-ping"></div>
                        <span className="text-3xl relative z-10 text-teal-500">
                          ✅
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                      Analysis Complete!
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Your comprehensive keyword analysis is ready for review.
                    </p>

                    <div className="max-w-md mx-auto bg-gray-200 rounded-full h-1.5 mb-3 overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 h-1.5 rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      Ready to optimize your SEO strategy
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Loading Animation */}
            {loading && (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto mb-4">
                  <div className="bg-gray-200 rounded-full h-1.5 shadow-inner overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 h-1.5 rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="animate-spin text-xl text-teal-500">⏳</span>
                  <h3 className="text-lg font-bold text-gray-900">
                    Analyzing Website
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Scanning pages and extracting keywords...
                </p>
                <div className="mt-3 flex justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
                      style={{
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: "1.5s",
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>

        <style jsx>{`
          @keyframes loading {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}</style>
      </div>
    </>
  );
}
