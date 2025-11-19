"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  CreditCard, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  User, 
  Calendar, 
  FileText,
  Search,
  Building,
  FileSearch,
  Globe,
  BarChart3
} from "lucide-react";
import Metatags from "../../../SEO/metatags";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserProfile {
  name: string;
  email: string;
  mobile?: string;
  planName: string;
  billingCycle: string;
  subscriptionStatus: string;
  planExpiry: string;
  maxAuditsPerMonth: number;
 
  auditsUsed: number;
  
  memberSince: string;
  autoRenewal: boolean;
  renewalStatus: string;
  nextRenewalDate: string;
}

interface UsageStats {
  audits: {
    used: number;
    limit: number;
    remaining: number;
  };
  keywordReports: {
    used: number;
    limit: number;
    remaining: number;
  };
  businessNames: {
    used: number;
    limit: number;
    remaining: number;
  };
  keywordChecks: {
    used: number;
    limit: number;
    remaining: number;
  };
  keywordScrapes: {
    used: number;
    limit: number;
    remaining: number;
  };

}

interface BillingHistory {
  _id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  planName: string;
  billingCycle: string;
  createdAt: string;
  expiryDate: string;
}

interface AuditReport {
  id: string;
  website: string;
  url: string;
  date: string;
  time: string;
  seoScore: number;
  speedScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  issues: number;
  status: string;
  trend: string;
  recommendations: any[];
  analysis: string;
}

