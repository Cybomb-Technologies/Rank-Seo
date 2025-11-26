"use client";
import Metatags from "../../SEO/metatags";

export default function PrivacyPolicyPage() {
  const metaPropsData = {
    title: "Privacy Policy for Rank SEO - Data Protection and Security",
    description:
      "Our Privacy Policy details the data protection, security, and data collection practices for our Rank SEO tools, ensuring your information is safe.",
    keyword:
      "SEO audit privacy policy, data protection, privacy policy, SEO tool security, data collection",
    url: "https://rankseo.in/privacy-policy",
    image: "https://rankseo.in/SEO_LOGO.png",
  };
  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen pt-28 bg-gray-50 text-gray-800 py-12 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            Privacy Policy
          </h1>
          <p className="mb-4 text-sm text-gray-500">
            Last updated: September 1, 2025
          </p>

          <p className="mb-6">
            At <strong>RankSEO</strong>, we respect your privacy and are
            committed to protecting your personal information. This Privacy
            Policy explains how we collect, use, and safeguard your data when
            you use our AI-powered SEO analysis and landing page optimization
            tools (the “Service”).
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            1. Information We Collect
          </h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>
              <strong>Account Information:</strong> Name, email address, and
              login details when you create an account.
            </li>
            <li>
              <strong>Payment Information:</strong> Billing details when you
              purchase a subscription (processed securely through third-party
              providers, we do not store credit card details).
            </li>
            <li>
              <strong>Usage Data:</strong> Analytics on how you use our tools,
              including search queries and optimization reports.
            </li>
            <li>
              <strong>Device & Log Data:</strong> IP address, browser type, and
              other technical information to improve security and performance.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            2. How We Use Your Information
          </h2>
          <p className="mb-4">We use the collected information to:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Provide, operate, and improve our SEO tools and services.</li>
            <li>Process payments and manage subscriptions.</li>
            <li>
              Send important updates, product news, and customer support
              communications.
            </li>
            <li>
              Analyze user behavior to enhance our AI models and reporting
              accuracy.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            3. Sharing of Information
          </h2>
          <p className="mb-6">
            We do not sell or rent your personal information. We may share
            limited data with trusted third-party service providers (e.g.,
            payment processors, analytics providers) who help us operate our
            Service, under strict confidentiality agreements.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">4. Data Security</h2>
          <p className="mb-6">
            We implement industry-standard security measures to protect your
            data. However, no online service can guarantee 100% security. You
            are responsible for safeguarding your account credentials.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            5. Cookies and Tracking
          </h2>
          <p className="mb-6">
            We use cookies and similar tracking technologies to enhance your
            browsing experience, analyze site traffic, and personalize content.
            You can disable cookies in your browser settings, but some features
            of the Service may not function properly.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">6. Your Rights</h2>
          <p className="mb-4">
            Depending on your location, you may have the right to:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction or deletion of your personal data.</li>
            <li>Opt out of marketing emails at any time.</li>
            <li>Withdraw consent for data processing (where applicable).</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            7. Children’s Privacy
          </h2>
          <p className="mb-6">
            Our Service is not intended for children under 13. We do not
            knowingly collect data from children. If we discover such data, we
            will delete it promptly.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            8. Changes to this Policy
          </h2>
          <p className="mb-6">
            We may update this Privacy Policy from time to time. Any changes
            will be posted on this page with a revised “Last updated” date. If
            the changes are significant, we may notify you by email or platform
            announcement.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">9. Contact Us</h2>
          <p className="mb-2">
            If you have any questions about this Privacy Policy, please contact
            us:
          </p>
          <ul className="mb-6">
            <li>Email: Info@rankseo.in</li>
            <li>Phone: +91 9715092104</li>
          </ul>

          <p className="text-gray-600 text-sm">
            By using RankSeo.in, you consent to the practices described in this
            Privacy Policy.
          </p>
        </div>
      </div>
    </>
  );
}
