"use client";

import React, { useState } from "react";
import Metatags from "../../SEO/metatags";

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  ctaText: string;
  popular?: boolean;
  priceDescription?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "annual"
  );
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Exchange rate (you might want to fetch this from an API)
  const exchangeRate = 83.5;

  const formatPrice = (usdPrice: number, isCustom: boolean = false): string => {
    if (isCustom) return "Custom";

    if (currency === "INR") {
      const inrPrice = Math.round(usdPrice * exchangeRate);
      return `₹${inrPrice.toLocaleString("en-IN")}/month`;
    }
    return `$${usdPrice}/month`;
  };

  const formatPriceDescription = (
    usdPrice: number,
    billing: "monthly" | "annual"
  ): string => {
    if (currency === "INR") {
      const monthlyPrice = Math.round(usdPrice * exchangeRate);
      const annualPrice = Math.round(usdPrice * 12 * exchangeRate);

      if (billing === "annual") {
        return `Billed annually (₹${annualPrice.toLocaleString("en-IN")})`;
      }
      return `Billed monthly`;
    }

    if (billing === "annual") {
      const annualPrice = usdPrice * 12;
      return `Billed annually ($${annualPrice})`;
    }
    return `Billed monthly`;
  };

  const handlePlanSelection = (planId: string) => {
    const params = new URLSearchParams({
      plan: planId,
      billing: billingCycle,
      currency: currency,
    });
    window.location.href = `/checkout?${params.toString()}`;
  };

  const pricingPlans: PricingPlan[] = [
    {
      id: "starter",
      name: "Starter",
      price: billingCycle === "annual" ? formatPrice(15) : formatPrice(19),
      description: "Perfect for small businesses and bloggers",
      features: [
        "5 SEO audits per month",
        "Basic technical SEO analysis",
        "Keyword suggestions (up to 50)",
        "Email support",
        "PDF report export",
      ],
      ctaText: "Get Started",
      priceDescription:
        billingCycle === "annual"
          ? formatPriceDescription(15, "annual")
          : formatPriceDescription(19, "monthly"),
    },
    {
      id: "professional",
      name: "Professional",
      price: billingCycle === "annual" ? formatPrice(39) : formatPrice(49),
      description: "Ideal for marketing agencies and growing businesses",
      features: [
        "20 SEO audits per month",
        "Comprehensive technical SEO analysis",
        "Competitor analysis (up to 3 competitors)",
        "Keyword tracking (up to 200 keywords)",
        "Content optimization suggestions",
        "Priority email & chat support",
        "White-label reports",
      ],
      ctaText: "Start Free Trial",
      popular: true,
      priceDescription:
        billingCycle === "annual"
          ? formatPriceDescription(39, "annual")
          : formatPriceDescription(49, "monthly"),
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations with advanced needs",
      features: [
        "Unlimited SEO audits",
        "Advanced competitor analysis",
        "Custom keyword tracking",
        "API access",
        "Dedicated account manager",
        "24/7 priority support",
        "Custom integration options",
        "Team collaboration tools",
      ],
      ctaText: "Contact Sales",
      priceDescription: "Tailored to your needs",
    },
  ];

  const featureComparison = [
    {
      feature: "SEO Audits",
      starter: "5 per month",
      professional: "20 per month",
      enterprise: "Unlimited",
    },
    {
      feature: "Keyword Tracking",
      starter: "50 keywords",
      professional: "200 keywords",
      enterprise: "Custom",
    },
    {
      feature: "Competitor Analysis",
      starter: false,
      professional: "Up to 3 competitors",
      enterprise: "Advanced analysis",
    },
    {
      feature: "Technical SEO Analysis",
      starter: "Basic",
      professional: "Comprehensive",
      enterprise: "Advanced",
    },
    {
      feature: "White-label Reports",
      starter: false,
      professional: true,
      enterprise: true,
    },
    {
      feature: "API Access",
      starter: false,
      professional: false,
      enterprise: true,
    },
    {
      feature: "Dedicated Support",
      starter: false,
      professional: "Priority",
      enterprise: "24/7 Priority",
    },
  ];

  const faqs: FAQItem[] = [
    {
      question: "How does the AI SEO audit work?",
      answer:
        "Our AI analyzes your website using advanced algorithms to identify SEO issues, opportunities, and provides actionable recommendations to improve your search engine rankings.",
    },
    {
      question: "Can I change plans anytime?",
      answer:
        "Yes, you can upgrade or downgrade your plan at any time. When upgrading, the new rate will apply immediately. When downgrading, the change will take effect at the end of your billing cycle.",
    },
    {
      question: "Do you offer discounts for annual billing?",
      answer:
        "Yes, we offer a 20% discount when you choose annual billing instead of monthly payments.",
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
        "Yes, we offer a 14-day free trial for the Professional plan. No credit card required to start your trial.",
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
  ];

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

  const metaPropsData = {
    title: "SEO Audit Pricing Plans | Affordable SEO Tools for Businesses",
    description:
      "Choose from our flexible pricing plans for AI-powered SEO audits. Starter, Professional & Enterprise plans with monthly or annual billing options.",
    keyword:
      "SEO audit pricing, affordable SEO tools, SEO plans, business SEO pricing, SEO audit cost",
    url: "https://rankseo.in/pricing",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="pricing-page">
        {/* Header Section */}
        <header className="pricing-header">
          <div className="container">
            <h1>AI-Powered SEO Audit Pricing</h1>
            <p>Choose the plan that works best for your business needs</p>

            {/* Currency Toggle */}
            <div className="currency-toggle">
              <span className={currency === "USD" ? "active" : ""}>USD</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={currency === "INR"}
                  onChange={() =>
                    setCurrency(currency === "INR" ? "USD" : "INR")
                  }
                />
                <span className="slider"></span>
              </label>
              <span className={currency === "INR" ? "active" : ""}>INR</span>
            </div>

            {/* Exchange Rate Notice */}
            <div className="exchange-rate-notice">
              {currency === "INR" ? (
                <p>
                  Exchange rate: 1 USD ≈ ₹{exchangeRate}. Prices in INR include
                  all applicable taxes.
                </p>
              ) : (
                <p>
                  All prices in USD. Switch to INR for local currency pricing.
                </p>
              )}
            </div>

            {/* Billing Toggle */}
            <div className="billing-toggle">
              <span className={billingCycle === "monthly" ? "active" : ""}>
                Monthly
              </span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={billingCycle === "annual"}
                  onChange={() =>
                    setBillingCycle(
                      billingCycle === "annual" ? "monthly" : "annual"
                    )
                  }
                />
                <span className="slider"></span>
              </label>
              <span className={billingCycle === "annual" ? "active" : ""}>
                Annual <span className="discount-badge">Save 20%</span>
              </span>
            </div>
          </div>
        </header>

        {/* Pricing Plans */}
        <section className="pricing-plans">
          <div className="container">
            <div className="plans-grid">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`pricing-card ${plan.popular ? "popular" : ""}`}
                >
                  {plan.popular && (
                    <div className="popular-badge">Most Popular</div>
                  )}

                  <div className="plan-header">
                    <h3>{plan.name}</h3>
                    <div className="price">{plan.price}</div>
                    <p className="price-description">{plan.priceDescription}</p>
                    <p className="plan-description">{plan.description}</p>
                  </div>

                  <ul className="features-list">
                    {plan.features.map((feature, index) => (
                      <li key={index}>
                        <i className="fas fa-check"></i>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`cta-button ${
                      plan.popular ? "primary" : "secondary"
                    }`}
                    onClick={() => handlePlanSelection(plan.id)}
                  >
                    {plan.ctaText}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="feature-comparison">
          <div className="container">
            <h2>Compare Plans</h2>
            <div className="comparison-table">
              <div className="table-header">
                <div className="feature-column">Features</div>
                <div className="plan-column">Starter</div>
                <div className="plan-column">Professional</div>
                <div className="plan-column">Enterprise</div>
              </div>

              {featureComparison.map((item, index) => (
                <div key={index} className="table-row">
                  <div className="feature-column">{item.feature}</div>
                  <div className="plan-column">
                    {typeof item.starter === "boolean" ? (
                      item.starter ? (
                        <i className="fas fa-check"></i>
                      ) : (
                        <i className="fas fa-times"></i>
                      )
                    ) : (
                      item.starter
                    )}
                  </div>
                  <div className="plan-column">
                    {typeof item.professional === "boolean" ? (
                      item.professional ? (
                        <i className="fas fa-check"></i>
                      ) : (
                        <i className="fas fa-times"></i>
                      )
                    ) : (
                      item.professional
                    )}
                  </div>
                  <div className="plan-column">
                    {typeof item.enterprise === "boolean" ? (
                      item.enterprise ? (
                        <i className="fas fa-check"></i>
                      ) : (
                        <i className="fas fa-times"></i>
                      )
                    ) : (
                      item.enterprise
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <div className="container">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`faq-item ${
                    expandedFaq === index ? "expanded" : ""
                  }`}
                  onClick={() => toggleFaq(index)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expandedFaq === index}
                  aria-controls={`faq-answer-${index}`}
                  onKeyDown={(e) => handleFaqKeyDown(e, index)}
                >
                  <div className="faq-question">
                    {faq.question}
                    <span className="chevron-icon" aria-hidden="true">
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
                    </span>
                  </div>
                  {expandedFaq === index && (
                    <div id={`faq-answer-${index}`} className="faq-answer">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="final-cta">
          <div className="container">
            <h2>Ready to Improve Your SEO?</h2>
            <p>
              Join thousands of businesses using our AI-powered SEO audit tool
            </p>
            <button
              className="cta-button primary large"
              onClick={() => handlePlanSelection("professional")}
            >
              Get Started Now
            </button>
          </div>
        </section>

        <style jsx>
          {`
            .pricing-page {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                Oxygen, Ubuntu, sans-serif;
              color: #333;
              line-height: 1.6;
            }

            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 20px;
            }

            /* Header Styles */
            .pricing-header {
              text-align: center;
              padding: 60px 0 60px;
              font-weight: 600;
              background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
            }

            .pricing-header h1 {
              font-size: 2.5rem;
              margin-bottom: 15px;
              margin-top: 40px;
              color: #1a202c;
            }

            .pricing-header p {
              font-size: 1.2rem;
              color: #4a5568;
              margin-bottom: 30px;
            }

            /* Currency Toggle */
            .currency-toggle {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
              margin-bottom: 20px;
            }

            .currency-toggle span {
              font-weight: 600;
              color: #666;
            }

            .currency-toggle span.active {
              color: #2d3748;
            }

            .exchange-rate-notice {
              margin-bottom: 20px;
            }

            .exchange-rate-notice p {
              font-size: 0.9rem;
              color: #666;
              margin: 0;
            }

            .billing-toggle {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
              margin-top: 20px;
            }

            .billing-toggle span {
              font-weight: 600;
              color: #666;
            }

            .billing-toggle span.active {
              color: #2d3748;
            }

            .discount-badge {
              background: #48bb78;
              color: white;
              padding: 2px 8px 6px;
              border-radius: 12px;
              font-size: 0.8rem;
              margin-left: 5px;
            }

            .toggle-switch {
              position: relative;
              display: inline-block;
              width: 60px;
              height: 30px;
            }

            .toggle-switch input {
              opacity: 0;
              width: 0;
              height: 0;
            }

            .slider {
              position: absolute;
              cursor: pointer;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: #4299e1;
              transition: 0.4s;
              border-radius: 34px;
            }

            .slider:before {
              position: absolute;
              content: "";
              height: 22px;
              width: 22px;
              left: 4px;
              bottom: 4px;
              background-color: white;
              transition: 0.4s;
              border-radius: 50%;
            }

            input:checked + .slider {
              background-color: green;
            }

            input:checked + .slider:before {
              transform: translateX(30px);
            }

            /* Pricing Plans */
            .pricing-plans {
              padding: 70px 0;
            }

            .plans-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 30px;
              align-items: stretch;
              grid-auto-rows: 1fr;
            }

            .pricing-card {
              background: white;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              padding: 30px;
              position: relative;
              transition: transform 0.3s ease, box-shadow 0.3s ease;
              display: flex;
              flex-direction: column;
              height: 100%;
            }

            .pricing-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }

            .pricing-card.popular {
              border: 2px solid #4299e1;
              transform: scale(1.03);
            }

            .popular-badge {
              position: absolute;
              top: -12px;
              right: 20px;
              background: #4299e1;
              color: white;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 0.8rem;
              font-weight: 600;
            }

            .plan-header {
              text-align: center;
              margin-bottom: 25px;
            }

            .plan-header h3 {
              font-size: 1.5rem;
              margin-bottom: 15px;
              color: #2d3748;
            }

            .price {
              font-size: 2.2rem;
              font-weight: 700;
              color: #2d3748;
              margin-bottom: 5px;
            }

            .price-description {
              color: #718096;
              font-size: 0.9rem;
              margin-bottom: 10px;
            }

            .plan-description {
              color: #4a5568;
            }

            .features-list {
              list-style: none;
              padding: 0;
              margin: 0 0 25px 0;
            }

            .features-list li {
              padding: 10px 0;
              border-bottom: 1px solid #e2e8f0;
              display: flex;
              align-items: center;
            }

            .features-list li:last-child {
              border-bottom: none;
            }

            .features-list i {
              color: #48bb78;
              margin-right: 10px;
            }

            .cta-button {
              width: 100%;
              padding: 15px 20px;
              border: none;
              border-radius: 6px;
              font-weight: 600;
              cursor: pointer;
              transition: background-color 0.3s ease;
              margin-top: auto;
            }

            .cta-button.primary {
              background-color: #4299e1;
              color: white;
            }

            .cta-button.primary:hover {
              background-color: #3182ce;
            }

            .cta-button.secondary {
              background-color: #e2e8f0;
              color: #4a5568;
            }

            .cta-button.secondary:hover {
              background-color: #cbd5e0;
            }

            .cta-button.large {
              padding: 10px 5px;
              font-size: 1.1rem;
              width: 200px;
            }

            /* Feature Comparison */
            .feature-comparison {
              padding: 30px 0;
              background: #f7fafc;
            }

            .feature-comparison h2 {
              text-align: center;
              margin-bottom: 40px;
              color: rgb(12, 69, 143);
              font-size: 2.5rem;
              font-weight: 600;
            }

            .comparison-table {
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }

            .table-header,
            .table-row {
              display: grid;
              grid-template-columns: 2fr 1fr 1fr 1fr;
            }

            .table-header {
              background: #4299e1;
              color: white;
              font-weight: 600;
            }

            .table-row {
              border-bottom: 1px solid #e2e8f0;
            }

            .table-row:last-child {
              border-bottom: none;
            }

            .feature-column,
            .plan-column {
              padding: 15px 20px;
              display: flex;
              align-items: center;
            }

            .table-header .feature-column,
            .table-header .plan-column {
              justify-content: left;
              text-align: center;
            }

            .table-row:nth-child(even) {
              background: #f7fafc;
            }

            /* FAQ Section */
            .faq-section {
              padding: 80px 0;
              background: linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
            }

            .faq-section h2 {
              text-align: center;
              margin-bottom: 24px;
              color: rgb(7, 79, 151);
              font-size: 2.5rem;
              font-weight: 600;
              line-height: 1.2;
            }

            .faq-list {
              max-width: 800px;
              margin: 0 auto;
              display: grid;
              grid-template-columns: 1fr;
              gap: 16px;
            }

            .faq-item {
              cursor: pointer;
              background: #ffffff;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
              padding: 16px 20px;
              border: 1px solid #edf2f7;
              transition: all 0.3s ease;
              position: relative;
              overflow: hidden;
            }

            .faq-item:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
              border-color: #e2e8f0;
            }

            .faq-item::before {
              content: "";
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 4px;
              border-top-left-radius: 12px;
              border-bottom-left-radius: 12px;
              background: linear-gradient(180deg, #63b3ed, #4299e1);
              opacity: 0.6;
            }

            .faq-item.expanded::before {
              opacity: 1;
            }

            .faq-question {
              font-weight: 700;
              display: flex;
              justify-content: space-between;
              align-items: center;
              color: #2d3748;
              gap: 12px;
            }

            .chevron-icon {
              color: #718096;
              transition: all 0.3s ease;
              font-size: 1.3rem;

              display: flex;
              align-items: center;
              justify-content: center;
              width: 20px;
              height: 50px;
              text-align: center;
              flex-shrink: 0;
              position: relative;
              line-height: 1;
            }

            .faq-item:hover .chevron-icon {
              color: #4299e1;
            }

            .faq-item.expanded .chevron-icon {
              color: #4299e1;
              transform: scale(1.1);
            }

            .faq-answer {
              padding-top: 15px;
              color: #4a5568;
              animation: slideDown 0.3s ease;
              border-top: 1px solid #e2e8f0;
              margin-top: 10px;
            }

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

            /* Final CTA */
            .final-cta {
              padding: 60px 0;
              text-align: center;
              background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
              color: white;
            }

            .final-cta h2 {
              margin-bottom: 15px;
              font-size: 2.2rem;
            }

            .final-cta p {
              margin-bottom: 30px;
              font-size: 1.2rem;
              opacity: 0.9;
            }

            /* Mobile Responsive Styles */
            @media (max-width: 1024px) {
              .container {
                padding: 0 15px;
              }

              .pricing-header h1 {
                font-size: 2.2rem;
              }

              .pricing-header p {
                font-size: 1.1rem;
              }

              .plans-grid {
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
              }
            }

            @media (max-width: 768px) {
              .container {
                padding: 0 12px;
                margin-top: 30px;
              }

              /* Header Mobile */
              .pricing-header {
                padding: 60px 0 60px;
              }

              .pricing-header h1 {
                font-size: 1.8rem;
                margin-bottom: 12px;
              }

              .pricing-header p {
                font-size: 1rem;
                margin-bottom: 25px;
              }

              .currency-toggle {
                flex-direction: row;
                gap: 15px;
                margin-bottom: 15px;
              }

              .billing-toggle {
                flex-direction: row;
                gap: 15px;
                margin-top: 15px;
              }

              .currency-toggle span,
              .billing-toggle span {
                font-size: 0.9rem;
              }

              .discount-badge {
                font-size: 0.7rem;
                padding: 1px 6px 4px;
              }

              .toggle-switch {
                width: 50px;
                height: 25px;
              }

              .slider:before {
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
              }

              input:checked + .slider:before {
                transform: translateX(25px);
              }

              /* Pricing Cards Mobile */
              .plans-grid {
                grid-template-columns: 1fr;
                gap: 20px;
              }

              .pricing-card {
                padding: 20px;
              }

              .pricing-card.popular {
                transform: none;
                border-width: 1px;
              }

              .popular-badge {
                top: -8px;
                right: 15px;
                padding: 3px 10px;
                font-size: 0.7rem;
              }

              .plan-header h3 {
                font-size: 1.3rem;
              }

              .price {
                font-size: 1.8rem;
              }

              .price-description {
                font-size: 0.8rem;
              }

              .features-list li {
                padding: 8px 0;
                font-size: 0.9rem;
              }

              .cta-button {
                padding: 12px 15px;
                font-size: 0.9rem;
              }

              .cta-button.large {
                padding: 14px 20px;
                font-size: 1rem;
                width: 100%;
                max-width: 300px;
              }

              /* Feature Comparison Mobile */
              .feature-comparison {
                padding: 20px 0;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
              }

              .feature-comparison h2 {
                font-size: 1.8rem;
                margin-bottom: 25px;
                text-align: center;
              }

              .comparison-table {
                min-width: 600px;
                margin: 0 10px;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                position: relative;
              }

              .comparison-table::after {
                content: "";
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                width: 20px;
                background: linear-gradient(
                  to left,
                  rgba(255, 255, 255, 0.8),
                  transparent
                );
                pointer-events: none;
              }

              .table-header,
              .table-row {
                grid-template-columns: 1.5fr 1fr 1fr 1fr;
              }

              .feature-column,
              .plan-column {
                padding: 12px 15px;
                font-size: 0.85rem;
                min-height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .table-header .feature-column,
              .table-header .plan-column {
                font-size: 0.8rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              .table-row .feature-column {
                justify-content: flex-start;
                font-weight: 600;
                background: #f8f9fa;
              }

              .table-row .plan-column {
                background: white;
                border-left: 1px solid #e2e8f0;
              }

              .table-row .plan-column:first-child {
                border-left: none;
              }

              /* FAQ Mobile */
              .faq-section {
                padding: 50px 0;
              }

              .faq-section h2 {
                font-size: 1.8rem;
                margin-bottom: 20px;
              }

              .faq-item {
                padding: 12px 15px;
              }

              .faq-question {
                font-size: 0.9rem;
                gap: 8px;
              }

              .chevron-icon {
                font-size: 1.2rem;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                position: relative;
                transition: all 0.3s ease;
                line-height: 1;
              }

              .faq-answer {
                font-size: 0.85rem;
                padding-top: 12px;
              }

              /* Final CTA Mobile */
              .final-cta {
                padding: 40px 0;
              }

              .final-cta h2 {
                font-size: 1.6rem;
                margin-bottom: 12px;
              }

              .final-cta p {
                font-size: 1rem;
                margin-bottom: 25px;
              }
            }

            @media (max-width: 480px) {
              .container {
                padding: 0 10px;
                margin-top: 30px;
              }

              /* Extra Small Mobile */
              .pricing-header {
                padding: 50px 0 50px;
              }

              .pricing-header h1 {
                font-size: 1.5rem;
              }

              .pricing-header p {
                font-size: 0.9rem;
              }

              .currency-toggle,
              .billing-toggle {
                gap: 12px;
                flex-direction: row;
              }

              .currency-toggle span,
              .billing-toggle span {
                font-size: 0.8rem;
              }

              .pricing-card {
                padding: 15px;
              }

              .plan-header h3 {
                font-size: 1.2rem;
              }

              .price {
                font-size: 1.6rem;
              }

              .features-list li {
                padding: 6px 0;
                font-size: 0.85rem;
              }

              .cta-button {
                padding: 10px 12px;
                font-size: 0.85rem;
              }

              .feature-comparison h2 {
                font-size: 1.5rem;
                margin-bottom: 20px;
              }

              .comparison-table {
                min-width: 500px;
                margin: 0 5px;
                border-radius: 8px;
              }

              .feature-column,
              .plan-column {
                padding: 10px 12px;
                font-size: 0.8rem;
                min-height: 45px;
              }

              .table-header .feature-column,
              .table-header .plan-column {
                font-size: 0.75rem;
                letter-spacing: 0.3px;
              }

              .faq-section h2 {
                font-size: 1.5rem;
              }

              .faq-item {
                padding: 10px 12px;
              }

              .faq-question {
                font-size: 0.85rem;
              }

              .faq-answer {
                font-size: 0.8rem;
              }

              .final-cta h2 {
                font-size: 1.4rem;
              }

              .final-cta p {
                font-size: 0.9rem;
              }
            }
          `}
        </style>
      </div>
    </>
  );
};

export default PricingPage;
