// src/app/About/page.tsx

import React from "react";
import { CheckCircle, Zap, Bug, BarChart } from "lucide-react";
import Link from "next/link";
import Metatags from "../../SEO/metatags";

const AboutPage = () => {
  const metaPropsData = {
    title: "About Rank SEO - AI SEO Tool for SEO Audit & Optimization",
    description:
      "Learn about Rank SEO AI tool for SEO audit and website optimization. Get performance monitoring, bug detection, and competitive analysis like top SEO tools.",
    keyword:
      "rank seo, ai seo tool, seo audit, website optimization, performance monitoring, bug detection",
    url: "https://rankseo.in/about-us",
    image: "https://rankseo.in/SEO_LOGO.png",
  };
  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
        {/* Hero Section */}
        <header
          className="text-white pt-28 sm:pt-36 pb-12 sm:pb-20 px-4 sm:px-6 text-center"
          style={{ backgroundColor: "var(--primary)" }}
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-snug">
            RANK SEO
          </h1>
          <p className="max-w-3xl mx-auto text-base sm:text-lg lg:text-xl leading-snug text-gray-200 tracking-wide">
            The AI-powered solution that audits and optimizes your landing pages
            for SEO, performance, and bugs. Unlock valuable insights and boost
            your website's search rankings with detailed, actionable reports.
          </p>
        </header>

        {/* Mission Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-12 sm:pb-16">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#003366] mb-4">
              Our Commitment to Growth & Innovation
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Discover how we help businesses, developers, and marketers
              optimize their websites.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 items-center">
            {/* Left Image */}
            <div className="flex">
              <img
                src="/our-mission.jpg"
                alt="Our Mission"
                className="w-full h-auto rounded-xl shadow-lg object-cover"
                loading="lazy"
              />
            </div>

            {/* Right Content */}
            <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl shadow-xl border border-gray-200 flex flex-col justify-center">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-[#003366]">
                Our Mission
              </h3>
              <p className="text-base sm:text-lg leading-relaxed text-gray-700">
                Our mission is to help businesses, developers, and marketers
                optimize their websites through comprehensive SEO and
                performance audits. We leverage the power of AI and key industry
                tools like Google PageSpeed Insights, Lighthouse, and Moz/Ahrefs
                to deliver actionable insights and recommendations that improve
                your website's performance and search visibility.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-10 sm:mb-14 text-[#003366]">
              Key Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[
                {
                  icon: (
                    <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-[#34d399] mb-4 mx-auto" />
                  ),
                  title: "Comprehensive SEO Analysis",
                  text: "Analyze on-page SEO factors like meta tags, headings, alt tags, and schema to ensure your content is fully optimized.",
                },
                {
                  icon: (
                    <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-[#34d399] mb-4 mx-auto" />
                  ),
                  title: "Performance Optimization",
                  text: "Review Core Web Vitals, reduce delays, and improve loading speed for seamless interaction and higher engagement.",
                },
                {
                  icon: (
                    <Bug className="w-8 h-8 sm:w-10 sm:h-10 text-[#34d399] mb-4 mx-auto" />
                  ),
                  title: "Bug Detection & Repair",
                  text: "Identify bugs and broken elements that affect user experience and rankings, with actionable solutions to fix them.",
                },
                {
                  icon: (
                    <BarChart className="w-8 h-8 sm:w-10 sm:h-10 text-[#34d399] mb-4 mx-auto" />
                  ),
                  title: "Backlink & Authority",
                  text: "Monitor backlinks, domain authority, and referring domains to strengthen trust and improve search rankings.",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="p-6 sm:p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 transform border border-gray-100 hover:border-[#34d399] text-center"
                >
                  {feature.icon}
                  <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-[#003366]">
                    {feature.title}
                  </h3>
                  <p className="text-base sm:text-lg leading-relaxed text-gray-700">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who We Help Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-10 sm:mb-14 text-[#003366]">
            Who Can Benefit?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "Marketers",
                text: "Optimize landing pages for better rankings, higher CTR, and improved conversions through SEO-driven insights.",
              },
              {
                title: "Developers",
                text: "Save time with automated bug detection and performance tools, so you can focus on building instead of debugging.",
              },
              {
                title: "Business Owners",
                text: "Ensure your site is fast, mobile-friendly, and ranking high to drive more traffic and boost sales.",
              },
            ].map((role, i) => (
              <div
                key={i}
                className="p-6 sm:p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 transform text-center"
              >
                <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-[#003366]">
                  {role.title}
                </h3>
                <p className="text-base sm:text-lg leading-relaxed text-gray-700">
                  {role.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action Section */}
        <section
          className="text-white py-12 sm:py-16 px-4 sm:px-6 text-center"
          style={{ backgroundColor: "var(--primary)" }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">
            Ready to Improve Your SEO?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl max-w-3xl mx-auto mb-6 text-gray-200 tracking-wide">
            Thousands of websites are already benefiting from our AI-powered
            optimization tool. Start improving your SEO and performance today
            with our free audit.
          </p>
          <Link
            href="/audit"
            className="inline-block bg-white px-5 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all text-base sm:text-lg"
            style={{ color: "var(--primary)" }}
          >
            Start Your Free Audit
          </Link>
        </section>
      </div>
    </>
  );
};

export default AboutPage;
