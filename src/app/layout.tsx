import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserProvider } from "@/components/context/UserContext";
import Script from "next/script";

export const metadata: Metadata = {
  title: "RANK SEO | AI-Powered SEO Audit & Analysis Tools",
  description:
    "Free AI-powered SEO tools for comprehensive website audits, keyword research, competitor analysis, and performance optimization. Boost your search rankings with RANK SEO.",
  keywords:
    "SEO audit, AI SEO tools, keyword research, competitor analysis, website optimization, search engine ranking",
  authors: [{ name: "RANK SEO" }],
  creator: "RANK SEO",
  publisher: "RANK SEO",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rankseo.in",
    siteName: "RANK SEO",
    title: "RANK SEO | AI-Powered SEO Audit & Analysis Tools",
    description:
      "Free AI-powered SEO tools for comprehensive website audits, keyword research, competitor analysis, and performance optimization.",
    images: [
      {
        url: "https://rankseo.in/SEO_LOGO.png",
        width: 1200,
        height: 630,
        alt: "RANK SEO - AI Powered SEO Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RANK SEO | AI-Powered SEO Audit & Analysis Tools",
    description:
      "Free AI-powered SEO tools for comprehensive website analysis and optimization.",
    images: ["https://rankseo.in/SEO_LOGO.png"],
  },
  verification: {
    // Add Google Search Console verification if you have it
    // google: "your-google-verification-code",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.json", // If you have a PWA manifest
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#008e7a", // Match your primary color
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Canonical URL */}
        <link rel="canonical" href="https://rankseo.in" />

        {/* Favicon links */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <!-- Google tag (gtag.js) -->
<Script
    src="https://www.googletagmanager.com/gtag/js?id=G-40JS8B17NN"
    strategy="afterInteractive"
  />
  <Script id="google-analytics" strategy="afterInteractive">
    {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-40JS8B17NN');
    `}
  </Script>

      </head>

      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} overflow-hidden`}
      >
        {/* Global Google AdSense Script */}
        <Script
          id="adsense-init"
          strategy="afterInteractive"
          async
          src="https://pagead2.googlesyndication.compagead/js/adsbygoogle.js?client=ca-pub-4338634405797265"
          crossOrigin="anonymous"
        />

        {/* Structured Data for SEO */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "RANK SEO",
              url: "https://rankseo.in",
              logo: "https://rankseo.in/SEO_LOGO.png",
              description: "AI-Powered SEO Audit & Analysis Tools",
              sameAs: [
                // Add your social media links here if available
              ],
              contactPoint: {
                "@type": "ContactPoint",
                email: "info@rankseo.in",
                contactType: "customer service",
              },
            }),
          }}
        />

        <UserProvider>
          {/* Navbar */}
          <Navbar />

          {/* Page Content */}
          <main className="overflow-y-scroll scrollbar-hide h-screen">
            {children}
            <Footer />
          </main>
        </UserProvider>
      </body>
    </html>
  );
}
