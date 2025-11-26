"use client";
import React, { useState, useCallback, ReactNode, useEffect } from "react";
import {
  MessageCircle,
  Mail,
  FileText,
  HelpCircle,
  X,
  Search,
  ChevronDown,
  History,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Metatags from "../../../SEO/metatags";

const metaPropsData = {
  title: "Support Center - SEO Tool Help & Customer Assistance",
  description:
    "Get expert help with RANK SEO tools, access our knowledge base, contact our support team, and find troubleshooting guides for SEO audit and analysis tools.",
  keyword:
    "seo tool support, customer help, technical support, troubleshooting guides, contact support",
  url: "https://rankseo.in/profile/support",
  image: "https://rankseo.in/SEO_LOGO.png",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// --- Type Definitions ---
interface CardProps {
  children: ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

interface ButtonProps {
  children: ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  size?: "default" | "sm" | "lg";
}

interface InputProps {
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  id?: string;
}

interface TextareaProps {
  className?: string;
  rows?: number;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  id?: string;
}

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "secondary" | "outline" | "success" | "warning";
  className?: string;
  onClick?: () => void;
}

interface DialogProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

interface KnowledgeBaseProps {
  onOpenModal: (type: string) => void;
}

interface QuickResourcesProps {
  onOpenModal: (type: string) => void;
}

interface MessageHistoryProps {
  messages: any[];
  isLoading: boolean;
}

// --- Mock UI Components ---
const Card = ({ children, className = "" }: CardProps) => (
  <div
    className={`rounded-xl border bg-card text-card-foreground shadow-lg ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: CardHeaderProps) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }: CardTitleProps) => (
  <h3
    className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
  >
    {children}
  </h3>
);

const CardDescription = ({
  children,
  className = "",
}: CardDescriptionProps) => (
  <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
);

const CardContent = ({ children, className = "" }: CardContentProps) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({
  children,
  variant = "default",
  className = "",
  onClick,
  type = "button",
  disabled = false,
  size = "default",
  ...props
}: ButtonProps) => {
  let style = "bg-primary text-primary-foreground hover:bg-primary/90";
  if (variant === "outline") {
    style =
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground";
  } else if (variant === "secondary") {
    style = "bg-secondary text-secondary-foreground hover:bg-secondary/80";
  } else if (variant === "ghost") {
    style = "hover:bg-accent hover:text-accent-foreground";
  }

  const sizeStyle =
    size === "sm"
      ? "h-8 px-3 text-xs"
      : size === "lg"
      ? "h-12 px-6 text-base"
      : "h-10 px-4 py-2 text-sm";

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${style} ${sizeStyle} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = "", ...props }: InputProps) => (
  <input
    className={`flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Textarea = ({ className = "", rows = 3, ...props }: TextareaProps) => (
  <textarea
    className={`flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    rows={rows}
    {...props}
  />
);

const Badge = ({
  children,
  variant = "default",
  className = "",
  onClick,
}: BadgeProps) => {
  let style = "bg-primary text-primary-foreground hover:bg-primary/80";
  if (variant === "secondary") {
    style = "bg-secondary text-secondary-foreground hover:bg-secondary/80";
  } else if (variant === "outline") {
    style = "text-foreground border border-input";
  } else if (variant === "success") {
    style =
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-800/30 dark:text-green-400";
  } else if (variant === "warning") {
    style =
      "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-800/30 dark:text-yellow-400";
  }

  const clickableStyle = onClick ? "cursor-pointer" : "";

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${style} ${clickableStyle} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// --- Dialog ---
const Dialog = ({ isOpen, title, children, onClose }: DialogProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl transition-all duration-300 transform scale-100 opacity-100 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b bg-white dark:bg-gray-800 rounded-t-xl">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
          </Button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
};

// --- FAQ Item Type ---
interface FAQItem {
  q: string;
  a: string;
  category: string;
}

// --- Content Data based on rankseo.in context ---
const documentationContent = (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      RankSEO's platform provides a comprehensive suite of AI-powered tools for
      professional SEO analysis, guiding you from audit to action.
    </p>

    <h3 className="text-lg font-semibold text-foreground">
      Core Services & Features
    </h3>
    <ul className="space-y-3 list-none pl-0">
      <li className="flex items-start">
        <FileText className="w-5 h-5 text-indigo-500 mr-3 mt-1 flex-shrink-0" />
        <div>
          <strong className="block text-sm">Detailed SEO Analysis</strong>
          <p className="text-sm text-muted-foreground">
            Performs deep technical and on-page audits, analyzing over 200
            ranking factors, identifying errors in meta tags, content structure,
            and technical SEO issues.
          </p>
        </div>
      </li>
      <li className="flex items-start">
        <MessageCircle className="w-5 h-5 text-indigo-500 mr-3 mt-1 flex-shrink-0" />
        <div>
          <strong className="block text-sm">
            Keyword Insights & Optimization
          </strong>
          <p className="text-sm text-muted-foreground">
            Utilizes AI to discover high-impact keyword opportunities, analyze
            competitor targeting, and identify content gaps specific to your
            market for better visibility.
          </p>
        </div>
      </li>
      <li className="flex items-start">
        <Badge
          variant="default"
          className="w-5 h-5 text-indigo-500 mr-3 mt-1 flex-shrink-0"
        >
          !
        </Badge>
        <div>
          <strong className="block text-sm">
            Performance Monitoring & Security
          </strong>
          <p className="text-sm text-muted-foreground">
            Tracks crucial site speed metrics, Core Web Vitals, and continuously
            checks for security vulnerabilities like SSL issues that affect
            search engine trust.
          </p>
        </div>
      </li>
      <li className="flex items-start">
        <HelpCircle className="w-5 h-5 text-indigo-500 mr-3 mt-1 flex-shrink-0" />
        <div>
          <strong className="block text-sm">Actionable PDF Reports</strong>
          <p className="text-sm text-muted-foreground">
            Generate branded, professional, and detailed PDF reports of audit
            findings and progress tracking to share with clients or internal
            stakeholders.
          </p>
        </div>
      </li>
    </ul>
  </div>
);

const faqItems: FAQItem[] = [
  {
    q: "What is SEO and why is it important?",
    a: "Search Engine Optimization (SEO) is the process of improving your website's visibility and position in search engine results pages (SERPs). It's crucial because the higher your rank, the more organic, free traffic you receive. The first organic result typically captures over 27% of clicks.",
    category: "General",
  },
  {
    q: "How does an AI SEO tool like RankSEO work?",
    a: "AI SEO tools, like RankSEO, leverage machine learning and natural language processing (NLP) to automate complex tasks. They analyze vast datasets in real-time, predict search trends, identify technical issues, optimize content for user intent, and provide prioritized, actionable recommendations much faster than manual processes.",
    category: "Technical",
  },
  {
    q: "Can AI replace human SEO experts?",
    a: "No. AI is a powerful assistant, not a replacement. AI excels at analyzing data and automating repetitive tasks, but human experts are essential for strategic vision, creative content direction, ethical judgment, and nuanced problem-solving. The best results come from 'human-with-AI' collaboration.",
    category: "General",
  },
  {
    q: "How often should I run an SEO audit?",
    a: "While monitoring should be continuous, a deep, comprehensive SEO audit is typically recommended monthly or quarterly for small to mid-sized sites to ensure consistent alignment with search engine updates and to track the impact of previous fixes.",
    category: "Best Practices",
  },
  {
    q: "Will using an AI SEO tool guarantee first-page rankings?",
    a: "No tool can guarantee first-page rankings. RankSEO provides the most accurate analysis and actionable insights to give you a significant competitive advantage. Success ultimately depends on the quality of your content, the consistency of your optimization efforts, and the overall authority of your domain.",
    category: "General",
  },
  {
    q: "Is an AI SEO tool suitable for beginners?",
    a: "Yes, absolutely. AI SEO tools are designed to simplify complex SEO tasks. RankSEO provides easy-to-understand, prioritized recommendations, making high-impact SEO accessible even to users with no prior technical expertise. It helps beginners focus on what truly matters first.",
    category: "Getting Started",
  },
];

// --- Message History Component ---
const MessageHistory = ({ messages, isLoading }: MessageHistoryProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "new":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-blue-600 dark:text-blue-400">
            <History className="w-5 h-5 mr-3" />
            Message History
          </CardTitle>
          <CardDescription>Loading your support messages...</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-blue-600 dark:text-blue-400">
          <History className="w-5 h-5 mr-3" />
          Message History
        </CardTitle>
        <CardDescription>
          Your previous support requests and their status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No support messages yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Your support requests will appear here.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-foreground">
                  {message.subject}
                </h4>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(message.status)}
                  <Badge variant="outline" className="text-xs capitalize">
                    {message.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {message.message}
              </p>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <div className="flex space-x-2">
                  <Badge
                    variant="outline"
                    className={`capitalize ${getPriorityColor(
                      message.priority
                    )}`}
                  >
                    {message.priority}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {message.type}
                  </Badge>
                </div>
                <span>{new Date(message.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

// --- Knowledge Base Component ---
const KnowledgeBase = ({ onOpenModal }: KnowledgeBaseProps) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedItems, setExpandedItems] = useState<{
    [key: number]: boolean;
  }>({});

  const categories = ["All", ...new Set(faqItems.map((item) => item.category))];

  const toggleExpand = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const filteredFaqs = faqItems.filter((item) => {
    const matchesSearch =
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card className="hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-600 dark:text-purple-400">
          <Search className="w-5 h-5 mr-3" />
          Knowledge Base
        </CardTitle>
        <CardDescription>
          Search our comprehensive knowledge base for instant answers to common
          questions.
        </CardDescription>

        {/* Search and Filter */}
        <div className="space-y-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search for answers..."
              className="pl-10"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  selectedCategory === category
                    ? "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-800/30 dark:text-purple-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-8">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              No results found. Try a different search term.
            </p>
          </div>
        ) : (
          filteredFaqs.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
            >
              <button
                className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"
                onClick={() => toggleExpand(index)}
              >
                <span className="font-medium text-foreground pr-4">
                  {item.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    expandedItems[index] ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedItems[index] && (
                <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-600">
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                  <div className="flex justify-between items-center mt-3">
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => onOpenModal("faq")}
                    >
                      View All FAQs
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

// --- Contact Form Component ---
const ContactForm = () => {
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    priority: "medium",
    type: "technical",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to send a message");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSubmitted(true);
      setFormData({
        subject: "",
        message: "",
        priority: "medium",
        type: "technical",
      });

      // Refresh message history
      window.dispatchEvent(new Event("refreshMessages"));
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-hide success message
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        setSubmitted(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitted]);

  if (submitted) {
    return (
      <Card className="hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Message Sent Successfully!
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            We've received your message and will get back to you within 24
            hours.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center text-indigo-600 dark:text-indigo-400">
          <Mail className="w-5 h-5 mr-3" />
          Contact Support
        </CardTitle>
        <CardDescription>
          Send us a direct message and we'll reply to your email as soon as
          possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Issue Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="technical">Technical Issue</option>
                <option value="billing">Billing Question</option>
                <option value="feature">Feature Request</option>
                <option value="general">General Inquiry</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange("priority", e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Subject
            </label>
            <Input
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              placeholder="What can we help you with?"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Message
            </label>
            <Textarea
              value={formData.message}
              onChange={(e) => handleChange("message", e.target.value)}
              placeholder="Describe your issue or question in detail..."
              rows={5}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition duration-150"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// --- Quick Resources Component ---
const QuickResources = ({ onOpenModal }: QuickResourcesProps) => {
  const resources = [
    {
      icon: FileText,
      title: "Platform Documentation & Guides",
      description: "Complete guides and technical documentation",
      variant: "indigo",
      onClick: () => onOpenModal("documentation"),
    },
    {
      icon: HelpCircle,
      title: "Frequently Asked Questions",
      description: "Quick answers to common questions",
      variant: "green",
      onClick: () => onOpenModal("faq"),
    },
    {
      icon: MessageCircle,
      title: "Community Forum",
      description: "Connect with other RankSEO users",
      variant: "blue",
      onClick: () => alert("Community forum coming soon!"),
    },
  ];

  const getVariantClasses = (variant: string) => {
    const classes: { [key: string]: string } = {
      indigo:
        "border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-50 dark:hover:bg-gray-700/50 text-indigo-500",
      green:
        "border-green-200 dark:border-green-800/50 hover:bg-green-50 dark:hover:bg-gray-700/50 text-green-500",
      blue: "border-blue-200 dark:border-blue-800/50 hover:bg-blue-50 dark:hover:bg-gray-700/50 text-blue-500",
    };
    return classes[variant] || classes.indigo;
  };

  return (
    <Card className="hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center text-green-600 dark:text-green-400">
          <HelpCircle className="w-5 h-5 mr-3" />
          Quick Resources
        </CardTitle>
        <CardDescription>
          Instant answers and essential guides for the RankSEO platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {resources.map((resource, index) => (
          <Button
            key={index}
            variant="outline"
            className={`w-full justify-start bg-transparent transition duration-150 ${getVariantClasses(
              resource.variant
            )}`}
            onClick={resource.onClick}
          >
            <resource.icon className="w-4 h-4 mr-3" />
            <div className="text-left">
              <div className="font-medium text-foreground">
                {resource.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {resource.description}
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

// --- FAQ Content for Modal ---
const faqContent = (
  <div className="space-y-6">
    {faqItems.map((item, index) => (
      <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
        <div className="flex items-start justify-between mb-1">
          <h4 className="font-semibold text-base text-foreground">
            Q: {item.q}
          </h4>
          <Badge variant="outline" className="ml-2 flex-shrink-0">
            {item.category}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">A: {item.a}</p>
      </div>
    ))}
  </div>
);

// --- Main Component ---
export default function SupportPage() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalContent, setModalContent] = useState<ReactNode>(null);
  const [messageHistory, setMessageHistory] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);

  // In the fetchMessageHistory function in page.tsx
  const fetchMessageHistory = async () => {
    try {
      setIsLoadingMessages(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoadingMessages(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/contact/my-messages`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setMessageHistory(data.messages || []);
      } else if (res.status === 404) {
        console.log(
          "Messages endpoint not found - this is normal for new installations"
        );
        setMessageHistory([]);
      } else {
        console.error("Failed to fetch messages:", res.status);
        setMessageHistory([]);
      }
    } catch (error) {
      console.error("Error fetching message history:", error);
      setMessageHistory([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Fetch message history on component mount and when refresh event is triggered
  useEffect(() => {
    fetchMessageHistory();

    const handleRefreshMessages = () => {
      fetchMessageHistory();
    };

    window.addEventListener("refreshMessages", handleRefreshMessages);

    return () => {
      window.removeEventListener("refreshMessages", handleRefreshMessages);
    };
  }, []);

  const handleOpenModal = useCallback((type: string) => {
    if (type === "documentation") {
      setModalTitle("Documentation: RankSEO Platform Overview");
      setModalContent(documentationContent);
    } else if (type === "faq") {
      setModalTitle("Frequently Asked Questions");
      setModalContent(faqContent);
    }
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setModalTitle("");
    setModalContent(null);
  }, []);

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="p-6 md:p-10 lg:p-12 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Support Center
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
            Get immediate help, browse our knowledge base, or contact our
            dedicated support team. We're here to help you succeed.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Contact Form and Knowledge Base */}
          <div className="lg:col-span-2 space-y-8">
            <ContactForm />
            <KnowledgeBase onOpenModal={handleOpenModal} />
          </div>

          {/* Right Column - Quick Resources, Message History, and Support Status */}
          <div className="space-y-8">
            <QuickResources onOpenModal={handleOpenModal} />
            <MessageHistory
              messages={messageHistory}
              isLoading={isLoadingMessages}
            />

            {/* Support Status */}
            <Card className="hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-orange-600 dark:text-orange-400">
                  Support Status
                </CardTitle>
                <CardDescription>
                  Current system status and response times
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">System Status</span>
                  <Badge variant="success">All Systems Operational</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg. Response Time</span>
                  <Badge variant="outline">Under 4 hours</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Support Hours</span>
                  <Badge variant="outline">24/7</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dynamic Content Modal */}
        <Dialog
          isOpen={isModalOpen}
          title={modalTitle}
          onClose={handleCloseModal}
        >
          {modalContent}
        </Dialog>
      </div>
    </>
  );
}
