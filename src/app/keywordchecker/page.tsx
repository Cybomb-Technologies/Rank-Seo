"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Loader2,
  LinkIcon,
  XCircle,
  Star,
  TrendingUp,
  Target,
  Zap,
  Lightbulb,
  Search,
  BarChart,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import axios from "axios";
import Metatags from "../../SEO/metatags";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Define the structure of the data we expect from the backend API
interface Keyword {
  keyword: string;
  intent: string;
  difficulty: number;
  frequency?: string;
  relevance_score: number;
  search_volume: number;
  cpc?: number;
  competition?: string;
  related_keywords: string[];
  trend?: any;
  serps?: any[];
}

interface KeywordSummary {
  primary_keywords: string[];
  secondary_keywords: string[];
  long_tail_keywords: string[];
  total_keywords: number;
  keyword_intent_breakdown: Record<string, number>;
}

interface SEOData {
  url: string;
  pages?: any;
  keywords: Keyword[];
  summary: KeywordSummary;
  recommendations: string[];
  error?: string;
  analysis?: any;
  totalScraped?: number;
  totalPagesAttempted?: number;
  successfulScrapes?: number;
}

interface ApiResponse {
  success: boolean;
  data: SEOData;
  mainUrl: string;
  totalScraped: number;
  totalPagesAttempted: number;
  reportId: string;
  usage: any;
  analysis: {
    sentToN8n: boolean;
    dataOptimized: boolean;
    fallback: boolean;
    successfulScrapes: number;
    failedScrapes: number;
  };
}