export default function BillingPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [auditReports, setAuditReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRenewal, setUpdatingRenewal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const metaPropsData = {
    title: "Billing & Subscription | Manage Your SEO Plan",
    description: "View your current SEO plan, usage statistics, billing history, and manage your subscription settings.",
    keyword: "SEO billing, subscription management, plan usage, billing history, SEO tool pricing",
    url: "https://rankseo.in/profile/billing",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Fetch user profile data (includes all subscription info)
      const userResponse = await fetch(`${API_BASE}/api/payments/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserProfile(userData);
      }

      // Fetch usage statistics
      const usageResponse = await fetch(`${API_BASE}/api/usage/usage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsageStats(usageData.data);
      } else {
        // Fallback: create usage stats from user profile if API fails
        if (userProfile) {
          setUsageStats({
            audits: {
              used: userProfile.auditsUsed || 0,
              limit: userProfile.maxAuditsPerMonth || 5,
              remaining: Math.max(0, (userProfile.maxAuditsPerMonth || 5) - (userProfile.auditsUsed || 0))
            },
            keywordReports: {
              used: 0,
              limit: 10,
              remaining: 10
            },
            businessNames: {
              used: 0,
              limit: 5,
              remaining: 5
            },
            keywordChecks: {
              used: 0,
              limit: 10,
              remaining: 10
            },
            keywordScrapes: {
              used: 0,
              limit: 5,
              remaining: 5
            },
           
          });
        }
      }

      // Fetch billing history
      const historyResponse = await fetch(`${API_BASE}/api/payments/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setBillingHistory(historyData.payments || []);
      }

      // Fetch audit reports (optional - for display purposes only)
      const auditResponse = await fetch(`${API_BASE}/api/audits`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        const formattedAudits = (Array.isArray(auditData) ? auditData : auditData.audits || [])
          .map((audit: any, idx: number) => ({
            id: audit.id || idx + 1,
            website: audit.url || "Unknown",
            url: audit.url || "N/A",
            date: audit.date || new Date().toLocaleDateString("en-GB"),
            time: audit.time || new Date().toLocaleTimeString([], {
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
        setAuditReports(formattedAudits);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleAutoRenewalToggle = async (enabled: boolean) => {
    try {
      setUpdatingRenewal(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/payments/auto-renewal/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ autoRenewal: enabled }),
      });

      if (response.ok) {
        const result = await response.json();
        // Update local state
        setUserProfile(prev => prev ? { 
          ...prev, 
          autoRenewal: result.autoRenewal,
          renewalStatus: result.renewalStatus
        } : null);
      } else {
        console.error("Failed to update auto-renewal");
        alert("Failed to update auto-renewal settings");
      }
    } catch (error) {
      console.error("Error updating auto-renewal:", error);
      alert("Error updating auto-renewal settings");
    } finally {
      setUpdatingRenewal(false);
    }
  };

  const handleDownloadInvoice = async (transactionId: string, planName: string) => {
    try {
      setDownloadingId(transactionId);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/payments/invoice/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RankSEO_Invoice_${planName.replace(/\s/g, '_')}_${transactionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Failed to download invoice:", response.statusText);
        alert("Failed to download invoice. Please try again.");
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert("Error downloading invoice. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBillingData();
  };

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default" as const, label: "Active", className: "bg-green-500 hover:bg-green-600" },
      expired: { variant: "destructive" as const, label: "Expired", className: "bg-red-500 hover:bg-red-600" },
      cancelled: { variant: "secondary" as const, label: "Cancelled", className: "bg-gray-500 hover:bg-gray-600" },
      inactive: { variant: "secondary" as const, label: "Inactive", className: "bg-gray-500 hover:bg-gray-600" },
      pending: { variant: "outline" as const, label: "Pending", className: "bg-yellow-500 hover:bg-yellow-600" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return (
      <Badge 
        variant={config.variant} 
        className={`capitalize text-white ${config.className}`}
      >
        {config.label}
      </Badge>
    );
  };

  const getRenewalStatusText = (renewalStatus: string) => {
    const statusMap: { [key: string]: string } = {
      scheduled: "Scheduled",
      processing: "Processing",
      failed: "Failed - Please check payment method",
      cancelled: "Cancelled",
      inactive: "Inactive",
    };
    return statusMap[renewalStatus] || renewalStatus;
  };

  const getUsageIcon = (feature: string) => {
    switch (feature) {
      case 'audits':
        return <FileSearch className="w-5 h-5" />;
      case 'keywordReports':
        return <Search className="w-5 h-5" />;
      case 'businessNames':
        return <Building className="w-5 h-5" />;
      case 'keywordChecks':
        return <BarChart3 className="w-5 h-5" />;
      case 'keywordScrapes':
        return <Globe className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getUsageTitle = (feature: string) => {
    const titles: { [key: string]: string } = {
      audits: "Website Audits",
      keywordReports: "Keyword Reports",
      businessNames: "Business Name Generations",
      keywordChecks: "Keyword Checks",
      keywordScrapes: "Website Keyword Scrapes"
      
    };
    return titles[feature] || feature;
  };

  const getUsageDescription = (feature: string) => {
    const descriptions: { [key: string]: string } = {
      audits: "Complete website SEO audits",
      keywordReports: "AI-powered keyword research reports",
      businessNames: "AI business name suggestions",
      keywordChecks: "Competitor keyword analysis",
      keywordScrapes: "Website content keyword extraction"
   
    };
    return descriptions[feature] || "Feature";
  };

  // Determine current plan display name and status
  const currentPlanName = userProfile?.planName || "Free Tier";
  const subscriptionStatus = userProfile?.subscriptionStatus || "inactive";
  const isFreeTier = currentPlanName === "Free" || currentPlanName === "Free Tier";
  const hasActiveSubscription = subscriptionStatus === "active" && !isFreeTier;

  if (loading) {
    return (
      <>
        <Metatags metaProps={metaPropsData} />
        <div className="p-6 pt-5 space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading billing information...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="p-6 pt-5 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
            <p className="text-muted-foreground">
              Manage your subscription, usage, and billing information
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Account Overview */}
        {userProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
              <CardDescription>Your profile and billing information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Account Holder</p>
                      <p className="text-lg">{userProfile.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Member Since</p>
                      <p className="text-lg">{formatDate(userProfile.memberSince)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Contact Email</p>
                      <p className="text-lg">{userProfile.email}</p>
                    </div>
                  </div>
                  {userProfile.mobile && (
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Contact Phone</p>
                        <p className="text-lg">{userProfile.mobile}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            {userProfile ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold capitalize">{currentPlanName}</h3>
                  <p className="text-muted-foreground">
                    {userProfile.maxAuditsPerMonth === Infinity ? 'Unlimited' : userProfile.maxAuditsPerMonth} audits per month 
                  </p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(subscriptionStatus)}
                    {userProfile.autoRenewal && hasActiveSubscription && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Auto-renewal
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right space-y-2">
                  <p className="text-2xl font-bold capitalize">
                    {userProfile.billingCycle === "annual" ? "Annual" : userProfile.billingCycle === "monthly" ? "Monthly" : "Free"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasActiveSubscription && userProfile.planExpiry ? (
                      <>
                        Expires: {formatDate(userProfile.planExpiry)}
                        <br />
                        {userProfile.autoRenewal && userProfile.nextRenewalDate && (
                          <>Next renewal: {formatDate(userProfile.nextRenewalDate)}</>
                        )}
                      </>
                    ) : !isFreeTier ? (
                      "Subscription expired"
                    ) : (
                      "Free plan - no expiration"
                    )}
                  </p>
                  <Button onClick={handleUpgrade} className="mt-2 w-full sm:w-auto">
                    {hasActiveSubscription ? "Upgrade Plan" : "View Plans"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                <p className="text-muted-foreground mb-4">
                  You are currently on the Free Tier. Choose a plan to unlock full features.
                </p>
                <Button onClick={handleUpgrade}>View Plans</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
            <CardDescription>Track your monthly usage across all features</CardDescription>
          </CardHeader>
          <CardContent>
            {usageStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(usageStats)
  .filter(([feature]) => feature !== 'trackedKeywords') // Filter out the unwanted key
  .map(([feature, stats]) => (
                  <div key={feature} className="space-y-4 p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        {getUsageIcon(feature)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{getUsageTitle(feature)}</h4>
                        <p className="text-sm text-muted-foreground">
                          {getUsageDescription(feature)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usage</span>
                        <span>
                          {stats.used} / {stats.limit === Infinity ? 'Unlimited' : stats.limit}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            stats.used >= stats.limit ? 'bg-red-500' : 
                            stats.used / stats.limit > 0.8 ? 'bg-yellow-500' : 'bg-primary'
                          }`}
                          style={{ 
                            width: `${stats.limit === Infinity ? 100 : Math.min((stats.used / stats.limit) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stats.limit === Infinity 
                          ? 'Unlimited usage available' 
                          : `${stats.remaining} remaining this month`
                        }
                      </p>
                    </div>

                    {stats.used >= stats.limit && stats.limit !== Infinity && (
                      <div className="flex items-center space-x-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                        <AlertCircle className="w-3 h-3" />
                        <span>Limit reached. Upgrade for more.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Usage Data Available</h3>
                <p className="text-muted-foreground mb-4">
                  Usage statistics will appear here once you start using our features.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button onClick={() => router.push('/audit')}>
                    Start Audit
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/keyword-generator')}>
                    Generate Keywords
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auto-Renewal Settings */}
        {hasActiveSubscription && (
          <Card>
            <CardHeader>
              <CardTitle>Auto-Renewal Settings</CardTitle>
              <CardDescription>
                Automatically renew your subscription to avoid service interruption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">Auto-renewal</p>
                  <p className="text-sm text-muted-foreground">
                    {userProfile.autoRenewal && userProfile.nextRenewalDate
                      ? `Your plan will automatically renew on ${formatDate(userProfile.nextRenewalDate)}`
                      : "Your subscription will expire on the renewal date"
                    }
                  </p>
                  {userProfile.renewalStatus && (
                    <p className={`text-sm ${
                      userProfile.renewalStatus === "failed" ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      Status: {getRenewalStatusText(userProfile.renewalStatus)}
                    </p>
                  )}
                </div>
                <Switch
                  checked={userProfile.autoRenewal}
                  onCheckedChange={handleAutoRenewalToggle}
                  disabled={updatingRenewal}
                />
              </div>
              {updatingRenewal && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Updating auto-renewal settings...
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Your recent invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            {billingHistory.length > 0 ? (
              <div className="space-y-4">
                {billingHistory.map((payment) => (
                  <div
                    key={payment._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg gap-4 sm:gap-0"
                  >
                    <div className="flex items-start sm:items-center space-x-4">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{payment.planName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payment.createdAt)} • {payment.billingCycle} • {payment.transactionId}
                        </p>
                        {payment.expiryDate && (
                          <p className="text-xs text-muted-foreground">
                            Valid until: {formatDate(payment.expiryDate)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2 sm:gap-0">
                      <Badge 
                        variant={payment.status === "success" ? "default" : "secondary"}
                        className="w-fit sm:w-auto capitalize"
                      >
                        {payment.status === "success" ? "Paid" : payment.status}
                      </Badge>
                      <span className="font-medium text-center sm:text-left text-lg">
                        {formatCurrency(payment.amount, payment.currency)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-center sm:justify-start border-primary text-primary hover:bg-primary hover:text-white"
                        onClick={() => handleDownloadInvoice(payment.transactionId, payment.planName)}
                        disabled={payment.status !== 'success' || downloadingId === payment.transactionId}
                      >
                        {downloadingId === payment.transactionId ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-1" />
                        )}
                        {downloadingId === payment.transactionId ? 'Downloading...' : 'Invoice'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Billing History</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't made any payments yet. Upgrade your plan to get started.
                </p>
                <Button onClick={handleUpgrade}>View Plans</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access your most used features quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/audit')}
              >
                <FileSearch className="w-6 h-6" />
                <span className="text-sm">Website Audit</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/keyword-generator')}
              >
                <Search className="w-6 h-6" />
                <span className="text-sm">Keyword Generator</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/business-name-generator')}
              >
                <Building className="w-6 h-6" />
                <span className="text-sm">Business Names</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/keywordchecker')}
              >
                <BarChart3 className="w-6 h-6" />
                <span className="text-sm">Keyword Checker</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Need Help with Your Subscription?</h3>
              <p className="text-muted-foreground mb-4">
                Our support team is here to help you with any billing questions or issues.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" onClick={() => window.open('mailto:info@rankseo.in')}>
                  Contact Support
                </Button>
                <Button onClick={() => router.push('/help')}>
                  Help Center
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}