"use client";

import { useState, useEffect } from "react";
import { GeneratorHeader, NameResults } from "./frontend";
import { Building2, Zap, Target, Palette } from "lucide-react";

interface BusinessName {
  name: string;
  style: string;
  tagline: string;
}
import Metatags from "../../SEO/metatags";

const N8N_WEBHOOK_URL =
  "https://n8n.cybomb.com/webhook/Business-name-generator";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function BusinessNameGeneratorPage() {
  const [industry, setIndustry] = useState("");
  const [audience, setAudience] = useState("");
  const [style, setStyle] = useState("");
  const [names, setNames] = useState<BusinessName[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  // Get token from localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  useEffect(() => {
    setIsVisible(true);

    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const saveNamesToDatabase = async (
    namesToSave: BusinessName[]
  ): Promise<boolean> => {
    if (!namesToSave.length) return false;

    const token = getToken();
    if (!token) {
      console.error("No authentication token found");
      return false;
    }

    setSaving(true);
    try {
      const sessionId = `sess_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const saveResponse = await fetch(`${API_BASE_URL}/api/business/names`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          names: namesToSave,
          industry,
          audience,
          stylePreference: style,
          sessionId,
        }),
      });

      if (!saveResponse.ok) {
        if (saveResponse.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return false;
        }
        throw new Error(`Save failed: ${saveResponse.status}`);
      }

      const saveResult = await saveResponse.json();
      console.log("Names saved to database:", saveResult.data);
      return true;
    } catch (error) {
      console.error("Error saving to database:", error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateNames = async () => {
    if (!industry || !audience || !style) {
      alert("Please complete all fields to generate names.");
      return;
    }

    setLoading(true);
    setNames([]);

    const token = getToken();
    if (!token) {
      alert("Please log in to generate names.");
      setLoading(false);
      return;
    }

    try {
      // Generate names through backend to check usage limits
      const generateResponse = await fetch(
        `${API_BASE_URL}/api/business/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ industry, audience, style }),
        }
      );

      if (!generateResponse.ok) {
        if (generateResponse.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        if (generateResponse.status === 403) {
          const errorData = await generateResponse.json();
          alert(
            errorData.message ||
              "Usage limit reached. Please upgrade your plan."
          );
          return;
        }
        throw new Error(`Generation failed: ${generateResponse.status}`);
      }

      const responseData = await generateResponse.json();

      const businessNames = responseData.data.names.map((item: any) => ({
        name: item.name || "Unnamed",
        style: item.style || "General",
        tagline: item.tagline || "",
      }));

      setNames(businessNames);

      // Save to MongoDB in background (silently)
      saveNamesToDatabase(businessNames);
    } catch (err: any) {
      console.error("Generation failed:", err.message);
      alert("Name generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Zap,
      title: "AI-Powered",
      desc: "Advanced algorithms generate unique, brandable names",
    },
    {
      icon: Target,
      title: "Targeted",
      desc: "Precisely tailored to your audience and industry",
    },
    {
      icon: Palette,
      title: "Style-Matched",
      desc: "Aligned with your preferred brand aesthetic",
    },
  ];

  const metaPropsData = {
    title: "Business Name Generator - Creative Company & Brand Ideas",
    description:
      "Generate unique business and brand names instantly with our AI-powered name generator. Get creative company names, taglines, and branding ideas for your startup or business venture.",
    keyword:
      "company naming ideas, business name generator, brand name generator, business name builder, business name ideas",
    url: "https://rankseo.in/business-name-generator",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen pt-12 sm:pt-16 bg-gradient-to-br from-background via-color-mix(in oklab, var(--primary) 2%, transparent) to-color-mix(in oklab, var(--secondary) 1%, transparent) relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-20 left-5% w-40 h-40 bg-color-mix(in oklab, var(--primary) 8%, transparent) rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-30 right-10% w-32 h-32 bg-color-mix(in oklab, var(--secondary) 6%, transparent) rounded-full blur-2xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-40 right-25% w-24 h-24 bg-color-mix(in oklab, var(--accent) 5%, transparent) rounded-full blur-xl animate-pulse-slow delay-500"></div>

        <div
          className={`relative transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <GeneratorHeader
            industry={industry}
            setIndustry={setIndustry}
            audience={audience}
            setAudience={setAudience}
            style={style}
            setStyle={setStyle}
            loading={loading}
            handleGenerateNames={handleGenerateNames}
          />

          <div className="container mx-auto py-12 px-4 sm:px-6 md:px-8">
            {names.length > 0 && (
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold text-foreground mb-3">
                  Suggested Names for Your Business
                </h2>
                <p className="text-muted-foreground text-lg">
                  {names.length} expertly crafted names for your {industry}{" "}
                  business
                </p>
              </div>
            )}

            {names.length > 0 && <NameResults names={names} />}

            {!names.length && !loading && (
              <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-10 items-center">
                  {/* Feature Showcase */}
                  <div className="space-y-8">
                    <div className="text-center lg:text-left">
                      <h2 className="text-4xl font-bold text-foreground mb-4">
                        Build Your Brand Identity
                      </h2>
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        Generate professional business names that resonate with
                        your target market and reflect your brand's unique
                        personality.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {features.map((feature, index) => (
                        <div
                          key={index}
                          className={`flex items-center space-x-4 p-4 rounded-2xl border transition-all duration-500 ${
                            activeFeature === index
                              ? "border-color-mix(in oklab, var(--primary) 30%, transparent) bg-color-mix(in oklab, var(--primary) 3%, transparent) shadow-lg"
                              : "border-color-mix(in oklab, var(--ring) 10%, transparent) bg-background/50"
                          }`}
                        >
                          <div
                            className={`p-3 rounded-xl transition-colors ${
                              activeFeature === index
                                ? "bg-primary text-primary-foreground"
                                : "bg-color-mix(in oklab, var(--primary) 8%, transparent) text-primary"
                            }`}
                          >
                            <feature.icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {feature.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {feature.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats Card */}
                  <div className="bg-background/80 backdrop-blur-md rounded-3xl p-8 border border-color-mix(in oklab, var(--ring) 15%, transparent) shadow-2xl">
                    <div className="text-center space-y-6">
                      <Building2 className="h-16 w-16 text-primary mx-auto" />
                      <h3 className="text-2xl font-bold text-foreground">
                        Ready to Launch?
                      </h3>
                      <p className="text-muted-foreground">
                        Start by defining your business profile to generate
                        professional, market-ready names.
                      </p>

                      <div className="grid grid-cols-3 gap-4 pt-4">
                        {[
                          ["50K+", "Names Generated"],
                          ["95%", "Satisfaction"],
                          ["24/7", "AI Powered"],
                        ].map(([value, label], idx) => (
                          <div
                            key={idx}
                            className="text-center p-3 rounded-xl bg-color-mix(in oklab, var(--primary) 3%, transparent)"
                          >
                            <div className="font-bold text-foreground text-lg">
                              {value}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-16 space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-color-mix(in oklab, var(--primary) 20%, transparent) rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-foreground font-semibold">
                    Rank SEO AI is crafting your professional names
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Analyzing market trends and brand positioning...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse-slow {
            0%,
            100% {
              opacity: 0.3;
            }
            50% {
              opacity: 0.6;
            }
          }
          .animate-pulse-slow {
            animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
      </div>
    </>
  );
}
