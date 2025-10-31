"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Eye,
  EyeOff,
  Download,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Zap,
  Shield,
  Search,
  Globe,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useState } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export const getScoreColor = (score: number) => {
  if (score >= 90) return "text-green-600 bg-green-50";
  if (score >= 70) return "text-teal-600 bg-teal-50";
  if (score >= 50) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};

export const getPriorityColor = (priority: string) => {
  if (priority === "High") return "bg-red-100 text-red-800 border-red-500";
  if (priority === "Medium")
    return "bg-yellow-100 text-yellow-800 border-yellow-500";
  return "bg-green-100 text-green-800 border-green-500";
};

export const ScoreCard = ({
  label,
  score,
  trend,
}: {
  label: string;
  score: number;
  trend?: number;
}) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={`${getScoreColor(
      score
    )} p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg text-center border-2 border-white transition-all duration-300 relative`}
  >
    <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
      {trend !== undefined && (
        <div
          className={`flex items-center text-xs font-semibold ${
            trend > 0
              ? "text-green-600"
              : trend < 0
              ? "text-red-600"
              : "text-gray-600"
          }`}
        >
          {trend > 0 ? (
            <ArrowUp size={10} className="sm:size-3" />
          ) : trend < 0 ? (
            <ArrowDown size={10} className="sm:size-3" />
          ) : null}
          {trend !== 0 ? `${Math.abs(trend)}%` : "No change"}
        </div>
      )}
    </div>

    <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-2 sm:mb-3">
      {label}
    </h3>
    <div className="relative inline-block">
      <svg
        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28"
        viewBox="0 0 36 36"
      >
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
          stroke={
            score >= 90
              ? "#16a34a"
              : score >= 70
              ? "#0f766e"
              : score >= 50
              ? "#ca8a04"
              : "#dc2626"
          }
          strokeWidth="3"
          strokeDasharray={`${score}, 100`}
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg sm:text-xl md:text-2xl font-bold">
        {score}
      </div>
    </div>
    <p className="mt-1 sm:mt-2 text-xs sm:text-sm opacity-80">out of 100</p>

    {score >= 90 && (
      <div className="mt-2 sm:mt-3 inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
        <CheckCircle size={10} className="mr-1" /> Excellent
      </div>
    )}
    {score >= 70 && score < 90 && (
      <div className="mt-2 sm:mt-3 inline-flex items-center text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full">
        <CheckCircle size={10} className="mr-1" /> Good
      </div>
    )}
    {score >= 50 && score < 70 && (
      <div className="mt-2 sm:mt-3 inline-flex items-center text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
        <AlertCircle size={10} className="mr-1" /> Needs Improvement
      </div>
    )}
    {score < 50 && (
      <div className="mt-2 sm:mt-3 inline-flex items-center text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
        <AlertCircle size={10} className="mr-1" /> Poor
      </div>
    )}
  </motion.div>
);

