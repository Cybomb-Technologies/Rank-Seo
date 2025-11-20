// frontend.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  List,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Target,
  Users,
  Building,
  ChevronDown,
  BarChart3,
  DollarSign,
  X,
  Download,
  AlertTriangle,
} from "lucide-react";
import { useState, Dispatch, SetStateAction } from "react";

import { exportToCSV } from "./csv";

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

// Usage limits interface
interface UsageLimits {
  used: number;
  limit: number;
  remaining: number;
  message?: string;
}

// --- Difficulty Badge Styles ---
const getDifficultyColor = (difficulty: string) => {
  const lower = difficulty.toLowerCase();
  if (lower.includes("easy"))
    return "border-green-500 text-green-600 bg-green-50";
  if (lower.includes("medium"))
    return "border-yellow-500 text-yellow-600 bg-yellow-50";
  if (lower.includes("hard"))
    return "border-red-500 text-red-600 bg-red-50";
  return "border-gray-300 text-gray-600 bg-gray-50";
};

const getDifficultyIcon = (difficulty: string) => {
  const lower = difficulty.toLowerCase();
  if (lower.includes("easy"))
    return <CheckCircle className="text-green-500" size={16} />;
  if (lower.includes("medium"))
    return <AlertCircle className="text-yellow-500" size={16} />;
  if (lower.includes("hard"))
    return <Zap className="text-red-500" size={16} />;
  return <BarChart3 className="text-gray-400" size={16} />;
};

// --- Progress Bar ---
export const ProgressBar = ({
  progress,
  loadingStep,
}: {
  progress: number;
  loadingStep: string;
}) => (
  <div className="mt-6 max-w-xl mx-auto">
    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
      <motion.div
        className="h-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
    <p className="mt-2 text-sm text-gray-500 flex items-center justify-center gap-2">
      <Clock size={14} className="animate-pulse text-teal-500" />
      {loadingStep}
    </p>
  </div>
);

// --- Usage Limit Alert ---
export const UsageLimitAlert = ({ 
  usageLimits,
  onUpgrade
}: { 
  usageLimits: UsageLimits;
  onUpgrade: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6"
  >
    <div className="flex items-start gap-3">
      <AlertTriangle className="text-orange-500 mt-0.5 flex-shrink-0" size={20} />
      <div className="flex-1">
        <h4 className="font-semibold text-orange-800">Usage Limit Reached</h4>
        <p className="text-orange-700 text-sm mt-1">
          {usageLimits.message || `You've used ${usageLimits.used} of ${usageLimits.limit} keyword reports this month.`}
        </p>
        <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (usageLimits.used / usageLimits.limit) * 100)}%` }}
          />
        </div>
        <p className="text-orange-600 text-xs mt-2">
          {usageLimits.remaining <= 0 ? (
            "No reports remaining. Upgrade your plan to continue."
          ) : (
            `${usageLimits.remaining} reports remaining`
          )}
        </p>
        <button
          onClick={onUpgrade}
          className="mt-3 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Upgrade Plan
        </button>
      </div>
    </div>
  </motion.div>
);

// --- Usage Limit Display ---
export const UsageLimitDisplay = ({ 
  usageLimits 
}: { 
  usageLimits: UsageLimits;
}) => {
  const remaining = Math.max(0, usageLimits.limit - usageLimits.used);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-800">Keyword Reports</h4>
          <p className="text-gray-600 text-sm">
            {usageLimits.used} of {usageLimits.limit} used this month
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-teal-600">
            {remaining}
          </div>
          <div className="text-xs text-gray-500">Remaining</div>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
        <div 
          className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, (usageLimits.used / usageLimits.limit) * 100)}%` }}
        />
      </div>
      {remaining <= 2 && remaining > 0 && (
        <p className="text-orange-600 text-xs mt-2 flex items-center gap-1">
          <AlertTriangle size={12} />
          Low on reports. Consider upgrading your plan.
        </p>
      )}
    </div>
  );
};

