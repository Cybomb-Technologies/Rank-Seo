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

  // Split by common bullet point indicators
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

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [auditReports, setAuditReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // ✅ Fetch data from API
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_URL}/api/audits`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch reports");

        const data = await res.json();
        const formattedData = (
          Array.isArray(data) ? data : data.audits || []
        ).map((audit: any, idx: number) => ({
          id: audit.id || idx + 1,
          website: audit.url || "Unknown",
          url: audit.url || "N/A",
          date: audit.date || new Date().toLocaleDateString("en-GB"), // format: DD/MM/YYYY
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
        }));

        setAuditReports(formattedData);
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // ✅ Convert DD/MM/YYYY → YYYY-MM-DD for date comparison
  const formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month}-${day}`;
  };

  // ✅ Filtering logic with Date filter
  const filteredReports = auditReports.filter((report) => {
    const matchesSearch =
      report.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.url.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter;

    const matchesDate = !dateFilter || formatDate(report.date) === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // ✅ Handle view report
  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setIsDialogOpen(true);
  };

  const metaPropsData = {
    title: "SEO Audit Reports | Comprehensive Website Analysis & Insights",
    description:
      "Access detailed SEO audit reports with performance scores, actionable recommendations, and comprehensive website analysis for better search rankings.",
    keyword:
      "SEO audit reports, website analysis, performance scores, audit insights, SEO recommendations",
    url: "https://rankseo.in/profile/reports",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-foreground">
              Reports
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              View and manage your SEO audit reports
            </p>
          </div>
          <Link href="/audit" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" /> New Audit
            </Button>
          </Link>
        </div>

        {/* Summary Cards - Improved mobile layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Reports</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {auditReports.length}
                  </p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Recent SEO Score
                  </p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {auditReports.length > 0 ? auditReports[0].seoScore : 0}
                  </p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Recent Speed Score
                  </p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {auditReports.length > 0 ? auditReports[0].speedScore : 0}
                  </p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Issues</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {
                      auditReports.filter(
                        (r) =>
                          r.seoScore === 0 &&
                          r.speedScore === 0 &&
                          r.accessibilityScore === 0 &&
                          r.bestPracticesScore === 0
                      ).length
                    }
                  </p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-lg sm:text-xl">
                Audit Reports
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Detailed view of all your website audits
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Search + Date Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search websites or URLs..."
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
                  <TableRow>
                    <TableHead className="min-w-[120px] sm:min-w-[200px]">
                      Website
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      Date
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      SEO
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      Speed
                    </TableHead>
                    <TableHead className="text-center hidden sm:table-cell min-w-[100px]">
                      Accessibility
                    </TableHead>
                    <TableHead className="text-center hidden md:table-cell min-w-[100px]">
                      Best Practices
                    </TableHead>
                    <TableHead className="text-center hidden lg:table-cell min-w-[60px]">
                      Trend
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      Actions
                    </TableHead>
                  </TableRow>
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
                        className="text-center py-8 text-muted-foreground"
                      >
                        No reports found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report) => (
                      <TableRow key={report.id} className="hover:bg-muted/50">
                        <TableCell className="py-3">
                          <div
                            className="max-w-[120px] sm:max-w-none truncate"
                            title={report.website}
                          >
                            {report.website}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
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
                            variant={getScoreBadgeVariant(
                              report.accessibilityScore
                            )}
                            className={`${getScoreColor(
                              report.accessibilityScore
                            )} text-xs px-2 py-1`}
                          >
                            {report.accessibilityScore}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center hidden md:table-cell py-3">
                          <Badge
                            variant={getScoreBadgeVariant(
                              report.bestPracticesScore
                            )}
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
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Report Detail Dialog - Mobile optimized */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[95vw] h-[95vh] sm:w-[90vw] sm:max-w-[90vw] sm:h-[90vh] lg:w-[70vw] lg:max-w-[70vw] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg sm:text-xl lg:text-2xl">
                Audit Report: {selectedReport?.website}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Detailed analysis for {selectedReport?.url}
              </DialogDescription>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
                {/* Summary Card - Mobile optimized */}
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
                        <p className="text-sm sm:text-base font-medium">
                          SEO Score
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={selectedReport.seoScore}
                            className="h-1.5 sm:h-2 flex-1"
                          />
                          <Badge
                            variant={getScoreBadgeVariant(
                              selectedReport.seoScore
                            )}
                            className="text-xs"
                          >
                            {selectedReport.seoScore}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-sm sm:text-base font-medium">
                          Speed Score
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={selectedReport.speedScore}
                            className="h-1.5 sm:h-2 flex-1"
                          />
                          <Badge
                            variant={getScoreBadgeVariant(
                              selectedReport.speedScore
                            )}
                            className="text-xs"
                          >
                            {selectedReport.speedScore}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-sm sm:text-base font-medium">
                          Accessibility
                        </p>
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
                        <p className="text-sm sm:text-base font-medium">
                          Best Practices
                        </p>
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

                {/* Tabs for different sections - Mobile optimized */}
                <Tabs defaultValue="recommendations" className="w-full">
                  <div className="relative">
                    <TabsList className="flex w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-1 space-x-1">
                      <TabsTrigger
                        value="recommendations"
                        className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm"
                      >
                        Recommendations
                      </TabsTrigger>
                      <TabsTrigger
                        value="analysis"
                        className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm"
                      >
                        Analysis
                      </TabsTrigger>
                      <TabsTrigger
                        value="technical"
                        className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm"
                      >
                        Technical
                      </TabsTrigger>
                    </TabsList>
                  </div>

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
                                  )} bg-opacity-20 mt-0.5`}
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
                                  <p className="text-sm sm:text-base text-muted-foreground mt-1">
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

                  <TabsContent
                    value="analysis"
                    className="space-y-3 sm:space-y-4 pt-3"
                  >
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
                                  <p className="text-sm sm:text-base pt-1 flex-1">
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

                  <TabsContent
                    value="technical"
                    className="space-y-3 sm:space-y-4 pt-3"
                  >
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
                            <h4 className="font-medium text-sm sm:text-base">
                              Status
                            </h4>
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
