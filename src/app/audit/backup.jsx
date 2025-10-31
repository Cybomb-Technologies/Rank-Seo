"use client";

import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LabelList,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell
} from 'recharts';
import { Eye, EyeOff, Download, TrendingUp, AlertCircle, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import Metatags from "../../SEO/metatags";

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [auditCount, setAuditCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("Initializing audit...");
  const [auditDone, setAuditDone] = useState(false);
  const [showSampleReport, setShowSampleReport] = useState(true);
  const [chartSize, setChartSize] = useState(300);
  const [chartView, setChartView] = useState<'radar' | 'polar'>('radar');
  const [showDataLabels, setShowDataLabels] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Define ReportType
  type ReportType = {
    seo?: number;
    performance?: number;
    accessibility?: number;
    bestPractices?: number;
    backlinks?: number;
    recommendations?: { text: string; priority: string }[];
    analysis?: string;
    history?: { date: string; seo: number; performance: number; accessibility: number; bestPractices: number }[];
    issues?: { category: string; count: number }[];
    loadingTime?: number;
    pageSize?: number;
    requests?: number;
  };

  // Sample report data
  const sampleReport: ReportType = {
    seo: 92,
    performance: 65,
    accessibility: 80,
    bestPractices: 88,
    backlinks: 124,
    loadingTime: 3.2,
    pageSize: 2.4,
    requests: 78,
    recommendations: [
      { text: "Optimize images, enable caching, and reduce unused JS", priority: "High" },
      { text: "Improve color contrast and keyboard navigation", priority: "Medium" },
      { text: "Add missing alt text to images", priority: "Medium" },
      { text: "Fix broken internal links", priority: "Low" },
      { text: "Improve server response time", priority: "High" },
    ],
    issues: [
      { category: "SEO", count: 3 },
      { category: "Performance", count: 8 },
      { category: "Accessibility", count: 5 },
      { category: "Best Practices", count: 2 }
    ],
    analysis: `# Sample SEO Audit Report

**Date:** September 12, 2025  
**Website:** https://www.sample.com  

---

## 1. Executive Summary
This is a **sample report** to show you what your final audit will look like.  
Your actual report will include detailed recommendations tailored to your website.

## 2. Technical Analysis
- **Core Web Vitals**: Needs improvement in LCP and CLS
- **Mobile Usability**: Good responsiveness across devices
- **Security**: HTTPS properly implemented
- **Crawlability**: Some pages blocked by robots.txt

## 3. Content Analysis
- **Keyword Optimization**: Good primary keyword usage, lacking secondary keywords
- **Content Quality**: Comprehensive and valuable content
- **Content Freshness**: Some content hasn't been updated in 12+ months

## 4. Opportunities
- **Featured Snippets**: 12 potential opportunities identified
- **Internal Linking**: Could improve site architecture with better linking
- **Image Optimization**: 4.2MB of images could be compressed
`
  };

  const [report, setReport] = useState<ReportType | null>(sampleReport);

  // Radar chart data
  const radarData = report
    ? [
        { metric: "SEO", value: report.seo ?? 0, industryAvg: 75, previous: report.history?.[report.history.length - 2]?.seo },
        { metric: "Performance", value: report.performance ?? 0, industryAvg: 65, previous: report.history?.[report.history.length - 2]?.performance },
        { metric: "Accessibility", value: report.accessibility ?? 0, industryAvg: 70, previous: report.history?.[report.history.length - 2]?.accessibility },
        { metric: "Best Practices", value: report.bestPractices ?? 0, industryAvg: 80, previous: report.history?.[report.history.length - 2]?.bestPractices },
      ]
    : [];

  // Check availability of extra data
  const industryAverage = radarData.some((item) => item.industryAvg !== undefined);
  const previousScores = radarData.some((item) => item.previous !== undefined);

  // Issues data for bar chart
  const issuesData = report?.issues || [];

  // History data for trend chart
  const historyData = report?.history?.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    seo: item.seo,
    performance: item.performance,
    accessibility: item.accessibility,
    bestPractices: item.bestPractices
  })) || [];

  useEffect(() => {
    const storedCount = localStorage.getItem("auditCount");
    if (storedCount) setAuditCount(parseInt(storedCount, 10));
  }, []);

  useEffect(() => {
    localStorage.setItem("auditCount", auditCount.toString());
  }, [auditCount]);

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const startProgressAnimation = () => {
    setProgress(0);
    setLoadingStep("Running Lighthouse tests...");
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + Math.random() * 7 : prev));
      if (progress > 30) setLoadingStep("Analyzing SEO and content...");
      if (progress > 60) setLoadingStep("Checking accessibility and performance...");
      if (progress > 85) setLoadingStep("Generating recommendations...");
    }, 700);
  };

  const stopProgressAnimation = (complete = false) => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setProgress(complete ? 100 : 0);
    if (complete) setLoadingStep("Audit complete!");
  };

  const handleAudit = async () => {
    if (!url || !isValidUrl(url)) {
      alert("⚠️ Please enter a valid website URL");
      return;
    }
    if (!isLoggedIn && auditCount >= 3) {
      alert("🚀 Free audits used up! Please sign in to continue.");
      return;
    }

    setLoading(true);
    setShowSampleReport(false);
    setAuditDone(false);
    startProgressAnimation();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("https://n8n.cybomb.com/webhook/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("Failed to fetch audit report");
      const data = await response.json();
      setReport(data);
      setAuditCount((prev) => prev + 1);
      setAuditDone(true);
      stopProgressAnimation(true);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Audit aborted by user.");
        setReport(sampleReport);
        setShowSampleReport(true);
      } else {
        console.error(err);
        alert("❌ Error analyzing the website.");
      }
      stopProgressAnimation();
    } finally {
      setLoading(false);
    }
  };

  const handleStopAudit = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      stopProgressAnimation();
    }
  };

  const handleDownloadPDF = () => {
    // Your existing PDF generation code
    // ...
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50";
    if (score >= 70) return "text-teal-600 bg-teal-50";
    if (score >= 50) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "High") return "bg-red-100 text-red-800 border-red-200";
    if (priority === "Medium") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const renderScoreCard = (label: string, score: number) => (
    <motion.div 
      whileHover={{ scale: 1.05 }} 
      className={`${getScoreColor(score)} p-6 rounded-2xl shadow-lg text-center border-2 border-white transition-all duration-300`}
    >
      <h3 className="font-semibold text-lg mb-3">{label}</h3>
      <div className="relative inline-block">
        <svg className="w-28 h-28" viewBox="0 0 36 36">
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#eee"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={score >= 70 ? "#0f766e" : score >= 50 ? "#ca8a04" : "#dc2626"}
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold">
          {score}
        </div>
      </div>
      <p className="mt-2 text-sm opacity-80">out of 100</p>
    </motion.div>
  );

   const metaPropsData = {
    title: "Free SEO Audit Tool | Website Performance & Accessibility Analysis",
    description: "Run comprehensive SEO, performance, accessibility, and best practices audits for any website. Get detailed reports with actionable recommendations to improve your rankings.",
    keyword: "SEO audit, website analysis, performance testing, accessibility check, SEO tools, free audit, website optimization",
    url: "https://rankseo.in/audit",
    image: "https://rankseo.in/SEO_LOGO.png",
  };
  
  return (
    <>
    <Metatags metaProps={metaPropsData} />
    <div className="min-h-screen pt-15 bg-gradient-to-br from-gray-50 to-teal-50">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-gray-900 via-teal-900 to-gray-900 text-white py-16 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="container mx-auto relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold mb-4"
          >
            Analyze Your Website Performance
          </motion.h1>
          <p className="mt-2 text-gray-300 text-lg max-w-2xl mx-auto">
            Get SEO, Performance, Accessibility, and Best Practices insights instantly
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3 max-w-xl mx-auto w-full">
            <input
              type="url"
              placeholder="https://example.com"
              className="flex-1 w-full px-5 py-3 rounded-lg text-black bg-white focus:ring-4 focus:ring-teal-300 focus:outline-none transition-all shadow-lg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            {!loading ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAudit}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold shadow-lg flex items-center justify-center gap-2"
              >
                <BarChart3 size={20} />
                Start Audit
              </motion.button>
            ) : (
              <button
                onClick={handleStopAudit}
                className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg flex items-center justify-center gap-2"
              >
                <Clock size={20} />
                Stop Audit
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="mt-6 max-w-xl mx-auto">
              <div className="bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                <motion.div
                  className="bg-gradient-to-r from-teal-400 to-teal-600 h-3 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              </div>
              <p className="mt-3 text-sm text-gray-300 flex items-center justify-center gap-2">
                <Clock size={16} />
                {loadingStep}
              </p>
            </div>
          )}

          <p className="mt-4 text-sm text-gray-300">
            {isLoggedIn ? "Unlimited audits available" : `Free audits left: ${Math.max(0, 3 - auditCount)}`}
          </p>
        </div>
      </div>

      {/* REPORT SECTION */}
      {report && (
        <div className="container mx-auto py-12 px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8"
          >
            <div className="p-6 bg-gradient-to-r from-teal-600 to-teal-800 text-white">
              <h2 className="text-2xl md:text-3xl font-bold">
                {showSampleReport ? "Sample Audit Report" : `Audit Report for: ${url}`}
              </h2>
              <p className="mt-2 opacity-90">
                Generated on {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
              <button
                className={`px-6 py-3 font-medium text-sm ${activeTab === 'overview' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`px-6 py-3 font-medium text-sm ${activeTab === 'analysis' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('analysis')}
              >
                Detailed Analysis
              </button>
              <button
                className={`px-6 py-3 font-medium text-sm ${activeTab === 'recommendations' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('recommendations')}
              >
                Recommendations
              </button>
              {/* <button
                className={`px-6 py-3 font-medium text-sm ${activeTab === 'technical' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('technical')}
              >
                Technical Data
              </button> */}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <>
                  {/* SCORE OVERVIEW */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {renderScoreCard("SEO", report.seo ?? 0)}
                    {renderScoreCard("Performance", report.performance ?? 0)}
                    {renderScoreCard("Accessibility", report.accessibility ?? 0)}
                    {renderScoreCard("Best Practices", report.bestPractices ?? 0)}
                  </div>

                  {/* Performance Metrics */}
                  {/* <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                      <div className="flex items-center mb-3">
                        <Clock className="text-teal-600 mr-2" size={20} />
                        <h3 className="font-semibold text-gray-700">Loading Time</h3>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{report.loadingTime || 3.2}s</p>
                      <p className="text-sm text-gray-500 mt-1">Page load time</p>
                    </div>
                    
                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                      <div className="flex items-center mb-3">
                        <TrendingUp className="text-teal-600 mr-2" size={20} />
                        <h3 className="font-semibold text-gray-700">Page Size</h3>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{report.pageSize || 2.4}MB</p>
                      <p className="text-sm text-gray-500 mt-1">Total resources</p>
                    </div>
                    
                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                      <div className="flex items-center mb-3">
                        <BarChart3 className="text-teal-600 mr-2" size={20} />
                        <h3 className="font-semibold text-gray-700">Requests</h3>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{report.requests || 78}</p>
                      <p className="text-sm text-gray-500 mt-1">HTTP requests</p>
                    </div>
                  </div> */}

                  {/* RADAR CHART */}
                  <div className="bg-gray-50 rounded-xl p-6 shadow-md mb-12">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                      <TrendingUp className="mr-2 text-teal-600" size={24} />
                      Performance Radar
                    </h3>
                    
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex items-center">
                        <label className="mr-2 text-sm text-gray-600">Chart Size:</label>
                        <select 
                          className="border rounded-md p-1 text-sm bg-white"
                          onChange={(e) => setChartSize(parseInt(e.target.value))}
                          value={chartSize}
                        >
                          <option value={250}>Small</option>
                          <option value={300}>Medium</option>
                          <option value={350}>Large</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center">
                        <label className="mr-2 text-sm text-gray-600">View:</label>
                        <select 
                          className="border rounded-md p-1 text-sm bg-white"
                          onChange={(e) => setChartView(e.target.value as 'radar' | 'polar')}
                          value={chartView}
                        >
                          <option value="radar">Radar</option>
                          <option value="polar">Polar</option>
                        </select>
                      </div>
                      
                      <button
                        className="text-sm text-teal-600 hover:text-teal-700 flex items-center bg-teal-50 px-3 py-1 rounded-md"
                        onClick={() => setShowDataLabels(!showDataLabels)}
                      >
                        {showDataLabels ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Hide Values
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Show Values
                          </>
                        )}
                      </button>
                    </div>
                    
                    <ResponsiveContainer width="100%" height={chartSize}>
                      <RadarChart
                        outerRadius={chartSize * 0.4}
                        data={radarData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <PolarGrid 
                          stroke="#e2e8f0" 
                          strokeDasharray="3 3" 
                        />
                        <PolarAngleAxis 
                          dataKey="metric" 
                          tick={{ fill: '#4a5568', fontSize: 12 }}
                        />
                        <PolarRadiusAxis 
                          angle={30} 
                          domain={[0, 100]} 
                          tickCount={6}
                          tick={{ fill: '#718096', fontSize: 10 }}
                        />
                        
                        <Radar
                          name="Current Score"
                          dataKey="value"
                          stroke="#0f766e"
                          fill="#0f766e"
                          fillOpacity={0.6}
                          strokeWidth={2}
                        />
                        
                        {industryAverage && (
                          <Radar
                            name="Industry Average"
                            dataKey="industryAvg"
                            stroke="#9ca3af"
                            fill="#9ca3af"
                            fillOpacity={0.3}
                            strokeWidth={1}
                            strokeDasharray="5 5"
                          />
                        )}
                        
                        {previousScores && (
                          <Radar
                            name="Previous Score"
                            dataKey="previous"
                            stroke="#6366f1"
                            fill="#6366f1"
                            fillOpacity={0.2}
                            strokeWidth={1.5}
                          />
                        )}
                        
                        {showDataLabels && (
                          <LabelList 
                            dataKey="value" 
                            position="top" 
                            offset={10}
                            formatter={(value: number) => `${value}`}
                            style={{ fill: '#0f766e', fontSize: 11, fontWeight: 'bold' }}
                          />
                        )}
                        
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 rounded-lg shadow-md border">
                                  <p className="font-semibold text-gray-800">{label}</p>
                                  <p className="text-sm mt-1">
                                    <span className="text-teal-700 font-medium">Score: </span>
                                    {payload[0].value}/100
                                  </p>
                                  {payload[1] && (
                                    <p className="text-sm">
                                      <span className="text-gray-500 font-medium">Industry Avg: </span>
                                      {payload[1].value}/100
                                    </p>
                                  )}
                                  {payload[2] && (
                                    <p className="text-sm">
                                      <span className="text-indigo-500 font-medium">Previous: </span>
                                      {payload[2].value}/100
                                    </p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry) => (
                            <span className="text-xs text-gray-600">{value}</span>
                          )}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                    
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                        <div className="flex items-center mb-2">
                          <div className="w-3 h-3 rounded-full bg-teal-600 mr-2"></div>
                          <span className="font-medium">Current Score</span>
                        </div>
                        <p className="text-gray-600">Your website's current performance metrics</p>
                      </div>
                      
                      {industryAverage && (
                        <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                          <div className="flex items-center mb-2">
                            <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                            <span className="font-medium">Industry Average</span>
                          </div>
                          <p className="text-gray-600">Comparison with industry benchmarks</p>
                        </div>
                      )}
                      
                      {previousScores && (
                        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                          <div className="flex items-center mb-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
                            <span className="font-medium">Previous Score</span>
                          </div>
                          <p className="text-gray-600">Your website's performance from last audit</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Issues Breakdown */}
                  {issuesData.length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-md mb-12">
                      <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                        <AlertCircle className="mr-2 text-amber-500" size={24} />
                        Issues by Category
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={issuesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              borderRadius: '6px', 
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                              border: '1px solid #e5e7eb'
                            }}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {issuesData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={
                                  entry.category === "SEO" ? "#0f766e" :
                                  entry.category === "Performance" ? "#ea580c" :
                                  entry.category === "Accessibility" ? "#6366f1" : "#ca8a04"
                                } 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* History Trends */}
                  {historyData.length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-md">
                      <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                        <TrendingUp className="mr-2 text-teal-600" size={24} />
                        Performance Trends
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={historyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              borderRadius: '6px', 
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                              border: '1px solid #e5e7eb'
                            }}
                          />
                          <Legend />
                          <Bar dataKey="seo" fill="#0f766e" name="SEO" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="performance" fill="#ea580c" name="Performance" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="accessibility" fill="#6366f1" name="Accessibility" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="bestPractices" fill="#ca8a04" name="Best Practices" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'analysis' && (
                <div className="bg-gray-50 rounded-xl p-6 lg:p-8 shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                    <AlertCircle className="mr-2 text-teal-600" size={24} />
                    Executive Summaryiled Analysis
                  </h3>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="space-y-6">
                      {/* Executive Summary */}
                      <div>
                        <h4 className="text-lg font-semibold text-teal-700 mb-3">Executive Summary</h4>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                          <li>This is a sample report to show you what your final audit will look like</li>
                          <li>Your actual report will include detailed recommendations tailored to your website</li>
                          <li>Date: September 12, 2025</li>
                          <li>Website: https://www.sample.com</li>
                        </ul>
                      </div>

                      {/* Technical Analysis */}
                      <div>
                        <h4 className="text-lg font-semibold text-teal-700 mb-3">Technical Analysis</h4>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                          <li><span className="font-medium">Core Web Vitals:</span> Needs improvement in LCP and CLS</li>
                          <li><span className="font-medium">Mobile Usability:</span> Good responsiveness across devices</li>
                          <li><span className="font-medium">Security:</span> HTTPS properly implemented</li>
                          <li><span className="font-medium">Crawlability:</span> Some pages blocked by robots.txt</li>
                        </ul>
                      </div>

                      {/* Content Analysis */}
                      <div>
                        <h4 className="text-lg font-semibold text-teal-700 mb-3">Content Analysis</h4>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                          <li><span className="font-medium">Keyword Optimization:</span> Good primary keyword usage, lacking secondary keywords</li>
                          <li><span className="font-medium">Content Quality:</span> Comprehensive and valuable content</li>
                          <li><span className="font-medium">Content Freshness:</span> Some content hasn't been updated in 12+ months</li>
                        </ul>
                      </div>

                      {/* Opportunities */}
                      <div>
                        <h4 className="text-lg font-semibold text-teal-700 mb-3">Opportunities</h4>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                          <li><span className="font-medium">Featured Snippets:</span> 12 potential opportunities identified</li>
                          <li><span className="font-medium">Internal Linking:</span> Could improve site architecture with better linking</li>
                          <li><span className="font-medium">Image Optimization:</span> 4.2MB of images could be compressed</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'recommendations' && report.recommendations && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                    <CheckCircle className="mr-2 text-teal-600" size={24} />
                    Recommendations
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    {report.recommendations.map((rec, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        className={`bg-white p-5 rounded-xl shadow-lg border-l-4 ${
                          rec.priority === "High" ? "border-red-500" :
                          rec.priority === "Medium" ? "border-yellow-500" : "border-green-500"
                        } transition-all`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-lg font-medium text-gray-800">{rec.text}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(rec.priority)}`}>
                            {rec.priority}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-4">
                          <AlertCircle size={16} className="mr-1" />
                          {rec.priority === "High" ? "Critical issue - fix immediately" :
                           rec.priority === "Medium" ? "Important improvement needed" :
                           "Enhancement opportunity"}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'technical' && (
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Technical Metrics</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-5 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">First Contentful Paint</span>
                          <span className="font-medium">1.8s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Largest Contentful Paint</span>
                          <span className="font-medium">2.9s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cumulative Layout Shift</span>
                          <span className="font-medium">0.12</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">First Input Delay</span>
                          <span className="font-medium">35ms</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-5 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">SEO Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Indexed Pages</span>
                          <span className="font-medium">124</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Backlinks</span>
                          <span className="font-medium">{report.backlinks || 124}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mobile Friendly</span>
                          <span className="font-medium text-green-600">Yes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">SSL Certificate</span>
                          <span className="font-medium text-green-600">Valid</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Download Button */}
            {!showSampleReport && auditDone && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadPDF}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold shadow-lg flex items-center justify-center gap-2 mx-auto"
                >
                  <Download size={20} />
                  Download PDF Report
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Custom CSS for additional styling */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.05)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
        }
        .prose {
          line-height: 1.7;
        }
        .prose h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #0f766e;
        }
        .prose h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #0f766e;
        }
        .prose p {
          margin-bottom: 1rem;
        }
        .prose ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .prose li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
    </>
  );
}