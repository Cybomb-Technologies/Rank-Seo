"use client";
import { User } from "../../types";

interface UserProfileModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ user, isOpen, onClose }: UserProfileModalProps) {
  if (!isOpen || !user) return null;

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisplayPlan = () => {
    if (user.planName && user.planName !== "Free") {
      return user.planName;
    }
    if (user.plan && typeof user.plan === 'object' && (user.plan as any).name) {
      return (user.plan as any).name;
    }
    if (typeof user.plan === 'string' && user.plan.length > 0) {
      return user.subscriptionStatus === "active" ? "Premium" : "Free";
    }
    return user.planName || "Free";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">User Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Profile Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              {user.profilePicture ? (
                <img
                  className="h-20 w-20 rounded-full"
                  src={user.profilePicture}
                  alt={user.name}
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-2xl">
                    {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user.name || "No Name"}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>

          {/* User Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Plan</label>
                <p className="mt-1 text-sm text-gray-900 font-semibold">{getDisplayPlan()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.subscriptionStatus === "active" 
                    ? "bg-green-100 text-green-800"
                    : user.subscriptionStatus === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : user.subscriptionStatus === "expired"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {(user.subscriptionStatus || "inactive").charAt(0).toUpperCase() + 
                   (user.subscriptionStatus || "inactive").slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Login Method</label>
                <p className="mt-1 text-sm text-gray-900">{user.loginMethod || "Email"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Verified</label>
                <p className="mt-1 text-sm text-gray-900">
                  {user.isVerified ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {user.phone && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Mobile</label>
                <p className="mt-1 text-sm text-gray-900">{user.phone}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-500">Last Login</label>
              <p className="mt-1 text-sm text-gray-900">
                {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Member Since</label>
              <p className="mt-1 text-sm text-gray-900">
                {user.createdAt ? formatDate(user.createdAt) : "Unknown"}
              </p>
            </div>

            {/* Subscription Details */}
            {(user.billingCycle || user.planExpiry) && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Subscription Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  {user.billingCycle && (
                    <div>
                      <label className="block text-xs font-medium text-gray-400">Billing Cycle</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{user.billingCycle}</p>
                    </div>
                  )}
                  {user.planExpiry && (
                    <div>
                      <label className="block text-xs font-medium text-gray-400">Plan Expiry</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(user.planExpiry)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}