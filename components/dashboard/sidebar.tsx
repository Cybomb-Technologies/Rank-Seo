"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  User,
  LayoutDashboard,
  FileText,
  History,
  CreditCard,
  HelpCircle,
  Search,
  LogOut,
  Menu,
  Home,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser } from "@/components/context/UserContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const sidebarItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
    {
    title: "Dashboard",
    href: "/profile/dashboard",
    icon: LayoutDashboard,
  },

  {
    title: "Reports",
    href: "/profile/reports",
    icon: FileText,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Billing",
    href: "/profile/billing",
    icon: User,
  },
  {
    title: "Support",
    href: "/profile/support",
    icon: HelpCircle,
  },
];

// Add onClose prop to SidebarContent
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const [userData, setUserData] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/profile`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        setUserData({
          name: data.name || "N/A",
          email: data.email || "N/A",
        });
      } catch (error) {
        console.error("Authentication failed:", error);
        localStorage.removeItem("token");
        router.push("/login");
      }
    };
    fetchProfile();
  }, [router]);

  const { setUser } = useUser();

  const handleSignOut = async () => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      setUser(null);

      // Close sidebar on sign out
      if (onClose) onClose();

      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      setUser(null);

      // Close sidebar on sign out even if API fails
      if (onClose) onClose();

      router.push("/");
    }
  };

  // Function to handle navigation item clicks
  const handleNavigationClick = () => {
    if (onClose) {
      onClose(); // Close the sidebar on mobile
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link 
          href="/" 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={handleNavigationClick} // Add click handler
        >
          <img src="/SEO_LOGO.png" alt="rank_seo_logo" width="100" height="35"/>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link 
              key={item.href} 
              href={item.href} 
              style={{ padding: "20px 0px" }}
              onClick={handleNavigationClick} // Add click handler
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive &&
                    "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                )}
                style={{ margin: "5px 0px" }}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-sidebar-accent-foreground">
              {userData.name ? userData.name[0] : "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {userData.name || "Guest"}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {userData.email || "guest@example.com"}
            </p>
          </div>
        </div>

        {/* Sign Out Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Function to close the mobile sidebar
  const closeSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="bg-background">
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar">
            {/* Pass the closeSidebar function to SidebarContent */}
            <SidebarContent onClose={closeSidebar} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:block w-64 bg-sidebar border-r border-sidebar-border">
        {/* No need to pass onClose for desktop */}
        <SidebarContent />
      </div>
    </>
  );
}