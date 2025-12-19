"use client";
import React, { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  showSuccessAlert,
  showErrorAlert,
  showWarningAlert,
} from "@/components/Utils/alert-util";
import { useUser } from "@/components/context/UserContext";
const API_URL = process.env.NEXT_PUBLIC_API_URL;
import Metatags from "../../SEO/metatags";

const LoginPage = () => {
  const metaPropsData = {
    title: "Rank SEO Login | Access Your SEO Dashboard & Analytics",
    description:
      "Sign in to your Rank SEO account to access SEO audits, performance analytics, and website optimization tools. Manage your SEO campaigns more effectively now.",
    keyword:
      "rank seo login, seo tool login, access seo dashboard, website analytics login, seo audit tool, seo management",
    url: "https://rankseo.in/login",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();
  const { setUser } = useUser();

  const handleNext = async (e: FormEvent) => {
    e.preventDefault();

    if (!showPassword) {
      setShowPassword(true);
    } else {
      if (email && password) {
        try {
          const res = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();

          if (res.ok) {
            localStorage.setItem("token", data.token);

            // ✅ Update context immediately for standard login
            if (data.user) {
              setUser(data.user);
            } else {
              const meRes = await fetch(`${API_URL}/api/profile`, {
                headers: { Authorization: `Bearer ${data.token}` },
              });
              if (meRes.ok) {
                const meData = await meRes.json();
                setUser(meData);
              }
            }

            showSuccessAlert("Login successful!");
            router.push("/");
          } else {
            showWarningAlert(data.msg || "Invalid credentials");
          }
        } catch (error) {
          showErrorAlert("Error logging in");
        }
      } else {
        showWarningAlert("Please enter both email and password!");
      }
    }
  };

  const handleSocialLogin = (provider: "google" | "github") => {
    window.location.href = `${API_URL}/api/auth/${provider}`;
  };

  const socialButtonClass =
    "flex items-center justify-center w-full py-2 px-4 bg-gray-100 text-gray-800 rounded-full font-semibold transition-transform transform hover:scale-105 duration-200 cursor-pointer shadow-md";

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="flex items-center justify-center min-h-screen bg-blue-50 p-4">
        <div className="bg-white text-gray-900 p-8 rounded-2xl shadow-2xl max-w-sm w-full relative">
          {/* Logo and Title */}
          <div className="flex justify-center mb-6">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 ml-2">
              RankSeo
            </span>
          </div>
          <h1 className="text-3xl font-bold text-center mb-6">Sign in</h1>

          {/* Form */}
          <form onSubmit={handleNext} className="space-y-4">
            <input
              type="text"
              placeholder="Phone, email, or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-3 px-4 bg-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />

            <AnimatePresence>
              {showPassword && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-3 px-4 bg-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.button
                key={showPassword ? "login" : "next"}
                type="submit"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full py-3 px-4 bg-emerald-600 text-white rounded-full font-semibold shadow-lg hover:bg-emerald-500 cursor-pointer"
              >
                {showPassword ? "Login" : "Next"}
              </motion.button>
            </AnimatePresence>
          </form>

          <AnimatePresence>
            {showPassword && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center mt-4"
              >
                <Link
                  href="/forgotpassword"
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  Forgotten your password?
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-8 text-center text-gray-600">
            Don’t have an account?{" "}
            <Link href="/signup" className="text-emerald-600 hover:underline">
              Sign up
            </Link>
          </p>

          <div className="flex items-center my-4">
            <hr className="flex-grow border-gray-300" />
            <span className="px-2 text-gray-500">OR</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          <div className="space-y-4 mb-6">
            <button
              onClick={() => handleSocialLogin("google")}
              className={socialButtonClass}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="30"
                height="30"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#fbc02d"
                  d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20 s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                ></path>
                <path
                  fill="#e53935"
                  d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                ></path>
                <path
                  fill="#4caf50"
                  d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                ></path>
                <path
                  fill="#1565c0"
                  d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                ></path>
              </svg>
              Continue with Google
            </button>
            {/* <button
            onClick={() => handleSocialLogin("github")}
            className={socialButtonClass}
          >
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 64 64">
              <path d="M32 6C17.641 6 6 17.641 6 32c0 12.277 8.512 22.56 19.955 25.286-.592-.141-1.179-.299-1.755-.479V50.85c0 0-.975.325-2.275.325-3.637 0-5.148-3.245-5.525-4.875-.229-.993-.827-1.934-1.469-2.509-.767-.684-1.126-.686-1.131-.92-.01-.491.658-.471.975-.471 1.625 0 2.857 1.729 3.429 2.623 1.417 2.207 2.938 2.577 3.721 2.577.975 0 1.817-.146 2.397-.426.268-1.888 1.108-3.57 2.478-4.774-6.097-1.219-10.4-4.716-10.4-10.4 0-2.928 1.175-5.619 3.133-7.792C19.333 23.641 19 22.494 19 20.625c0-1.235.086-2.751.65-4.225 0 0 3.708.026 7.205 3.338C28.469 19.268 30.196 19 32 19s3.531.268 5.145.738c3.497-3.312 7.205-3.338 7.205-3.338.567 1.474.65 2.99.65 4.225 0 2.015-.268 3.19-.432 3.697C46.466 26.475 47.6 29.124 47.6 32c0 5.684-4.303 9.181-10.4 10.4 1.628 1.43 2.6 3.513 2.6 5.85v8.557c-.576.181-1.162.338-1.755.479C49.488 54.56 58 44.277 58 32 58 17.641 46.359 6 32 6zM33.813 57.93C33.214 57.972 32.61 58 32 58 32.61 58 33.213 57.971 33.813 57.93zM37.786 57.346c-1.164.265-2.357.451-3.575.554C35.429 57.797 36.622 57.61 37.786 57.346zM32 58c-.61 0-1.214-.028-1.813-.07C30.787 57.971 31.39 58 32 58zM29.788 57.9c-1.217-.103-2.411-.289-3.574-.554C27.378 57.61 28.571 57.797 29.788 57.9z"></path>
            </svg>
            Continue with Github
          </button> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
