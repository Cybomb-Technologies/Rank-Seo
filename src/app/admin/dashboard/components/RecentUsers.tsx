import { User } from "../types";

interface RecentUsersProps {
  users: User[];
}

export default function RecentUsers({ users }: RecentUsersProps) {
  const recentUsers = users.slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">Recent Users</h3>
        <span className="text-sm text-gray-500">Last {recentUsers.length} registered users</span>
      </div>
      <div className="divide-y divide-gray-200">
        {recentUsers.map((user) => (
          <div key={user._id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.loginMethod && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {user.loginMethod}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    (user.planName && user.planName !== "Free") // Check if plan is not Free
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user.planName || "Free"} {/* Use planName for display */}
                </span>
                <p className="text-sm text-gray-500">
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-400">
                  {user.isVerified ? "Verified" : "Not Verified"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}