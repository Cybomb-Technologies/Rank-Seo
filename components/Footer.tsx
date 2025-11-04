"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2"; // ✅ SweetAlert2
import Image from "next/image";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");

  // Function to handle form submission
  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Please enter a valid email address.",
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Subscribed!",
          text: data.message || "Subscription successful!",
          timer: 2000,
          showConfirmButton: false,
        });
        setEmail(""); // Clear the input field on success
      } else {
        Swal.fire({
          icon: "error",
          title: "Already Subscribed",
          text: data.message || "This email is already subscribed.",
        });
      }
    } catch (error) {
      console.error("Subscription error:", error);
      Swal.fire({
        icon: "error",
        title: "Failed!",
        text: "Failed to subscribe. Please try again.",
      });
    }
  };

  // Hide Footer for all routes starting with /profile
  if (pathname.startsWith("/profile")) {
    return null;
  }

  return (
    <footer className="bg-muted border-t border-border py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        {/* Subscribe Section - TOP CENTER */}
        <div className="text-center mb-12">
          <h3 className="font-semibold text-foreground text-xl mb-4">
            Stay Updated with SEO Insights
          </h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Subscribe to our newsletter for the latest SEO tips, tools updates,
            and industry insights.
          </p>
          <form className="flex max-w-md mx-auto" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full px-4 py-3 text-sm border border-border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white text-sm font-medium rounded-r-lg hover:bg-primary/90 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo + About */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Link href={"/"}>
                <Image
                  src="/SEO_LOGO.png"
                  alt="SEO-AUDIT LOGO"
                  width={100}
                  height={35}
                  priority
                  className="opacity-100"
                />
              </Link>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Professional SEO analysis tools to help businesses improve their
              search engine rankings and online visibility.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-foreground text-base mb-3">
              Services
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/business-name-generator"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Business Name Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/audit"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Seo Audit Tool
                </Link>
              </li>
              <li>
                <Link
                  href="/keyword-generator"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Keyword Generator Tool
                </Link>
              </li>
              <li>
                <Link
                  href="/scraper"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Keyword Scraper Tool
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-foreground text-base mb-3">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms-of-services"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing-policy"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Pricing Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Get in Touch Section */}
          <div>
            <h3 className="font-semibold text-foreground text-base mb-3">
              Get in Touch
            </h3>
            <div className="space-y-3">
              {/* Address */}
              <div className="flex items-start gap-2">
                <div className="bg-blue-100 p-2 rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Address</p>
                  <p className="text-sm text-muted-foreground">
                    Cybomb Technologies Pvt Ltd,
                    <br />
                    Prime Plaza No.54/1, 1st street,
                    <br />
                    Sripuram colony, St. Thomas Mount,
                    <br />
                    Chennai, Tamil Nadu - 600 016,
                    <br />
                    India
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2">
                <div className="bg-green-100 p-2 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Phone</p>
                  <a
                    href="tel:+919715092104"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    +91 9715092104
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2">
                <div className="bg-purple-100 p-2 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <a
                    href="mailto:info@rankseo.in"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    info@rankseo.in
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-6 mt-6 border-t border-border">
          <p className="text-muted-foreground text-sm text-center">
            © 2025 Cybomb Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
