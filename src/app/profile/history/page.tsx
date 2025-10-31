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
import { Download, Eye } from "lucide-react";
import Metatags from "../../../SEO/metatags";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function HistoryPage() {
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ✅ Fetch audits from backend
  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_URL}/api/audits`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch audit history");
        const data = await res.json();

        const formattedData = (
          Array.isArray(data) ? data : data.audits || []
        ).map((audit: any) => ({
          id: audit._id,
          website: audit.url || "Unknown",
          date: audit.date || new Date().toLocaleDateString("en-GB"),
          seoScore: audit.scores?.seo ?? 0,
          speedScore: audit.scores?.performance ?? 0,
          status: audit.status || "completed",
        }));

        setAuditHistory(formattedData);
      } catch (err) {
        console.error("Error fetching audits:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAudits();
  }, []);

  // ✅ Filter audits by date range
  const filteredAudits = auditHistory.filter((audit) => {
    if (!fromDate && !toDate) return true;
    const auditDate = new Date(audit.date.split("/").reverse().join("-")); // Convert dd/mm/yyyy → yyyy-mm-dd
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    return (!from || auditDate >= from) && (!to || auditDate <= to);
  });

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
    title: "Audit History | Complete SEO Audit Records & Reports",
    description:
      "View your complete SEO audit history with detailed reports, performance scores, and downloadable PDF reports for all your website audits.",
    keyword:
      "SEO audit history, audit reports, performance history, website audits, SEO reports",
    url: "https://rankseo.in/profile/history",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="p-6 space-y-6">
        {/* Header with Date Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Audit History
            </h1>
            <p className="text-muted-foreground">
              View and manage all your previous SEO audits
            </p>
          </div>

          {/* Date Filter */}
          <div className="flex space-x-2 items-center">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
            <span>-</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* History Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Audits</CardTitle>
            <CardDescription>
              Complete record of your website audits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-center text-gray-500 py-4">
                  Loading audits...
                </p>
              ) : filteredAudits.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No audits found
                </p>
              ) : (
                filteredAudits.map((audit) => (
                  <div
                    key={audit.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg gap-3 sm:gap-0 hover:bg-gray-50 transition"
                  >
                    {/* Website & Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {audit.website}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {audit.date}
                        </p>
                      </div>
                    </div>

                    {/* Scores & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2 sm:gap-0">
                      <div className="flex space-x-2 justify-center sm:justify-start">
                        <Badge className={`${getScoreColor(audit.seoScore)}`}>
                          SEO: {audit.seoScore}
                        </Badge>
                        <Badge className={`${getScoreColor(audit.speedScore)}`}>
                          Speed: {audit.speedScore}
                        </Badge>
                        <Badge className={`${getStatusColor(audit.status)}`}>
                          {audit.status}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 justify-center sm:justify-start">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4 mr-1" /> PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
