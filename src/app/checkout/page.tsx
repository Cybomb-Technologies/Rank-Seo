"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";

interface PlanDetails {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  billingCycle: "monthly" | "annual";
  currency: "USD" | "INR";
  isCustom?: boolean;
  savings?: string;
}

interface FormData {
  email: string;
  name: string;
  company: string;
  phone: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  acceptTerms: boolean;
  acceptMarketing: boolean;
}

const CheckoutPage: React.FC = () => {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") || "starter";
  const billing =
    (searchParams.get("billing") as "monthly" | "annual") || "annual";
  const currency = (searchParams.get("currency") as "USD" | "INR") || "USD";

  const [formData, setFormData] = useState<FormData>({
    email: "",
    name: "",
    company: "",
    phone: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
    address: "",
    city: "",
    zipCode: "",
    country: "",
    acceptTerms: false,
    acceptMarketing: false,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"card" | "paypal" | "bank">(
    "card"
  );
  const [showSuccess, setShowSuccess] = useState(false);

  // Memoized plan details
  const planDetails: Record<string, PlanDetails> = useMemo(
    () => ({
      starter: {
        id: "starter",
        name: "Starter",
        price:
          currency === "USD"
            ? billing === "annual"
              ? "$15/month"
              : "$19/month"
            : billing === "annual"
            ? "₹1,253/month"
            : "₹1,587/month",
        description: "Perfect for small businesses and bloggers",
        features: [
          "5 SEO audits per month",
          "Basic technical SEO analysis",
          "Keyword suggestions (up to 50)",
          "Email support",
          "PDF report export",
          "Basic performance metrics",
        ],
        billingCycle: billing,
        currency: currency,
        savings: billing === "annual" ? "Save 20%" : "",
      },
      professional: {
        id: "professional",
        name: "Professional",
        price:
          currency === "USD"
            ? billing === "annual"
              ? "$39/month"
              : "$49/month"
            : billing === "annual"
            ? "₹3,257/month"
            : "₹4,092/month",
        description: "Ideal for marketing agencies and growing businesses",
        features: [
          "20 SEO audits per month",
          "Comprehensive technical SEO analysis",
          "Competitor analysis (up to 3 competitors)",
          "Keyword tracking (up to 200 keywords)",
          "Content optimization suggestions",
          "Priority email & chat support",
          "White-label reports",
          "14-day free trial",
        ],
        billingCycle: billing,
        currency: currency,
        savings: billing === "annual" ? "Save 20%" : "",
      },
      enterprise: {
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
        billingCycle: billing,
        currency: currency,
        isCustom: true,
      },
    }),
    [billing, currency]
  );

  const currentPlan = planDetails[planId];

  // Why Choose These Plans features - Plan specific benefits
  const planBenefits = useMemo(() => {
    const baseBenefits = [
      {
        icon: "search",
        title: "AI-Powered SEO Audits",
        description:
          "Get comprehensive website analysis with our advanced AI algorithms",
      },
      {
        icon: "chart-line",
        title: "Keyword Tracking",
        description: "Monitor keyword rankings and track your SEO progress",
      },
      {
        icon: "bolt",
        title: "Technical SEO Analysis",
        description:
          "Identify crawl errors, site speed issues, and technical improvements",
      },
    ];

    const professionalBenefits = [
      {
        icon: "chart-bar",
        title: "Competitor Analysis",
        description: "Benchmark your performance against up to 3 competitors",
      },
      {
        icon: "bullseye",
        title: "Content Optimization",
        description: "Get actionable recommendations to optimize your content",
      },
      {
        icon: "file-alt",
        title: "White-label Reports",
        description: "Generate custom reports with your branding for clients",
      },
    ];

    const enterpriseBenefits = [
      {
        icon: "link",
        title: "Advanced Backlink Analysis",
        description: "Comprehensive backlink profile analysis and monitoring",
      },
      {
        icon: "code",
        title: "API Access",
        description: "Full API access for custom integrations and automation",
      },
      {
        icon: "users",
        title: "Team Collaboration",
        description: "Multi-user access with role-based permissions",
      },
    ];

    switch (currentPlan.id) {
      case "starter":
        return baseBenefits;
      case "professional":
        return [...baseBenefits, ...professionalBenefits];
      case "enterprise":
        return [
          ...baseBenefits,
          ...professionalBenefits,
          ...enterpriseBenefits,
        ];
      default:
        return baseBenefits;
    }
  }, [currentPlan.id]);

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value, type } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));
    },
    []
  );

  const formatCardNumber = useCallback((value: string): string => {
    return value
      .replace(/\s?/g, "")
      .replace(/(\d{4})/g, "$1 ")
      .trim()
      .slice(0, 19);
  }, []);

  const formatExpiryDate = useCallback((value: string): string => {
    return value
      .replace(/\//g, "")
      .replace(/(\d{2})(\d{2})/, "$1/$2")
      .slice(0, 5);
  }, []);

  const handleCardNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCardNumber(e.target.value);
      setFormData((prev) => ({ ...prev, cardNumber: formatted }));
    },
    [formatCardNumber]
  );

  const handleExpiryDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatExpiryDate(e.target.value);
      setFormData((prev) => ({ ...prev, expiryDate: formatted }));
    },
    [formatExpiryDate]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setShowSuccess(true);
    setIsProcessing(false);
  };

  // const PaymentIcons = () => (
  //   <div className="payment-icons">
  //     <div className="payment-icon-group">
  //       <i className="fab fa-cc-visa" title="Visa"></i>
  //       <i className="fab fa-cc-mastercard" title="Mastercard"></i>
  //       <i className="fab fa-cc-amex" title="American Express"></i>
  //       <i className="fab fa-cc-discover" title="Discover"></i>
  //       <i className="fab fa-cc-paypal" title="PayPal"></i>
  //     </div>
  //   </div>
  // );

  const Icon = ({ name }: { name: string }) => {
    const getIcon = () => {
      switch (name) {
        case "search":
          return <i className="fas fa-search"></i>;
        case "chart-line":
          return <i className="fas fa-chart-line"></i>;
        case "bolt":
          return <i className="fas fa-bolt"></i>;
        case "chart-bar":
          return <i className="fas fa-chart-bar"></i>;
        case "bullseye":
          return <i className="fas fa-bullseye"></i>;
        case "file-alt":
          return <i className="fas fa-file-alt"></i>;
        case "link":
          return <i className="fas fa-link"></i>;
        case "code":
          return <i className="fas fa-code"></i>;
        case "users":
          return <i className="fas fa-users"></i>;
        case "shield":
          return <i className="fas fa-shield-alt"></i>;
        case "lock":
          return <i className="fas fa-lock"></i>;
        case "sync":
          return <i className="fas fa-sync"></i>;
        case "headset":
          return <i className="fas fa-headset"></i>;
        default:
          return <i className="fas fa-circle"></i>;
      }
    };

    return getIcon();
  };

  if (showSuccess) {
    return (
      <div className="success-page">
        <div className="container">
          <div className="success-content">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h1>Welcome to SEO Audit Pro!</h1>
            <p>Your {currentPlan.name} plan has been successfully activated</p>
            <div className="success-details">
              <div className="detail-item">
                <strong>Plan:</strong> {currentPlan.name}
              </div>
              <div className="detail-item">
                <strong>Billing:</strong>{" "}
                {billing === "annual" ? "Annual" : "Monthly"}
              </div>
              <div className="detail-item">
                <strong>Email:</strong> {formData.email}
              </div>
            </div>
            <div className="success-actions">
              <button
                className="btn primary"
                onClick={() => (window.location.href = "/dashboard")}
              >
                Go to Dashboard
              </button>
              <button
                className="btn secondary"
                onClick={() => (window.location.href = "/")}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
        <style jsx>{`
          .success-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
          }
          .success-content {
            background: white;
            padding: 60px 40px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 100%;
          }
          .success-icon {
            font-size: 4rem;
            margin-bottom: 20px;
            color: #0d9488;
          }
          .success-details {
            background: #f0fdfa;
            padding: 20px;
            border-radius: 10px;
            margin: 30px 0;
            text-align: left;
            border: 1px solid #99f6e4;
          }
          .detail-item {
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #ccfbf1;
          }
          .detail-item:last-child {
            border-bottom: none;
          }
          .success-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* Add Font Awesome CDN */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      <div className="container">
        <div className="checkout-header">
          <div className="header-content pt-10">
            <h1>Complete Your Purchase</h1>
            <p>
              You're signing up for the <strong>{currentPlan.name}</strong> plan
            </p>
            <div className="header-badge">
              {currentPlan.savings && (
                <span className="savings-badge">{currentPlan.savings}</span>
              )}
              {currentPlan.id === "professional" && (
                <span className="trial-badge">14-Day Free Trial</span>
              )}
            </div>
          </div>
        </div>

        <div className="checkout-grid">
          {/* Order Summary */}
          <div className="order-summary">
            <div className="summary-card">
              <div className="card-header">
                <h3>Order Summary</h3>
                <div className="plan-type">{currentPlan.name} Plan</div>
              </div>

              <div className="plan-details">
                <div className="price-section">
                  <div className="price">{currentPlan.price}</div>
                  <p className="price-note">{currentPlan.description}</p>
                </div>

                <div className="features-section">
                  <h4>What's included:</h4>
                  <ul className="features-list">
                    {currentPlan.features.map((feature, index) => (
                      <li key={index}>
                        <i className="fas fa-check"></i>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="billing-info">
                  <div className="info-item">
                    <span>Billing cycle:</span>
                    <span className={billing === "annual" ? "highlight" : ""}>
                      {billing === "annual" ? "Annual (Save 20%)" : "Monthly"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span>Currency:</span>
                    <span>{currency}</span>
                  </div>
                  {currentPlan.id === "professional" && (
                    <div className="info-item highlight">
                      <span>Free trial:</span>
                      <span>14 days</span>
                    </div>
                  )}
                </div>

                {!currentPlan.isCustom && (
                  <div className="total-section">
                    <div className="total-line">
                      <span>Subtotal</span>
                      <span>{currentPlan.price}</span>
                    </div>
                    <div className="total-line">
                      <span>Tax</span>
                      <span>Included</span>
                    </div>
                    <div className="total-main">
                      <span>Total</span>
                      <span>{currentPlan.price}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Why Choose These Plans Section */}
            <div className="benefits-card">
              <h3>Why Choose this Plan?</h3>
              <div className="benefits-grid">
                {planBenefits.map((benefit, index) => (
                  <div key={index} className="benefit-item">
                    <div className="benefit-icon">
                      <Icon name={benefit.icon} />
                    </div>
                    <div className="benefit-content">
                      <h4>{benefit.title}</h4>
                      <p>{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="checkout-form-section">
            <div className="checkout-form">
              {currentPlan.isCustom ? (
                <div className="contact-form">
                  <div className="form-header">
                    <h3>Contact Sales</h3>
                    <p>
                      Our team will get in touch to discuss custom pricing and
                      requirements.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="name">Full Name *</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="company">Company *</label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          required
                          placeholder="Your company name"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="email">Work Email *</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder="your@company.com"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="message">
                        What are your SEO needs? *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        placeholder="Tell us about your business, current challenges, and SEO goals..."
                        required
                      ></textarea>
                    </div>

                    <div className="form-actions">
                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          id="acceptTermsContact"
                          name="acceptTerms"
                          checked={formData.acceptTerms}
                          onChange={handleInputChange}
                          required
                        />
                        <label
                          htmlFor="acceptTermsContact"
                          className="checkbox-label"
                        >
                          I agree to the{" "}
                          <a href="/terms" target="_blank">
                            Terms & Conditions
                          </a>{" "}
                          and{" "}
                          <a href="/privacy" target="_blank">
                            Privacy Policy
                          </a>{" "}
                          *
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="btn primary large"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Contacting Sales Team...
                          </>
                        ) : (
                          "Contact Sales Team"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  {/* Payment Method Tabs */}
                  <div className="payment-section">
                    <h3>Payment Method</h3>
                    <div className="payment-tabs">
                      <button
                        className={`tab-btn ${
                          activeTab === "card" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("card")}
                        type="button"
                      >
                        <i className="fas fa-credit-card "></i>
                        Credit/Debit Card
                      </button>
                      <button
                        className={`tab-btn ${
                          activeTab === "paypal" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("paypal")}
                        type="button"
                      >
                        <i className="fab fa-paypal"></i>
                        PayPal
                      </button>
                      {currency === "INR" && (
                        <button
                          className={`tab-btn ${
                            activeTab === "bank" ? "active" : ""
                          }`}
                          onClick={() => setActiveTab("bank")}
                          type="button"
                        >
                          <i className="fas fa-university"></i>
                          Bank Transfer
                        </button>
                      )}
                    </div>

                    {/* <PaymentIcons /> */}

                    <form onSubmit={handleSubmit} className="payment-form">
                      {/* Contact Information */}
                      <div className="form-section">
                        <h4>Contact Information</h4>
                        <div className="form-group">
                          <label htmlFor="email">Email Address *</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>

                      {/* Payment Details */}
                      {activeTab === "card" && (
                        <div className="form-section">
                          <h4>Card Details</h4>
                          <div className="form-group">
                            <label htmlFor="cardNumber">Card Number *</label>
                            <input
                              type="text"
                              id="cardNumber"
                              name="cardNumber"
                              value={formData.cardNumber}
                              onChange={handleCardNumberChange}
                              placeholder="1234 5678 9012 3456"
                              maxLength={19}
                              required
                            />
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="expiryDate">Expiry Date *</label>
                              <input
                                type="text"
                                id="expiryDate"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleExpiryDateChange}
                                placeholder="MM/YY"
                                maxLength={5}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="cvv">CVV *</label>
                              <input
                                type="text"
                                id="cvv"
                                name="cvv"
                                value={formData.cvv}
                                onChange={handleInputChange}
                                placeholder="123"
                                maxLength={4}
                                required
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label htmlFor="cardName">Name on Card *</label>
                            <input
                              type="text"
                              id="cardName"
                              name="cardName"
                              value={formData.cardName}
                              onChange={handleInputChange}
                              required
                              placeholder="As shown on card"
                            />
                          </div>
                        </div>
                      )}

                      {activeTab === "paypal" && (
                        <div className="paypal-section">
                          <div className="paypal-content">
                            <i className="fab fa-paypal"></i>
                            <h4>Pay with PayPal</h4>
                            <p>
                              You will be redirected to PayPal to complete your
                              payment securely. Your account will be activated
                              immediately after payment confirmation.
                            </p>
                            <div className="paypal-features">
                              <div className="feature">
                                <i className="fas fa-shield-alt"></i>
                                <span>PayPal Buyer Protection</span>
                              </div>
                              <div className="feature">
                                <i className="fas fa-bolt"></i>
                                <span>Instant Activation</span>
                              </div>
                              <div className="feature">
                                <i className="fas fa-globe"></i>
                                <span>Global Payments</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === "bank" && (
                        <div className="bank-section">
                          <div className="bank-content">
                            <h4>Bank Transfer</h4>
                            <div className="bank-details">
                              <div className="detail-row">
                                <span>Account Name:</span>
                                <strong>SEO Audit Tools Inc.</strong>
                              </div>
                              <div className="detail-row">
                                <span>Account Number:</span>
                                <strong>1234567890</strong>
                              </div>
                              <div className="detail-row">
                                <span>IFSC Code:</span>
                                <strong>SBIN0000123</strong>
                              </div>
                              <div className="detail-row">
                                <span>Bank Name:</span>
                                <strong>State Bank of India</strong>
                              </div>
                              <div className="detail-row">
                                <span>Branch:</span>
                                <strong>Mumbai Main Branch</strong>
                              </div>
                            </div>
                            <p className="bank-note">
                              Please include your email address in the transfer
                              reference. We'll activate your account within 24
                              hours of payment confirmation.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Billing Address */}
                      {(activeTab === "card" || activeTab === "paypal") && (
                        <div className="form-section">
                          <h4>Billing Address</h4>
                          <div className="form-group">
                            <label htmlFor="address">Address *</label>
                            <input
                              type="text"
                              id="address"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              required
                              placeholder="Street address"
                            />
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="city">City *</label>
                              <input
                                type="text"
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                required
                                placeholder="City"
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="zipCode">ZIP/Postal Code *</label>
                              <input
                                type="text"
                                id="zipCode"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleInputChange}
                                required
                                placeholder="ZIP code"
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label htmlFor="country">Country *</label>
                            <select
                              id="country"
                              name="country"
                              value={formData.country}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="">Select Country</option>
                              <option value="US">United States</option>
                              <option value="IN">India</option>
                              <option value="GB">United Kingdom</option>
                              <option value="CA">Canada</option>
                              <option value="AU">Australia</option>
                              <option value="DE">Germany</option>
                              <option value="FR">France</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Terms and Conditions */}
                      <div className="form-section">
                        <div className="checkbox-group">
                          <input
                            type="checkbox"
                            id="acceptTerms"
                            name="acceptTerms"
                            checked={formData.acceptTerms}
                            onChange={handleInputChange}
                            required
                          />
                          <label
                            htmlFor="acceptTerms"
                            className="checkbox-label"
                          >
                            I agree to the{" "}
                            <a href="/terms-and-conditions" target="_blank">
                              Terms & Conditions
                            </a>{" "}
                            and{" "}
                            <a href="/privacy" target="_blank">
                              Privacy Policy
                            </a>{" "}
                            *
                          </label>
                        </div>

                        <div className="checkbox-group">
                          <input
                            type="checkbox"
                            id="acceptMarketing"
                            name="acceptMarketing"
                            checked={formData.acceptMarketing}
                            onChange={handleInputChange}
                          />
                          <label
                            htmlFor="acceptMarketing"
                            className="checkbox-label"
                          >
                            Send me product updates, SEO tips, and special
                            offers
                          </label>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="form-actions">
                        <button
                          type="submit"
                          className={`btn primary large ${
                            isProcessing ? "processing" : ""
                          }`}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <i className="fas fa-spinner fa-spin"></i>
                              Processing...
                            </>
                          ) : currentPlan.id === "professional" ? (
                            "Start 14-Day Free Trial"
                          ) : (
                            "Get Started Now"
                          )}
                        </button>

                        <p className="secure-note">
                          <i className="fas fa-lock"></i>
                          Your payment is secure and encrypted with 256-bit SSL
                        </p>

                        {currentPlan.id === "professional" && (
                          <p className="trial-note">
                            No credit card required for free trial. You can
                            cancel anytime.
                          </p>
                        )}
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>

            {/* Security Card - Moved under the form */}
            <div className="security-card">
              <h4>Secure & Trusted</h4>
              <div className="security-features">
                <div className="security-item">
                  <Icon name="shield" />
                  <span>256-bit SSL Encryption</span>
                </div>
                <div className="security-item">
                  <Icon name="lock" />
                  <span>PCI DSS Compliant</span>
                </div>
                <div className="security-item">
                  <Icon name="sync" />
                  <span>Cancel Anytime</span>
                </div>
                <div className="security-item">
                  <Icon name="headset" />
                  <span>24/7 Support</span>
                </div>
              </div>
              {/* <PaymentIcons /> */}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .checkout-page {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, sans-serif;
          background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
          min-height: 100vh;
          padding: 40px 0;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .checkout-header {
          text-align: center;
          margin-bottom: 50px;
        }

        .header-content h1 {
          font-size: 3rem;
          background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .header-content p {
          font-size: 1.3rem;
          color: #0f766e;
          margin-bottom: 20px;
        }

        .header-badge {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .savings-badge,
        .trial-badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .savings-badge {
          background: #0d9488;
          color: white;
        }

        .trial-badge {
          background: #14b8a6;
          color: white;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 40px;
          align-items: start;
        }

        .checkout-form-section {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        /* Order Summary Styles */
        .order-summary {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .summary-card,
        .benefits-card,
        .security-card {
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(13, 148, 136, 0.08);
          border: 1px solid #99f6e4;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f0fdfa;
        }

        .card-header h3 {
          font-size: 1.5rem;
          color: #0f766e;
          margin: 0;
        }

        .plan-type {
          background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .price-section {
          text-align: center;
          margin-bottom: 25px;
          padding: 20px;
          background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
          border-radius: 12px;
          color: white;
        }

        .price {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .price-note {
          opacity: 0.9;
          margin: 0;
          font-size: 1rem;
        }

        .features-section h4 {
          color: #0f766e;
          margin-bottom: 15px;
          font-size: 1.1rem;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 0 0 25px 0;
        }

        .features-list li {
          padding: 12px 0;
          border-bottom: 1px solid #f0fdfa;
          display: flex;
          align-items: center;
          font-size: 0.95rem;
          color: #134e4a;
        }

        .features-list li:last-child {
          border-bottom: none;
        }

        .features-list i {
          color: #0d9488;
          margin-right: 12px;
          font-size: 1rem;
        }

        .billing-info {
          background: #f0fdfa;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
          border: 1px solid #99f6e4;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          color: #0f766e;
        }

        .info-item.highlight {
          color: #0d9488;
          font-weight: 600;
        }

        .highlight {
          color: #0d9488;
          font-weight: 600;
        }

        .total-section {
          border-top: 2px solid #99f6e4;
          padding-top: 20px;
        }

        .total-line,
        .total-main {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
        }

        .total-line {
          color: #0f766e;
        }

        .total-main {
          font-weight: 700;
          font-size: 1.3rem;
          border-top: 1px solid #99f6e4;
          margin-top: 10px;
          padding-top: 15px;
          color: #134e4a;
        }

        /* Benefits Section */
        .benefits-card h3 {
          font-size: 1.4rem;
          color: #0f766e;
          margin-bottom: 25px;
          text-align: center;
        }

        .benefits-grid {
          display: grid;
          gap: 20px;
        }

        .benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 15px;
          background: #f0fdfa;
          border-radius: 10px;
          transition: transform 0.2s ease;
          border: 1px solid #ccfbf1;
        }

        .benefit-item:hover {
          transform: translateY(-2px);
          background: #ccfbf1;
        }

        .benefit-icon {
          color: #0d9488;
          font-size: 1.2rem;
          width: 24px;
          text-align: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .benefit-content h4 {
          margin: 0 0 5px 0;
          color: #0f766e;
          font-size: 1rem;
        }

        .benefit-content p {
          margin: 0;
          color: #0f766e;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        /* Security Card */
        .security-card h4 {
          color: #0f766e;
          margin-bottom: 20px;
          text-align: center;
        }

        .security-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 25px;
        }

        .security-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #0d9488;
          font-size: 0.9rem;
        }

        .security-item i {
          font-size: 1rem;
          width: 16px;
        }

        .payment-icons {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #99f6e4;
        }

        .payment-icon-group {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 25px;
          flex-wrap: wrap;
          padding: 15px 0;
        }

        .payment-icon-group i {
          font-size: 4rem;
          transition: all 0.3s ease;
          filter: brightness(1);
          padding: 8px;
        }

        .payment-icon-group i:hover {
          transform: translateY(-3px);
          filter: brightness(1.1);
        }

        /* Payment Icons Brand Colors */
        .payment-icon-group .fa-cc-visa {
          color: #1a1f71;
        }

        .payment-icon-group .fa-cc-mastercard {
          color: #eb001b;
        }

        .payment-icon-group .fa-cc-amex {
          color: #2e77bc;
        }

        .payment-icon-group .fa-cc-discover {
          color: #ff6000;
        }

        .payment-icon-group .fa-cc-paypal {
          color: #003087;
        }

        /* Checkout Form Styles */
        .checkout-form {
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 10px 30px rgba(13, 148, 136, 0.08);
          border: 1px solid #99f6e4;
        }

        .payment-section h3 {
          font-size: 1.6rem;
          color: #0f766e;
          margin-bottom: 25px;
        }

        .payment-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 25px;
          background: #f0fdfa;
          padding: 8px;
          border-radius: 12px;
        }

        .tab-btn {
          flex: 1;
          padding: 15px 20px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
          color: #0f766e;
        }

        .tab-btn.active {
          background: white;
          color: #0d9488;
          box-shadow: 0 2px 8px rgba(13, 148, 136, 0.1);
        }

        .tab-btn:hover:not(.active) {
          color: #0d9488;
        }

        .form-section {
          margin-bottom: 30px;
          padding-bottom: 25px;
          border-bottom: 1px solid #99f6e4;
        }

        .form-section h4 {
          font-size: 1.2rem;
          color: #0f766e;
          margin-bottom: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #0f766e;
          font-size: 0.95rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #99f6e4;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: white;
          color: #134e4a;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }

        .form-group input::placeholder {
          color: #5eead4;
        }

        .checkbox-group {
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #0d9488;
        }

        .checkbox-label {
          cursor: pointer;
          font-size: 0.95rem;
          color: #0f766e;
          margin: 0;
        }

        .checkbox-label a {
          color: #0d9488;
          text-decoration: none;
          font-weight: 600;
        }

        .checkbox-label a:hover {
          text-decoration: underline;
        }

        .btn {
          padding: 16px 24px;
          border: none;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-decoration: none;
          text-align: center;
        }

        .btn.primary {
          background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
          color: white;
        }

        .btn.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 148, 136, 0.3);
        }

        .btn.secondary {
          background: #f0fdfa;
          color: #0f766e;
          border: 2px solid #99f6e4;
        }

        .btn.secondary:hover {
          background: #ccfbf1;
        }

        .btn.large {
          width: 100%;
          padding: 18px 24px;
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn.processing {
          background: #94a3b8;
        }

        .form-actions {
          margin-top: 30px;
        }

        .secure-note {
          text-align: center;
          color: #0f766e;
          margin-top: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.9rem;
        }

        .trial-note {
          text-align: center;
          color: #0d9488;
          margin-top: 10px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        /* PayPal & Bank Sections */
        .paypal-section,
        .bank-section {
          text-align: center;
          padding: 40px 20px;
          background: #f0fdfa;
          border-radius: 12px;
          margin: 20px 0;
          border: 1px solid #99f6e4;
        }

        .paypal-content i {
          font-size: 4rem;
          color: #003087;
          margin-bottom: 20px;
        }

        .paypal-content h4 {
          color: #003087;
          margin-bottom: 15px;
        }

        .paypal-features {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-top: 25px;
          flex-wrap: wrap;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0f766e;
          font-size: 0.9rem;
        }

        .feature i {
          color: #0d9488;
          font-size: 1rem;
        }

        .bank-content h4 {
          color: #0f766e;
          margin-bottom: 20px;
        }

        .bank-details {
          text-align: left;
          background: white;
          padding: 25px;
          border-radius: 10px;
          margin-bottom: 20px;
          border: 1px solid #99f6e4;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f0fdfa;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .bank-note {
          color: #0f766e;
          font-style: italic;
          font-size: 0.9rem;
        }

        /* Contact Form */
        .contact-form .form-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .contact-form .form-header h3 {
          font-size: 1.8rem;
          color: #0f766e;
          margin-bottom: 10px;
        }

        .contact-form .form-header p {
          color: #0f766e;
          font-size: 1.1rem;
        }

        /* Mobile Responsive */
        @media (max-width: 1024px) {
          .checkout-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .order-summary {
            order: 2;
          }

          .checkout-form-section {
            order: 1;
          }
        }

        @media (max-width: 768px) {
          .container {
            padding: 0 15px;
          }

          .checkout-header h1 {
            font-size: 2.2rem;
          }

          .checkout-form {
            padding: 25px;
          }

          .form-grid,
          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .payment-tabs {
            flex-direction: column;
          }

          .security-features {
            grid-template-columns: 1fr;
          }

          .paypal-features {
            flex-direction: column;
            gap: 15px;
          }

          .benefits-grid {
            grid-template-columns: 1fr;
          }

          .payment-icon-group {
            gap: 20px;
          }

          .payment-icon-group i {
            font-size: 2.5rem;
            padding: 6px;
          }
        }

        @media (max-width: 480px) {
          .checkout-header h1 {
            font-size: 1.8rem;
          }

          .checkout-header p {
            font-size: 1.1rem;
          }

          .checkout-form {
            padding: 20px;
          }

          .price {
            font-size: 2rem;
          }

          .summary-card,
          .benefits-card,
          .security-card {
            padding: 20px;
          }

          .payment-icon-group {
            gap: 15px;
          }

          .payment-icon-group i {
            font-size: 2rem;
            padding: 5px;
          }
        }

        @media (max-width: 360px) {
          .payment-icon-group {
            gap: 12px;
          }

          .payment-icon-group i {
            font-size: 1.8rem;
            padding: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;
