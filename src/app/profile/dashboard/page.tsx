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
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  Eye,
  Settings,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Metatags from "../../../SEO/metatags";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DashboardPage() {
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch audits dynamically
  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_URL}/api/audits`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch audits");
        const data = await res.json();

        // ✅ Map backend fields to UI-friendly fields safely
        const formattedData = (
          Array.isArray(data) ? data : data.audits || []
        ).map((audit: any) => ({
          website: audit.url || "Unknown",
          seo: audit.scores?.seo ?? 0,
          speed: audit.scores?.performance ?? 0,
          date: audit.date || new Date().toLocaleDateString("en-GB"),
          status: audit.status || "completed",
        }));

        setRecentAudits(formattedData);
      } catch (err) {
        console.error("Error fetching audits:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAudits();
  }, []);

  // ✅ Chart data
  const chartData = recentAudits.slice(0, 3).map((audit) => ({
    name: audit.website,
    seo: audit.seo,
    speed: audit.speed,
  }));

  // ✅ Badge colors
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-700";
    if (score >= 60) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return "bg-green-100 text-green-700";
    if (status === "processing") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };
  const metaPropsData = {
    title: "SEO Dashboard | Performance Analytics & Audit Reports",
    description:
      "Track your website SEO performance, view recent audits, and monitor key metrics with comprehensive dashboard analytics.",
    keyword:
      "SEO dashboard, performance analytics, audit reports, SEO metrics, website performance",
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
              Welcome back! Here's your SEO performance overview.
            </p>
          </div>
          <Link href="/audit">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              New Audit
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Audits
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {recentAudits.slice(0, 3).length}
              </div>
              <p className="text-xs text-green-600">+3 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average SEO Score
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {recentAudits.slice(0, 3).length > 0
                  ? Math.round(
                      recentAudits
                        .slice(0, 3)
                        .reduce((sum, a) => sum + a.seo, 0) /
                        recentAudits.slice(0, 3).length
                    )
                  : 0}
              </div>
              <p className="text-xs text-green-600">
                +5 points from last audit
              </p>
            </CardContent>
          </Card>

          {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">12</div>
            <p className="text-xs text-red-600">-8 from last audit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">156</div>
            <p className="text-xs text-green-600">+23 this month</p>
          </CardContent>
        </Card> */}
        </div>

        {/* Performance Analysis Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Performance Trends Graph */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Track your SEO and Speed metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSEO" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorSpeed"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      tick={{ fontSize: 13, fill: "#374151" }} // darker readable text
                      height={50}
                      tickFormatter={(url) => {
                        try {
                          // Extract clean domain name only
                          return new URL(url).hostname;
                        } catch {
                          return url;
                        }
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        color: "#111",
                      }}
                      labelStyle={{ fontWeight: "bold" }}
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label) => `Website: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="seo"
                      stroke="#3b82f6"
                      fill="url(#colorSEO)"
                    />
                    <Area
                      type="monotone"
                      dataKey="speed"
                      stroke="#10b981"
                      fill="url(#colorSpeed)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {/* <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Perform tasks with a single click</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                + Start New Audit
              </Button>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="w-full">
                  View Reports
                </Button>
                <Button variant="outline" className="w-full">
                  Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card> */}
        </div>

        {/* Recent Audits Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Audits</CardTitle>
            <CardDescription>
              Your latest website audits and their scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm">
                    <th className="py-3 px-4">WEBSITE</th>
                    <th className="py-3 px-4">SEO SCORE</th>
                    <th className="py-3 px-4">SPEED SCORE</th>
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">STATUS</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : recentAudits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        No audits found
                      </td>
                    </tr>
                  ) : (
                    recentAudits.slice(0, 3).map((audit, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="py-3 px-4">{audit.website}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreColor(
                              audit.seo
                            )}`}
                          >
                            {audit.seo}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreColor(
                              audit.speed
                            )}`}
                          >
                            {audit.speed}
                          </span>
                        </td>
                        <td className="py-3 px-4">{audit.date}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              audit.status
                            )}`}
                          >
                            {audit.status}
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
}
