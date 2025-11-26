"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Eye,
  Search,
  Filter,
  Plus,
  TrendingUp,
  TrendingDown,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
  Tag,
  Globe,
  FileText,
  Target,
  Users,
  Sparkles,
  BarChart3,
  Smartphone,
  Tablet,
  Monitor,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import Metatags from "../../../SEO/metatags";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getScoreColor(score: number) {
  if (score >= 90) return "text-green-600 bg-green-50";
  if (score >= 70) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
}

function getScoreBadgeVariant(score: number) {
  if (score >= 90) return "default";
  if (score >= 70) return "secondary";
  return "destructive";
}

function getPriorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case "high":
      return "text-red-600";
    case "medium":
      return "text-yellow-600";
    case "low":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
}

// Function to format analysis text into bullet points
function formatAnalysis(analysis: string) {
  if (!analysis) return [];

  const points = analysis
    .split(/\n|•|\*| - /)
    .filter(
      (point) =>
        point.trim().length > 0 &&
        !point.toLowerCase().includes("analysis:") &&
        !point.toLowerCase().includes("detailed analysis:")
    );

  return points.length > 0 ? points : [analysis];
}

// Service types
type ServiceType =
  | "seo-audit"
  | "business-names"
  | "keyword-reports"
  | "keyword-checker"
  | "keyword-scraper";

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedService, setSelectedService] =
    useState<ServiceType>("seo-audit");
  const [auditReports, setAuditReports] = useState<any[]>([]);
  const [businessNameReports, setBusinessNameReports] = useState<any[]>([]);
  const [keywordReports, setKeywordReports] = useState<any[]>([]);
  const [keywordCheckerReports, setKeywordCheckerReports] = useState<any[]>([]);
  const [keywordScraperReports, setKeywordScraperReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailedBusinessNames, setDetailedBusinessNames] = useState<any[]>([]);
  const [detailedKeywords, setDetailedKeywords] = useState<any[]>([]);
  const [detailedKeywordAnalysis, setDetailedKeywordAnalysis] =
    useState<any>(null);

  // Pagination states for all services
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Pagination states for scraped pages (moved to top level)
  const [currentScrapedPage, setCurrentScrapedPage] = useState(1);
  const [scrapedPerPage, setScrapedPerPage] = useState(10);

  // ✅ Fetch data from APIs based on selected service
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        setLoading(true);

        switch (selectedService) {
          case "seo-audit":
            await fetchSEOAuditReports(token);
            break;
          case "business-names":
            await fetchBusinessNameReports(token);
            break;
          case "keyword-reports":
            await fetchKeywordReports(token);
            break;
          case "keyword-checker":
            await fetchKeywordCheckerReports(token);
            break;
          case "keyword-scraper":
            await fetchKeywordScraperReports(token);
            break;
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [selectedService]);

  // ✅ Fetch SEO Audit Reports
  const fetchSEOAuditReports = async (token: string) => {
    const res = await fetch(`${API_URL}/api/audits`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch SEO audit reports");

    const data = await res.json();
    const formattedData = (Array.isArray(data) ? data : data.audits || []).map(
      (audit: any, idx: number) => ({
        id: audit.id || idx + 1,
        website: audit.url || "Unknown",
        url: audit.url || "N/A",
        date: audit.date || new Date().toLocaleDateString("en-GB"),
        time:
          audit.time ||
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        seoScore: audit.scores?.seo ?? 0,
        speedScore: audit.scores?.performance ?? 0,
        accessibilityScore: audit.scores?.accessibility ?? 0,
        bestPracticesScore: audit.scores?.bestPractices ?? 0,
        issues: audit.issues ?? 0,
        status: audit.status || "completed",
        trend: audit.trend || (audit.scores?.seo > 70 ? "up" : "down"),
        recommendations: audit.recommendations || [],
        analysis: audit.analysis || "",
        service: "seo-audit",
      })
    );

    setAuditReports(formattedData);
  };

  // ✅ Fetch Business Name Reports
  const fetchBusinessNameReports = async (token: string) => {
    const res = await fetch(`${API_URL}/api/business/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch business name reports");

    const data = await res.json();
    const formattedData = (data.data || []).map(
      (session: any, idx: number) => ({
        id: session._id || session.sessionId || idx + 1,
        sessionId: session.sessionId,
        industry: session.industry || "Unknown",
        audience: session.audience || "General",
        stylePreference: session.stylePreference || "Modern",
        nameCount: session.nameCount || 0,
        date: new Date(session.generatedAt).toLocaleDateString("en-GB"),
        time: new Date(session.generatedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "completed",
        service: "business-names",
      })
    );

    setBusinessNameReports(formattedData);
  };

  // ✅ Fetch Keyword Reports
  const fetchKeywordReports = async (token: string) => {
    const res = await fetch(`${API_URL}/api/keywords/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch keyword reports");

    const data = await res.json();
    const formattedData = (data.data || []).map((report: any, idx: number) => ({
      id: report._id || report.sessionId || idx + 1,
      sessionId: report.sessionId,
      topic: report.topic || "Unknown",
      industry: report.industry || "General",
      audience: report.audience || "General",
      keywordCount: report.keywordCount || 0,
      totalSearchVolume: report.totalSearchVolume || 0,
      averageCPC: report.averageCPC || 0,
      date: new Date(report.generatedAt).toLocaleDateString("en-GB"),
      time: new Date(report.generatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "completed",
      service: "keyword-reports",
    }));

    setKeywordReports(formattedData);
  };

  // ✅ Fetch Keyword Checker Reports - FIXED
  const fetchKeywordCheckerReports = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/keychecker/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.warn("Keyword checker reports endpoint not available");
        setKeywordCheckerReports([]);
        return;
      }

      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const formattedData = data.data.map((report: any, idx: number) => ({
          id: report._id || report.reportId || `kc-${idx + 1}`,
          reportId: report.reportId,
          mainUrl: report.mainUrl || "Unknown",
          totalScraped: report.totalScraped || 0,
          status: report.status || "completed",
          processingTime: report.processingTime || 0,
          keywords: report.keywords || [],
          summary: report.summary || {},
          analysis: report.analysis || {},
          date: new Date(report.createdAt).toLocaleDateString("en-GB"),
          time: new Date(report.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          service: "keyword-checker",
        }));

        setKeywordCheckerReports(formattedData);
      } else {
        setKeywordCheckerReports([]);
      }
    } catch (error) {
      console.error("Error fetching keyword checker reports:", error);
      setKeywordCheckerReports([]);
    }
  };

  // ✅ Fetch Keyword Scraper Reports - FIXED
  const fetchKeywordScraperReports = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/scraper/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.warn(
          "Keyword scraper reports endpoint not available, trying alternative endpoint"
        );
        // Try alternative endpoint
        const altRes = await fetch(`${API_URL}/api/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!altRes.ok) {
          setKeywordScraperReports([]);
          return;
        }

        const altData = await altRes.json();
        if (altData.success && Array.isArray(altData.data)) {
          const formattedData = altData.data.map(
            (report: any, idx: number) => ({
              id: report._id || report.reportId || `ks-${idx + 1}`,
              reportId: report.reportId,
              mainUrl: report.mainUrl || "Unknown",
              domain: report.domain || "N/A",
              totalPagesScraped: report.totalPagesScraped || 0,
              totalKeywordsFound: report.totalKeywordsFound || 0,
              keywordData: report.keywordData || {},
              scrapedPages: report.scrapedPages || [],
              date: new Date(report.createdAt).toLocaleDateString("en-GB"),
              time: new Date(report.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              status: "completed",
              service: "keyword-scraper",
            })
          );

          setKeywordScraperReports(formattedData);
        } else {
          setKeywordScraperReports([]);
        }
        return;
      }

      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const formattedData = data.data.map((report: any, idx: number) => ({
          id: report._id || report.reportId || `ks-${idx + 1}`,
          reportId: report.reportId,
          mainUrl: report.mainUrl || "Unknown",
          domain: report.domain || "N/A",
          totalPagesScraped: report.totalPagesScraped || 0,
          totalKeywordsFound: report.totalKeywordsFound || 0,
          keywordData: report.keywordData || {},
          scrapedPages: report.scrapedPages || [],
          date: new Date(report.createdAt).toLocaleDateString("en-GB"),
          time: new Date(report.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "completed",
          service: "keyword-scraper",
        }));

        setKeywordScraperReports(formattedData);
      } else {
        setKeywordScraperReports([]);
      }
    } catch (error) {
      console.error("Error fetching keyword scraper reports:", error);
      setKeywordScraperReports([]);
    }
  };

  // ✅ Fetch detailed business names for a session
  const fetchDetailedBusinessNames = async (sessionId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [];

      const res = await fetch(`${API_URL}/api/business/names/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch detailed business names");

      const data = await res.json();
      return data.data?.names || [];
    } catch (error) {
      console.error("Error fetching detailed business names:", error);
      return [];
    }
  };

  // ✅ Fetch detailed keywords for a session
  const fetchDetailedKeywords = async (sessionId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [];

      const res = await fetch(
        `${API_URL}/api/keywords/reports/session/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch detailed keywords");

      const data = await res.json();
      return data.data?.keywords || [];
    } catch (error) {
      console.error("Error fetching detailed keywords:", error);
      return [];
    }
  };

  // ✅ Fetch detailed keyword analysis for keyword checker
  const fetchDetailedKeywordAnalysis = async (reportId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const res = await fetch(`${API_URL}/api/keychecker/report/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch detailed keyword analysis");

      const data = await res.json();
      return data.data || null;
    } catch (error) {
      console.error("Error fetching detailed keyword analysis:", error);
      return null;
    }
  };

  // ✅ Fetch detailed scraper analysis for keyword scraper
  const fetchDetailedScraperAnalysis = async (reportId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const res = await fetch(`${API_URL}/api/scraper/report/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Try alternative endpoint
        const altRes = await fetch(`${API_URL}/api/report/${reportId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!altRes.ok)
          throw new Error("Failed to fetch detailed scraper analysis");

        const altData = await altRes.json();
        return altData.report || altData.data || null;
      }

      const data = await res.json();
      return data.report || data.data || null;
    } catch (error) {
      console.error("Error fetching detailed scraper analysis:", error);
      return null;
    }
  };

  // ✅ Get current reports based on selected service
  const getCurrentReports = () => {
    switch (selectedService) {
      case "seo-audit":
        return auditReports;
      case "business-names":
        return businessNameReports;
      case "keyword-reports":
        return keywordReports;
      case "keyword-checker":
        return keywordCheckerReports;
      case "keyword-scraper":
        return keywordScraperReports;
      default:
        return [];
    }
  };

  // ✅ Get service display name
  const getServiceDisplayName = (service: ServiceType) => {
    switch (service) {
      case "seo-audit":
        return "SEO Audits";
      case "business-names":
        return "Business Names";
      case "keyword-reports":
        return "Keyword Reports";
      case "keyword-checker":
        return "Keyword Checker";
      case "keyword-scraper":
        return "Keyword Scraper";
      default:
        return "Reports";
    }
  };

  // ✅ Get service link
  const getServiceLink = () => {
    switch (selectedService) {
      case "seo-audit":
        return "/audit";
      case "business-names":
        return "/business-name-generator";
      case "keyword-reports":
        return "/keyword-generator";
      case "keyword-checker":
        return "/keyword-checker";
      case "keyword-scraper":
        return "/keyword-scraper";
      default:
        return "/";
    }
  };

  // ✅ Convert DD/MM/YYYY → YYYY-MM-DD for date comparison
  const formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month}-${day}`;
  };

  // ✅ Filtering logic with Date filter
  const currentReports = getCurrentReports();
  const filteredReports = currentReports.filter((report) => {
    const matchesSearch =
      report.website?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.mainUrl?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.industry?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter;
    const matchesDate = !dateFilter || formatDate(report.date) === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // ✅ Pagination functions for all services
  const getCurrentItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    if (selectedReport?.service === "keyword-reports") {
      return detailedKeywords.slice(startIndex, endIndex);
    } else if (selectedReport?.service === "keyword-checker") {
      const reportData = detailedKeywordAnalysis || selectedReport;
      return (reportData.keywords || []).slice(startIndex, endIndex);
    } else if (selectedReport?.service === "business-names") {
      return detailedBusinessNames.slice(startIndex, endIndex);
    } else if (selectedReport?.service === "keyword-scraper") {
      const reportData = detailedKeywordAnalysis || selectedReport;
      const keywords = reportData.keywordData?.primary_keywords || [];
      return keywords.slice(startIndex, endIndex);
    }
    return [];
  };

  const getTotalPages = () => {
    let totalItems = 0;

    if (selectedReport?.service === "keyword-reports") {
      totalItems = detailedKeywords.length;
    } else if (selectedReport?.service === "keyword-checker") {
      const reportData = detailedKeywordAnalysis || selectedReport;
      totalItems = reportData.keywords?.length || 0;
    } else if (selectedReport?.service === "business-names") {
      totalItems = detailedBusinessNames.length;
    } else if (selectedReport?.service === "keyword-scraper") {
      const reportData = detailedKeywordAnalysis || selectedReport;
      totalItems = reportData.keywordData?.primary_keywords?.length || 0;
    }

    return Math.ceil(totalItems / itemsPerPage);
  };

  const handleNextPage = () => {
    if (currentPage < getTotalPages()) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // ✅ Pagination functions for scraped pages
  const getCurrentScrapedPages = () => {
    const startIndex = (currentScrapedPage - 1) * scrapedPerPage;
    const endIndex = startIndex + scrapedPerPage;
    const scrapedPages =
      detailedKeywordAnalysis?.scrapedPages ||
      selectedReport?.scrapedPages ||
      [];
    return scrapedPages.slice(startIndex, endIndex);
  };

  const getTotalScrapedPages = () => {
    const scrapedPages =
      detailedKeywordAnalysis?.scrapedPages ||
      selectedReport?.scrapedPages ||
      [];
    return Math.ceil(scrapedPages.length / scrapedPerPage);
  };

  const handleNextScrapedPage = () => {
    if (currentScrapedPage < getTotalScrapedPages()) {
      setCurrentScrapedPage(currentScrapedPage + 1);
    }
  };

  const handlePrevScrapedPage = () => {
    if (currentScrapedPage > 1) {
      setCurrentScrapedPage(currentScrapedPage - 1);
    }
  };

  const handleScrapedPerPageChange = (value: string) => {
    setScrapedPerPage(Number(value));
    setCurrentScrapedPage(1);
  };

  // ✅ Handle view report
  const handleViewReport = async (report: any) => {
    setSelectedReport(report);
    setCurrentPage(1); // Reset to first page when viewing new report
    setCurrentScrapedPage(1); // Reset scraped pages pagination

    // Fetch additional data based on service type
    if (report.service === "business-names" && report.sessionId) {
      const detailedNames = await fetchDetailedBusinessNames(report.sessionId);
      setDetailedBusinessNames(detailedNames);
    } else if (report.service === "keyword-reports" && report.sessionId) {
      const detailedKeywords = await fetchDetailedKeywords(report.sessionId);
      setDetailedKeywords(detailedKeywords);
    } else if (report.service === "keyword-checker" && report.reportId) {
      const detailedAnalysis = await fetchDetailedKeywordAnalysis(
        report.reportId
      );
      setDetailedKeywordAnalysis(detailedAnalysis);
    } else if (report.service === "keyword-scraper" && report.reportId) {
      const detailedAnalysis = await fetchDetailedScraperAnalysis(
        report.reportId
      );
      setDetailedKeywordAnalysis(detailedAnalysis);
    } else {
      setDetailedBusinessNames([]);
      setDetailedKeywords([]);
      setDetailedKeywordAnalysis(null);
    }

    setIsDialogOpen(true);
  };

  // ✅ Get table columns based on service
  const getTableColumns = () => {
    switch (selectedService) {
      case "seo-audit":
        return (
          <>
            <TableHead className="min-w-[120px]">Website</TableHead>
            <TableHead className="text-center hidden xs:table-cell">
              Date
            </TableHead>
            <TableHead className="text-center">SEO</TableHead>
            <TableHead className="text-center">Speed</TableHead>
            <TableHead className="text-center hidden sm:table-cell">
              Accessibility
            </TableHead>
            <TableHead className="text-center hidden md:table-cell">
              Best Practices
            </TableHead>
            <TableHead className="text-center hidden lg:table-cell">
              Trend
            </TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </>
        );

      case "business-names":
        return (
          <>
            <TableHead className="min-w-[120px]">Industry</TableHead>
            <TableHead className="text-center hidden xs:table-cell">
              Audience
            </TableHead>
            <TableHead className="text-center hidden sm:table-cell">
              Style
            </TableHead>
            <TableHead className="text-center">Names</TableHead>
            <TableHead className="text-center hidden xs:table-cell">
              Date
            </TableHead>
            <TableHead className="text-center hidden md:table-cell">
              Session ID
            </TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </>
        );

      case "keyword-reports":
        return (
          <>
            <TableHead className="min-w-[120px]">Topic</TableHead>
            <TableHead className="text-center hidden xs:table-cell">
              Industry
            </TableHead>
            <TableHead className="text-center">Keywords</TableHead>
            <TableHead className="text-center hidden sm:table-cell">
              Search Volume
            </TableHead>
            <TableHead className="text-center hidden xs:table-cell">
              Date
            </TableHead>
            <TableHead className="text-center hidden md:table-cell">
              Avg CPC
            </TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </>
        );

      case "keyword-checker":
      case "keyword-scraper":
        return (
          <>
            <TableHead className="min-w-[120px]">URL</TableHead>
            <TableHead className="text-center">Pages</TableHead>
            <TableHead className="text-center hidden xs:table-cell">
              Keywords
            </TableHead>
            <TableHead className="text-center hidden sm:table-cell">
              Date
            </TableHead>
            <TableHead className="text-center hidden md:table-cell">
              Status
            </TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </>
        );

      default:
        return null;
    }
  };

  // ✅ Get table row content based on service
  const getTableRow = (report: any) => {
    switch (selectedService) {
      case "seo-audit":
        return (
          <TableRow key={report.id} className="hover:bg-muted/50">
            <TableCell className="py-3">
              <div
                className="max-w-[120px] xs:max-w-[180px] sm:max-w-none truncate"
                title={report.website}
              >
                {report.website}
              </div>
              <div className="xs:hidden text-xs text-muted-foreground mt-1">
                {report.date}
              </div>
            </TableCell>
            <TableCell className="text-center py-3 hidden xs:table-cell">
              <p className="text-xs sm:text-sm font-medium whitespace-nowrap">
                {report.date}
              </p>
            </TableCell>
            <TableCell className="text-center py-3">
              <Badge
                variant={getScoreBadgeVariant(report.seoScore)}
                className={`${getScoreColor(
                  report.seoScore
                )} text-xs px-2 py-1`}
              >
                {report.seoScore}
              </Badge>
            </TableCell>
            <TableCell className="text-center py-3">
              <Badge
                variant={getScoreBadgeVariant(report.speedScore)}
                className={`${getScoreColor(
                  report.speedScore
                )} text-xs px-2 py-1`}
              >
                {report.speedScore}
              </Badge>
            </TableCell>
            <TableCell className="text-center hidden sm:table-cell py-3">
              <Badge
                variant={getScoreBadgeVariant(report.accessibilityScore)}
                className={`${getScoreColor(
                  report.accessibilityScore
                )} text-xs px-2 py-1`}
              >
                {report.accessibilityScore}
              </Badge>
            </TableCell>
            <TableCell className="text-center hidden md:table-cell py-3">
              <Badge
                variant={getScoreBadgeVariant(report.bestPracticesScore)}
                className={`${getScoreColor(
                  report.bestPracticesScore
                )} text-xs px-2 py-1`}
              >
                {report.bestPracticesScore}
              </Badge>
            </TableCell>
            <TableCell className="text-center hidden lg:table-cell py-3">
              {report.trend === "up" ? (
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 mx-auto" />
              ) : (
                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 mx-auto" />
              )}
            </TableCell>
            <TableCell className="text-center py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewReport(report)}
                className="h-8 px-2 text-xs"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="sr-only xs:not-sr-only xs:ml-1">View</span>
              </Button>
            </TableCell>
          </TableRow>
        );

      case "business-names":
        return (
          <TableRow key={report.id} className="hover:bg-muted/50">
            <TableCell className="py-3">
              <div
                className="max-w-[120px] xs:max-w-[180px] sm:max-w-none truncate"
                title={report.industry}
              >
                {report.industry}
              </div>
              <div className="xs:hidden text-xs text-muted-foreground mt-1">
                {report.audience} • {report.nameCount} names
              </div>
            </TableCell>
            <TableCell className="text-center py-3 hidden xs:table-cell">
              <p className="text-xs sm:text-sm font-medium whitespace-wrap">
                {report.audience}
              </p>
            </TableCell>
            <TableCell className="text-center py-3 hidden sm:table-cell">
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {report.stylePreference}
              </Badge>
            </TableCell>
            <TableCell className="text-center py-3">
              <Badge variant="outline" className="text-xs px-2 py-1">
                {report.nameCount}
              </Badge>
            </TableCell>
            <TableCell className="text-center py-3 hidden xs:table-cell">
              <p className="text-xs sm:text-sm font-medium whitespace-wrap">
                {report.date}
              </p>
            </TableCell>
            <TableCell className="text-center hidden md:table-cell py-3">
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {report.sessionId?.slice(0, 8)}...
              </code>
            </TableCell>
            <TableCell className="text-center py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewReport(report)}
                className="h-8 px-2 text-xs"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="sr-only xs:not-sr-only xs:ml-1">View</span>
              </Button>
            </TableCell>
          </TableRow>
        );

      case "keyword-reports":
        return (
          <TableRow key={report.id} className="hover:bg-muted/50">
            <TableCell className="py-3">
              <div
                className="max-w-[120px] xs:max-w-[180px] sm:max-w-none truncate"
                title={report.topic}
              >
                {report.topic}
              </div>
              <div className="xs:hidden text-xs text-muted-foreground mt-1">
                {report.keywordCount} keywords • {report.date}
              </div>
            </TableCell>
            <TableCell className="text-center py-3 hidden xs:table-cell">
              <p className="text-xs sm:text-sm font-medium whitespace-nowrap">
                {report.industry}
              </p>
            </TableCell>
            <TableCell className="text-center py-3">
              <Badge variant="outline" className="text-xs px-2 py-1">
                {report.keywordCount}
              </Badge>
            </TableCell>
            <TableCell className="text-center py-3 hidden sm:table-cell">
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {report.totalSearchVolume.toLocaleString()}
              </Badge>
            </TableCell>
            <TableCell className="text-center py-3 hidden xs:table-cell">
              <p className="text-xs sm:text-sm font-medium whitespace-nowrap">
                {report.date}
              </p>
            </TableCell>
            <TableCell className="text-center hidden md:table-cell py-3">
              <Badge variant="outline" className="text-xs px-2 py-1">
                ${report.averageCPC?.toFixed(2)}
              </Badge>
            </TableCell>
            <TableCell className="text-center py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewReport(report)}
                className="h-8 px-2 text-xs"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="sr-only xs:not-sr-only xs:ml-1">View</span>
              </Button>
            </TableCell>
          </TableRow>
        );

      case "keyword-checker":
        return (
          <TableRow key={report.id} className="hover:bg-muted/50">
            <TableCell className="py-3">
              <div
                className="max-w-[120px] xs:max-w-[180px] sm:max-w-none truncate"
                title={report.mainUrl}
              >
                {report.mainUrl}
              </div>
              <div className="xs:hidden text-xs text-muted-foreground mt-1">
                {report.totalScraped || 0} pages • {report.date}
              </div>
            </TableCell>
            <TableCell className="text-center py-3">
              <Badge variant="outline" className="text-xs px-2 py-1">
                {report.totalScraped || 0}
              </Badge>
            </TableCell>
            <TableCell className="text-center py-3 hidden xs:table-cell">
              <Badge variant="outline" className="text-xs px-2 py-1">
                {report.keywords?.length || 0}
              </Badge>
            </TableCell>
            <TableCell className="text-center py-3 hidden sm:table-cell">
              <p className="text-xs sm:text-sm font-medium whitespace-nowrap">
                {report.date}
              </p>
            </TableCell>
            <TableCell className="text-center hidden md:table-cell py-3">
              <Badge
                variant={
                  report.status === "completed" ? "default" : "secondary"
                }
                className="text-xs px-2 py-1"
              >
                {report.status}
              </Badge>
            </TableCell>
            <TableCell className="text-center py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewReport(report)}
                className="h-8 px-2 text-xs"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="sr-only xs:not-sr-only xs:ml-1">View</span>
              </Button>
            </TableCell>
          </TableRow>
        );

      case "keyword-scraper":
        return (
          <TableRow key={report.id} className="hover:bg-muted/50">
            <TableCell className="py-3">
              <div
                className="max-w-[120px] xs:max-w-[180px] sm:max-w-none truncate"
                title={report.mainUrl}
              >
                {report.mainUrl}
              </div>
              <div className="xs:hidden text-xs text-muted-foreground mt-1">
                {report.totalPagesScraped || 0} pages • {report.date}
              </div>
            </TableCell>
            <TableCell className="text-center py-3">
              <Badge variant="outline" className="text-xs px-2 py-1">
                {report.totalPagesScraped || 0}
              </Badge>
            </TableCell>
            <TableCell className="text-center py-3 hidden xs:table-cell">
              <Badge variant="outline" className="text-xs px-2 py-1">
                {report.totalKeywordsFound || 0}
              </Badge>
            </TableCell>
            <TableCell className="text-center py-3 hidden sm:table-cell">
              <p className="text-xs sm:text-sm font-medium whitespace-nowrap">
                {report.date}
              </p>
            </TableCell>
            <TableCell className="text-center hidden md:table-cell py-3">
              <Badge
                variant={
                  report.status === "completed" ? "default" : "secondary"
                }
                className="text-xs px-2 py-1"
              >
                {report.status}
              </Badge>
            </TableCell>
            <TableCell className="text-center py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewReport(report)}
                className="h-8 px-2 text-xs"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="sr-only xs:not-sr-only xs:ml-1">View</span>
              </Button>
            </TableCell>
          </TableRow>
        );

      default:
        return null;
    }
  };

  // ✅ Render detailed view based on service type
  const renderDetailedView = () => {
    if (!selectedReport) return null;

    switch (selectedReport.service) {
      case "seo-audit":
        return renderSEODetailedView();
      case "business-names":
        return renderBusinessNamesDetailedView();
      case "keyword-reports":
        return renderKeywordReportsDetailedView();
      case "keyword-checker":
        return renderKeywordCheckerDetailedView();
      case "keyword-scraper":
        return renderKeywordScraperDetailedView();
      default:
        return renderDefaultDetailedView();
    }
  };

  // ✅ SEO Audit Detailed View
  const renderSEODetailedView = () => (
    <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
      {/* Performance Summary */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg">
            Performance Summary
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Overall website performance scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <p className="text-sm sm:text-base font-medium">SEO Score</p>
              <div className="flex items-center gap-2">
                <Progress
                  value={selectedReport.seoScore}
                  className="h-1.5 sm:h-2 flex-1"
                />
                <Badge
                  variant={getScoreBadgeVariant(selectedReport.seoScore)}
                  className="text-xs"
                >
                  {selectedReport.seoScore}
                </Badge>
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-sm sm:text-base font-medium">Speed Score</p>
              <div className="flex items-center gap-2">
                <Progress
                  value={selectedReport.speedScore}
                  className="h-1.5 sm:h-2 flex-1"
                />
                <Badge
                  variant={getScoreBadgeVariant(selectedReport.speedScore)}
                  className="text-xs"
                >
                  {selectedReport.speedScore}
                </Badge>
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-sm sm:text-base font-medium">Accessibility</p>
              <div className="flex items-center gap-2">
                <Progress
                  value={selectedReport.accessibilityScore}
                  className="h-1.5 sm:h-2 flex-1"
                />
                <Badge
                  variant={getScoreBadgeVariant(
                    selectedReport.accessibilityScore
                  )}
                  className="text-xs"
                >
                  {selectedReport.accessibilityScore}
                </Badge>
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-sm sm:text-base font-medium">Best Practices</p>
              <div className="flex items-center gap-2">
                <Progress
                  value={selectedReport.bestPracticesScore}
                  className="h-1.5 sm:h-2 flex-1"
                />
                <Badge
                  variant={getScoreBadgeVariant(
                    selectedReport.bestPracticesScore
                  )}
                  className="text-xs"
                >
                  {selectedReport.bestPracticesScore}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger
            value="recommendations"
            className="flex-1 min-w-0 text-xs sm:text-sm"
          >
            Recommendations
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="flex-1 min-w-0 text-xs sm:text-sm"
          >
            Analysis
          </TabsTrigger>
          <TabsTrigger
            value="technical"
            className="flex-1 min-w-0 text-xs sm:text-sm"
          >
            Technical
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="recommendations"
          className="space-y-3 sm:space-y-4 pt-3"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">
                Actionable Recommendations
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Prioritized list of improvements for your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedReport.recommendations &&
              selectedReport.recommendations.length > 0 ? (
                selectedReport.recommendations.map(
                  (rec: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <div
                        className={`p-1.5 rounded-full ${getPriorityColor(
                          rec.priority
                        )} bg-opacity-20 mt-0.5 flex-shrink-0`}
                      >
                        {rec.priority === "high" ? (
                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : rec.priority === "medium" ? (
                          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base capitalize">
                          {rec.priority} Priority
                        </h4>
                        <p className="text-sm sm:text-base text-muted-foreground mt-1 break-words">
                          {rec.text}
                        </p>
                      </div>
                    </div>
                  )
                )
              ) : (
                <p className="text-sm sm:text-base text-muted-foreground text-center py-4">
                  No recommendations available for this audit.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-3 sm:space-y-4 pt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">
                Detailed Analysis
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Comprehensive breakdown of the audit results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedReport.analysis ? (
                <div className="space-y-2 sm:space-y-3">
                  {formatAnalysis(selectedReport.analysis).map(
                    (point, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-2 flex-shrink-0"></div>
                        <p className="text-sm sm:text-base pt-1 flex-1 break-words">
                          {point.replace(/#/g, "").trim()}
                        </p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm sm:text-base text-muted-foreground text-center py-4">
                  No detailed analysis available for this audit.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-3 sm:space-y-4 pt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">
                Technical Details
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Metadata and technical information about this audit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <h4 className="font-medium text-sm sm:text-base">
                    Audit Date
                  </h4>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {selectedReport.date}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm sm:text-base">
                    Audit Time
                  </h4>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {selectedReport.time}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <h4 className="font-medium text-sm sm:text-base">
                    Website URL
                  </h4>
                  <p className="text-sm sm:text-base text-muted-foreground break-all">
                    {selectedReport.url}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm sm:text-base">Status</h4>
                  <Badge
                    variant={
                      selectedReport.status === "completed"
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {selectedReport.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  // ✅ Business Names Detailed View with Pagination
  const renderBusinessNamesDetailedView = () => {
    const currentItems = getCurrentItems();
    const totalPages = getTotalPages();
    const totalItems = detailedBusinessNames.length;

    return (
      <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
        {/* Session Overview */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">
              Session Overview
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Business name generation details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="w-4 h-4" />
                  <span>Industry</span>
                </div>
                <p className="font-medium text-sm sm:text-base break-words">
                  {selectedReport.industry}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Audience</span>
                </div>
                <p className="font-medium text-sm sm:text-base break-words">
                  {selectedReport.audience}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4" />
                  <span>Style</span>
                </div>
                <p className="font-medium text-sm sm:text-base break-words">
                  {selectedReport.stylePreference}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="w-4 h-4" />
                  <span>Total Names</span>
                </div>
                <p className="font-medium text-sm sm:text-base">
                  {selectedReport.nameCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Names with Pagination */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Generated Business Names
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {totalItems} names generated for your business
                </CardDescription>
              </div>

              {/* Pagination Controls */}
              {totalItems > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show:</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={handleItemsPerPageChange}
                    >
                      <SelectTrigger className="w-20 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {currentItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentItems.map((name: any, index: number) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index;
                  return (
                    <Card key={globalIndex} className="p-3 sm:p-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-base sm:text-lg break-words">
                          {name.name}
                        </h4>
                        {name.tagline && (
                          <p className="text-sm text-muted-foreground break-words">
                            {name.tagline}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {name.style}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            #{globalIndex + 1}
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No detailed names available for this session.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ✅ Keyword Reports Detailed View with Pagination
  const renderKeywordReportsDetailedView = () => {
    const currentItems = getCurrentItems();
    const totalPages = getTotalPages();
    const totalItems = detailedKeywords.length;

    return (
      <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
        {/* Report Overview */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">
              Keyword Report Overview
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Comprehensive keyword analysis summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Topic</span>
                </div>
                <p className="font-medium text-sm sm:text-base break-words">
                  {selectedReport.topic}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="w-4 h-4" />
                  <span>Industry</span>
                </div>
                <p className="font-medium text-sm sm:text-base break-words">
                  {selectedReport.industry}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="w-4 h-4" />
                  <span>Total Volume</span>
                </div>
                <p className="font-medium text-sm sm:text-base">
                  {selectedReport.totalSearchVolume.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span>Avg CPC</span>
                </div>
                <p className="font-medium text-sm sm:text-base">
                  ${selectedReport.averageCPC?.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keywords List with Pagination */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Keyword Analysis
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {totalItems} keywords analyzed with detailed metrics
                </CardDescription>
              </div>

              {/* Pagination Controls */}
              {totalItems > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show:</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={handleItemsPerPageChange}
                    >
                      <SelectTrigger className="w-20 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {currentItems.length > 0 ? (
              <div className="space-y-3">
                {currentItems.map((keyword: any, index: number) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index;
                  return (
                    <Card key={globalIndex} className="p-3 sm:p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base break-words">
                            {keyword.keyword}
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Type:
                              </span>
                              <Badge variant="outline" className="ml-1 text-xs">
                                {keyword.type}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Volume:
                              </span>
                              <span className="ml-1 font-medium">
                                {keyword.search_volume}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                CPC:
                              </span>
                              <span className="ml-1 font-medium">
                                ${keyword.cpc}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Difficulty:
                              </span>
                              <Badge
                                variant={
                                  keyword.difficulty_score === "Low"
                                    ? "default"
                                    : "secondary"
                                }
                                className="ml-1 text-xs"
                              >
                                {keyword.difficulty_score}
                              </Badge>
                            </div>
                          </div>
                          {keyword.content_idea && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2 break-words">
                              <strong>Content Idea:</strong>{" "}
                              {keyword.content_idea}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          #{globalIndex + 1}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No detailed keyword data available for this report.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ✅ Keyword Checker Detailed View with Pagination
  const renderKeywordCheckerDetailedView = () => {
    const reportData = detailedKeywordAnalysis || selectedReport;
    const currentItems = getCurrentItems();
    const totalPages = getTotalPages();
    const totalItems = reportData.keywords?.length || 0;
    const summary = reportData.summary || {};

    return (
      <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
        {/* Analysis Overview */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">
              Keyword Checker Analysis
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Comprehensive website keyword competitiveness analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>Website</span>
                </div>
                <p className="font-medium text-sm sm:text-base break-all">
                  {reportData.mainUrl}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Pages Analyzed</span>
                </div>
                <p className="font-medium text-sm sm:text-base">
                  {reportData.totalScraped || 0}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span>Keywords Found</span>
                </div>
                <p className="font-medium text-sm sm:text-base">{totalItems}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Status</span>
                </div>
                <Badge
                  variant={
                    reportData.status === "completed" ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {reportData.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keywords Analysis with Pagination */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Keyword Analysis
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Detailed keyword competitiveness and opportunity analysis
                </CardDescription>
              </div>

              {/* Pagination Controls */}
              {totalItems > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show:</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={handleItemsPerPageChange}
                    >
                      <SelectTrigger className="w-20 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {currentItems.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Keyword</TableHead>
                        <TableHead className="text-center min-w-[80px]">
                          Intent
                        </TableHead>
                        <TableHead className="text-center min-w-[90px]">
                          Difficulty
                        </TableHead>
                        <TableHead className="text-center min-w-[100px]">
                          Search Volume
                        </TableHead>
                        <TableHead className="text-center min-w-[80px]">
                          Relevance
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map((keyword: any, index: number) => {
                        const globalIndex =
                          (currentPage - 1) * itemsPerPage + index;
                        return (
                          <TableRow key={globalIndex}>
                            <TableCell className="font-medium text-sm break-words">
                              <div className="flex items-center justify-between">
                                <span>{keyword.keyword}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  #{globalIndex + 1}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {keyword.intent || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  keyword.difficulty === "Low"
                                    ? "default"
                                    : keyword.difficulty === "Medium"
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {keyword.difficulty || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {keyword.search_volume || "N/A"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-xs">
                                {keyword.relevance_score || 0}/10
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No keyword data available for this analysis.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {summary.primary_keywords && summary.primary_keywords.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">
                Key Findings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm sm:text-base mb-2">
                    Primary Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {summary.primary_keywords
                      .slice(0, 8)
                      .map((keyword: string, index: number) => (
                        <Badge
                          key={index}
                          variant="default"
                          className="text-xs"
                        >
                          {keyword}
                        </Badge>
                      ))}
                  </div>
                </div>
                {summary.secondary_keywords &&
                  summary.secondary_keywords.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base mb-2">
                        Secondary Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {summary.secondary_keywords
                          .slice(0, 8)
                          .map((keyword: string, index: number) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {keyword}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // ✅ Keyword Scraper Detailed View with Pagination
  const renderKeywordScraperDetailedView = () => {
    const reportData = detailedKeywordAnalysis || selectedReport;
    const keywordData = reportData.keywordData || {};
    const scrapedPages = reportData.scrapedPages || [];
    const currentItems = getCurrentItems();
    const totalPages = getTotalPages();
    const totalItems = keywordData.primary_keywords?.length || 0;
    const currentScrapedPages = getCurrentScrapedPages();
    const totalScrapedPages = getTotalScrapedPages();

    return (
      <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
        {/* Analysis Overview */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">
              Keyword Scraper Analysis
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Comprehensive website content and keyword extraction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>Website</span>
                </div>
                <p className="font-medium text-sm sm:text-base break-all">
                  {reportData.mainUrl}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Pages Scraped</span>
                </div>
                <p className="font-medium text-sm sm:text-base">
                  {reportData.totalPagesScraped || 0}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span>Keywords Found</span>
                </div>
                <p className="font-medium text-sm sm:text-base">
                  {reportData.totalKeywordsFound || 0}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Status</span>
                </div>
                <Badge
                  variant={
                    reportData.status === "completed" ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {reportData.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extracted Keywords with Pagination */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Extracted Keywords
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Keywords extracted from website content with intent
                  classification
                </CardDescription>
              </div>

              {/* Pagination Controls */}
              {totalItems > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show:</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={handleItemsPerPageChange}
                    >
                      <SelectTrigger className="w-20 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="primary" className="w-full">
              <TabsList className="flex w-full overflow-x-auto">
                <TabsTrigger
                  value="primary"
                  className="flex-1 min-w-0 text-xs sm:text-sm"
                >
                  Primary
                </TabsTrigger>
                <TabsTrigger
                  value="secondary"
                  className="flex-1 min-w-0 text-xs sm:text-sm"
                >
                  Secondary
                </TabsTrigger>
                <TabsTrigger
                  value="intent"
                  className="flex-1 min-w-0 text-xs sm:text-sm"
                >
                  Intent
                </TabsTrigger>
              </TabsList>

              <TabsContent value="primary" className="space-y-3 pt-3">
                {currentItems.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentItems.map((keyword: string, index: number) => {
                      const globalIndex =
                        (currentPage - 1) * itemsPerPage + index;
                      return (
                        <Badge
                          key={globalIndex}
                          variant="default"
                          className="text-xs sm:text-sm"
                        >
                          {keyword}{" "}
                          <span className="text-xs opacity-70 ml-1">
                            #{globalIndex + 1}
                          </span>
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No primary keywords found.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="secondary" className="space-y-3 pt-3">
                {keywordData.secondary_keywords &&
                keywordData.secondary_keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {keywordData.secondary_keywords
                      .slice(0, 50)
                      .map((keyword: string, index: number) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs sm:text-sm"
                        >
                          {keyword}
                        </Badge>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No secondary keywords found.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="intent" className="space-y-4 pt-3">
                {keywordData.keyword_intent ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(keywordData.keyword_intent).map(
                      ([intent, keywords]: [string, any]) => (
                        <Card key={intent}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm capitalize">
                              {intent} Keywords
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {keywords && keywords.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {keywords
                                  .slice(0, 6)
                                  .map((keyword: string, index: number) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {keyword}
                                    </Badge>
                                  ))}
                                {keywords.length > 6 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{keywords.length - 6} more
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No {intent} keywords
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No intent analysis available.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Scraped Pages Summary with Pagination */}
        {scrapedPages.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Scraped Pages Summary
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Overview of pages analyzed during the scraping process
                  </CardDescription>
                </div>

                {/* Pagination Controls for Scraped Pages */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show:</span>
                    <Select
                      value={scrapedPerPage.toString()}
                      onValueChange={handleScrapedPerPageChange}
                    >
                      <SelectTrigger className="w-20 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevScrapedPage}
                      disabled={currentScrapedPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                      Page {currentScrapedPage} of {totalScrapedPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextScrapedPage}
                      disabled={currentScrapedPage === totalScrapedPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">URL</TableHead>
                      <TableHead className="text-center min-w-[60px]">
                        Depth
                      </TableHead>
                      <TableHead className="text-center min-w-[70px]">
                        Words
                      </TableHead>
                      <TableHead className="text-center min-w-[60px]">
                        Links
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentScrapedPages.map((page: any, index: number) => {
                      const globalIndex =
                        (currentScrapedPage - 1) * scrapedPerPage + index;
                      return (
                        <TableRow key={globalIndex}>
                          <TableCell
                            className="max-w-[150px] sm:max-w-[200px] truncate text-xs sm:text-sm"
                            title={page.url}
                          >
                            {page.url}
                          </TableCell>
                          <TableCell className="text-center text-xs sm:text-sm">
                            {page.depth}
                          </TableCell>
                          <TableCell className="text-center text-xs sm:text-sm">
                            {page.wordCount || 0}
                          </TableCell>
                          <TableCell className="text-center text-xs sm:text-sm">
                            {page.foundLinks || 0}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="text-center text-muted-foreground mt-4">
                <p className="text-sm">
                  Showing{" "}
                  {Math.min(
                    scrapedPerPage,
                    scrapedPages.length -
                      (currentScrapedPage - 1) * scrapedPerPage
                  )}{" "}
                  of {scrapedPages.length} pages
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // ✅ Default Detailed View
  const renderDefaultDetailedView = () => (
    <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          <CardDescription>
            Complete information for this{" "}
            {getServiceDisplayName(selectedReport.service).slice(0, -1)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs sm:text-sm bg-muted p-3 sm:p-4 rounded-lg overflow-auto">
            {JSON.stringify(selectedReport, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );

  const metaPropsData = {
    title: "SEO Audit Reports - Website Analysis & Performance Dashboard",
    description:
      "Access comprehensive SEO audit reports with detailed website analysis, performance scores, and actionable recommendations to improve your search rankings.",
    keyword:
      "seo audit reports, website audit report, seo score tracker, seo performance dashboard, website analysis report, audit history",
    url: "https://rankseo.in/profile/reports",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              Reports
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              View and manage your reports across all services
            </p>
          </div>
          <Link href={getServiceLink()} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto text-sm sm:text-base">
              <Plus className="w-4 h-4 mr-2" />
              New {getServiceDisplayName(selectedService).replace("s", "")}
            </Button>
          </Link>
        </div>

        {/* Service Selector */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
              <div className="flex-1 w-full">
                <label className="text-sm font-medium mb-2 block">
                  Select Service
                </label>
                <Select
                  value={selectedService}
                  onValueChange={(value: ServiceType) =>
                    setSelectedService(value)
                  }
                >
                  <SelectTrigger className="w-full lg:w-64">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seo-audit">SEO Audits</SelectItem>
                    <SelectItem value="business-names">
                      Business Names
                    </SelectItem>
                    <SelectItem value="keyword-reports">
                      Keyword Reports
                    </SelectItem>
                    <SelectItem value="keyword-checker">
                      Keyword Checker
                    </SelectItem>
                    <SelectItem value="keyword-scraper">
                      Keyword Scraper
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full lg:w-auto">
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total Reports
                        </p>
                        <p className="text-lg sm:text-xl font-bold">
                          {currentReports.length}
                        </p>
                      </div>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedService === "seo-audit" &&
                  currentReports.length > 0 && (
                    <>
                      <Card className="bg-muted/50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Recent SEO
                              </p>
                              <p className="text-lg sm:text-xl font-bold">
                                {currentReports[0].seoScore}
                              </p>
                            </div>
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-secondary" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/50 hidden lg:block">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Recent Speed
                              </p>
                              <p className="text-lg sm:text-xl font-bold">
                                {currentReports[0].speedScore}
                              </p>
                            </div>
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-lg sm:text-xl">
                {getServiceDisplayName(selectedService)}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Detailed view of all your{" "}
                {getServiceDisplayName(selectedService).toLowerCase()}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Search + Date Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={`Search ${getServiceDisplayName(
                    selectedService
                  ).toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>

              {/* Date Filter */}
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full sm:w-48 text-sm sm:text-base"
              />
            </div>

            {/* Reports Table - Mobile optimized */}
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>{getTableColumns()}</TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground text-sm sm:text-base"
                      >
                        No{" "}
                        {getServiceDisplayName(selectedService).toLowerCase()}{" "}
                        found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report) => getTableRow(report))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Report Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] sm:max-w-[90vw] sm:w-[90vw] sm:h-[90vh] md:max-w-[85vw] md:w-[85vw] lg:max-w-[80vw] lg:w-[80vw] xl:max-w-[70vw] xl:w-[70vw] overflow-y-auto p-3 sm:p-4 md:p-6">
            <DialogHeader className="text-left pb-4">
              <DialogTitle className="text-lg sm:text-xl lg:text-2xl">
                {getServiceDisplayName(selectedReport?.service)} Report
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Detailed view for{" "}
                {selectedReport?.website ||
                  selectedReport?.topic ||
                  selectedReport?.mainUrl ||
                  "this report"}
              </DialogDescription>
            </DialogHeader>

            {selectedReport && renderDetailedView()}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
