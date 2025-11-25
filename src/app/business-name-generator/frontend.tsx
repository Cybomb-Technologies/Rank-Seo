"use client";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Sparkles,
  Target,
  Palette,
  Users,
  Building2,
  ArrowRight,
} from "lucide-react";

interface BusinessName {
  name: string;
  style: string;
  tagline: string;
}

function GeneratorHeader({
  industry,
  setIndustry,
  audience,
  setAudience,
  style,
  setStyle,
  loading,
  handleGenerateNames,
}: any) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="container mx-auto px-4 pt-4 md:px-6">
      <Card
        className={`rounded-3xl shadow-2xl bg-background/80 backdrop-blur-md border border-color-mix(in oklab, var(--ring) 15%, transparent) transition-all duration-700 ${
          isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <CardContent className="p-8 md:p-10 space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center space-x-3 mb-2">
              <div className="relative">
                <Building2 className="h-10 w-10 text-primary" />
                <Sparkles className="h-5 w-5 text-primary absolute -top-1 -right-1" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Business Name Generator
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              AI-powered business name generation for modern entrepreneurs and
              established brands
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <label className="flex items-center text-sm font-semibold text-foreground">
                <Target className="h-4 w-4 mr-2 text-primary" />
                Industry Sector
              </label>
              <Input
                placeholder="Technology, Healthcare, Retail..."
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="rounded-xl border-color-mix(in oklab, var(--ring) 20%, transparent) focus:border-primary transition-all duration-300 h-12 text-foreground bg-background"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center text-sm font-semibold text-foreground">
                <Users className="h-4 w-4 mr-2 text-primary" />
                Target Demographic
              </label>
              <Input
                placeholder="Enterprise, Consumers, Youth..."
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="rounded-xl border-color-mix(in oklab, var(--ring) 20%, transparent) focus:border-primary transition-all duration-300 h-12 text-foreground bg-background"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center text-sm font-semibold text-foreground">
                <Palette className="h-4 w-4 mr-2 text-primary" />
                Brand Aesthetic
              </label>
              <Input
                placeholder="Modern, Luxury, Minimalist..."
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="rounded-xl border-color-mix(in oklab, var(--ring) 20%, transparent) focus:border-primary transition-all duration-300 h-12 text-foreground bg-background"
              />
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={handleGenerateNames}
              disabled={loading}
              className="px-10 py-3 mx-auto rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                {loading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" />
                    Generate Names
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NameResults({ names }: { names: BusinessName[] }) {
  const [visibleCards, setVisibleCards] = useState<boolean[]>([]);

  useEffect(() => {
    const delays = names.map((_, index) =>
      setTimeout(() => {
        setVisibleCards((prev) => {
          const newVisible = [...prev];
          newVisible[index] = true;
          return newVisible;
        });
      }, index * 100)
    );

    return () => delays.forEach(clearTimeout);
  }, [names]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {names.map((item, idx) => (
        <Card
          key={idx}
          className={`rounded-2xl shadow-lg bg-background/60 backdrop-blur-sm border border-color-mix(in oklab, var(--ring) 15%, transparent) hover:shadow-xl hover:border-color-mix(in oklab, var(--ring) 30%, transparent) transition-all duration-500 transform hover:-translate-y-1 ${
            visibleCards[idx]
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-foreground truncate">
                  {item.name}
                </h3>
              </div>
              <div className="bg-color-mix(in oklab, var(--primary) 15%, transparent) text-primary text-xs font-semibold px-3 py-1 rounded-full ml-3 flex-shrink-0">
                {idx + 1}
              </div>
            </div>

            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-primary mr-3"></span>
              <span className="text-sm font-medium text-muted-foreground bg-color-mix(in oklab, var(--primary) 5%, transparent) px-3 py-1 rounded-full">
                {item.style}
              </span>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed border-l-2 border-color-mix(in oklab, var(--primary) 30%, transparent) pl-4 py-1">
              {item.tagline}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const N8N_WEBHOOK_URL =
  "https://n8n.cybomb.com/webhook/business-name-generator";

export default function BusinessNameGeneratorPage() {
  const [industry, setIndustry] = useState("");
  const [audience, setAudience] = useState("");
  const [style, setStyle] = useState("");
  const [names, setNames] = useState<BusinessName[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("Initializing...");

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startProgressAnimation = () => {
    setProgress(0);
    setLoadingStep("Analyzing your inputs...");
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev < 90 ? prev + Math.random() * 5 : prev;
        if (newProgress > 20 && newProgress <= 40)
          setLoadingStep("Generating creative names...");
        else if (newProgress > 40 && newProgress <= 60)
          setLoadingStep("Crafting taglines...");
        else if (newProgress > 60 && newProgress <= 80)
          setLoadingStep("Refining brand styles...");
        else if (newProgress > 80) setLoadingStep("Finalizing results...");
        return newProgress;
      });
    }, 500);
  };

  const stopProgressAnimation = (complete = false) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setProgress(complete ? 100 : 0);
    if (complete) {
      setLoadingStep("Done! Preparing names...");
      setTimeout(() => setLoadingStep("Names ready!"), 800);
    }
  };

  const handleGenerateNames = async () => {
    if (!industry || !audience || !style) {
      alert("⚠️ Please fill in all fields.");
      return;
    }

    setLoading(true);
    setNames([]);
    startProgressAnimation();

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry,
          audience,
          style,
        }),
      });

      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const responseData = await response.json();

      let namesArray: any[] = [];
      if (Array.isArray(responseData)) {
        if (responseData[0]?.output) {
          const outputString = responseData[0].output
            .replace(/```json\n?|```/g, "")
            .trim();
          namesArray = JSON.parse(outputString);
        } else {
          namesArray = responseData;
        }
      } else if (responseData.output) {
        const outputString = responseData.output
          .replace(/```json\n?|```/g, "")
          .trim();
        namesArray = JSON.parse(outputString);
      }

      const cleanedNames: BusinessName[] = Array.isArray(namesArray)
        ? namesArray
            .map((item: any) => ({
              name: item.name || "N/A",
              style: item.style || "N/A",
              tagline: item.tagline || "No tagline provided.",
            }))
            .filter((item: BusinessName) => item.name !== "N/A")
        : [];

      setNames(cleanedNames);
      stopProgressAnimation(true);
    } catch (err: any) {
      console.error("⚠️ Name generation failed:", err.message);
      alert("Something went wrong while generating names.");
      stopProgressAnimation();
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  return (
    <>
      {/* <Metatags metaProps={metaPropsData} /> */}
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white py-8">
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

        <div className="container mx-auto py-12 px-6">
          {names.length > 0 && <NameResults names={names} />}

          {!names.length && !loading && (
            <div className="bg-white rounded-2xl p-12 shadow-md border border-gray-200 text-center text-gray-500">
              <Sparkles size={48} className="text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2 text-gray-800">
                Ready to Discover Business Names?
              </h3>
              <p className="mb-6">
                Fill out the form above to generate AI-powered business name
                ideas.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <Target size={16} className="text-primary" /> Define your
                  industry
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Users size={16} className="text-primary" /> Choose your
                  audience
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Palette size={16} className="text-primary" /> Select your
                  style
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto mb-4">
                <div className="bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-primary/70 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{loadingStep}</p>
                <p className="text-xs text-gray-500">
                  {Math.round(progress)}% complete
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
export { GeneratorHeader, NameResults };
