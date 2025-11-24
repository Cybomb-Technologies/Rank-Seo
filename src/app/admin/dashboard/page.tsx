"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import OverviewTab from "./components/tabs/OverviewTab";
import UsersTab from "./components/tabs/UsersTab";
import AuditTab from "./components/tabs/AuditTab";
import PricingTab from "./components/tabs/PricingTab";
import AdminPaymentsPage from "./components/tabs/PaymentTab";
import LoadingSpinner from "./components/LoadingSpinner";
import AdminNewsletterPage from "./components/tabs/NewsletterTab";
import SupportTab from "./components/tabs/SupportTab";
import { DashboardData } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ;

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("adminToken");
      
      const response = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else if (response.status === 401) {
        localStorage.removeItem("adminToken");
        router.push("/admin");
      } else {
        throw new Error("Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load dashboard data. Please try again.");
      setData({
        totalLogins: 0,
        uniqueUsers: 0,
        activeUsers: 0,
        premiumUsers: 0,
        auditData: [],
        users: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    router.push("/admin");
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout} 
      />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Header 
            activeTab={activeTab} 
            onRefresh={refreshData} 
            error={error}
          />
          
          {activeTab === "overview" && data && <OverviewTab data={data} />}
          {activeTab === "users" && data && <UsersTab data={data} />}
          {activeTab === "audit" && data && <AuditTab data={data} />}
          {activeTab === "pricing" && data && <PricingTab data={data} />}
          {activeTab === "payments" && data && <AdminPaymentsPage data={data} />}
          {activeTab === "newsletter" && data && <AdminNewsletterPage data={data} />}
          {activeTab === "support" && data && <SupportTab data={data} />}

        </div>
      </div>
    </div>
  );
}

