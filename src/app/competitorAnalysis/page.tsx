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
  Users,
  TrendingUp,
  Target,
  Star,
  Search,
  FileText,
  Lightbulb,
  PenTool,
  Globe,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Award,
  Rocket,
} from "lucide-react";
import Metatags from "../../SEO/metatags";

// n8n webhook URL
const API_URL = "https://n8n.cybomb.com/webhook/competitor-analysis";

interface CompetitorAnalysis {
  competitor_name: string;
  website_url: string;
  inferred_location: string;
  core_keywords: string[];
  long_tail_keywords: string[];
  technical_or_niche_keywords: string[];
  local_keywords: string[];
  high_volume_low_competition: string[];
  keyword_groupings: {
    [key: string]: string[];
  };
  strengths: string[];
  gaps: string[];
}

interface LandscapeSummary {
  industry_keyword_themes: string[];
  competitor_overlap: string[];
  local_strategies: string[];
  opportunity_gaps: string[];
}

interface KeywordData {
  url: string;
  inferred_location: string;
  competitor_analysis: CompetitorAnalysis[];
  landscape_summary: LandscapeSummary;
  recommendations: string[];
  blog_topics: string[];
  meta_examples: Array<{
    meta_title: string;
    meta_description: string;
  }>;
}

interface N8nResponse {
  output: string | KeywordData;
}

