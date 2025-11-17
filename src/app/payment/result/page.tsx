"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface PaymentResult {
  success: boolean;
  message: string;
  orderStatus?: string;
  orderAmount?: number;
  orderCurrency?: string;
  planId?: string;
  planName?: string; // Added to interface
  billingCycle?: string;
}

export default function PaymentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (orderId) {
      verifyPayment();
    } else {
      setPaymentResult({
        success: false,
        message: "No order ID found in URL",
      });
      setLoading(false);
    }
  }, [orderId]);

  const verifyPayment = async () => {
    if (!orderId) return;

    try {
      setVerifying(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setPaymentResult({
          success: false,
          message: "Please log in to verify payment",
        });
        setLoading(false);
        return;
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const response = await fetch(`${API_BASE}/api/payments/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentResult(data);
      } else {
        setPaymentResult({
          success: false,
          message: data.message || "Failed to verify payment",
        });
      }
    } catch (error: any) {
      console.error("Payment verification error:", error);
      setPaymentResult({
        success: false,
        message: error.message || "Network error occurred",
      });
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  const retryVerification = () => {
    setVerifying(true);
    verifyPayment();
  };

  // Format plan name for display
  const formatPlanName = (planName?: string) => {
    if (!planName) return "N/A";
    // Capitalizes the first letter
    return planName.charAt(0).toUpperCase() + planName.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Verifying Your Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your payment details</p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6 mt-12">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
            paymentResult?.success 
              ? "bg-green-100 text-green-600" 
              : "bg-red-100 text-red-600"
          }`}>
            {paymentResult?.success ? (
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {paymentResult?.success ? "Payment Successful! 🎉" : "Payment Processing"}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {paymentResult?.success 
              ? "Thank you for your purchase! Your subscription has been activated and you can start using all features immediately."
              : paymentResult?.message || "We're checking your payment status. This may take a moment."
            }
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Payment Details Card */}
          <div className="lg:col-span-2">
            <div className={`bg-white rounded-2xl shadow-lg border-l-4 ${
              paymentResult?.success 
                ? "border-green-500" 
                : paymentResult?.orderStatus === "ACTIVE" 
                  ? "border-blue-500" 
                  : "border-orange-500"
            } p-6 md:p-8`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
                  {paymentResult?.success ? "Payment Confirmed" : "Payment Details"}
                </h2>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  paymentResult?.success 
                    ? "bg-green-100 text-green-800" 
                    : paymentResult?.orderStatus === "ACTIVE"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-orange-100 text-orange-800"
                }`}>
                  {paymentResult?.success 
                    ? "Completed" 
                    : paymentResult?.orderStatus === "ACTIVE" 
                      ? "Processing" 
                      : "Pending"
                  }
                </div>
              </div>

              {orderId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Order ID</label>
                      <p className="font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded-lg text-sm break-all">
                        {orderId}
                      </p>
                    </div>
                    
                    {paymentResult?.orderAmount && paymentResult?.orderCurrency && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Amount Paid</label>
                        <p className="text-2xl font-bold text-gray-900">
                          {paymentResult.orderCurrency === "INR" ? "₹" : "$"}
                          {paymentResult.orderAmount.toLocaleString()}
                          <span className="text-sm font-normal text-gray-600 ml-1">
                            {paymentResult.orderCurrency}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {(paymentResult?.planName || paymentResult?.planId) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Plan</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatPlanName(paymentResult.planName)}
                        </p>
                      </div>
                    )}

                    {paymentResult?.billingCycle && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Billing Cycle</label>
                        <p className="text-lg font-semibold text-gray-900 capitalize">
                          {paymentResult.billingCycle}
                          {paymentResult.billingCycle === "annual" && (
                            <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Save 20%
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {paymentResult?.orderStatus && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Payment Status</label>
                        <p className="text-lg font-semibold text-gray-900 capitalize">
                          {paymentResult.orderStatus.toLowerCase()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Message */}
              {paymentResult?.message && (
                <div className={`mt-6 p-4 rounded-lg border ${
                  paymentResult.success 
                    ? "bg-green-50 border-green-200 text-green-800" 
                    : paymentResult.orderStatus === "ACTIVE"
                      ? "bg-blue-50 border-blue-200 text-blue-800"
                      : "bg-orange-50 border-orange-200 text-orange-800"
                }`}>
                  <div className="flex items-start">
                    <svg className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                      paymentResult.success ? "text-green-600" : "text-orange-600"
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm leading-relaxed">{paymentResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next Steps Sidebar */}
          <div className="space-y-6">
            {/* What's Next Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                What's Next?
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Access your dashboard immediately</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Start running SEO audits</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Track keywords and monitor progress</span>
                </li>
              </ul>
            </div>

            {/* Support Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Need Help?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Our support team is here to help you get started
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  info@rankseo.in
                </div>
                <div className="flex items-center text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  +91 9715092104
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {paymentResult?.success ? (
            <>
              <Link
                href="/profile/dashboard"
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Go to Dashboard
              </Link>
              <Link
                href="/audit"
                className="w-full sm:w-auto px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 text-center flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                Run Your First Audit
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={retryVerification}
                disabled={verifying}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg text-center flex items-center justify-center"
              >
                {verifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Retry Verification
                  </>
                )}
              </button>
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 text-center flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Back to Pricing
              </Link>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600 max-w-2xl mx-auto">
            {paymentResult?.success 
              ? "Your plan features are now active. Check your dashboard to explore all the tools available in your subscription."
              : "If you continue to experience issues, our support team is ready to help you complete your purchase."
            }
          </p>
          {!paymentResult?.success && (
            <div className="mt-4">
              <Link
                href="/support"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Support
                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}