// --- Input Field ---
export const InputField = ({
  icon,
  placeholder,
  value,
  onChange,
  disabled,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500">
      {icon}
    </div>
    <input
      type="text"
      placeholder={placeholder}
      className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  </div>
);

// --- Header ---
export const GeneratorHeader = ({
  topic,
  setTopic,
  industry,
  setIndustry,
  audience,
  setAudience,
  loading,
  handleGenerateKeywords,
  progress,
  loadingStep,
  usageLimits,
  onUpgrade,
}: {
  topic: string;
  setTopic: (val: string) => void;
  industry: string;
  setIndustry: (val: string) => void;
  audience: string;
  setAudience: (val: string) => void;
  loading: boolean;
  handleGenerateKeywords: () => void;
  progress?: number;
  loadingStep?: string;
  usageLimits?: UsageLimits;
  onUpgrade: () => void;
}) => {
  const hasReachedLimit = usageLimits && usageLimits.remaining <= 0;
  const isDisabled = loading || !topic || !industry || !audience || hasReachedLimit;

  return (
    <div className="bg-gradient-to-r pt-30 from-white via-gray-50 to-white py-12 text-center shadow-sm border-b border-gray-200">
      <div className="container mx-auto relative z-10">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-800 flex items-center justify-center gap-2">
          <Sparkles className="text-teal-500" size={28} />
          AI-Powered Keyword Generator
          <Sparkles className="text-emerald-400" size={28} />
        </h1>
        <p className="mt-3 text-gray-500 max-w-2xl mx-auto">
          Fuel your content strategy with intelligent keyword insights tailored to
          your business.
        </p>

        {/* Usage Limit Alert */}
        {hasReachedLimit && usageLimits && (
          <UsageLimitAlert usageLimits={usageLimits} onUpgrade={onUpgrade} />
        )}

        <div className="mt-8 max-w-3xl mx-auto w-full bg-white border border-gray-200 rounded-xl shadow-md p-6">
          {/* Usage Display */}
          {usageLimits && !hasReachedLimit && (
            <UsageLimitDisplay usageLimits={usageLimits} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <InputField
              icon={<Target size={18} />}
              placeholder="Primary Topic"
              value={topic}
              onChange={setTopic}
              disabled={loading || hasReachedLimit}
            />
            <InputField
              icon={<Building size={18} />}
              placeholder="Industry"
              value={industry}
              onChange={setIndustry}
              disabled={loading || hasReachedLimit}
            />
            <InputField
              icon={<Users size={18} />}
              placeholder="Target Audience"
              value={audience}
              onChange={setAudience}
              disabled={loading || hasReachedLimit}
            />
          </div>
          <motion.button
            onClick={handleGenerateKeywords}
            disabled={isDisabled}
            whileHover={{ scale: isDisabled ? 1 : 1.03 }}
            whileTap={{ scale: isDisabled ? 1 : 0.97 }}
            className={`mx-auto px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-3 text-white transition-all duration-300 ${
              isDisabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-lg"
            }`}
          >
            {loading ? (
              <Clock size={20} className="animate-spin" />
            ) : hasReachedLimit ? (
              <AlertTriangle size={20} />
            ) : (
              <Search size={20} />
            )}
            {hasReachedLimit ? "Usage Limit Reached" : loading ? "Generating..." : "Generate Keywords"}
          </motion.button>

          {hasReachedLimit && (
            <p className="text-sm text-gray-500 mt-3">
              You've reached your monthly limit.{" "}
              <button 
                onClick={onUpgrade}
                className="text-teal-600 hover:text-teal-700 font-medium underline"
              >
                Upgrade your plan
              </button>{" "}
              to generate more keyword reports.
            </p>
          )}
        </div>

        <AnimatePresence>
          {loading && progress !== undefined && loadingStep && (
            <ProgressBar progress={progress} loadingStep={loadingStep} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Helper for Detail View ---
const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-3 py-1">
    <div className="text-teal-500 mt-0.5 flex-shrink-0">{icon}</div>
    <div>
      <span className="font-medium text-gray-700">{label}:</span>
      <span className="ml-2 text-gray-500">{value}</span>
    </div>
  </div>
);

// --- KeywordDetailModal Component ---
const KeywordDetailModal = ({
  keyword,
  onClose,
}: {
  keyword: Keyword;
  onClose: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{backgroundColor:"#00000061"}}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, y: 50 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 50 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-md mx-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-start border-b pb-3 mb-4">
        <h3 className="text-xl md:text-2xl font-bold text-gray-800 break-words pr-4">
          {keyword.keyword}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <X size={24} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(
              keyword.difficulty_score
            )} flex items-center gap-1 flex-shrink-0`}
          >
            {getDifficultyIcon(keyword.difficulty_score)}
            {keyword.difficulty_score}
          </span>
          <span className="text-sm font-medium text-gray-500">
            Type: {keyword.type}
          </span>
        </div>

        <div className="pt-2 space-y-3">
          <DetailRow 
            icon={<Search size={16} />}
            label="Search Volume"
            value={keyword.search_volume.toLocaleString()}
          />
          <DetailRow 
            icon={<DollarSign size={16} />}
            label="CPC"
            value={`$${keyword.cpc.toFixed(2)}`}
          />
          <DetailRow 
            icon={<Target size={16} />}
            label="Intent"
            value={keyword.intent}
          />
          <DetailRow 
            icon={<List size={16} />}
            label="Content Type"
            value={keyword.content_type}
          />
          <DetailRow 
            icon={<BarChart3 size={16} />}
            label="Keyword Density"
            value={`${keyword.keyword_density.toFixed(1)}%`}
          />
          <DetailRow 
            icon={<Sparkles size={16} />}
            label="Content Idea"
            value={<p className="text-gray-600 italic mt-0.5">{keyword.content_idea}</p>}
          />
        </div>
      </div>
    </motion.div>
  </motion.div>
);

// --- KeywordCard Component ---
export const KeywordCard = ({
  keyword,
  index,
  onOpenModal,
}: {
  keyword: Keyword;
  index: number;
  onOpenModal: (keyword: Keyword) => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
    className="bg-white p-5 rounded-xl shadow-md border border-gray-200 transition-all hover:shadow-lg hover:border-teal-300 cursor-pointer"
    onClick={() => onOpenModal(keyword)}
  >
    <div className="flex justify-between items-start gap-3">
      <h4 className="font-semibold text-gray-800 text-base sm:text-lg flex-1">
        {keyword.keyword}
      </h4>
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(
          keyword.difficulty_score
        )} flex items-center gap-1 flex-shrink-0`}
      >
        {getDifficultyIcon(keyword.difficulty_score)}
        {keyword.difficulty_score}
      </span>
    </div>
    
    <div className="flex justify-between items-center mt-3">
      <span className="text-xs font-medium text-gray-500">Type: {keyword.type}</span>
      <div className="flex items-center text-teal-500 text-sm font-medium">
        View Details <ArrowRight size={16} className="ml-1" />
      </div>
    </div>
  </motion.div>
);

// --- Keyword Results with Tabs ---
export const KeywordResults = ({
  topic,
  keywords,
  usageLimits,
}: {
  topic: string;
  keywords: Keyword[];
  usageLimits?: UsageLimits;
}) => {
  const [activeTab, setActiveTab] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [modalKeyword, setModalKeyword] = useState<Keyword | null>(null);

  const filtered = keywords.filter((k) =>
    k.difficulty_score.toLowerCase().includes(activeTab.toLowerCase())
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-8 bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <List size={24} /> Keyword Report for "{topic}"
            </h2>
            {usageLimits && (
              <p className="text-teal-100 text-sm mt-1">
                Used {usageLimits.used} of {usageLimits.limit} reports this month
              </p>
            )}
          </div>

          <button
            onClick={() => exportToCSV(keywords, `${topic}-keywords.csv`)}
            className="ml-auto bg-white text-teal-600 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 text-sm font-medium transition flex items-center gap-2"
          >
            <Download size={16} />
            Download CSV
          </button>
        </div>

        <div className="flex gap-3 mt-4">
          {(["Easy", "Medium", "Hard"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-white text-teal-600"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <motion.div 
        className="p-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {filtered.map((keyword, i) => (
          <KeywordCard
            key={keyword.keyword}
            keyword={keyword}
            index={i}
            onOpenModal={setModalKeyword}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {modalKeyword && (
          <KeywordDetailModal 
            keyword={modalKeyword} 
            onClose={() => setModalKeyword(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};