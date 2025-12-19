"use client";
import Metatags from "../../SEO/metatags";
export default function PricingPolicyPage() {
  const metaPropsData = {
    title: "Pricing Policy | Rank SEO Audit Subscription Terms & Billing",
    description:
      "Learn about Rank SEO pricing structure, billing cycles, refund policy, and subscription terms. Clear transparent pricing with flexible cancellation options.",
    keyword:
      "seo audit pricing policy, subscription terms, billing policy, transparent pricing policy, seo tool pricing",
    url: "https://rankseo.in/pricing-policy",
    image: "https://rankseo.in/SEO_LOGO.png",
  };
  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen pt-28 bg-gray-50 text-gray-800 py-12 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            Pricing Policy
          </h1>
          <p className="mb-4 text-sm text-gray-500">
            Last updated: {new Date().getFullYear()}-
            {(new Date().getMonth() + 1).toString().padStart(2, "0")}-
            {new Date().getDate().toString().padStart(2, "0")}
          </p>

          <p className="mb-6">
            This Pricing Policy explains how our pricing, billing, renewals, and
            refunds work for all our AI-powered SEO audit services and
            subscription plans. By subscribing to our services, you agree to the
            terms outlined in this policy.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            1. Pricing Structure
          </h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>
              <strong>Plan Tiers:</strong> We offer Starter, Professional, and
              Enterprise plans designed to meet different business needs and
              scales.
            </li>
            <li>
              <strong>Billing Cycles:</strong> Both monthly and annual billing
              options are available. Annual subscriptions offer significant
              savings compared to monthly billing.
            </li>
            <li>
              <strong>Currency:</strong> All prices are displayed in both USD
              and INR. For Indian customers, prices include applicable GST.
            </li>
            <li>
              <strong>Taxes:</strong> All applicable taxes are included in the
              displayed price for Indian customers. International customers may
              be subject to local taxes based on their jurisdiction.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            2. Subscription & Renewal
          </h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>
              <strong>Automatic Renewal:</strong> All subscriptions
              automatically renew at the end of each billing cycle to ensure
              uninterrupted service.
            </li>
            <li>
              <strong>Renewal Notices:</strong> We send renewal reminder emails
              7 days and 24 hours before your subscription renews.
            </li>
            <li>
              <strong>Cancellation:</strong> You can cancel your subscription at
              any time through your account dashboard. Cancellations must be
              made at least 24 hours before the next billing cycle to avoid
              being charged for the upcoming period.
            </li>
            <li>
              <strong>Free Trials:</strong> Some plans may include free trial
              periods. If you don't cancel before the trial ends, your
              subscription will automatically convert to a paid plan.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            3. Payment Methods
          </h2>
          <p className="mb-4">We accept the following payment methods:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Credit Cards (Visa, MasterCard, American Express, Discover)</li>
            <li>Debit Cards</li>
            <li>PayPal</li>
            <li>UPI (for Indian customers)</li>
            <li>Net Banking (for Indian customers)</li>
            <li>Bank Transfers (for Enterprise plans)</li>
          </ul>
          <p className="mb-6">
            All payments are processed through secure, PCI-compliant payment
            gateways. We do not store your complete payment card details on our
            servers.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            4. Refund & Cancellation Policy
          </h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>
              <strong>Refund Period:</strong> We offer a 14-day money-back
              guarantee for all new subscriptions. If you're unsatisfied with
              our service, you can request a full refund within 14 days of your
              initial purchase.
            </li>
            <li>
              <strong>Non-Refundable Items:</strong> Refunds are not available
              for:
              <ul className="list-circle pl-6 mt-2 space-y-1">
                <li>Partially used subscription periods</li>
                <li>
                  Services that have been actively used beyond trial limits
                </li>
                <li>Enterprise plan customizations and implementations</li>
                <li>Renewal payments after the initial 14-day period</li>
              </ul>
            </li>
            <li>
              <strong>Refund Process:</strong> To request a refund, contact our
              support team with your account details and reason for
              cancellation. Refunds are processed within 7-10 business days.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            5. Discounts, Coupons & Offers
          </h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>
              <strong>Promotional Offers:</strong> We occasionally run
              promotional campaigns offering discounts or special pricing for
              limited periods.
            </li>
            <li>
              <strong>Coupon Codes:</strong> Discount codes are non-transferable
              and can only be used once per customer unless otherwise specified.
            </li>
            <li>
              <strong>Combining Offers:</strong> Discount codes cannot be
              combined with other ongoing promotions or applied to existing
              subscriptions.
            </li>
            <li>
              <strong>Offer Validity:</strong> All special offers and discounts
              are valid only during the specified promotional period and are
              subject to change or withdrawal without prior notice.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">6. Price Changes</h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>
              <strong>Price Adjustments:</strong> We reserve the right to modify
              our pricing at any time. However, we will provide at least 30 days
              notice via email before any price changes take effect.
            </li>
            <li>
              <strong>Existing Customers:</strong> Current subscribers will
              maintain their existing pricing for the duration of their current
              billing cycle. New pricing will apply from the next renewal date
              after the notice period.
            </li>
            <li>
              <strong>Grandfathering:</strong> In some cases, we may grandfather
              existing customers at their current rates for a limited time after
              price increases.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            7. Security & Billing Protection
          </h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>
              <strong>Payment Security:</strong> All transactions are protected
              by 256-bit SSL encryption and processed through PCI-DSS compliant
              payment processors.
            </li>
            <li>
              <strong>Data Protection:</strong> We do not store your complete
              payment card details on our servers. All sensitive financial
              information is handled by our secure payment partners.
            </li>
            <li>
              <strong>Billing Disputes:</strong> If you notice any unauthorized
              charges or billing discrepancies, please contact us immediately
              within 30 days of the charge date.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            8. Plan Features & Limitations
          </h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>
              <strong>Feature Updates:</strong> We continuously improve our
              platform and may add new features to existing plans. Some advanced
              features may be limited to higher-tier plans.
            </li>
            <li>
              <strong>Usage Limits:</strong> Each plan has specific usage limits
              (number of audits, keyword tracking, etc.). Exceeding these limits
              may require upgrading your plan.
            </li>
            <li>
              <strong>Plan Changes:</strong> You can upgrade your plan at any
              time, with the new rate applied immediately. Downgrades take
              effect at the end of your current billing cycle.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            9. Contact Information
          </h2>
          <p className="mb-4">
            For any billing, pricing, or subscription-related questions, please
            contact us:
          </p>
          <ul className="mb-6 space-y-2">
            <li>📧 Email: Info@rankseo.in</li>
            <li>📞 Phone: +91 9715092104</li>
            <li>🕒 Support Hours: Monday-Friday, 9:00 AM - 6:00 PM IST</li>
          </ul>
          <p className="text-gray-600 text-sm">
            We typically respond to billing inquiries within 24 hours during
            business days.
          </p>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> This Pricing Policy is subject to change.
              We recommend reviewing it periodically for updates. Continued use
              of our services after changes constitutes acceptance of the
              updated policy.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