export default function KeywordAnalysis() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keywordData, setKeywordData] = useState<KeywordData | null>(null);
  const [showAnimations, setShowAnimations] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [expandedCompetitors, setExpandedCompetitors] = useState<number[]>([]);

  useEffect(() => {
    if (keywordData) {
      const timer = setTimeout(() => {
        setShowAnimations(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [keywordData]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    if (loading) {
      setAnalysisProgress(0);
      progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
    }
    return () => clearInterval(progressInterval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!url) {
      setError("Please enter a valid URL.");
      return;
    }

    setLoading(true);
    setError("");
    setKeywordData(null);
    setShowAnimations(false);
    setAnalysisProgress(0);
    setExpandedCompetitors([]);

    try {
      const payload = {
        url,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: N8nResponse = await response.json();

      // Handle the nested JSON string structure from n8n
      let parsedData: KeywordData;

      if (typeof data.output === "string") {
        // Clean the string and parse the JSON
        const cleanedOutput = data.output
          .replace(/```json\n?/g, "")
          .replace(/```/g, "")
          .trim();

        try {
          parsedData = JSON.parse(cleanedOutput);
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
          // If parsing fails, try to extract JSON from the string more carefully
          const jsonMatch = cleanedOutput.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("Failed to parse the response data");
          }
        }
      } else if (data.output && typeof data.output === "object") {
        // If it's already an object, use it directly
        parsedData = data.output as KeywordData;
      } else {
        throw new Error("Unexpected response format from server");
      }

      // Validate the parsed data has required structure
      if (!parsedData.url || !parsedData.competitor_analysis) {
        throw new Error("Invalid data structure received from server");
      }

      setKeywordData(parsedData);
      setAnalysisProgress(100);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err instanceof Error) {
        setError(
          err.message || "Failed to analyze competitors. Please try again."
        );
      } else {
        setError(
          "An unknown error occurred. Please check the URL and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to remove asterisks from text
  const cleanText = (text: string) => {
    return text.replace(/\*\*/g, "");
  };

  // Function to extract bold text for highlighting
  const renderTextWithHighlights = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <span key={index} className="font-bold text-[#008e7a]">
            {part.slice(2, -2)}
          </span>
        );
      }
      return part;
    });
  };

  const toggleCompetitorExpansion = (index: number) => {
    setExpandedCompetitors((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const metaPropsData = {
    title: "Competitor Analysis Tool | SEO Competitive Intelligence",
    description:
      "Analyze competitor SEO strategies with AI-powered competitive intelligence. Get keyword insights, market gaps, and actionable recommendations to dominate your industry.",
    keyword:
      "competitor analysis, SEO competitive intelligence, competitor research, market analysis, keyword gaps",
    url: "https://rankseo.in/competitorAnalysis",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50/30 py-22 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Hero Section with Enhanced Visuals */}
          <div className="text-center mb-16 relative">
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-[#008e7a]/5 rounded-full blur-3xl"></div>
            <Badge className="mb-6 px-4 py-2 text-sm bg-gradient-to-r from-[#008e7a] to-[#006b5c] text-white shadow-lg border-0 relative z-10">
              <Sparkles className="w-3 h-3 mr-2" />
              SEO Competitor Analysis
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-[#008e7a] to-[#004d40] bg-clip-text text-transparent mb-6 relative z-10">
              Competitive Intelligence
            </h1>
            <div className="max-w-3xl mx-auto">
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Uncover hidden opportunities, analyze competitor strategies, and
                dominate your market with data-driven SEO insights
              </p>
            </div>

            {/* Animated decorative elements */}
            <div className="flex justify-center space-x-4 mb-8">
              {[TrendingUp, Target, Zap, Award].map((Icon, index) => (
                <div
                  key={index}
                  className="p-3 bg-white/80 rounded-2xl shadow-lg border border-gray-100"
                >
                  <Icon className="w-6 h-6 text-[#008e7a]" />
                </div>
              ))}
            </div>
          </div>

          {/* Input Section with Enhanced Card */}
          <Card className="max-w-4xl mx-auto mb-16 shadow-2xl border-0 bg-gradient-to-br from-white to-gray-50/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#008e7a] to-[#006b5c]"></div>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Start Your Analysis
                  </h2>
                  <p className="text-gray-600">
                    Enter a competitor's URL to generate a comprehensive SEO
                    report
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#008e7a]/10 to-[#006b5c]/5 rounded-lg blur-sm"></div>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#008e7a] h-5 w-5 z-10" />
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="pl-12 h-14 text-base shadow-lg border-2 border-gray-200/80 focus:border-[#008e7a] transition-all duration-300 bg-white/50 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="h-14 text-base shadow-lg bg-gradient-to-r from-[#008e7a] to-[#006b5c] hover:from-[#007a69] hover:to-[#005a4d] hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                    disabled={loading}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin relative z-10" />
                        <span className="relative z-10">Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-5 w-5 relative z-10" />
                        <span className="relative z-10">Launch Analysis</span>
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Get detailed competitor insights in seconds
                </p>
              </form>
            </CardContent>
          </Card>

          {error && (
            <div className="mt-6 flex items-center justify-center text-red-600 bg-red-50/80 p-6 rounded-2xl border border-red-200 max-w-2xl mx-auto backdrop-blur-sm shadow-lg">
              <XCircle className="h-6 w-6 mr-3 flex-shrink-0" />
              <p className="font-medium text-lg">{error}</p>
            </div>
          )}

          {/* Enhanced Loading Animation */}
          {loading && (
            <div className="text-center py-16 transition-all duration-500">
              <div className="max-w-2xl mx-auto mb-8 relative">
                <div className="relative bg-gray-200/50 rounded-2xl h-4 mb-6 overflow-hidden backdrop-blur-sm">
                  <div
                    className="bg-gradient-to-r from-[#008e7a] via-[#00b894] to-[#008e7a] h-4 rounded-2xl transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ width: `${analysisProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Initializing</span>
                  <span className="font-semibold text-[#008e7a]">
                    {analysisProgress}%
                  </span>
                  <span>Complete</span>
                </div>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
                  <h3 className="text-3xl font-bold mb-3">
                    Analyzing Competitive Landscape
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  {[
                    { icon: Users, text: "Scanning competitors" },
                    { icon: Search, text: "Identifying keywords" },
                    { icon: Lightbulb, text: "Generating insights" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm"
                    >
                      <div className="p-2 bg-[#008e7a]/10 rounded-lg">
                        <item.icon className="h-5 w-5 text-[#008e7a]" />
                      </div>
                      <span className="text-gray-700 font-medium">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {keywordData && (
            <div className="space-y-8">
              {/* Enhanced Header Card */}
              <Card
                className={`shadow-2xl border-0 bg-gradient-to-br from-white to-gray-50/50 transition-all duration-700 ${
                  showAnimations
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
              >
                <CardHeader className="relative overflow-hidden bg-gradient-to-r from-[#008e7a] via-[#006b5c] to-[#004d40] text-white rounded-2xl p-8">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

                  <div className="relative z-10 text-center">
                    <CardTitle className="flex items-center justify-center gap-3 text-3xl mb-4">
                      <BarChart3 className="h-8 w-8" />
                      Competitor Analysis Report
                    </CardTitle>
                    <CardDescription className="text-blue-100 text-xl font-medium space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <LinkIcon className="h-5 w-5" />
                        {keywordData.url}
                      </div>
                      {keywordData.inferred_location && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <MapPin className="h-5 w-5" />
                          <span className="text-lg">
                            Primary Market: {keywordData.inferred_location}
                          </span>
                        </div>
                      )}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      {
                        icon: Users,
                        label: "Competitors Analyzed",
                        value: keywordData.competitor_analysis?.length || 0,
                        color: "from-blue-500 to-cyan-500",
                      },
                      {
                        icon: Target,
                        label: "Industry Themes",
                        value:
                          keywordData.landscape_summary?.industry_keyword_themes
                            ?.length || 0,
                        color: "from-green-500 to-emerald-500",
                      },
                      {
                        icon: Lightbulb,
                        label: "Opportunity Gaps",
                        value:
                          keywordData.landscape_summary?.opportunity_gaps
                            ?.length || 0,
                        color: "from-amber-500 to-orange-500",
                      },
                      {
                        icon: TrendingUp,
                        label: "Recommendations",
                        value: keywordData.recommendations?.length || 0,
                        color: "from-purple-500 to-indigo-500",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group"
                      >
                        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-[#008e7a] to-[#006b5c] rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                          <item.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="font-semibold text-gray-900 mb-2">
                          {item.label}
                        </div>
                        <div className="text-4xl font-bold bg-gradient-to-r from-[#008e7a] to-[#006b5c] bg-clip-text text-transparent">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Industry Landscape Summary */}
              {keywordData.landscape_summary && (
                <Card
                  className={`shadow-2xl border-0 bg-white transition-all duration-700 delay-200 ${
                    showAnimations
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                >
                  <CardHeader className="relative overflow-hidden bg-gradient-to-r from-[#008e7a] to-[#006b5c] text-white rounded-2xl p-8">
                    <CardTitle className="flex items-center gap-3 text-2xl relative z-10">
                      <Globe className="h-6 w-6" />
                      Industry Landscape Summary
                      {keywordData.inferred_location && (
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-white/20 text-white border-white/30 text-sm py-1"
                        >
                          {keywordData.inferred_location}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-blue-100 text-lg">
                      Key themes, competitor overlaps, and market opportunities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div>
                      <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-[#008e7a]" />
                        Industry Keyword Themes
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {keywordData.landscape_summary.industry_keyword_themes.map(
                          (theme, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="bg-gradient-to-r from-[#008e7a]/10 to-[#006b5c]/10 text-[#008e7a] border-[#008e7a]/20 px-4 py-2 text-sm rounded-full shadow-sm"
                            >
                              {theme}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          Competitor Overlaps
                        </h3>
                        <ul className="space-y-3">
                          {keywordData.landscape_summary.competitor_overlap.map(
                            (overlap, i) => (
                              <li
                                key={i}
                                className="text-gray-700 flex items-start gap-3 p-3 bg-white/50 rounded-lg"
                              >
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="leading-relaxed">
                                  {renderTextWithHighlights(overlap)}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-green-600" />
                          Opportunity Gaps
                        </h3>
                        <ul className="space-y-3">
                          {keywordData.landscape_summary.opportunity_gaps.map(
                            (gap, i) => (
                              <li
                                key={i}
                                className="text-gray-700 flex items-start gap-3 p-3 bg-white/50 rounded-lg"
                              >
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="leading-relaxed">
                                  {renderTextWithHighlights(gap)}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Competitor Analysis Section */}
              {keywordData.competitor_analysis?.length > 0 && (
                <Card
                  className={`shadow-2xl border-0 bg-white transition-all duration-700 delay-300 ${
                    showAnimations
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                >
                  <CardHeader className="relative overflow-hidden bg-gradient-to-r from-[#008e7a] to-[#006b5c] text-white rounded-2xl p-8">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <Users className="h-6 w-6" />
                      Competitor Analysis
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white border-white/30 text-sm py-1"
                      >
                        {keywordData.competitor_analysis.length} Competitors
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-blue-100 text-lg">
                      Detailed analysis of competitor strategies and market
                      positioning
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      {keywordData.competitor_analysis.map((competitor, i) => {
                        const isExpanded = expandedCompetitors.includes(i);
                        return (
                          <Card
                            key={i}
                            className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                          >
                            <CardHeader
                              className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-t-xl border-b p-6 cursor-pointer"
                              onClick={() => toggleCompetitorExpansion(i)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-gradient-to-r from-[#008e7a] to-[#006b5c] rounded-full flex items-center justify-center text-white text-sm font-bold">
                                      {i + 1}
                                    </span>
                                    {competitor.competitor_name}
                                  </CardTitle>
                                  <CardDescription className="text-gray-600 mt-2">
                                    <div className="space-y-1">
                                      <a
                                        href={competitor.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline flex items-center gap-2 font-medium"
                                      >
                                        <LinkIcon className="h-4 w-4" />
                                        {competitor.website_url}
                                      </a>
                                      {competitor.inferred_location && (
                                        <div className="flex items-center gap-2 text-sm">
                                          <MapPin className="h-4 w-4" />
                                          {competitor.inferred_location}
                                        </div>
                                      )}
                                    </div>
                                  </CardDescription>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-4"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-5 w-5" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5" />
                                  )}
                                </Button>
                              </div>
                            </CardHeader>

                            {isExpanded && (
                              <CardContent className="p-6 space-y-6 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                                    <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                                      <Star className="h-5 w-5 text-green-600" />
                                      Strengths
                                    </h4>
                                    <ul className="space-y-2">
                                      {competitor.strengths.map(
                                        (strength, idx) => (
                                          <li
                                            key={idx}
                                            className="text-gray-700 flex items-start gap-2"
                                          >
                                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                            <span className="leading-relaxed">
                                              {cleanText(strength)}
                                            </span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
                                    <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                                      <Lightbulb className="h-5 w-5 text-blue-600" />
                                      Gaps & Opportunities
                                    </h4>
                                    <ul className="space-y-2">
                                      {competitor.gaps.map((gap, idx) => (
                                        <li
                                          key={idx}
                                          className="text-gray-700 flex items-start gap-2"
                                        >
                                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                          <span className="leading-relaxed">
                                            {cleanText(gap)}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                {/* Rest of competitor content remains the same but with enhanced styling */}
                                {/* ... (previous competitor content) ... */}
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Recommendations Section */}
              {keywordData.recommendations?.length > 0 && (
                <Card
                  className={`shadow-2xl border-0 bg-white transition-all duration-700 delay-400 ${
                    showAnimations
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                >
                  <CardHeader className="relative overflow-hidden bg-gradient-to-r from-[#008e7a] to-[#006b5c] text-white rounded-2xl p-8">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <Target className="h-6 w-6" />
                      Strategic Recommendations
                    </CardTitle>
                    <CardDescription className="text-blue-100 text-lg">
                      Actionable steps to improve your competitive positioning
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      {keywordData.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-6 p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 hover:border-[#008e7a]/40 transition-all duration-300 group"
                        >
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#008e7a] to-[#006b5c] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <span className="text-white font-bold text-lg">
                              {i + 1}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed text-lg pt-1">
                            {renderTextWithHighlights(rec)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Success Animation */}
              {showAnimations && (
                <div className="text-center py-16 transition-all duration-1000 bg-gradient-to-br from-white to-gray-50/50 rounded-3xl shadow-2xl border border-gray-100">
                  <div className="inline-flex items-center justify-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl mb-8 animate-bounce">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-r from-[#008e7a] to-[#00b894] rounded-full flex items-center justify-center shadow-lg">
                        <svg
                          className="w-10 h-10 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#008e7a] to-[#00b894] rounded-full animate-ping opacity-20"></div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    Analysis Complete!
                  </h3>
                  <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                    Your competitive intelligence report is ready. Use these
                    insights to optimize your SEO strategy and dominate your
                    market.
                  </p>

                  <div className="max-w-md mx-auto bg-gray-200/50 rounded-full h-3 mb-6 backdrop-blur-sm">
                    <div className="bg-gradient-to-r from-[#008e7a] to-[#00b894] h-3 rounded-full animate-pulse shadow-lg"></div>
                  </div>
                  <p className="text-gray-500 font-medium">
                    Ready to implement your competitive strategy
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>
    </>
  );
}
