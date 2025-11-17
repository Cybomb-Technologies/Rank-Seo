"use client";
import { useState } from "react";
import { DashboardData, User } from "../../types";
import UserTable from "../UserTable";
import UserProfileModal from "../UserProfileModal";

interface UsersTabProps {
  data: DashboardData;
}

export default function UsersTab({ data }: UsersTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Safe handling to prevent undefined errors
  const safeUsers = data?.users || [];

  // Helper function to get display plan name
  const getDisplayPlan = (user: User) => {
    // If planName exists and is not empty, use it
    if (user.planName && user.planName !== "Free") {
      return user.planName;
    }
    
    // If plan is an object with name property
    if (user.plan && typeof user.plan === 'object' && (user.plan as any).name) {
      return (user.plan as any).name;
    }
    
    // If plan is a string (ObjectId), check subscription status
    if (typeof user.plan === 'string' && user.plan.length > 0) {
      return user.subscriptionStatus === "active" ? "Premium" : "Free";
    }
    
    // Default fallback
    return user.planName || "Free";
  };

  // Helper function to format date
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "expired": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Process users with proper plan names and formatted dates
  const processedUsers = safeUsers.map(user => ({
    ...user,
    displayPlan: getDisplayPlan(user),
    formattedLastLogin: formatDate(user.lastLogin),
    formattedCreatedAt: formatDate(user.createdAt),
    statusColor: getStatusColor(user.subscriptionStatus)
  }));

  const filteredUsers = processedUsers.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.displayPlan?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlan === "all" || 
                       user.displayPlan?.toLowerCase() === selectedPlan.toLowerCase();
    return matchesSearch && matchesPlan;
  });

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // Get unique plan types for filter dropdown
  const uniquePlans = Array.from(new Set(processedUsers.map(user => user.displayPlan)))
    .filter(plan => plan && plan !== "Free")
    .sort();

  return (
    <>
      <div>
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users by name, email, or plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400 absolute left-3 top-2.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                {uniquePlans.map(plan => (
                  <option key={plan} value={plan.toLowerCase()}>
                    {plan}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-semibold text-blue-700">{safeUsers.length}</div>
              <div className="text-gray-600">Total Users</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-semibold text-green-700">
                {processedUsers.filter(u => u.subscriptionStatus === "active").length}
              </div>
              <div className="text-gray-600">Active Subs</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="font-semibold text-purple-700">
                {processedUsers.filter(u => u.displayPlan !== "Free").length}
              </div>
              <div className="text-gray-600">Premium Users</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded">
              <div className="font-semibold text-orange-700">
                {processedUsers.filter(u => u.isVerified).length}
              </div>
              <div className="text-gray-600">Verified</div>
            </div>
          </div>
        </div>

        <UserTable 
          users={filteredUsers} 
          totalUsers={safeUsers.length} 
          onViewUser={handleViewUser}
        />
      </div>

      <UserProfileModal 
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
}