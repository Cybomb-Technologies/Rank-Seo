"use client";

import { useState, useRef } from "react";
import { Building, Sparkles, Target, Users } from "lucide-react";
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

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get token from localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
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
        const errorText = await saveResponse.text();
        console.error("❌ Save failed with response:", errorText);
        throw new Error(`Save failed: ${saveResponse.status} - ${errorText}`);
      }

      const saveResult = await saveResponse.json();
      console.log("✅ Keyword report saved to database:", saveResult.data);
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
      saveKeywordReportToDatabase(cleanedKeywords, sessionId);

      stopProgressAnimation(true);
    } catch (err: any) {
      console.error("⚠️ Keyword generation failed:", err.message);
      alert("Something went wrong.");
      stopProgressAnimation();
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const metaPropsData = {
    title: "AI Keyword Generator Tool | Smart SEO Keyword Research",
    description:
      "Generate high-converting keywords with AI-powered keyword research tool. Get search volume, difficulty scores, and content ideas for better SEO.",
    keyword:
      "keyword generator, AI keyword research, SEO keywords, keyword ideas, content strategy",
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
        />

        <div className="container mx-auto py-12 px-6">
          {report && (
            <KeywordResults topic={report.topic} keywords={report.keywords} />
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
      </div>
    </>
  );
}
