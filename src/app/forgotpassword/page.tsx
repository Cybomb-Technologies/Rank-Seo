"use client";
import React, { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  showSuccessAlert,
  showErrorAlert,
  showWarningAlert,
} from "@/components/Utils/alert-util";
import Metatags from "../../SEO/metatags";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [showOtp, setShowOtp] = useState<boolean>(false);
  const [showReset, setShowReset] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!showOtp && !showReset) {
      // Stage 1: Send OTP
      try {
        const res = await fetch(`${API_URL}/api/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        if (res.ok) {
          showSuccessAlert(data.msg);
          setShowOtp(true);
        } else {
          showErrorAlert(data.msg || "Failed to send OTP.");
        }
      } catch (error) {
        showErrorAlert("Error sending OTP.");
      }
    } else if (showOtp && !showReset) {
      // Stage 2: Verify OTP
      setShowReset(true);
      setShowOtp(false);
    } else if (showReset) {
      // Stage 3: Reset Password
      if (newPassword !== confirmPassword) {
        showWarningAlert("Passwords do not match!");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp, newPassword }),
        });
        const data = await res.json();
        if (res.ok) {
          showSuccessAlert(data.msg);
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else {
          showErrorAlert(data.msg || "Password reset failed.");
        }
      } catch (error) {
        showErrorAlert("Error resetting password.");
      }
    }
  };

  const metaPropsData = {
    title: "Rank SEO - Forgot Password | Secure Account Recovery Tool",
    description:
      "Rank SEO account recovery solution. Securely reset password with robust OTP verification and quick step-by-step automated access restoration process tool now.",
    keyword:
      "rank seo forgot password, password reset, rank seo account recovery, otp verification, reset password, secure password recovery",
    url: "https://rankseo.in/forgotpassword",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="flex items-center justify-center min-h-screen bg-blue-50 p-4">
        <div className="bg-white text-gray-900 p-8 rounded-2xl shadow-2xl max-w-sm w-full relative">
          {/* Back Button */}
          <Link
            href="/login"
            className="absolute top-4 left-4 text-gray-500 hover:text-gray-900 transition-colors duration-200"
            aria-label="Back to login"
          >
            ←
          </Link>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-6">
            Forgot Password
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            {!showOtp && !showReset && (
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 px-4 bg-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                required
              />
            )}

            {/* OTP Input */}
            <AnimatePresence>
              {showOtp && !showReset && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full py-3 px-4 bg-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* New Password + Confirm Password */}
            <AnimatePresence>
              {showReset && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full py-3 px-4 bg-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full py-3 px-4 bg-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Button with animation */}
            <AnimatePresence mode="wait">
              <motion.button
                key={showReset ? "reset" : showOtp ? "verify" : "send"}
                type="submit"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full py-3 px-4 bg-emerald-600 text-white rounded-full font-semibold shadow-lg hover:bg-emerald-500 cursor-pointer"
              >
                {showReset
                  ? "Reset Password"
                  : showOtp
                  ? "Verify OTP"
                  : "Send OTP"}
              </motion.button>
            </AnimatePresence>
          </form>

          {/* Back to login */}
          <p className="mt-8 text-center text-gray-600">
            Remember your password?{" "}
            <Link href="/login" className="text-emerald-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
