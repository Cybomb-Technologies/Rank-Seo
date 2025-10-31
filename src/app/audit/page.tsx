"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import {
  ScoreCard,
  DetailedAnalysis,
  Recommendations,
  HeaderSection,
  ScoresRadar,
  ScoresBarChart,
} from "./frontend";
import PDFGenerator from "./pdf";
import { runAudit } from "./backend";
import Metatags from "../../SEO/metatags";

interface DecodedToken {
  user: {
    id: string;
    role?: string;
  };
}

interface Recommendation {
  text: string;
  priority: "High" | "Medium" | "Low";
}

interface AuditReport {
  seo?: number;
  performance?: number;
  accessibility?: number;
  bestPractices?: number;
  analysis?: string;
  recommendations?: Recommendation[];
  backlinks?: number;
  history?: {
    date: string;
    seo: number;
    performance: number;
    accessibility: number;
    bestPractices: number;
  }[];
  issues?: { category: string; count: number }[];
  loadingTime?: number;
  pageSize?: number;
  requests?: number;
}

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("Initializing audit...");
  const [auditCount, setAuditCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const storedCount = localStorage.getItem("auditCount");
    if (storedCount) setAuditCount(parseInt(storedCount, 10));

    // Check if user is logged in
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    localStorage.setItem("auditCount", auditCount.toString());
  }, [auditCount]);

  const startProgressAnimation = () => {
    setProgress(0);
    setLoadingStep("Analyzing your website performance...");
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + Math.random() * 7 : prev));
      if (progress > 30) setLoadingStep("Checking your website's health...");
      if (progress > 60) setLoadingStep("Checking accessibility...");
      if (progress > 85) setLoadingStep("Generating recommendations...");
    }, 700);
  };

  const stopProgressAnimation = (complete = false) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setProgress(complete ? 100 : 0);
    if (complete) setLoadingStep("Audit complete!");
  };

  const handleAudit = async () => {
    if (!url) {
      alert("⚠️ Please enter a website URL");
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      alert("⚠️ Please enter a valid website URL");
      return;
    }

    if (!isLoggedIn && auditCount >= 3) {
      alert("🚀 Free audits used up! Please sign in to continue.");
      router.push("/login");
      return;
    }

    setLoading(true);
    // Create new AbortController for this audit
    abortControllerRef.current = new AbortController();
    startProgressAnimation();

    const token = localStorage.getItem("token");
    let userId: string | null = null;

    // 🔑 Decode token if available
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        userId = decoded.user.id;
      } catch (err) {
        console.error("❌ Invalid token:", err);
      }
    }
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
      // ✅ Run local audit with abort signal
      const auditResults = await runAudit(
        url,
        userId || "",
        token || undefined,
        abortControllerRef.current.signal
      );

      // Check if audit was aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      // ✅ Decide endpoint: logged-in → save, guest → per-IP guest audits
      const endpoint = token
        ? `${API_URL}/api/create-audits`
        : `${API_URL}/api/guest-audits`;

      // ✅ Save audit (or guest audit check)
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url, ...auditResults }),
        credentials: "include",
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 403) {
        alert("🚀 Free audits used up for today! Please login.");
        router.push("/login");
        return;
      }

      const data = await response.json();
      setReport(data.audit || data);
      setAuditCount((prev) => prev + 1);
      stopProgressAnimation(true);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Audit aborted by user.");
      } else {
        console.error("⚠️ Audit failed:", err);
        alert("Something went wrong while running the audit");
      }
      stopProgressAnimation();
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopAudit = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log("Audit stopping...");
    }
    setLoading(false);
    stopProgressAnimation();
  };

  const metaPropsData = {
    title: "Free SEO Audit Tool | Website Performance & Accessibility Analysis",
    description:
      "Run comprehensive SEO, performance, accessibility, and best practices audits for any website. Get detailed reports with actionable recommendations to improve your rankings.",
    keyword:
      "SEO audit, website analysis, performance testing, accessibility check, SEO tools, free audit, website optimization",
    url: "https://rankseo.in/audit",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen pt-12 sm:pt-16 bg-gradient-to-br from-gray-50 to-teal-50">
        <HeaderSection
          url={url}
          setUrl={setUrl}
          loading={loading}
          handleAudit={handleAudit}
          handleStopAudit={handleStopAudit}
          isLoggedIn={isLoggedIn}
          auditCount={auditCount}
          progress={progress}
          loadingStep={loadingStep}
        />

        {/* 🔹 Sample Report Section */}
        {!report && !loading && (
          <div className="container mx-auto py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden mb-4 sm:mb-6 md:mb-8">
              <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-r from-gray-400 to-gray-600 text-white">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
                  Sample Audit Report
                </h2>
                <p className="mt-1 sm:mt-2 opacity-80 text-xs sm:text-sm md:text-base">
                  This is a preview of how the audit report will appear for{" "}
                  {url || "your website"}.
                </p>
              </div>

              <div className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
                  <ScoreCard label="SEO" score={82} />
                  <ScoreCard label="Performance" score={74} />
                  <ScoreCard label="Accessibility" score={89} />
                  <ScoreCard label="Best Practices" score={91} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                  <ScoresRadar
                    scores={{
                      seo: 82,
                      performance: 74,
                      accessibility: 89,
                      bestPractices: 91,
                    }}
                  />
                  <ScoresBarChart
                    scores={{
                      seo: 82,
                      performance: 74,
                      accessibility: 89,
                      bestPractices: 91,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🔹 Main Report Section */}
        {report && (
          <div className="container mx-auto py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden mb-4 sm:mb-6 md:mb-8">
              <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-r from-teal-600 to-teal-800 text-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
                      Audit Report for {url}
                    </h2>
                    <p className="mt-1 sm:mt-2 opacity-80 text-xs sm:text-sm md:text-base">
                      Generated on {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <PDFGenerator report={report} url={url} />
                  </div>
                </div>

                {/* Tabs for navigation */}
                <div className="mt-4 sm:mt-6 flex space-x-1 sm:space-x-2 overflow-x-auto">
                  {["overview", "analysis", "recommendations"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                        activeTab === tab
                          ? "bg-white text-teal-700 shadow-md"
                          : "text-white hover:bg-teal-500"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 sm:p-4 md:p-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-4 sm:space-y-6 md:space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                      <ScoreCard label="SEO" score={report.seo || 0} />
                      <ScoreCard
                        label="Performance"
                        score={report.performance || 0}
                      />
                      <ScoreCard
                        label="Accessibility"
                        score={report.accessibility || 0}
                      />
                      <ScoreCard
                        label="Best Practices"
                        score={report.bestPractices || 0}
                      />
                    </div>

                    {/* <PerformanceMetrics report={report} /> */}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                      <ScoresRadar
                        scores={{
                          seo: report.seo || 0,
                          performance: report.performance || 0,
                          accessibility: report.accessibility || 0,
                          bestPractices: report.bestPractices || 0,
                        }}
                      />
                      <ScoresBarChart
                        scores={{
                          seo: report.seo || 0,
                          performance: report.performance || 0,
                          accessibility: report.accessibility || 0,
                          bestPractices: report.bestPractices || 0,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Analysis Tab */}
                {activeTab === "analysis" && (
                  <DetailedAnalysis text={report.analysis} url={url} />
                )}

                {/* Recommendations Tab */}
                {activeTab === "recommendations" && (
                  <Recommendations list={report.recommendations} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