export const DetailedAnalysis = ({
  text,
  url,
}: {
  text?: string;
  url: string;
}) => {
  const analysisSections = text ? parseAnalysisText(text, url) : null;

  if (!analysisSections) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6 lg:p-8 shadow-md">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center">
          <AlertCircle className="mr-2 text-teal-600" size={20} />
          Detailed Analysis
        </h3>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <p className="text-gray-600">
            No analysis available for this website.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 sm:p-6 lg:p-8 shadow-md">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center">
        <AlertCircle className="mr-2 text-teal-600" size={20} />
        Detailed Analysis
      </h3>

      <div className="space-y-4 sm:space-y-6">
        {analysisSections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border-l-4 border-teal-500"
          >
            <h4 className="text-base sm:text-lg font-semibold text-teal-700 mb-3 sm:mb-4 flex items-center">
              {getSectionIcon(section.title)}
              <span className="ml-2">{section.title}</span>
            </h4>

            <div className="space-y-3 sm:space-y-4">
              {section.content.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                  </div>
                  <p className="ml-3 text-sm sm:text-base text-gray-700">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            {section.metrics && section.metrics.length > 0 && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                <h5 className="font-medium text-gray-600 mb-2">Key Metrics:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {section.metrics.map((metric, metricIndex) => (
                    <div
                      key={metricIndex}
                      className="flex items-center justify-between bg-gray-50 p-2 sm:p-3 rounded-lg"
                    >
                      <span className="text-xs sm:text-sm text-gray-600">
                        {metric.label}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-semibold ${
                          metric.value >= 90
                            ? "text-green-600"
                            : metric.value >= 70
                            ? "text-teal-600"
                            : metric.value >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Helper function to parse analysis text into structured sections
const parseAnalysisText = (text: string, url: string) => {
  const sections: any[] = [];
  const lines = text.split("\n").filter((line) => line.trim());

  let currentSection: any = null;

  for (const line of lines) {
    if (line.match(/^#{1,3}\s+.+/)) {
      // Section header
      if (currentSection) {
        sections.push(currentSection);
      }

      const title = line.replace(/^#{1,3}\s+/, "").trim();
      currentSection = {
        title,
        content: [],
        metrics: [],
      };
    } else if (/^([-*]|\d+\.)/.test(line)) {
      // List item - remove bullet points and numbers
      if (currentSection) {
        const content = line.replaceAll("*", "").trim();
        // Remove any remaining * or - from the content
        const cleanContent = content.replaceAll("*", "").trim();
        currentSection.content.push(cleanContent);

        // Check for metric
        const metricMatch = cleanContent.match(/(.+):\s*(\d+)\/100/);
        if (metricMatch) {
          currentSection.metrics.push({
            label: metricMatch[1].trim(),
            value: parseInt(metricMatch[2]),
          });
        }
      }
    } else if (currentSection && line.trim()) {
      // Paragraph - remove any * or - from beginning
      const cleanLine = line.replaceAll("*", "");
      currentSection.content.push(cleanLine);
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  if (sections.length === 0) {
    sections.push({
      title: "Executive Summary",
      content: [`Analysis for ${url} based on comprehensive SEO audit.`],
      metrics: [],
    });
  }

  return sections;
};

// Helper function to get appropriate icon for each section
const getSectionIcon = (title: string) => {
  if (
    title.toLowerCase().includes("executive") ||
    title.toLowerCase().includes("summary")
  ) {
    return <BarChart3 size={18} className="text-teal-600" />;
  } else if (title.toLowerCase().includes("technical")) {
    return <Zap size={18} className="text-teal-600" />;
  } else if (title.toLowerCase().includes("content")) {
    return <Search size={18} className="text-teal-600" />;
  } else if (
    title.toLowerCase().includes("opportunity") ||
    title.toLowerCase().includes("recommendation")
  ) {
    return <TrendingUp size={18} className="text-teal-600" />;
  } else if (title.toLowerCase().includes("security")) {
    return <Shield size={18} className="text-teal-600" />;
  } else {
    return <Globe size={18} className="text-teal-600" />;
  }
};

export const Recommendations = ({
  list,
}: {
  list?: { text: string; priority: string }[];
}) => {
  if (!list || list.length === 0) {
    return (
      <div className="mb-6 sm:mb-8 md:mb-12">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center">
          <CheckCircle className="mr-2 text-teal-600" size={20} />
          Recommendations
        </h3>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100">
          <p className="text-gray-600 text-center">
            No specific recommendations available. All areas appear to be
            optimized.
          </p>
        </div>
      </div>
    );
  }

  // Group recommendations by priority
  const highPriority = list.filter((rec) => rec.priority === "High");
  const mediumPriority = list.filter((rec) => rec.priority === "Medium");
  const lowPriority = list.filter((rec) => rec.priority === "Low");

  return (
    <div className="mb-6 sm:mb-8 md:mb-12">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center">
        <CheckCircle className="mr-2 text-teal-600" size={20} />
        Recommendations
      </h3>

      <div className="space-y-4 sm:space-y-6">
        {highPriority.length > 0 && (
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-red-600 mb-3 sm:mb-4 flex items-center">
              <AlertCircle size={16} className="mr-2 sm:size-4" />
              High Priority Issues ({highPriority.length})
            </h4>
            <div className="grid gap-3 sm:gap-4">
              {highPriority.map((rec, idx) => (
                <RecommendationCard
                  key={idx}
                  recommendation={rec}
                  index={idx}
                />
              ))}
            </div>
          </div>
        )}

        {mediumPriority.length > 0 && (
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-yellow-600 mb-3 sm:mb-4 flex items-center">
              <AlertCircle size={16} className="mr-2 sm:size-4" />
              Medium Priority Improvements ({mediumPriority.length})
            </h4>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              {mediumPriority.map((rec, idx) => (
                <RecommendationCard
                  key={idx}
                  recommendation={rec}
                  index={idx + highPriority.length}
                />
              ))}
            </div>
          </div>
        )}

        {lowPriority.length > 0 && (
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-green-600 mb-3 sm:mb-4 flex items-center">
              <TrendingUp size={16} className="mr-2 sm:size-4" />
              Low Priority Enhancements ({lowPriority.length})
            </h4>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lowPriority.map((rec, idx) => (
                <RecommendationCard
                  key={idx}
                  recommendation={rec}
                  index={idx + highPriority.length + mediumPriority.length}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RecommendationCard = ({
  recommendation,
  index,
}: {
  recommendation: { text: string; priority: string };
  index: number;
}) => (
  <motion.div
    whileHover={{ y: -5 }}
    className={`bg-white p-3 sm:p-4 md:p-5 rounded-xl shadow-lg border-l-4 ${
      recommendation.priority === "High"
        ? "border-red-500"
        : recommendation.priority === "Medium"
        ? "border-yellow-500"
        : "border-green-500"
    } transition-all h-full flex flex-col`}
  >
    <div className="flex items-start justify-between mb-2 sm:mb-3">
      <div className="flex items-start flex-1">
        <span className="text-teal-600 font-bold mr-2 mt-0.5 text-sm sm:text-base">
          {index + 1}.
        </span>
        <h4 className="text-sm sm:text-base font-medium text-gray-800">
          {recommendation.text}
        </h4>
      </div>
      <span
        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
          recommendation.priority
        )} whitespace-nowrap ml-2 flex-shrink-0`}
      >
        {recommendation.priority}
      </span>
    </div>
    <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-auto pt-2 sm:pt-3 md:pt-4">
      <AlertCircle size={12} className="mr-1 flex-shrink-0 sm:size-3" />
      <span>
        {recommendation.priority === "High"
          ? "Critical issue - fix immediately"
          : recommendation.priority === "Medium"
          ? "Important improvement needed"
          : "Enhancement opportunity"}
      </span>
    </div>
  </motion.div>
);

export const ProgressBar = ({
  progress,
  loadingStep,
}: {
  progress: number;
  loadingStep: string;
}) => (
  <div className="mt-4 sm:mt-6 max-w-xl mx-auto">
    <div className="bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden shadow-inner">
      <motion.div
        className="bg-gradient-to-r from-teal-400 to-teal-600 h-2 sm:h-3 rounded-full"
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "linear" }}
      />
    </div>
    <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-300 flex items-center justify-center gap-2">
      <Clock size={12} className="sm:size-3" />
      {loadingStep}
    </p>
  </div>
);

export const HeaderSection = ({
  url,
  setUrl,
  loading,
  handleAudit,
  handleStopAudit,
  isLoggedIn,
  auditCount,
  progress,
  loadingStep,
}: {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  handleAudit: () => void;
  handleStopAudit: () => void;
  isLoggedIn: boolean;
  auditCount: number;
  progress?: number;
  loadingStep?: string;
}) => (
  <div className="bg-gradient-to-r from-gray-900 via-teal-900 to-gray-900 text-white py-8 sm:py-12 md:py-16 text-center px-4 relative overflow-hidden">
    <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
    <div className="container mx-auto relative z-10">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
        Analyze Your Website Performance
      </h1>
      <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
        Get SEO, Performance, Accessibility, and Best Practices insights
        instantly
      </p>

      <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col sm:flex-row justify-center gap-3 max-w-xl mx-auto w-full">
        <input
          type="url"
          placeholder="https://example.com"
          className="flex-1 w-full px-3 sm:px-4 md:px-5 py-2 sm:py-3 rounded-lg text-black bg-white focus:ring-4 focus:ring-teal-300 focus:outline-none transition-all shadow-lg text-sm sm:text-base"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        {!loading ? (
          <button
            onClick={handleAudit}
            className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <BarChart3 size={16} className="sm:size-4" />
            Start Audit
          </button>
        ) : (
          <button
            onClick={() => {
              handleStopAudit();
            }}
            className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Clock size={16} className="sm:size-4" />
            Stop Audit
          </button>
        )}
      </div>

      {loading && progress !== undefined && loadingStep && (
        <ProgressBar progress={progress} loadingStep={loadingStep} />
      )}
    </div>
  </div>
);

// New component for performance metrics
// export const PerformanceMetrics = ({ report }: { report: any }) => (
//   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12">
//     <div className="bg-white p-3 sm:p-4 md:p-5 rounded-xl shadow-md border border-gray-100">
//       <div className="flex items-center mb-2 sm:mb-3">
//         <Clock className="text-teal-600 mr-2 sm:size-4" size={16}/>
//         <h3 className="font-semibold text-gray-700 text-sm sm:text-base">Loading Time</h3>
//       </div>
//       <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{report.loadingTime || 3.2}s</p>
//       <p className="text-xs sm:text-sm text-gray-500 mt-1">Page load time</p>
//     </div>

//     <div className="bg-white p-3 sm:p-4 md:p-5 rounded-xl shadow-md border border-gray-100">
//       <div className="flex items-center mb-2 sm:mb-3">
//         <TrendingUp className="text-teal-600 mr-2 sm:size-4" size={16} />
//         <h3 className="font-semibold text-gray-700 text-sm sm:text-base">Page Size</h3>
//       </div>
//       <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{report.pageSize || 2.4}MB</p>
//       <p className="text-xs sm:text-sm text-gray-500 mt-1">Total resources</p>
//     </div>

//     <div className="bg-white p-3 sm:p-4 md:p-5 rounded-xl shadow-md border border-gray-100">
//       <div className="flex items-center mb-2 sm:mb-3">
//         <BarChart3 className="text-teal-600 mr-2 sm:size-4" size={16}/>
//         <h3 className="font-semibold text-gray-700 text-sm sm:text-base">Requests</h3>
//       </div>
//       <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{report.requests || 78}</p>
//       <p className="text-xs sm:text-sm text-gray-500 mt-1">HTTP requests</p>
//     </div>
//   </div>
// );

interface Scores {
  seo: number;
  performance: number;
  accessibility: number;
  bestPractices: number;
}

interface ScoresRadarProps {
  scores: Scores;
  color?: string;
}

export const ScoresRadar = ({
  scores,
  color = "#14b8a6",
}: ScoresRadarProps) => {
  const data = [
    { subject: "SEO", score: scores.seo || 0, fullMark: 100 },
    { subject: "Performance", score: scores.performance || 0, fullMark: 100 },
    {
      subject: "Accessibility",
      score: scores.accessibility || 0,
      fullMark: 100,
    },
    {
      subject: "Best Practices",
      score: scores.bestPractices || 0,
      fullMark: 100,
    },
  ];

  return (
    <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-md border border-gray-100 h-64 sm:h-72 md:h-80 lg:h-96">
      <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
        Score Comparison
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" fontSize={12} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar
            name="Scores"
            dataKey="score"
            stroke={color}
            fill={color}
            fillOpacity={0.6}
            animationDuration={1500}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              marginBottom: 5,
              borderRadius: 6,
              borderColor: "#ddd",
              fontSize: 12,
            }}
            itemStyle={{ color }}
          />
          <Legend verticalAlign="top" height={36} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

// New Bar Chart component to replace Historical Trends
export const ScoresBarChart = ({ scores }: { scores: Scores }) => {
  const data = [
    { category: "SEO", score: scores.seo || 0, fill: "#10b981" },
    {
      category: "Performance",
      score: scores.performance || 0,
      fill: "#0ea5e9",
    },
    {
      category: "Accessibility",
      score: scores.accessibility || 0,
      fill: "#8b5cf6",
    },
    {
      category: "Best Practices",
      score: scores.bestPractices || 0,
      fill: "#f59e0b",
    },
  ];

  return (
    <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-md border border-gray-100 h-64 sm:h-72 md:h-80 lg:h-96">
      <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center">
        <BarChart3 className="text-teal-600 mr-2 sm:size-5" size={18} />
        Performance Overview
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="category"
            fontSize={12}
            angle={-25}
            textAnchor="end"
            height={60}
          />
          <YAxis domain={[0, 100]} fontSize={12} />
          <Tooltip
            formatter={(value) => [`${value}`, "Score"]}
            contentStyle={{
              backgroundColor: "white",
              borderRadius: 6,
              borderColor: "#ddd",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="score"
            fill="#14b8a6"
            radius={[4, 4, 0, 0]}
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
