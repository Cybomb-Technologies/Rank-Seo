"use client";
import Metatags from "../../SEO/metatags";

export default function RefundPolicyPage() {
  const metaPropsData = {
    title: "Refund Policy | SEO Audit Tool Money-Back Guarantee",
    description:
      "Learn about our refund policy for RANK SEO audit services. 7-day money-back guarantee for eligible cases. Clear terms for subscription refunds.",
    keyword:
      "SEO audit refund policy, money-back guarantee, subscription refund, SEO tool refund policy",
    url: "https://rankseo.in/refund-policy",
    image: "https://rankseo.in/SEO_LOGO.png",
  };
  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen pt-28 bg-gray-50 text-gray-800 py-12 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            Refund Policy
          </h1>
          <p className="mb-4 text-sm text-gray-500">
            Last updated: September 1, 2025
          </p>

          <p className="mb-6">
            Thank you for using <strong>RankSeo.in</strong>. We strive to
            provide the best AI-powered SEO analysis and landing page
            optimization tools. This Refund Policy outlines the terms under
            which refunds may be granted for subscription purchases.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            1. Subscription Fees
          </h2>
          <p className="mb-6">
            Our services are offered on a subscription basis. Payments are
            processed securely through third-party providers. Subscription fees
            are generally non-refundable, except as outlined in this policy.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            2. Eligibility for Refunds
          </h2>
          <p className="mb-4">You may be eligible for a refund if:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>
              You were charged in error or experienced a duplicate payment.
            </li>
            <li>
              You did not receive access to the Service after a successful
              payment.
            </li>
            <li>
              There was a technical issue on our platform that prevented usage
              and could not be resolved within a reasonable time.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            3. Non-Refundable Situations
          </h2>
          <p className="mb-4">
            Refunds will not be issued in the following cases:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Change of mind after purchase.</li>
            <li>Partial use of the Service during the billing cycle.</li>
            <li>Failure to cancel a subscription before the renewal date.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            4. Requesting a Refund
          </h2>
          <p className="mb-6">
            To request a refund, please contact our support team within{" "}
            <strong>7 days</strong> of the transaction. Include your account
            email, payment reference, and a description of the issue. Refund
            requests will be reviewed on a case-by-case basis.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            5. Processing of Refunds
          </h2>
          <p className="mb-6">
            If your refund request is approved, the refund will be processed to
            your original payment method within{" "}
            <strong>5–10 business days</strong>, depending on your bank or
            payment provider.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">6. Contact Us</h2>
          <p className="mb-2">
            If you have any questions regarding this Refund Policy, please reach
            out to us:
          </p>
          <ul className="mb-6">
            <li>Email: Info@rankseo.in</li>
            <li>Phone: +91 9715092104</li>
          </ul>

          <p className="text-gray-600 text-sm">
            By subscribing to RankSeo.in, you acknowledge that you have read and
            understood this Refund Policy.
          </p>
        </div>
      </div>
    </>
  );
}
