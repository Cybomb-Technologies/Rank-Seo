interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-semibold">Admin Panel</h1>
        <p className="text-sm text-gray-400 mt-1">User Management</p>
      </div>
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => onTabChange("overview")}
              className={`w-full text-left px-4 py-3 rounded-md transition-colors flex items-center ${
                activeTab === "overview" 
                  ? "bg-blue-700 text-white" 
                  : "hover:bg-gray-700 text-gray-300"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Dashboard Overview
            </button>
          </li>
          <li>
            <button
              onClick={() => onTabChange("users")}
              className={`w-full text-left px-4 py-3 rounded-md transition-colors flex items-center ${
                activeTab === "users" 
                  ? "bg-blue-700 text-white" 
                  : "hover:bg-gray-700 text-gray-300"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              User Management
            </button>
          </li>
          <li>
            <button
              onClick={() => onTabChange("audit")}
              className={`w-full text-left px-4 py-3 rounded-md transition-colors flex items-center ${
                activeTab === "audit" 
                  ? "bg-blue-700 text-white" 
                  : "hover:bg-gray-700 text-gray-300"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Audit Logs
            </button>
          </li>
          <li>
            <button
              onClick={() => onTabChange("pricing")}
              className={`w-full text-left px-4 py-3 rounded-md transition-colors flex items-center ${
                activeTab === "pricing" 
                  ? "bg-blue-700 text-white" 
                  : "hover:bg-gray-700 text-gray-300"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1h2V3a1 1 0 00-1-1zm4 1a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 110 2h1a1 1 0 110 2h-1v1a1 1 0 110 2h1a1 1 0 110 2h-1v1a1 1 0 110 2h1a1 1 0 110 2h-1v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-1h-1a1 1 0 110-2h1v-1a1 1 0 110-2h-1a1 1 0 110-2h1v-1a1 1 0 110-2h-1a1 1 0 110-2h1V4a1 1 0 011-1h4zM8 8a1 1 0 000 2h4a1 1 0 000-2H8zm0 4a1 1 0 000 2h4a1 1 0 000-2H8z" clipRule="evenodd" />
              </svg>
              Pricing
            </button>
          </li>
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-700 flex items-center text-gray-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}