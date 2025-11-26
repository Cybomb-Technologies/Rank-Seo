// page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Building, Sparkles, Target, Users, Crown } from "lucide-react";
import { GeneratorHeader, KeywordResults } from "./frontend";
import Metatags from "../../SEO/metatags";

interface Keyword {
  keyword: string;
  type: string;
  difficulty_score: string;
  search_volume: number;
  cpc: number;
  intent: string;
  content_type: string;
  keyword_density: number;
  content_idea: string;
}

interface KeywordReport {
  topic: string;
  keywords: Keyword[];
}

interface UsageLimits {
  used: number;
  limit: number;
  remaining: number;
  message?: string;
}

const N8N_WEBHOOK_URL = "https://n8n.cybomb.com/webhook/keyword-generator";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function KeywordGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [industry, setIndustry] = useState("");
  const [audience, setAudience] = useState("");
  const [report, setReport] = useState<KeywordReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("Initializing...");
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get token from localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  // Fetch usage limits on component mount
  useEffect(() => {
    fetchUsageLimits();
  }, []);

  const fetchUsageLimits = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/keywords/reports`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.usage) {
          const used = data.usage.used || 0;
          const limit = data.usage.limit || 10;
          const remaining = Math.max(0, limit - used);

          setUsageLimits({
            used: used,
            limit: limit,
            remaining: remaining,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch usage limits:", error);
      // Set default limits if fetch fails
      setUsageLimits({
        used: 0,
        limit: 10,
        remaining: 10,
      });
    }
  };

  const startProgressAnimation = (initialTopic: string) => {
    setProgress(0);
    setLoadingStep(`Running AI analysis for "${initialTopic}"...`);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev < 90 ? prev + Math.random() * 5 : prev;
        if (newProgress > 20 && newProgress <= 40)
          setLoadingStep("Analyzing competition...");
        else if (newProgress > 40 && newProgress <= 60)
          setLoadingStep("Researching audience behavior...");
        else if (newProgress > 60 && newProgress <= 80)
          setLoadingStep("Generating keyword ideas...");
        else if (newProgress > 80) setLoadingStep("Finalizing report...");
        return newProgress;
      });
    }, 500);
  };

  const stopProgressAnimation = (complete = false) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setProgress(complete ? 100 : 0);
    if (complete) {
      setLoadingStep("Done! Preparing report...");
      setTimeout(() => setLoadingStep("Report ready!"), 800);
    }
  };

  // Function to save keyword report to MongoDB
  const saveKeywordReportToDatabase = async (
    keywords: Keyword[],
    sessionId: string
  ): Promise<boolean> => {
    try {
      const token = getToken();
      if (!token) {
        console.error("No authentication token found");
        return false;
      }

      console.log("🔄 Attempting to save to MongoDB...", {
        topic,
        industry,
        audience,
        keywordCount: keywords.length,
        sessionId,
      });

      const saveResponse = await fetch(`${API_BASE_URL}/api/keywords/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic,
          industry,
          audience,
          keywords,
          sessionId,
        }),
      });

      console.log("📡 Save response status:", saveResponse.status);

      if (!saveResponse.ok) {
        if (saveResponse.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("token");
          window.location.href = "/login";
          return false;
        }

        if (saveResponse.status === 403) {
          // Usage limit exceeded
          const errorData = await saveResponse.json();
          const used = errorData.usage?.used || 0;
          const limit = errorData.usage?.limit || 10;
          const remaining = Math.max(0, limit - used);

          setUsageLimits({
            used: used,
            limit: limit,
            remaining: remaining,
            message: errorData.message || "Usage limit exceeded",
          });
          return false;
        }

        const errorText = await saveResponse.text();
        console.error("❌ Save failed with response:", errorText);
        throw new Error(`Save failed: ${saveResponse.status} - ${errorText}`);
      }

      const saveResult = await saveResponse.json();
      console.log("✅ Keyword report saved to database:", saveResult.data);

      // Update usage limits after successful save
      if (saveResult.usage) {
        const used = saveResult.usage.used;
        const limit = saveResult.usage.limit;
        const remaining = Math.max(0, limit - used);

        setUsageLimits({
          used: used,
          limit: limit,
          remaining: remaining,
        });
      }

      return true;
    } catch (error) {
      console.error("❌ Error saving to database:", error);
      return false;
    }
  };

  const handleGenerateKeywords = async () => {
    if (!topic || !industry || !audience) {
      alert("⚠️ Please fill in all fields.");
      return;
    }

    // Check usage limits before proceeding
    if (usageLimits && usageLimits.remaining <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setReport(null);
    const initialTopic = topic;
    const sessionId = `kw_sess_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    startProgressAnimation(initialTopic);

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryTopic: topic,
          industry: industry,
          audience: audience,
          intent: "informational, transactional, commercial",
        }),
      });

      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const responseData = await response.json();

      let keywordsArray: any[] = [];
      if (Array.isArray(responseData)) {
        if (responseData[0]?.output) {
          const outputString = responseData[0].output
            .replace(/```json\n?|```/g, "")
            .trim();
          keywordsArray = JSON.parse(outputString);
        } else {
          keywordsArray = responseData;
        }
      } else if (responseData.output) {
        const outputString = responseData.output
          .replace(/```json\n?|```/g, "")
          .trim();
        keywordsArray = JSON.parse(outputString);
      }

      const cleanedKeywords: Keyword[] = Array.isArray(keywordsArray)
        ? keywordsArray
            .map((item: any) => ({
              keyword: item.keyword || "N/A",
              type: item.type || "N/A",
              difficulty_score: item.difficulty_score || "N/A",
              search_volume: item.search_volume || 0,
              cpc: item.cpc || 0,
              intent: item.intent || "N/A",
              content_type: item.content_type || "N/A",
              keyword_density: item.keyword_density || 0,
              content_idea: item.content_idea || "No idea provided.",
            }))
            .filter((item: Keyword) => item.keyword !== "N/A")
        : [];

      setReport({ topic: initialTopic, keywords: cleanedKeywords });

      // Save to MongoDB in background (silently)
      const saveSuccess = await saveKeywordReportToDatabase(
        cleanedKeywords,
        sessionId
      );

      if (!saveSuccess && usageLimits?.remaining === 0) {
        // If save failed due to usage limits, show upgrade modal
        setShowUpgradeModal(true);
      }

      stopProgressAnimation(true);
    } catch (err: any) {
      console.error("⚠️ Keyword generation failed:", err.message);
      alert("Something went wrong.");
      stopProgressAnimation();
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const handleUpgradePlan = () => {
    setShowUpgradeModal(true);
  };

  const metaPropsData = {
    title: "Free Keyword Generate Tool - Analyse your keywords for SEO",
    description:
      "Use our free keyword research tool for SEO. Get comprehensive keyword planner and analysis features with search volumes and difficulty scores to find high-converting keywords.",
    keyword:
      "free keyword research tool, keyword planner tool, keyword analysis tool, keyword research for seo, keyword search volumes",
    url: "https://rankseo.in/keyword-generator",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
        <GeneratorHeader
          topic={topic}
          setTopic={setTopic}
          industry={industry}
          setIndustry={setIndustry}
          audience={audience}
          setAudience={setAudience}
          loading={loading}
          handleGenerateKeywords={handleGenerateKeywords}
          progress={progress}
          loadingStep={loadingStep}
          usageLimits={usageLimits || undefined}
          onUpgrade={handleUpgradePlan}
        />

        <div className="container mx-auto py-12 px-6">
          {report && (
            <KeywordResults
              topic={report.topic}
              keywords={report.keywords}
              usageLimits={usageLimits || undefined}
            />
          )}

          {!report && !loading && (
            <div className="bg-white rounded-2xl p-12 shadow-md border border-gray-200 text-center text-gray-500">
              <Sparkles size={48} className="text-teal-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2 text-gray-800">
                Ready to Discover Keywords?
              </h3>
              <p className="mb-6">
                Fill out the form above to generate your AI-powered keyword
                strategy.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <Target size={16} className="text-teal-500" /> Define your
                  primary topic
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Building size={16} className="text-teal-500" /> Select your
                  industry
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Users size={16} className="text-teal-500" /> Identify your
                  audience
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upgrade Plan Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <div className="text-center">
                <Crown className="text-yellow-500 mx-auto mb-4" size={48} />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Upgrade Your Plan
                </h3>
                <p className="text-gray-600 mb-6">
                  You've reached your monthly limit of {usageLimits?.limit}{" "}
                  keyword reports. Upgrade to unlock more features and higher
                  limits.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Current Plan Features
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      • {usageLimits?.limit || 10} keyword reports per month
                    </li>
                    <li>• Basic keyword analytics</li>
                    <li>• CSV export functionality</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={() => {
                      // Redirect to pricing page
                      window.location.href = "/pricing";
                    }}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600 transition"
                  >
                    View Plans
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
