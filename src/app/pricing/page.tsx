// app/pricing/page.tsx - Updated with free plan redirection and 4-column responsive design
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Metatags from "../../SEO/metatags";

interface Feature {
  name: string;
  included: boolean;
  description?: string;
}

interface PricingPlan {
  _id: string;
  id?: string;
  name: string;
  description: string;
  monthlyUSD?: number;
  annualUSD?: number;
  monthlyINR?: number;
  annualINR?: number;
  features: Feature[];
  highlight?: boolean;
  custom?: boolean;
  maxAuditsPerMonth?: number;
  maxKeywordReportsPerMonth?: number;
  maxBusinessNamesPerMonth?: number;
  maxKeywordChecksPerMonth?: number;
  maxKeywordScrapesPerMonth?: number;
  isActive?: boolean;
  sortOrder?: number;
  includesTax?: boolean;
  isFree?: boolean;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ComparisonFeature {
  feature: string;
  [key: string]: string | boolean | undefined;
}

interface UserSubscription {
  planId: string;
  status: string;
  planName: string;
  billingCycle: string;
  subscriptionStatus: string;
  autoRenewal?: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  mobile?: string;
  planName: string;
  billingCycle: string;
  subscriptionStatus: string;
  planExpiry: string;
  maxAuditsPerMonth: number;
  auditsUsed: number;
  memberSince: string;
  autoRenewal: boolean;
  renewalStatus: string;
  nextRenewalDate: string;
}

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "annual"
  );
  const [currency, setCurrency] = useState<"USD" | "INR">("INR");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<UserSubscription | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const exchangeRate = process.env.NEXT_PUBLIC_EXCHANGE_RATE ? Number(process.env.NEXT_PUBLIC_EXCHANGE_RATE) : 83.4;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/pricing/plans`);

      if (response.ok) {
        const data = await response.json();
        const transformedPlans = data.plans.map((plan: PricingPlan) => ({
          ...plan,
          id: plan._id || plan.id,
          features: plan.features || [],
        }));
        setPlans(transformedPlans);
      } else {
        console.error("Failed to fetch plans:", response.status);
        setPlans([]);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      // Fetch user profile data (same as billing page)
      const userResponse = await fetch(
        `${API_BASE}/api/payments/user/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserProfile(userData);

        // Set current plan from user profile
        if (userData) {
          setCurrentPlan({
            planId: userData.planId || "free",
            planName: userData.planName || "Free Tier",
            status: userData.subscriptionStatus || "inactive",
            billingCycle: userData.billingCycle || "monthly",
            subscriptionStatus: userData.subscriptionStatus || "inactive",
            autoRenewal: userData.autoRenewal || false,
          });
        }
      } else {
        // Fallback to subscription endpoint if profile fails
        const subscriptionResponse = await fetch(
          `${API_BASE}/api/user/subscription`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (subscriptionResponse.ok) {
          const data = await subscriptionResponse.json();
          if (data.subscription) {
            setCurrentPlan(data.subscription);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const formatPrice = (
    usdPrice: number | undefined,
    inrPrice: number | undefined,
    isCustom: boolean = false
  ): string => {
    if (isCustom) return "Custom";

    if (currency === "INR") {
      // Use explicit INR price if available, otherwise fallback to conversion
      if (inrPrice !== undefined && inrPrice !== null && inrPrice !== 0) {
        return `₹${inrPrice.toLocaleString("en-IN")}${
          billingCycle === "annual" ? "/year" : "/month"
        }`;
      }
      
      // Fallback to exchange rate calculation only if usdPrice is available
      if (usdPrice !== undefined) {
         const calculatedInr = Math.round(usdPrice * exchangeRate);
         return `₹${calculatedInr.toLocaleString("en-IN")}${
          billingCycle === "annual" ? "/year" : "/month"
        }`;
      }
      
      return "Custom";
    }
    
    // USD Case
    return usdPrice !== undefined 
      ? `$${usdPrice}${billingCycle === "annual" ? "/year" : "/month"}`
      : "Custom";
  };

  const formatPriceDescription = (usdPrice: number | undefined): string => {
    if (usdPrice === undefined) return "Tailored to your needs";

    if (currency === "INR") {
      if (billingCycle === "annual") {
        return `Billed annually`;
      }
      return `Billed monthly`;
    }

    if (billingCycle === "annual") {
      return `Billed annually`;
    }
    return `Billed monthly`;
  };

  const handleSubscribe = async (planId: string) => {
    setError(null);
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.push("/login?redirect=/pricing");
      return;
    }

    // Check if plan is free
    const targetPlan = plans.find((plan) => plan._id === planId);
    if (targetPlan?.isFree) {
      // Redirect free plan to dashboard
      router.push("/profile/dashboard");
      return;
    }
    if (targetPlan?.custom) {
      // Redirect custom plan to dashboard
      router.push("/profile/support");
      return;
    }

    // Check if user is already on this plan
    if (
      currentPlan &&
      currentPlan.planId === planId &&
      currentPlan.status === "active"
    ) {
      setError("You are already subscribed to this plan");
      return;
    }

    // Check if user is trying to downgrade to free plan
    if (targetPlan?.isFree && currentPlan?.status === "active") {
      setError("Please contact support to downgrade to free plan");
      return;
    }

    try {
      setLoadingPlan(planId);

      const body = {
        planId,
        billingCycle,
        currency,
      };

      const res = await fetch(`${API_BASE}/api/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to start payment");
      }

      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        throw new Error("Payment link not received from server");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleFaqKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    index: number
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFaq(index);
    }
  };

  // Dynamic feature comparison based on actual plans
  const getFeatureComparison = (): ComparisonFeature[] => {
    if (plans.length === 0) return [];

    const comparisonData: ComparisonFeature[] = [];

    // Add pricing information
    const pricingRow: ComparisonFeature = { feature: "Pricing" };
    plans.forEach((plan) => {
      pricingRow[plan.name.toLowerCase()] = formatPrice(
        billingCycle === "annual" ? plan.annualUSD : plan.monthlyUSD,
        billingCycle === "annual" ? plan.annualINR : plan.monthlyINR,
        plan.custom
      );
    });
    comparisonData.push(pricingRow);

    // Add tax information
    const taxRow: ComparisonFeature = { feature: "Includes Tax" };
    plans.forEach((plan) => {
      taxRow[plan.name.toLowerCase()] = plan.includesTax || false;
    });
    comparisonData.push(taxRow);

    // Add service limits
    const services = [
      { key: "maxAuditsPerMonth", label: "SEO Audits per Month" },
      { key: "maxKeywordReportsPerMonth", label: "Keyword Reports per Month" },
      {
        key: "maxBusinessNamesPerMonth",
        label: "Business Name Checks per Month",
      },
      { key: "maxKeywordChecksPerMonth", label: "Keyword Checks per Month" },
      { key: "maxKeywordScrapesPerMonth", label: "Keyword Scrapes per Month" },
    ];

    services.forEach((service) => {
      const row: ComparisonFeature = { feature: service.label };
      plans.forEach((plan) => {
        const value = plan[service.key as keyof PricingPlan];
        row[plan.name.toLowerCase()] = value
          ? value === 0
            ? "Unlimited"
            : value.toString()
          : "Not included";
      });
      comparisonData.push(row);
    });

    // Add included features
    const allFeatures = new Set<string>();
    plans.forEach((plan) => {
      plan.features.forEach((feature) => {
        if (feature.included && feature.name.trim()) {
          allFeatures.add(feature.name);
        }
      });
    });

    Array.from(allFeatures).forEach((feature) => {
      const row: ComparisonFeature = { feature };
      plans.forEach((plan) => {
        const hasFeature = plan.features.some(
          (f) => f.name === feature && f.included
        );
        row[plan.name.toLowerCase()] = hasFeature;
      });
      comparisonData.push(row);
    });

    return comparisonData;
  };

  const faqs: FAQItem[] = [
    {
      question: "How does the AI SEO audit work?",
      answer:
        "Our AI analyzes your website using advanced algorithms to identify SEO issues, opportunities, and provides actionable recommendations to improve your search engine rankings.",
    },
    {
      question: "Can I change plans anytime?",
      answer:
        "Yes, you can upgrade your plan at any time. When upgrading, the new rate will apply immediately. For downgrades, please contact our support team.",
    },
    {
      question: "Do you offer discounts for annual billing?",
      answer:
        "Yes, we offer significant discounts when you choose annual billing instead of monthly payments. The annual prices shown already include the discount.",
    },
    {
      question: "What payment methods do you accept?",
      answer: `We accept all major credit cards, PayPal, ${
        currency === "INR"
          ? "UPI, Net Banking, and bank transfers"
          : "and bank transfers"
      } for enterprise plans.`,
    },
    {
      question: "Is there a free trial available?",
      answer:
        "Yes, we offer a free tier with limited features. No credit card required to get started.",
    },
    {
      question: `Do you support ${
        currency === "INR" ? "Indian Rupee (INR)" : "multiple currency"
      } payments?`,
      answer: `Yes! We support ${
        currency === "INR"
          ? "payments in Indian Rupees (INR) including UPI, Net Banking, and credit/debit cards"
          : "multiple currencies including USD and INR. You can switch between currencies using the toggle above."
      }`,
    },
    {
      question: "Are taxes included in the price?",
      answer:
        "For plans marked with 'Includes Tax', all applicable taxes are included in the displayed price. For other plans, taxes will be calculated during checkout based on your location.",
    },
  ];

  const metaPropsData = {
    title: "Rank SEO Pricing & packages | Affordable  & premium plans for SEO",
    description:
      "Explore our SEO plans with transparent SEO audit pricing. Our SEO pricing packages are designed to offer SEO for businesses of all sizes.",
    keyword:
      "seo pricing packages, seo costing, seo audit pricing, seo plans and pricing, low cost seo plans",
    url: "https://rankseo.in/pricing",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  const featureComparison = getFeatureComparison();

  // Determine if user has active subscription
  const hasActiveSubscription =
    currentPlan?.status === "active" && currentPlan.planName !== "Free Tier";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading pricing plans...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <header
          className="py-16 text-center"
          style={{
            background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)",
          }}
        >
          <div className="container mx-auto px-4 max-w-7xl">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 mt-10">
              AI-Powered SEO Audit Pricing
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Choose the plan that works best for your business needs
            </p>



            {error && (
              <div
                className="mx-auto max-w-md bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
                style={{ maxWidth: "500px" }}
              >
                <p>{error}</p>
              </div>
            )}

            {/* Currency Toggle */}
            {/* <div className="flex items-center justify-center gap-4 mb-4">
              <span
                className={`font-semibold ${
                  currency === "USD" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                USD
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currency === "INR"}
                  onChange={() =>
                    setCurrency(currency === "INR" ? "USD" : "INR")
                  }
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-blue-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
              </label>
              <span
                className={`font-semibold ${
                  currency === "INR" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                INR
              </span>
            </div> */}

            {/* Exchange Rate Notice */}
            {/* <div className="mb-4">
              <p className="text-sm text-gray-600">
                {currency === "INR"
                  ? `Exchange rate: 1 USD ≈ ₹${exchangeRate}. Prices in INR include all applicable taxes.`
                  : "All prices in USD. Switch to INR for local currency pricing."}
              </p>
            </div> */}

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <span
                className={`font-semibold ${
                  billingCycle === "monthly" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                Monthly
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={billingCycle === "annual"}
                  onChange={() =>
                    setBillingCycle(
                      billingCycle === "annual" ? "monthly" : "annual"
                    )
                  }
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-blue-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
              </label>
              <span
                className={`font-semibold ${
                  billingCycle === "annual" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                Annual{" "}
                <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs ml-1">
                  Best Value
                </span>
              </span>
            </div>
          </div>
        </header>

        {/* Pricing Plans */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {plans.length > 0 ? (
                plans.map((plan) => (
                  <div
                    key={plan._id}
                    className={`relative bg-white rounded-xl border-2 p-6 flex flex-col transition-all duration-300 hover:shadow-xl h-full ${
                      plan.highlight
                        ? "border-blue-500 shadow-lg"
                        : "border-gray-200 shadow-md"
                    } ${
                      currentPlan && currentPlan.planId === plan._id
                        ? "ring-4 ring-green-500 ring-opacity-50"
                        : ""
                    }`}
                  >
                    {/* Plan Badges */}
                    <div className="absolute -top-3 left-0 right-0 flex justify-center gap-2">
                      {plan.highlight && (
                        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Most Popular
                        </div>
                      )}

                    </div>

                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {plan.name}
                      </h3>
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        {formatPrice(
                          billingCycle === "annual" ? plan.annualUSD : plan.monthlyUSD,
                          billingCycle === "annual" ? plan.annualINR : plan.monthlyINR,
                          plan.custom
                        )}
                      </div>
                      <p className="text-gray-600 text-xs mb-2">
                        {formatPriceDescription(
                          currency === "INR" 
                            ? (billingCycle === "annual" ? plan.annualINR : plan.monthlyINR)
                            : (billingCycle === "annual" ? plan.annualUSD : plan.monthlyUSD)
                        )}
                      </p>
                      {plan.includesTax && (
                        <div className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium mb-2">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Includes Tax
                        </div>
                      )}
                      <p className="text-gray-700 text-sm">
                        {plan.description}
                      </p>
                    </div>

                    <ul className="space-y-2 mb-6 flex-grow">
                      {plan.features
                        .filter((feature) => feature.included)
                        .map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <svg
                              className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-gray-700 text-sm">
                              {feature.name}
                            </span>
                          </li>
                        ))}
                    </ul>

                    <button
                      className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors duration-200 mt-auto ${
                        currentPlan &&
                        ((currentPlan.planId === plan._id &&
                          currentPlan.status === "active") ||
                          (plan.isFree &&
                            (!currentPlan.planId ||
                              currentPlan.planId === "free")))
                          ? "bg-gray-400 cursor-not-allowed"
                          : plan.highlight
                          ? "bg-blue-500 hover:bg-blue-600"
                          : "bg-gray-600 hover:bg-gray-700"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={() => handleSubscribe(plan._id)}
                      disabled={
                        loadingPlan === plan._id ||
                        (currentPlan &&
                          ((currentPlan.planId === plan._id &&
                            currentPlan.status === "active") ||
                            (plan.isFree &&
                              (!currentPlan.planId ||
                                currentPlan.planId === "free"))))
                      }
                    >
                      {loadingPlan === plan._id
                        ? "Redirecting..."
                        : currentPlan &&
                          ((currentPlan.planId === plan._id &&
                            currentPlan.status === "active") ||
                            (plan.isFree &&
                              (!currentPlan.planId ||
                                currentPlan.planId === "free")))
                        ? "Current Plan"
                        : plan.custom
                        ? "Contact Sales"
                        : plan.isFree
                        ? "Get Started Free"
                        : "Get Started"}
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-4 text-center py-12">
                  <p className="text-xl text-gray-600">
                    No pricing plans available at the moment. Please check back
                    later.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Dynamic Feature Comparison Table */}
        {plans.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4 max-w-7xl">
              <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">
                Compare Plans
              </h2>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <div
                    className="grid min-w-[800px]"
                    style={{
                      gridTemplateColumns: `2fr repeat(${plans.length}, 1fr)`,
                    }}
                  >
                    <div className="p-4 bg-blue-500 text-white font-semibold">
                      Features
                    </div>
                    {plans.map((plan) => (
                      <div
                        key={plan._id}
                        className="p-4 bg-blue-500 text-white font-semibold text-center"
                      >
                        {plan.name}
                        {currentPlan &&
                          (currentPlan.planId === plan._id ||
                            (plan.isFree && currentPlan.planId === "free")) && (
                            <div className="text-xs bg-green-500 text-white px-2 py-1 rounded-full mt-1 inline-block">
                              Your Plan
                            </div>
                          )}
                      </div>
                    ))}

                    {featureComparison.map((item, index) => (
                      <React.Fragment key={index}>
                        <div
                          className={`p-4 font-medium ${
                            index % 2 === 0 ? "bg-gray-50" : "bg-white"
                          } border-b border-gray-200`}
                        >
                          {item.feature}
                        </div>
                        {plans.map((plan) => (
                          <div
                            key={`${plan._id}-${index}`}
                            className={`p-4 text-center ${
                              index % 2 === 0 ? "bg-gray-50" : "bg-white"
                            } border-b border-gray-200`}
                          >
                            {typeof item[plan.name.toLowerCase()] ===
                            "boolean" ? (
                              item[plan.name.toLowerCase()] ? (
                                <svg
                                  className="w-5 h-5 text-green-500 mx-auto"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-5 h-5 text-red-500 mx-auto"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )
                            ) : (
                              <span className="text-sm">
                                {item[plan.name.toLowerCase()]}
                              </span>
                            )}
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section
          className="py-20"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)",
          }}
        >
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300 ${
                    expandedFaq === index ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => toggleFaq(index)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expandedFaq === index}
                  aria-controls={`faq-answer-${index}`}
                  onKeyDown={(e) => handleFaqKeyDown(e, index)}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: "4px",
                      borderTopLeftRadius: "12px",
                      borderBottomLeftRadius: "12px",
                      background: "linear-gradient(180deg, #63b3ed, #4299e1)",
                      opacity: expandedFaq === index ? 1 : 0.6,
                    }}
                  ></div>
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-gray-900 text-lg pr-4">
                      {faq.question}
                    </div>
                    <div className="text-gray-500 transition-transform duration-200 flex-shrink-0">
                      {expandedFaq === index ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6 15L12 9L18 15"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6 9L12 15L18 9"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  {expandedFaq === index && (
                    <div
                      id={`faq-answer-${index}`}
                      className="mt-4 pt-4 border-t border-gray-200 text-gray-700"
                      style={{
                        animation: "slideDown 0.3s ease",
                      }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Add CSS animation for FAQ */}
        <style jsx>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
              max-height: 0;
            }
            to {
              opacity: 1;
              transform: translateY(0);
              max-height: 200px;
            }
          }
        `}</style>
      </div>
    </>
  );
}
