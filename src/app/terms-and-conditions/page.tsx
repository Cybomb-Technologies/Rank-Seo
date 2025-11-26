"use client";
import Metatags from "../../SEO/metatags";

export default function TermsOfServicePage() {
  const metaPropsData = {
    title: "Terms & Conditions - Rank SEO Agreement & Usage Terms",
    description:
      "Review our Terms and conditions for the Rank SEO. This service agreement outlines the usage terms and legal agreement for our platform.",
    keyword:
      "SEO audit terms of service, terms and conditions, SEO tool agreement, usage terms, service agreement",
    url: "https://rankseo.in/terms-and-conditions",
    image: "https://rankseo.in/SEO_LOGO.png",
  };
  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen pt-28 bg-gray-50 text-gray-800 py-12 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            Terms & Conditions
          </h1>
          <p className="mb-4 text-sm text-gray-500">
            Last updated: September 1, 2025
          </p>

          <p className="mb-6">
            Welcome to <strong>RankSeo.in</strong>. By accessing or using our
            AI-powered SEO analysis and landing page optimization tools (the
            “Service”), you agree to be bound by these Terms & Conditions
            (“Terms”). Please read them carefully before using the Service.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            1. Use of the Service
          </h2>
          <p className="mb-4">
            You agree to use our Service only for lawful purposes and in
            accordance with these Terms. You may not use the Service:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>For any fraudulent, unlawful, or malicious activity.</li>
            <li>
              To copy, modify, or distribute our AI models or algorithms without
              permission.
            </li>
            <li>
              To interfere with the proper functioning of the Service, including
              security and access controls.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            2. Accounts and Access
          </h2>
          <p className="mb-6">
            To access certain features, you may need to create an account. You
            are responsible for safeguarding your login credentials and any
            activity under your account.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            3. Subscription and Payments
          </h2>
          <p className="mb-6">
            Some features of the Service require a paid subscription. By
            subscribing, you agree to provide accurate payment details and
            authorize us to charge the applicable fees. All payments are
            non-refundable except where required by law.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            4. Intellectual Property
          </h2>
          <p className="mb-6">
            All content, software, AI models, and branding associated with SEO
            Audit Pro remain our exclusive property. You may not use our
            trademarks, content, or algorithms without prior written consent.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            5. Data and Privacy
          </h2>
          <p className="mb-6">
            We respect your privacy and handle your data in accordance with our{" "}
            <a href="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </a>
            . By using the Service, you consent to our collection and use of
            data as described in that policy.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            6. Limitation of Liability
          </h2>
          <p className="mb-6">
            The Service is provided “as is” without warranties of any kind. We
            do not guarantee specific SEO results, search rankings, or traffic
            increases. To the maximum extent permitted by law, RankSeo.in shall
            not be liable for any direct, indirect, incidental, or consequential
            damages arising from your use of the Service.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">7. Termination</h2>
          <p className="mb-6">
            We may suspend or terminate your access if you violate these Terms
            or misuse the Service. Upon termination, your right to use the
            Service will immediately cease.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            8. Changes to Terms
          </h2>
          <p className="mb-6">
            We reserve the right to update or modify these Terms at any time. We
            will notify users of major updates via email or platform
            announcements. Continued use of the Service after changes means you
            accept the updated Terms.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">9. Contact Us</h2>
          <p className="mb-2">
            If you have questions about these Terms, please contact us at:
          </p>
          <ul className="mb-6">
            <li>Email: Info@rankseo.in</li>
            <li>Phone: +91 9715092104</li>
          </ul>

          <p className="text-gray-600 text-sm">
            By using RankSeo.in, you acknowledge that you have read and agreed
            to these Terms & Conditions.
          </p>
        </div>
      </div>
    </>
  );
}
