"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Menu,
  LogOut,
  User,
  ChevronDown,
  Search,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/components/context/UserContext";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolledPastBanner, setIsScrolledPastBanner] = useState(false);
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);

  const { user, setUser } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const services = [
    { name: "Keyword Checker", href: "/keywordchecker", icon: Search }, 
    { name: "Keyword Generator", href: "/keyword-generator", icon: Sparkles },
    { name: "Keyword Scraper", href: "/scraper", icon: Search }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledPastBanner(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/");
  };

  const handleProfileRedirect = () => {
    router.push("/login");
  };

  if (pathname.startsWith("/profile")) return null;

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolledPastBanner
          ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border"
          : "bg-white"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link href={"/"}>
              <Image
                src="/SEO_LOGO.png"
                alt="SEO-AUDIT LOGO"
                width={100}
                height={35}
                priority
                className={isScrolledPastBanner ? "opacity-90" : "opacity-100"}
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link
              href="/audit"
              className={`transition-colors ${
                isScrolledPastBanner
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              SEO Audit
            </Link>
            <Link
              href="/business-name-generator"
              className={`transition-colors ${
                isScrolledPastBanner
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Business Name Generator
            </Link>

            {/* Services Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsServicesMenuOpen(true)}
              onMouseLeave={() => setIsServicesMenuOpen(false)}
            >
              <DropdownMenu open={isServicesMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-1 transition-colors ${
                      isScrolledPastBanner
                        ? "text-muted-foreground hover:text-foreground"
                        : "text-gray-700 hover:text-gray-900"
                    }`}
                  >
                    <span>Services</span>
                    <ChevronDown className="w-4 h-4 transition-transform" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-64 rounded-xl shadow-lg border border-gray-200 bg-white p-2"
                  sideOffset={8}
                >
                  {services.map((service) => (
                    <DropdownMenuItem asChild key={service.href}>
                      <Link
                        href={service.href}
                        className="flex items-center px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary"
                      >
                        <service.icon className="mr-2 h-4 w-4" />
                        <span className="font-medium">{service.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link
              href="/pricing"
              className={`transition-colors ${
                isScrolledPastBanner
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Pricing
            </Link>
            <Link
              href="/about-us"
              className={`transition-colors ${
                isScrolledPastBanner
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              About Us
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/profile">
                  <Avatar className="cursor-pointer w-9 h-9 ring-2 ring-primary">
                    {user.image ? (
                      <AvatarImage src={user.image} alt={user.name} />
                    ) : (
                      <AvatarFallback className="bg-primary text-white">
                        {user.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleProfileRedirect}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    isScrolledPastBanner
                      ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  } hover:scale-110 hover:shadow-md active:scale-95`}
                >
                  <User className="w-5 h-5 transition-transform duration-200" />
                </Button>
                <Button
                  asChild
                  variant={isScrolledPastBanner ? "outline" : "default"}
                  size="sm"
                >
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu
                    className={`w-5 h-5 ${
                      isScrolledPastBanner
                        ? "text-foreground"
                        : "text-gray-900"
                    }`}
                  />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col space-y-6">
                  <div className="mx-5 flex flex-col">
                    <Link
                      href="/audit"
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      SEO Audit
                    </Link>
                    <Link
                      href="/business-name-generator"
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Business Name Generator
                    </Link>
                    {services.map((service) => (
                      <Link
                        key={service.href}
                        href={service.href}
                        className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {service.name}
                      </Link>
                    ))}
                    <Link
                      href="/pricing"
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Pricing
                    </Link>
                    <Link
                      href="/about-us"
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      About Us
                    </Link>

                    {user ? (
                      <div className="flex flex-col gap-3 mt-4">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Avatar className="w-10 h-10 ring-2 ring-primary">
                            {user.image ? (
                              <AvatarImage src={user.image} alt={user.name} />
                            ) : (
                              <AvatarFallback className="bg-primary text-white">
                                {user.name?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </Link>
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleProfileRedirect();
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-2 justify-center"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Button>
                        <Link
                          href="/login"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button className="w-full">Login</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