export default function KeywordAnalyzer() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [responseData, setResponseData] = useState<ApiResponse | null>(null);
  const [showAnimations, setShowAnimations] = useState(false);
  const [expandedKeywords, setExpandedKeywords] = useState<{
    [key: number]: boolean;
  }>({});
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Get token from localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  useEffect(() => {
    if (seoData) {
      const timer = setTimeout(() => {
        setShowAnimations(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [seoData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!url) {
      setError("Please enter a valid URL.");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("Please log in to use this feature.");
      return;
    }

    setLoading(true);
    setError("");
    setSeoData(null);
    setResponseData(null);
    setShowAnimations(false);
    setExpandedKeywords({});

    try {
      const response = await axios.post(
        `${API_URL}/api/keychecker`,
        { url },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success && response.data.data) {
        setResponseData(response.data);
        setSeoData({
          ...response.data.data,
          url: response.data.mainUrl,
          totalScraped: response.data.totalScraped,
          successfulScrapes: response.data.analysis?.successfulScrapes,
        });
      } else {
        setError(
          response.data.error || "An unexpected API response was received."
        );
      }
    } catch (err: any) {
      console.error("Error fetching SEO data:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      if (err.response?.status === 403) {
        const errorData = err.response.data;
        setError(
          errorData.error || "Usage limit reached. Please upgrade your plan."
        );
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

  const getDifficultyColor = (difficulty: number) => {
    // Convert number to string category
    let difficultyCategory = "medium";
    if (difficulty >= 70) {
      difficultyCategory = "hard";
    } else if (difficulty >= 40) {
      difficultyCategory = "medium";
    } else {
      difficultyCategory = "easy";
    }

    switch (difficultyCategory) {
      case "easy":
        return "bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg shadow-green-200";
      case "medium":
        return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg shadow-yellow-200";
      case "hard":
        return "bg-gradient-to-r from-red-400 to-red-500 text-white shadow-lg shadow-red-200";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-200";
    }
  };

  const getDifficultyText = (difficulty: number): string => {
    if (difficulty >= 70) {
      return "Hard";
    } else if (difficulty >= 40) {
      return "Medium";
    } else {
      return "Easy";
    }
  };

  const getIntentColor = (intent: string) => {
    const normalizedIntent = intent.toLowerCase();
    switch (normalizedIntent) {
      case "commercial":
        return "bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-200";
      case "informational":
        return "bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg shadow-purple-200";
      case "navigational":
        return "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-200";
      case "transactional":
        return "bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg shadow-green-200";
      case "local":
        return "bg-gradient-to-r from-indigo-400 to-indigo-500 text-white shadow-lg shadow-indigo-200";
      case "long-tail":
        return "bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg shadow-pink-200";
      case "unknown":
      case "to be determined":
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-200";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-200";
    }
  };

  const getIntentText = (intent: string): string => {
    const normalizedIntent = intent.toLowerCase();

    // Map intent values to more user-friendly display text
    const intentMap: Record<string, string> = {
      commercial: "Commercial",
      informational: "Informational",
      navigational: "Navigational",
      transactional: "Transactional",
      local: "Local",
      "long-tail": "Long Tail",
      long_tail: "Long Tail",
      unknown: "To Be Determined",
      "to be determined": "To Be Determined",
      "": "To Be Determined",
    };

    return intentMap[normalizedIntent] || "To Be Determined";
  };

  // Enhanced function to determine intent based on keyword characteristics
  const inferIntentFromKeyword = (keyword: string): string => {
    if (!keyword) return "unknown";

    const kw = keyword.toLowerCase();

    // Commercial intent indicators
    if (
      kw.includes("buy") ||
      kw.includes("price") ||
      kw.includes("cost") ||
      kw.includes("deal") ||
      kw.includes("discount") ||
      kw.includes("cheap") ||
      kw.includes("purchase") ||
      kw.includes("order") ||
      kw.includes("sale") ||
      kw.includes("best") ||
      kw.includes("top") ||
      kw.includes("review") ||
      kw.includes("comparison") ||
      kw.includes("vs ") ||
      kw.includes(" versus")
    ) {
      return "commercial";
    }

    // Transactional intent indicators
    if (
      kw.includes("near me") ||
      kw.includes("today") ||
      kw.includes("now") ||
      kw.includes("online") ||
      kw.includes("shop") ||
      kw.includes("store") ||
      kw.includes("buy now") ||
      kw.includes("order now") ||
      kw.includes("purchase now") ||
      kw.includes("for sale") ||
      kw.includes("discount code") ||
      kw.includes("coupon")
    ) {
      return "transactional";
    }

    // Informational intent indicators
    if (
      kw.includes("what") ||
      kw.includes("how") ||
      kw.includes("why") ||
      kw.includes("guide") ||
      kw.includes("tips") ||
      kw.includes("best way") ||
      kw.includes("tutorial") ||
      kw.includes("examples") ||
      kw.includes("definition") ||
      kw.includes("meaning") ||
      kw.includes("benefits") ||
      kw.includes("advantages") ||
      kw.includes("disadvantages") ||
      kw.includes("pros and cons")
    ) {
      return "informational";
    }

    // Local intent indicators
    if (
      kw.includes("near") ||
      kw.includes("in ") ||
      kw.match(/\b[a-z]+\s+[a-z]+\s+near me\b/i) ||
      kw.includes("city") ||
      kw.includes("area") ||
      kw.includes("location") ||
      kw.includes("find") ||
      kw.includes("find a") ||
      kw.includes("find an")
    ) {
      return "local";
    }

    // Long-tail indicators (typically 3+ words)
    if (kw.split(" ").length >= 3) {
      return "long-tail";
    }

    // Navigational intent (brand names, specific websites)
    if (
      kw.includes(".com") ||
      kw.includes(".org") ||
      kw.includes(".net") ||
      (kw.split(" ").length === 1 && kw.length > 2)
    ) {
      return "navigational";
    }

    return "unknown";
  };

  // Function to get the best intent for display
  const getDisplayIntent = (keyword: string, backendIntent: string): string => {
    // If backend provides a valid intent, use it
    if (
      backendIntent &&
      backendIntent !== "unknown" &&
      backendIntent !== "to be determined" &&
      backendIntent !== ""
    ) {
      return backendIntent;
    }

    // Otherwise, infer from keyword
    return inferIntentFromKeyword(keyword);
  };

  const toggleKeywordExpansion = (index: number) => {
    setExpandedKeywords((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const cleanText = (text: string) => {
    return text.replace(/\*\*/g, "");
  };

  // Use the totalScraped count from the backend response
  const getTotalPageCount = (data: SEOData | null): number => {
    return (
      data?.totalScraped ||
      data?.successfulScrapes ||
      responseData?.totalScraped ||
      responseData?.analysis?.successfulScrapes ||
      0
    );
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const metaPropsData = {
    title: "Rank SEO Keyword Research Tool - Advanced Keyword Analysis",
    description:
      "Perform comprehensive keyword analysis with AI-powered insights. Get search volume data, difficulty scores, and optimization recommendations for better SEO.",
    keyword:
      "free keyword research tool, free keyword analysis tool, keyword planner free, seo keyword analysis, keyword search volumes, seo and keyword search",
    url: "https://rankseo.in/keywordchecker",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen pt-30 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 py-28 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
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
          <div className="text-center mb-8 relative">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2 relative">
              AI Keyword Analysis Tool
              <Sparkles className="absolute -top-1 -right-4 w-4 h-4 text-teal-400" />
            </h1>

            <div className="text-base text-gray-600 max-w-xl mx-auto relative">
              <p className="mb-1">
                Deep dive into keyword analysis with AI-powered insights for
                superior SEO performance
              </p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full mx-auto"></div>
            </div>
          </div>

          {/* Enhanced Input Section */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-10 relative"
          >
            <div className="relative flex-1 group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600 h-5 w-5 z-10" />
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 h-12 text-base bg-white/95 backdrop-blur-lg border-0 rounded-xl shadow-xl focus:ring-2 focus:ring-teal-300 transition-all duration-300"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-12 text-base shadow-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-xl relative overflow-hidden group transition-all duration-300 transform hover:scale-105"
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin relative z-10" />
                  <span className="relative z-10">Analyzing Keywords...</span>
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4 relative z-10" />
                  <span className="relative z-10">Start Analysis</span>
                </>
              )}
            </Button>
          </form>

          {/* Empty Space Content - Keyword Analysis Focused */}
          {!loading && !seoData && !error && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3">
                  Start Your Keyword Analysis Journey
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Enter any website URL to perform comprehensive keyword
                  analysis and uncover optimization opportunities
                </p>
              </div>

              {/* Keyword Analysis Features */}
              <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        AI-Powered Analysis
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Our advanced AI algorithms analyze website content, meta
                        tags, and structure to extract the most relevant
                        keywords for your SEO strategy.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Comprehensive Reports
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Get detailed insights including primary keywords, search
                        intent analysis, long-tail variations, and competitive
                        keyword opportunities.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Analysis Features */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-lg">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">
                      Search Intent Analysis
                    </h4>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Categorize keywords by intent: informational, navigational,
                    commercial, and transactional for targeted content strategy.
                  </p>
                </div>

                <div className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">
                      Performance Metrics
                    </h4>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Get detailed metrics including search volume, difficulty
                    scores, and relevance ratings for each keyword.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center justify-center text-red-600 bg-red-50/95 backdrop-blur-lg p-3 rounded-xl border border-red-200 max-w-2xl mx-auto shadow-lg transform transition-all duration-300">
              <XCircle className="h-4 w-4 mr-2" />
              <p className="font-medium text-sm">{error}</p>
            </div>
          )}

          {seoData && (
            <div className="space-y-6">
              {/* Enhanced Header Stats */}
              <div
                className={`bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-6 transition-all duration-700 transform ${
                  showAnimations
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
              >
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Keyword Analysis Complete! 🎉
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Comprehensive analysis of{" "}
                    <strong className="text-teal-600">{seoData.url}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    {
                      icon: FileText,
                      label: "Pages Analyzed",
                      value: getTotalPageCount(seoData),
                      color: "bg-gradient-to-r from-teal-400 to-cyan-400",
                      description: "Total pages scanned",
                    },
                    {
                      icon: Target,
                      label: "Keywords Found",
                      value: seoData.keywords?.length || 0,
                      color: "bg-gradient-to-r from-cyan-400 to-teal-400",
                      description: "Unique keywords",
                    },
                    {
                      icon: Star,
                      label: "Primary Keywords",
                      value: seoData.summary?.primary_keywords?.length || 0,
                      color: "bg-gradient-to-r from-teal-500 to-cyan-500",
                      description: "Core focus terms",
                    },
                    {
                      icon: TrendingUp,
                      label: "Optimization Tips",
                      value: seoData.recommendations?.length || 0,
                      color: "bg-gradient-to-r from-cyan-500 to-teal-500",
                      description: "Actionable insights",
                    },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="text-center p-4 bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                    >
                      <div
                        className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg`}
                      >
                        <stat.icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        {stat.value}
                      </p>
                      <h3 className="text-sm font-semibold text-gray-800 mb-1">
                        {stat.label}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {stat.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Keyword Analysis - FIXED HEADER */}
              <Card
                className={`shadow-2xl bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl transition-all duration-700 delay-200 transform ${
                  showAnimations
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                } overflow-hidden`}
              >
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Search className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        In-Depth Keyword Analysis
                      </h3>
                      <p className="text-teal-100 text-sm mt-1">
                        Comprehensive breakdown of each keyword with detailed
                        metrics and insights
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-0">
                  {seoData.keywords?.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
                      {seoData.keywords.map((kw, i) => {
                        // Use the improved intent detection
                        const displayIntent = getDisplayIntent(
                          kw.keyword,
                          kw.intent
                        );

                        return (
                          <Card
                            key={i}
                            className="group hover:shadow-2xl transition-all duration-500 border border-gray-200 hover:border-teal-300 relative overflow-hidden transform hover:-translate-y-1 cursor-pointer bg-white/95 backdrop-blur-lg"
                            onMouseEnter={() => setHoveredCard(100 + i)}
                            onMouseLeave={() => setHoveredCard(null)}
                          >
                            <div
                              className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-cyan-400 transition-transform duration-300 ${
                                hoveredCard === 100 + i
                                  ? "scale-x-100"
                                  : "scale-x-0"
                              }`}
                            ></div>
                            <CardHeader className="pb-4">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-bold capitalize text-gray-900 group-hover:text-teal-700 transition-colors flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-teal-500" />
                                  {kw.keyword}
                                </CardTitle>
                                <div className="flex gap-2">
                                  <Badge
                                    className={`${getIntentColor(
                                      displayIntent
                                    )} transition-transform duration-300 hover:scale-105`}
                                  >
                                    {getIntentText(displayIntent)}
                                  </Badge>
                                  {typeof kw.difficulty === "number" && (
                                    <Badge
                                      className={`${getDifficultyColor(
                                        kw.difficulty
                                      )} transition-transform duration-300 hover:scale-105`}
                                    >
                                      {getDifficultyText(kw.difficulty)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {kw.relevance_score > 0 && (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">
                                      Relevance Score
                                    </span>
                                    <span className="font-bold text-gray-900">
                                      {kw.relevance_score}%
                                    </span>
                                  </div>
                                  <Progress
                                    value={kw.relevance_score}
                                    className="w-full h-2 bg-gray-200"
                                  />
                                </div>
                              )}
                              {typeof kw.search_volume === "number" &&
                                kw.search_volume > 0 && (
                                  <div className="flex justify-between items-center p-2 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                      <BarChart3 className="h-4 w-4 text-blue-500" />
                                      Monthly Search Volume
                                    </span>
                                    <span className="font-bold text-gray-900 flex items-center gap-1">
                                      {formatNumber(kw.search_volume)}
                                    </span>
                                  </div>
                                )}
                              {typeof kw.difficulty === "number" && (
                                <div className="flex justify-between items-center p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <Target className="h-4 w-4 text-amber-500" />
                                    Keyword Difficulty
                                  </span>
                                  <span className="font-bold text-gray-900">
                                    {kw.difficulty}/100
                                  </span>
                                </div>
                              )}
                              {typeof kw.cpc === "number" && kw.cpc > 0 && (
                                <div className="flex justify-between items-center p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                    Avg. CPC
                                  </span>
                                  <span className="font-bold text-gray-900">
                                    ${kw.cpc.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              {kw.competition && (
                                <div className="flex justify-between items-center p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <BarChart className="h-4 w-4 text-purple-500" />
                                    Competition
                                  </span>
                                  <span className="font-bold text-gray-900 capitalize">
                                    {kw.competition.toLowerCase()}
                                  </span>
                                </div>
                              )}
                              {kw.related_keywords &&
                                kw.related_keywords.length > 0 && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-700 block mb-2">
                                      Related Keywords
                                    </span>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {kw.related_keywords
                                        .slice(
                                          0,
                                          expandedKeywords[i]
                                            ? kw.related_keywords.length
                                            : 4
                                        )
                                        .map((related, idx) => (
                                          <Badge
                                            key={idx}
                                            variant="outline"
                                            className="text-xs border-teal-200 text-teal-700 bg-teal-50 transition-all duration-300 hover:bg-teal-100 hover:scale-105"
                                          >
                                            {related}
                                          </Badge>
                                        ))}
                                    </div>
                                    {kw.related_keywords.length > 4 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 p-1 h-auto w-full border border-dashed border-teal-200"
                                        onClick={() =>
                                          toggleKeywordExpansion(i)
                                        }
                                      >
                                        {expandedKeywords[i] ? (
                                          <>
                                            <ChevronUp className="h-3 w-3 mr-1" />
                                            Show Less
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="h-3 w-3 mr-1" />
                                            +{kw.related_keywords.length - 4}{" "}
                                            more keywords
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">
                        No keywords found for this URL.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Keyword Categories Analysis - FIXED HEADERS */}
              {seoData.summary && (
                <div
                  className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-700 delay-400 ${
                    showAnimations
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                >
                  {[
                    {
                      title: "Primary Keywords",
                      icon: Star,
                      keywords: seoData.summary.primary_keywords,
                      gradient: "from-teal-500 to-teal-600",
                      bgGradient: "from-teal-50 to-teal-100",
                      description: "Core terms driving your content strategy",
                    },
                    {
                      title: "Secondary Keywords",
                      icon: Target,
                      keywords: seoData.summary.secondary_keywords,
                      gradient: "from-cyan-500 to-teal-500",
                      bgGradient: "from-cyan-50 to-teal-100",
                      description: "Supporting terms for content depth",
                    },
                    {
                      title: "Long-tail Keywords",
                      icon: Zap,
                      keywords: seoData.summary.long_tail_keywords,
                      gradient: "from-amber-500 to-amber-600",
                      bgGradient: "from-amber-50 to-amber-100",
                      description: "Specific, low-competition terms",
                    },
                  ].map((section, index) => (
                    <Card
                      key={index}
                      className="shadow-2xl bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer overflow-hidden"
                      onMouseEnter={() => setHoveredCard(200 + index)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div
                        className={`bg-gradient-to-r ${section.gradient} text-white p-6`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <section.icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold">
                              {section.title}
                            </h3>
                            <p className="text-teal-100 text-xs mt-1">
                              {section.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          {section.keywords?.map((keyword, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-3 p-3 bg-gradient-to-r ${section.bgGradient} rounded-lg border border-gray-200 transition-all duration-300 transform hover:scale-105 hover:shadow-md`}
                            >
                              <div
                                className={`w-3 h-3 rounded-full bg-gradient-to-r ${section.gradient} shadow-sm`}
                              ></div>
                              <span className="font-medium text-gray-900">
                                {cleanText(keyword)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Optimization Recommendations - FIXED HEADER */}
              {seoData.recommendations?.length > 0 && (
                <Card
                  className={`shadow-2xl bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl transition-all duration-700 delay-500 transform ${
                    showAnimations
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  } overflow-hidden`}
                >
                  <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          Keyword Optimization Strategy
                        </h3>
                        <p className="text-teal-100 text-sm mt-1">
                          Actionable recommendations based on comprehensive
                          keyword analysis
                        </p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      {seoData.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-4 p-6 bg-gradient-to-r from-white to-gray-50 rounded-2xl border-l-4 border-teal-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <span className="text-white font-bold text-sm">
                              {i + 1}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed text-lg">
                            {cleanText(rec)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Success Animation */}
              {showAnimations && (
                <div className="text-center py-6 transition-all duration-1000">
                  <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl mb-3 shadow-xl border border-white/20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-teal-400/20 rounded-full animate-ping"></div>
                      <Sparkles className="h-8 w-8 text-teal-500 relative z-10" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    Keyword Analysis Complete!
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Your comprehensive keyword strategy is ready for
                    implementation.
                  </p>

                  <div className="max-w-md mx-auto bg-gray-200 rounded-full h-1.5 mb-3 overflow-hidden shadow-inner">
                    <div className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 h-1.5 rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    Ready to optimize your search presence
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
                <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                <h3 className="text-lg font-bold text-gray-900">
                  Analyzing Keywords
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                Performing comprehensive keyword analysis and extraction...
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
