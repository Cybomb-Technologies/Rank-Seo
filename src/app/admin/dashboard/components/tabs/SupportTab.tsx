// app/admin/support/SupportTab.tsx
"use client";

import React, { useState, useEffect } from "react";

interface User {
  _id: string;
  name?: string;
  email: string;
  planName?: string;
  subscriptionStatus?: string;
  lastLogin?: string;
}

interface ContactMessage {
  _id: string;
  subject: string;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
  type: "technical" | "billing" | "general" | "feature";
  status: "new" | "in_progress" | "resolved" | "closed";
  user: User;
  userEmail: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageStats {
  total: number;
  recent: number;
  byPriority: {
    low?: number;
    medium?: number;
    high?: number;
    urgent?: number;
  };
  byType: {
    technical?: number;
    billing?: number;
    general?: number;
    feature?: number;
  };
  byStatus: {
    new?: number;
    in_progress?: number;
    resolved?: number;
    closed?: number;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalMessages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function SupportTab() {
  // Data State
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Action State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Reply Modal State
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    type: "all",
    priority: "all",
    status: "all",
    search: "",
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalMessages: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, [filters]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") queryParams.append(key, value.toString());
      });

      const response = await fetch(`${API_BASE}/api/admin/support/messages?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const processedMessages = (data.messages || []).map((msg: any) => ({
          ...msg,
          status: msg.status || "new",
          priority: msg.priority || "medium",
          type: msg.type || "general",
          user: msg.user || { 
            _id: msg.user?._id || 'unknown',
            email: msg.userEmail || 'unknown@example.com',
            name: msg.userName || 'Unknown User'
          },
          userEmail: msg.userEmail || msg.user?.email || 'unknown@example.com',
          userName: msg.userName || msg.user?.name || 'Unknown User'
        }));
        setMessages(processedMessages);
        setPagination(data.pagination || pagination);
      } else {
        throw new Error("Failed to fetch messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const response = await fetch(`${API_BASE}/api/admin/support/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // --- REPLY FUNCTIONALITY START ---

  const openReplyModal = (message: ContactMessage) => {
    setReplyTarget(message);
    setReplyText(`Hi ${getSafeUserName(message)},\n\nRegarding your ticket "${message.subject}":\n\n`);
    setReplyModalOpen(true);
  };

  const closeReplyModal = () => {
    setReplyModalOpen(false);
    setReplyTarget(null);
    setReplyText("");
    setIsSendingReply(false);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget || !replyText.trim()) return;

    try {
      setIsSendingReply(true);
      const token = localStorage.getItem("adminToken");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const response = await fetch(`${API_BASE}/api/admin/support/messages/${replyTarget._id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: replyText,
          subject: `Re: ${replyTarget.subject}`
        }),
      });

      const result = await response.json();

      if (response.ok) {
        fetchMessages();
        fetchStats();
        alert(result.message || "Reply sent successfully!");
        closeReplyModal();
      } else {
        throw new Error(result.message || "Failed to send reply");
      }
    } catch (error: any) {
      console.error("Error sending reply:", error);
      alert(error.message || "Failed to send email. Please try again.");
    } finally {
      setIsSendingReply(false);
    }
  };

  // Fallback: Open external mail client
  const handleQuickEmail = (email: string, subject?: string, originalBody?: string) => {
    const emailSubject = subject ? `Re: ${subject}` : 'Response to your support inquiry';
    const bodyContext = originalBody ? `\n\n\n--- Original Message ---\n${originalBody}` : '';
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(bodyContext)}`;
    window.location.href = mailtoLink;
  };

  // --- REPLY FUNCTIONALITY END ---

  const deleteMessage = async (id: string) => {
    if(!window.confirm("Are you sure you want to delete this message?")) return;
    
    try {
      setDeletingId(id);
      const token = localStorage.getItem("adminToken");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const response = await fetch(`${API_BASE}/api/admin/support/messages/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMessages(messages.filter(msg => msg._id !== id));
        fetchStats();
      } else {
        throw new Error("Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    } finally {
      setDeletingId(null);
    }
  };

  const updateMessageStatus = async (id: string, status: string) => {
    try {
      setUpdatingId(id);
      const token = localStorage.getItem("adminToken");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const response = await fetch(`${API_BASE}/api/admin/support/messages/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setMessages(messages.map(msg => 
          msg._id === id ? { ...msg, status } : msg
        ));
        fetchStats();
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Helpers
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "technical": return "bg-blue-100 text-blue-800";
      case "billing": return "bg-purple-100 text-purple-800";
      case "feature": return "bg-indigo-100 text-indigo-800";
      case "general": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      case "closed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (error) { return "Invalid date"; }
  };

  const formatUserPlan = (user: User) => {
    if (!user) return "No user data";
    if (!user.planName && !user.subscriptionStatus) return "No plan";
    return `${user.planName || 'Free'} (${user.subscriptionStatus || 'Unknown'})`;
  };

  const getSafeStatus = (message: ContactMessage) => { return message.status || "new"; };
  const getSafeUserName = (message: ContactMessage) => { return message.userName || message.user?.name || "Unknown User"; };
  const getSafeUserEmail = (message: ContactMessage) => { return message.userEmail || message.user?.email || "unknown@example.com"; };

  if (loading && messages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-blue-500 rounded-full mb-4"></div>
          <div className="text-xl text-gray-600">Loading support messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Messages</h1>
          <p className="text-gray-600">Manage and review customer support inquiries and feedback</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last 7 Days</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recent}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgent Priority</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.byPriority.urgent || 0}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Technical Issues</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.byType.technical || 0}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.byStatus.new || 0}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 17.5L9 13l2.5 2.5L16 10l4.5 4.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search messages..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="general">General</option>
                <option value="feature">Feature Request</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt">Date</option>
                <option value="priority">Priority</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No messages found</div>
              <div className="text-gray-400 text-sm">Try adjusting your filters</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {messages.map((message) => {
                const safeStatus = getSafeStatus(message);
                const safeUserName = getSafeUserName(message);
                const safeUserEmail = getSafeUserEmail(message);
                
                return (
                  <div key={message._id} className="p-6 hover:bg-gray-50 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {message.subject}
                          </h3>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <select
                              value={safeStatus}
                              onChange={(e) => updateMessageStatus(message._id, e.target.value)}
                              disabled={updatingId === message._id}
                              className={`text-xs font-medium rounded-lg border px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getStatusColor(safeStatus)} cursor-pointer`}
                            >
                              <option value="new">New</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                            
                            <button
                              onClick={() => openReplyModal(message)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              <span>Reply</span>
                            </button>

                            <button
                              onClick={() => deleteMessage(message._id)}
                              disabled={deletingId === message._id}
                              className="px-3 py-1.5 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-gray-200 hover:border-red-200"
                            >
                              {deletingId === message._id ? '...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(message.type)}`}>
                            {message.type?.charAt(0).toUpperCase() + message.type?.slice(1) || 'General'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(message.priority)}`}>
                            {message.priority?.charAt(0).toUpperCase() + message.priority?.slice(1) || 'Medium'}
                          </span>
                        </div>

                        {/* User Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 text-sm bg-white p-3 rounded-lg border border-gray-100">
                          <div>
                            <div className="flex items-center space-x-2 text-gray-900">
                              <span className="font-semibold">{safeUserName}</span>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleQuickEmail(safeUserEmail, message.subject, message.message)}
                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                title="Open in Default Mail Client"
                              >
                                {safeUserEmail}
                              </button>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-500 mt-1">
                              <span>Plan:</span>
                              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                message.user?.subscriptionStatus === 'active' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {formatUserPlan(message.user)}
                              </span>
                            </div>
                          </div>
                          <div className="md:text-right text-gray-500 text-sm flex flex-col justify-center">
                            <div><span className="font-medium">Received:</span> {formatDate(message.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Message Content */}
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                        {message.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, pagination.totalMessages)} of {pagination.totalMessages} messages
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium bg-white"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium bg-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- REPLY MODAL --- */}
      {replyModalOpen && replyTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all scale-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Reply to Support Ticket
              </h3>
              <button 
                onClick={closeReplyModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSendReply} className="p-6">
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">To</span>
                  <div className="text-gray-900 font-medium">{getSafeUserEmail(replyTarget)}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Subject</span>
                  <div className="text-gray-900 font-medium truncate">Re: {replyTarget.subject}</div>
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
                  placeholder="Type your reply here..."
                  required
                />
              </div>

              <div className="flex justify-end items-center space-x-3 pt-4 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={closeReplyModal}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingReply}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 font-medium transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSendingReply ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Reply
                      <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}