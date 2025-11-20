import { DashboardData } from "../types";

interface StatsGridProps {
  data: DashboardData;
}

export default function StatsGrid({ data }: StatsGridProps) {
  // Calculate the actual total users from the users array
  const totalUsers = data.users?.length || 0;
  
  const stats = [
    {
      title: "Total Users",
      value: totalUsers, // Use the calculated total instead of data.uniqueUsers
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "blue"
    },
    {
      title: "Active Users",
      value: data.activeUsers,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: "green"
    },
    {
      title: "Premium Users",
      value: data.premiumUsers,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "purple"
    },
    {
      title: "Total Activities",
      value: data.totalActivities,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: "yellow"
    }
  ];

  const colorClasses = {
    blue: { border: "border-blue-500", bg: "bg-blue-100", text: "text-blue-600" },
    green: { border: "border-green-500", bg: "bg-green-100", text: "text-green-600" },
    purple: { border: "border-purple-500", bg: "bg-purple-100", text: "text-purple-600" },
    yellow: { border: "border-yellow-500", bg: "bg-yellow-100", text: "text-yellow-600" }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className={`bg-white rounded-lg shadow p-6 border-l-4 ${colorClasses[stat.color as keyof typeof colorClasses].border}`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${colorClasses[stat.color as keyof typeof colorClasses].bg} ${colorClasses[stat.color as keyof typeof colorClasses].text}`}>
              {stat.icon}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}