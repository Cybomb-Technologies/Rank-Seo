// app/pricing/page.tsx
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
  features: Feature[];
  highlight?: boolean;
  custom?: boolean;
  maxAuditsPerMonth?: number;
  maxTrackedKeywords?: number;
  isActive?: boolean;
  sortOrder?: number;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ComparisonFeature {
  feature: string;
  [key: string]: string | boolean | undefined;
}

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const exchangeRate = 83.5;

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE}/api/pricing/plans`);
      
      if (response.ok) {
        const data = await response.json();
        const transformedPlans = data.plans.map((plan: PricingPlan) => ({
          ...plan,
          id: plan._id || plan.id,
          features: plan.features
            ?.filter((feature: Feature) => feature.included)
            ?.map((feature: Feature) => feature.name) || []
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

  const formatPrice = (usdPrice: number | undefined, isCustom: boolean = false): string => {
    if (isCustom || usdPrice === undefined) return "Custom";

    const price = billingCycle === "annual" ? usdPrice : usdPrice;

    if (currency === "INR") {
      const inrPrice = Math.round(price * exchangeRate);
      return `₹${inrPrice.toLocaleString("en-IN")}${billingCycle === "annual" ? "/year" : "/month"}`;
    }
    return `$${price}${billingCycle === "annual" ? "/year" : "/month"}`;
  };

  const formatPriceDescription = (usdPrice: number | undefined): string => {
    if (usdPrice === undefined) return "Tailored to your needs";

    if (currency === "INR") {
      const monthlyPrice = Math.round(usdPrice * exchangeRate);
      const annualPrice = Math.round(usdPrice * 12 * exchangeRate);

      if (billingCycle === "annual") {
        return `Billed annually (₹${annualPrice.toLocaleString("en-IN")})`;
      }
      return `Billed monthly`;
    }

    if (billingCycle === "annual") {
      const annualPrice = usdPrice * 12;
      return `Billed annually ($${annualPrice})`;
    }
    return `Billed monthly`;
  };

  const handleSubscribe = async (planId: string) => {
    setError(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.push("/login?redirect=/pricing");
      return;
    }

    try {
      setLoadingPlan(planId);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const body = {
        planId,
        billingCycle,
        currency,
      };

      const res = await fetch(
        `${API_BASE}/api/payments/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

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

    // Get all unique features across all plans
    const allFeatures = new Set<string>();
    plans.forEach(plan => {
      plan.features.forEach(feature => {
        if (typeof feature === 'string') {
          allFeatures.add(feature);
        }
      });
    });

    // Convert to array and create comparison data
    const comparisonData: ComparisonFeature[] = Array.from(allFeatures).map(feature => {
      const comparisonRow: ComparisonFeature = { feature };
      
      plans.forEach(plan => {
        const hasFeature = plan.features.includes(feature);
        comparisonRow[plan.name.toLowerCase()] = hasFeature;
      });
      
      return comparisonRow;
    });

    // Add pricing information
    const pricingRow: ComparisonFeature = { feature: 'Pricing' };
    plans.forEach(plan => {
      pricingRow[plan.name.toLowerCase()] = formatPrice(
        billingCycle === "annual" ? plan.annualUSD : plan.monthlyUSD,
        plan.custom
      );
    });
    comparisonData.unshift(pricingRow);

    // Add audits per month
    const auditsRow: ComparisonFeature = { feature: 'SEO Audits per Month' };
    plans.forEach(plan => {
      auditsRow[plan.name.toLowerCase()] = plan.maxAuditsPerMonth 
        ? plan.maxAuditsPerMonth === 0 ? 'Unlimited' : plan.maxAuditsPerMonth.toString()
        : 'Not specified';
    });
    comparisonData.splice(1, 0, auditsRow);

    // Add keyword tracking
    const keywordsRow: ComparisonFeature = { feature: 'Keyword Tracking' };
    plans.forEach(plan => {
      keywordsRow[plan.name.toLowerCase()] = plan.maxTrackedKeywords 
        ? plan.maxTrackedKeywords === 0 ? 'Unlimited' : `${plan.maxTrackedKeywords} keywords`
        : 'Not specified';
    });
    comparisonData.splice(2, 0, keywordsRow);

    return comparisonData;
  };

  const faqs: FAQItem[] = [
    {
      question: "How does the AI SEO audit work?",
      answer: "Our AI analyzes your website using advanced algorithms to identify SEO issues, opportunities, and provides actionable recommendations to improve your search engine rankings.",
    },
    {
      question: "Can I change plans anytime?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, the new rate will apply immediately. When downgrading, the change will take effect at the end of your billing cycle.",
    },
    {
      question: "Do you offer discounts for annual billing?",
      answer: "Yes, we offer a 20% discount when you choose annual billing instead of monthly payments.",
    },
    {
      question: "What payment methods do you accept?",
      answer: `We accept all major credit cards, PayPal, ${currency === "INR" ? "UPI, Net Banking, and bank transfers" : "and bank transfers"} for enterprise plans.`,
    },
    {
      question: "Is there a free trial available?",
      answer: "Yes, we offer a 14-day free trial for the Professional plan. No credit card required to start your trial.",
    },
    {
      question: `Do you support ${currency === "INR" ? "Indian Rupee (INR)" : "multiple currency"} payments?`,
      answer: `Yes! We support ${currency === "INR" ? "payments in Indian Rupees (INR) including UPI, Net Banking, and credit/debit cards" : "multiple currencies including USD and INR. You can switch between currencies using the toggle above."}`,
    },
  ];

  const metaPropsData = {
    title: "SEO Audit Pricing Plans | Affordable SEO Tools for Businesses",
    description: "Choose from our flexible pricing plans for AI-powered SEO audits. Starter, Professional & Enterprise plans with monthly or annual billing options.",
    keyword: "SEO audit pricing, affordable SEO tools, SEO plans, business SEO pricing, SEO audit cost",
    url: "https://rankseo.in/pricing",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  const featureComparison = getFeatureComparison();

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
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)'
          }}
        >
          <div className="container mx-auto px-4 max-w-6xl">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 mt-10">
              AI-Powered SEO Audit Pricing
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Choose the plan that works best for your business needs
            </p>

            {error && (
              <div 
                className="mx-auto max-w-md bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
                style={{ maxWidth: '500px' }}
              >
                <p>{error}</p>
              </div>
            )}

            {/* Currency Toggle */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className={`font-semibold ${currency === "USD" ? "text-gray-900" : "text-gray-500"}`}>
                USD
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currency === "INR"}
                  onChange={() => setCurrency(currency === "INR" ? "USD" : "INR")}
                  className="sr-only peer"
                />
                <div 
                  className="w-14 h-7 bg-blue-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"
                ></div>
              </label>
              <span className={`font-semibold ${currency === "INR" ? "text-gray-900" : "text-gray-500"}`}>
                INR
              </span>
            </div>

            {/* Exchange Rate Notice */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {currency === "INR" 
                  ? `Exchange rate: 1 USD ≈ ₹${exchangeRate}. Prices in INR include all applicable taxes.`
                  : "All prices in USD. Switch to INR for local currency pricing."
                }
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <span className={`font-semibold ${billingCycle === "monthly" ? "text-gray-900" : "text-gray-500"}`}>
                Monthly
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={billingCycle === "annual"}
                  onChange={() => setBillingCycle(billingCycle === "annual" ? "monthly" : "annual")}
                  className="sr-only peer"
                />
                <div 
                  className="w-14 h-7 bg-blue-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"
                ></div>
              </label>
              <span className={`font-semibold ${billingCycle === "annual" ? "text-gray-900" : "text-gray-500"}`}>
                Annual <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs ml-1">Save 20%</span>
              </span>
            </div>
          </div>
        </header>

        {/* Pricing Plans */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.length > 0 ? (
                plans.map((plan) => (
                  <div
                    key={plan._id}
                    className={`relative bg-white rounded-xl border-2 p-8 flex flex-col transition-all duration-300 hover:shadow-xl ${
                      plan.highlight 
                        ? "border-blue-500 scale-105 shadow-lg" 
                        : "border-gray-200 shadow-md"
                    }`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 right-6 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {formatPrice(
                          billingCycle === "annual" ? plan.annualUSD : plan.monthlyUSD,
                          plan.custom
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        {formatPriceDescription(
                          billingCycle === "annual" ? plan.annualUSD : plan.monthlyUSD
                        )}
                      </p>
                      <p className="text-gray-700">{plan.description}</p>
                    </div>

                    <ul className="space-y-3 mb-8 flex-grow">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-colors duration-200 ${
                        plan.highlight 
                          ? "bg-blue-500 hover:bg-blue-600" 
                          : "bg-gray-600 hover:bg-gray-700"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={() => handleSubscribe(plan._id)}
                      disabled={loadingPlan === plan._id}
                    >
                      {loadingPlan === plan._id 
                        ? "Redirecting..." 
                        : plan.custom 
                          ? "Contact Sales" 
                          : "Get Started"
                      }
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <p className="text-xl text-gray-600">
                    No pricing plans available at the moment. Please check back later.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Dynamic Feature Comparison Table */}
        {plans.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">
                Compare Plans
              </h2>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="grid" style={{ gridTemplateColumns: `2fr repeat(${plans.length}, 1fr)` }}>
                  <div className="p-4 bg-blue-500 text-white font-semibold">Features</div>
                  {plans.map((plan) => (
                    <div key={plan._id} className="p-4 bg-blue-500 text-white font-semibold text-center">
                      {plan.name}
                    </div>
                  ))}

                  {featureComparison.map((item, index) => (
                    <React.Fragment key={index}>
                      <div className={`p-4 font-medium ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200`}>
                        {item.feature}
                      </div>
                      {plans.map((plan) => (
                        <div 
                          key={`${plan._id}-${index}`} 
                          className={`p-4 text-center ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200`}
                        >
                          {typeof item[plan.name.toLowerCase()] === "boolean" ? (
                            item[plan.name.toLowerCase()] ? (
                              <svg className="w-6 h-6 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            )
                          ) : (
                            item[plan.name.toLowerCase()]
                          )}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section 
          className="py-20"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)'
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
                    expandedFaq === index ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => toggleFaq(index)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expandedFaq === index}
                  aria-controls={`faq-answer-${index}`}
                  onKeyDown={(e) => handleFaqKeyDown(e, index)}
                  style={{
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div 
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      borderTopLeftRadius: '12px',
                      borderBottomLeftRadius: '12px',
                      background: 'linear-gradient(180deg, #63b3ed, #4299e1)',
                      opacity: expandedFaq === index ? 1 : 0.6
                    }}
                  ></div>
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-gray-900 text-lg pr-4">
                      {faq.question}
                    </div>
                    <div className="text-gray-500 transition-transform duration-200 flex-shrink-0">
                      {expandedFaq === index ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 15L12 9L18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {expandedFaq === index && (
                    <div 
                      id={`faq-answer-${index}`}
                      className="mt-4 pt-4 border-t border-gray-200 text-gray-700"
                      style={{
                        animation: 'slideDown 0.3s ease'
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

        {/* Final CTA Section */}
        <section 
          className="py-16 text-center text-white"
          style={{
            background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)'
          }}
        >
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-4">Ready to Improve Your SEO?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of businesses using our AI-powered SEO audit tool
            </p>
            <button
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors duration-200"
              onClick={() => {
                const professionalPlan = plans.find(plan => 
                  plan.name.toLowerCase().includes('professional') || 
                  plan.highlight
                );
                if (professionalPlan) {
                  handleSubscribe(professionalPlan._id);
                } else if (plans.length > 0) {
                  handleSubscribe(plans[0]._id);
                }
              }}
            >
              Get Started Now
            </button>
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