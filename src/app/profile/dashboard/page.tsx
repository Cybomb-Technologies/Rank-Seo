"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  FileText,
  Search,
  Building,
  Eye,
  Plus,
  Calendar,
  Users,
  Tag,
  Globe,
  Scissors,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Metatags from "../../../SEO/metatags";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Service types
type ServiceType = "all" | "seo-audit" | "business-names" | "keyword-reports" | "keyword-checker" | "keyword-scraper";

// Interface for service data
interface ServiceData {
  service: ServiceType;
  label: string;
  icon: JSX.Element;
  color: string;
  stats: {
    total: number;
    recent: number;
    averageScore?: number;
  };
  recentItems: any[];
  chartData: any[];
}

export default function DashboardPage() {
  const [selectedService, setSelectedService] = useState<ServiceType>("all");
  const [loading, setLoading] = useState(true);
  const [serviceData, setServiceData] = useState<Record<ServiceType, ServiceData>>({
    "all": {
      service: "all",
      label: "All Services",
      icon: <BarChart3 className="h-4 w-4" />,
      color: "#3b82f6",
      stats: { total: 0, recent: 0 },
      recentItems: [],
      chartData: []
    },
    "seo-audit": {
      service: "seo-audit",
      label: "SEO Audits",
      icon: <Eye className="h-4 w-4" />,
      color: "#10b981",
      stats: { total: 0, recent: 0 },
      recentItems: [],
      chartData: []
    },
    "business-names": {
      service: "business-names",
      label: "Business Names",
      icon: <Building className="h-4 w-4" />,
      color: "#8b5cf6",
      stats: { total: 0, recent: 0 },
      recentItems: [],
      chartData: []
    },
    "keyword-reports": {
      service: "keyword-reports",
      label: "Keyword Reports",
      icon: <FileText className="h-4 w-4" />,
      color: "#f59e0b",
      stats: { total: 0, recent: 0 },
      recentItems: [],
      chartData: []
    },
    "keyword-checker": {
      service: "keyword-checker",
      label: "Keyword Checker",
      icon: <Search className="h-4 w-4" />,
      color: "#ef4444",
      stats: { total: 0, recent: 0 },
      recentItems: [],
      chartData: []
    },
    "keyword-scraper": {
      service: "keyword-scraper",
      label: "Keyword Scraper",
      icon: <Scissors className="h-4 w-4" />,
      color: "#ec4899",
      stats: { total: 0, recent: 0 },
      recentItems: [],
      chartData: []
    }
  });

  // Fetch data from all services
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        setLoading(true);

        // Fetch SEO Audits
        const auditsRes = await fetch(`${API_URL}/api/audits`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const auditsData = await auditsRes.ok ? await auditsRes.json() : { audits: [] };

        // Fetch Business Names
        const businessRes = await fetch(`${API_URL}/api/business/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const businessData = await businessRes.ok ? await businessRes.json() : { data: [] };

        // Fetch Keyword Reports
        const keywordRes = await fetch(`${API_URL}/api/keywords/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const keywordData = await keywordRes.ok ? await keywordRes.json() : { data: [] };

        // Fetch Keyword Checker Reports
        const keycheckerRes = await fetch(`${API_URL}/api/keychecker/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const keycheckerData = await keycheckerRes.ok ? await keycheckerRes.json() : { data: [] };

        // Fetch Keyword Scraper Reports
        const scraperRes = await fetch(`${API_URL}/api/scraper/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const scraperData = await scraperRes.ok ? await scraperRes.json() : { data: [] };

        // Process SEO Audit Data
        const auditItems = (Array.isArray(auditsData) ? auditsData : auditsData.audits || []).map((audit: any) => ({
          id: audit._id || audit.id,
          name: audit.url || "Unknown Website",
          score: audit.scores?.seo ?? 0,
          secondaryScore: audit.scores?.performance ?? 0,
          date: audit.date || new Date().toISOString().split('T')[0],
          status: audit.status || "completed",
          type: "seo-audit" as ServiceType
        }));

        // Process Business Names Data
        const businessItems = (businessData.data || []).map((session: any) => ({
          id: session.sessionId || session._id,
          name: session.industry || "Business Names",
          score: session.nameCount || 0,
          secondaryScore: 0,
          date: session.generatedAt || new Date().toISOString().split('T')[0],
          status: "completed",
          type: "business-names" as ServiceType
        }));

        // Process Keyword Reports Data
        const keywordItems = (keywordData.data || []).map((report: any) => ({
          id: report.sessionId || report._id,
          name: report.topic || "Keyword Report",
          score: report.keywordCount || 0,
          secondaryScore: report.totalSearchVolume || 0,
          date: report.generatedAt || new Date().toISOString().split('T')[0],
          status: "completed",
          type: "keyword-reports" as ServiceType
        }));

        // Process Keyword Checker Data
        const keycheckerItems = (keycheckerData.data || []).map((report: any) => ({
          id: report.reportId || report._id,
          name: report.mainUrl || "Keyword Analysis",
          score: report.totalScraped || 0,
          secondaryScore: 0,
          date: report.createdAt || new Date().toISOString().split('T')[0],
          status: report.status || "completed",
          type: "keyword-checker" as ServiceType
        }));

        // Process Keyword Scraper Data
        const scraperItems = (scraperData.data || []).map((report: any) => ({
          id: report.reportId || report._id,
          name: report.mainUrl || "Website Scrape",
          score: report.totalPagesScraped || 0,
          secondaryScore: report.totalKeywordsFound || 0,
          date: report.createdAt || new Date().toISOString().split('T')[0],
          status: "completed",
          type: "keyword-scraper" as ServiceType
        }));

        // Combine all items
        const allItems = [...auditItems, ...businessItems, ...keywordItems, ...keycheckerItems, ...scraperItems];
        const recentItems = allItems
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);

        // Update service data
        setServiceData(prev => ({
          "all": {
            ...prev["all"],
            stats: {
              total: allItems.length,
              recent: recentItems.length,
              averageScore: allItems.length > 0 ? Math.round(allItems.reduce((sum, item) => sum + item.score, 0) / allItems.length) : 0
            },
            recentItems: recentItems,
            chartData: recentItems.slice(0, 5).map(item => ({
              name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
              score: item.score,
              date: new Date(item.date).toLocaleDateString()
            }))
          },
          "seo-audit": {
            ...prev["seo-audit"],
            stats: {
              total: auditItems.length,
              recent: auditItems.filter(item => new Date(item.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
              averageScore: auditItems.length > 0 ? Math.round(auditItems.reduce((sum, item) => sum + item.score, 0) / auditItems.length) : 0
            },
            recentItems: auditItems.slice(0, 5),
            chartData: auditItems.slice(0, 5).map(item => ({
              name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
              score: item.score,
              secondaryScore: item.secondaryScore,
              date: new Date(item.date).toLocaleDateString()
            }))
          },
          "business-names": {
            ...prev["business-names"],
            stats: {
              total: businessItems.length,
              recent: businessItems.filter(item => new Date(item.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
            },
            recentItems: businessItems.slice(0, 5),
            chartData: businessItems.slice(0, 5).map(item => ({
              name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
              score: item.score,
              date: new Date(item.date).toLocaleDateString()
            }))
          },
          "keyword-reports": {
            ...prev["keyword-reports"],
            stats: {
              total: keywordItems.length,
              recent: keywordItems.filter(item => new Date(item.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
            },
            recentItems: keywordItems.slice(0, 5),
            chartData: keywordItems.slice(0, 5).map(item => ({
              name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
              score: item.score,
              secondaryScore: item.secondaryScore,
              date: new Date(item.date).toLocaleDateString()
            }))
          },
          "keyword-checker": {
            ...prev["keyword-checker"],
            stats: {
              total: keycheckerItems.length,
              recent: keycheckerItems.filter(item => new Date(item.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
            },
            recentItems: keycheckerItems.slice(0, 5),
            chartData: keycheckerItems.slice(0, 5).map(item => ({
              name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
              score: item.score,
              date: new Date(item.date).toLocaleDateString()
            }))
          },
          "keyword-scraper": {
            ...prev["keyword-scraper"],
            stats: {
              total: scraperItems.length,
              recent: scraperItems.filter(item => new Date(item.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
            },
            recentItems: scraperItems.slice(0, 5),
            chartData: scraperItems.slice(0, 5).map(item => ({
              name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
              score: item.score,
              secondaryScore: item.secondaryScore,
              date: new Date(item.date).toLocaleDateString()
            }))
          }
        }));

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const currentService = serviceData[selectedService];

  // Get score color based on value
  const getScoreColor = (score: number, service: ServiceType) => {
    if (service === "seo-audit") {
      if (score >= 80) return "bg-green-100 text-green-700";
      if (score >= 60) return "bg-yellow-100 text-yellow-700";
      return "bg-red-100 text-red-700";
    }
    return "bg-blue-100 text-blue-700";
  };

  // Get status color
  const getStatusColor = (status: string) => {
    if (status === "completed") return "bg-green-100 text-green-700";
    if (status === "processing") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  // Service navigation links
  const serviceLinks = {
    "seo-audit": "/audit",
    "business-names": "/business-names",
    "keyword-reports": "/keywords",
    "keyword-checker": "/keychecker",
    "keyword-scraper": "/keychecker" // Update this to the correct route if different
  };

  const metaPropsData = {
    title: "SEO Dashboard | Performance Analytics & Audit Reports",
    description: "Track your website SEO performance, view recent audits, and monitor key metrics with comprehensive dashboard analytics.",
    keyword: "SEO dashboard, performance analytics, audit reports, SEO metrics, website performance",
    url: "https://rankseo.in/profile/dashboard",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back! Here's your performance overview.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Select value={selectedService} onValueChange={(value: ServiceType) => setSelectedService(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="seo-audit">SEO Audits</SelectItem>
                <SelectItem value="business-names">Business Names</SelectItem>
                <SelectItem value="keyword-reports">Keyword Reports</SelectItem>
                <SelectItem value="keyword-checker">Keyword Checker</SelectItem>
                <SelectItem value="keyword-scraper">Keyword Scraper</SelectItem>
              </SelectContent>
            </Select>

            {selectedService !== "all" && serviceLinks[selectedService] && (
              <Link href={serviceLinks[selectedService]} className="w-full sm:w-auto">
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  New {currentService.label}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Items
              </CardTitle>
              <div style={{ color: currentService.color }}>
                {currentService.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {currentService.stats.total}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentService.stats.recent} recent
              </p>
            </CardContent>
          </Card>

          {currentService.stats.averageScore !== undefined && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Score
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {currentService.stats.averageScore}
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall performance
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Service Type
              </CardTitle>
              <Tag className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold capitalize">
                {currentService.label}
              </div>
              <p className="text-xs text-muted-foreground">
                Active service
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Activity
              </CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {currentService.recentItems.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>
                Recent {currentService.label.toLowerCase()} performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentService.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={90} 
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="score" 
                      fill={currentService.color}
                      name={selectedService === "seo-audit" ? "SEO Score" : "Count"}
                    />
                    {selectedService === "seo-audit" && (
                      <Bar 
                        dataKey="secondaryScore" 
                        fill="#10b981" 
                        name="Speed Score"
                      />
                    )}
                    {(selectedService === "keyword-scraper" || selectedService === "keyword-reports") && (
                      <Bar 
                        dataKey="secondaryScore" 
                        fill="#8b5cf6" 
                        name={selectedService === "keyword-scraper" ? "Keywords Found" : "Search Volume"}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Service Distribution */}
          {selectedService === "all" && (
            <Card>
              <CardHeader>
                <CardTitle>Service Distribution</CardTitle>
                <CardDescription>
                  Breakdown of items across all services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.values(serviceData).filter(s => s.service !== "all").map(service => ({
                          name: service.label,
                          value: service.stats.total,
                          color: service.color
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.values(serviceData).filter(s => s.service !== "all").map((service, index) => (
                          <Cell key={`cell-${index}`} fill={service.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Insights & Metrics */}
          {selectedService !== "all" && (
            <Card>
              <CardHeader>
                <CardTitle>Service Insights</CardTitle>
                <CardDescription>
                  Key metrics and actions for {currentService.label.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Performance Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="w-4 h-4" />
                        <span>Completion Rate</span>
                      </div>
                      <div className="text-2xl font-bold" style={{ color: currentService.color }}>
                        {currentService.stats.total > 0 
                          ? `${Math.round((currentService.recentItems.filter(item => item.status === 'completed').length / currentService.stats.total) * 100)}%`
                          : '0%'
                        }
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Last 7 Days</span>
                      </div>
                      <div className="text-2xl font-bold" style={{ color: currentService.color }}>
                        {currentService.stats.recent}
                      </div>
                    </div>
                  </div>

                  {/* Service-specific metrics */}
                  {selectedService === "seo-audit" && currentService.stats.averageScore && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Average SEO Score</span>
                        <span className={`text-sm font-bold ${
                          currentService.stats.averageScore >= 80 ? 'text-green-600' :
                          currentService.stats.averageScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {currentService.stats.averageScore}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{
                            width: `${currentService.stats.averageScore}%`,
                            backgroundColor: currentService.color
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {selectedService === "keyword-reports" && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Keywords</span>
                        <span className="text-sm font-bold" style={{ color: currentService.color }}>
                          {currentService.recentItems.reduce((sum, item) => sum + item.score, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Across all reports
                      </div>
                    </div>
                  )}

                  {selectedService === "business-names" && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Names Generated</span>
                        <span className="text-sm font-bold" style={{ color: currentService.color }}>
                          {currentService.recentItems.reduce((sum, item) => sum + item.score, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Total business names created
                      </div>
                    </div>
                  )}

                  {selectedService === "keyword-checker" && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Pages Analyzed</span>
                        <span className="text-sm font-bold" style={{ color: currentService.color }}>
                          {currentService.recentItems.reduce((sum, item) => sum + item.score, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Total pages scanned
                      </div>
                    </div>
                  )}

                  {selectedService === "keyword-scraper" && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Keywords Found</span>
                        <span className="text-sm font-bold" style={{ color: currentService.color }}>
                          {currentService.recentItems.reduce((sum, item) => sum + item.secondaryScore, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Total keywords extracted
                      </div>
                    </div>
                  )}

                  {/* Quick Tip */}
                  <div className="p-3 rounded-lg border" style={{ borderColor: currentService.color }}>
                    <div className="flex items-start gap-2">
                      <div style={{ color: currentService.color }}>
                        <Globe className="w-4 h-4 mt-0.5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">Pro Tip</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedService === "seo-audit" && "Run regular audits to track your SEO progress over time."}
                          {selectedService === "business-names" && "Generate names for different industries to expand your portfolio."}
                          {selectedService === "keyword-reports" && "Compare keyword trends across different time periods."}
                          {selectedService === "keyword-checker" && "Analyze competitor keywords to identify new opportunities."}
                          {selectedService === "keyword-scraper" && "Scrape multiple pages to get comprehensive keyword data from websites."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest {selectedService === "all" ? "activities across all services" : currentService.label.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm">
                    <th className="py-3 px-4">NAME</th>
                    {selectedService === "all" && <th className="py-3 px-4">SERVICE</th>}
                    <th className="py-3 px-4">
                      {selectedService === "seo-audit" ? "SEO SCORE" : 
                       selectedService === "keyword-scraper" ? "PAGES SCRAPED" : "SCORE/COUNT"}
                    </th>
                    {selectedService === "seo-audit" && <th className="py-3 px-4">SPEED SCORE</th>}
                    {selectedService === "keyword-reports" && <th className="py-3 px-4">SEARCH VOLUME</th>}
                    {selectedService === "keyword-scraper" && <th className="py-3 px-4">KEYWORDS FOUND</th>}
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">STATUS</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={
                        selectedService === "all" ? 6 : 
                        selectedService === "seo-audit" ? 5 :
                        selectedService === "keyword-reports" ? 5 :
                        selectedService === "keyword-scraper" ? 5 : 4
                      } className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : currentService.recentItems.length === 0 ? (
                    <tr>
                      <td colSpan={
                        selectedService === "all" ? 6 : 
                        selectedService === "seo-audit" ? 5 :
                        selectedService === "keyword-reports" ? 5 :
                        selectedService === "keyword-scraper" ? 5 : 4
                      } className="text-center py-4">
                        No recent activity found
                      </td>
                    </tr>
                  ) : (
                    currentService.recentItems.map((item, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: serviceData[item.type].color }}
                            />
                            {item.name.length > 30 ? item.name.substring(0, 30) + '...' : item.name}
                          </div>
                        </td>
                        {selectedService === "all" && (
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                              {serviceData[item.type].label}
                            </span>
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreColor(item.score, item.type)}`}
                          >
                            {item.score}
                          </span>
                        </td>
                        {selectedService === "seo-audit" && (
                          <td className="py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreColor(item.secondaryScore, item.type)}`}
                            >
                              {item.secondaryScore}
                            </span>
                          </td>
                        )}
                        {selectedService === "keyword-reports" && item.secondaryScore > 0 && (
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                              {item.secondaryScore.toLocaleString()}
                            </span>
                          </td>
                        )}
                        {selectedService === "keyword-scraper" && item.secondaryScore > 0 && (
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded text-xs bg-pink-100 text-pink-700">
                              {item.secondaryScore.toLocaleString()}
                            </span>
                          </td>
                        )}
                        <td className="py-3 px-4">{formatDate(item.date)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
} // <--- This closing brace was missing and is required.