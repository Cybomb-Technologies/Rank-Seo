"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"
import { Menu, Search, BarChart3, Zap, Shield, TrendingUp, FileText, Lightbulb, CheckCircle } from "lucide-react" // Added FileText, Lightbulb, CheckCircle for new section
import { SeoGraph } from "@/components/seo-graph" 
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolledPastBanner, setIsScrolledPastBanner] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledPastBanner(window.scrollY > window.innerHeight * 0.8)
    }
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="relative w-full h-full pt-35 pb-16 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/banner.png')" }}
      >
        <div className="absolute inset-0 bg-black/80"></div>
        <div className="relative container mx-auto text-center max-w-4xl text-white">
          <Badge variant="secondary" className="mb-4">
            Professional SEO Analysis
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Comprehensive SEO Audits for
            <span className="text-primary"> Better Rankings</span>
          </h1>
          <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            Get detailed SEO and performance reports with actionable insights. Identify issues, track improvements, and
            boost your website&apos;s search rankings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/audit">
              <Button size="lg" className="text-lg px-8 sm:w-auto">
                Start Free Audit
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-2xl font-bold">500K+</h3>
              <p className="text-light-foreground">Audits Completed</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold">98%</h3>
              <p className="text-light-foreground">Accuracy Rate</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold">24/7</h3>
              <p className="text-light-foreground">Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30" id="Features">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 text-primary">
              Everything You Need for SEO Success
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Our comprehensive platform provides detailed analysis and actionable recommendations to improve your
              website&apos;s search engine performance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader className="text-center sm:text-left">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Detailed SEO Analysis</CardTitle>
                <CardDescription>
                  Comprehensive analysis of on-page SEO factors, meta tags, content optimization, and technical SEO issues.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader className="text-center sm:text-left">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Performance Monitoring</CardTitle>
                <CardDescription>
                  Track page speed, Core Web Vitals, and performance metrics that impact your search rankings.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader className="text-center sm:text-left">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Progress Tracking</CardTitle>
                <CardDescription>
                  Monitor improvements over time with historical data and track the impact of your SEO efforts.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader className="text-center sm:text-left">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Security Analysis</CardTitle>
                <CardDescription>
                  Check for security issues, SSL certificates, and other factors that affect search engine trust.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader className="text-center sm:text-left">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Keyword Insights</CardTitle>
                <CardDescription>
                  Discover keyword opportunities and analyze how well your content targets important search terms.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader className="text-center sm:text-left">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg sm:text-xl">PDF Reports</CardTitle>
                <CardDescription>
                  Generate professional PDF reports to share with clients or stakeholders with detailed findings.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* From Audit to Action Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              From Audit to Action: Grow Your Rankings in 3 Simple Steps
            </h2>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between md:gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center flex-1 min-w-0">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4 border-4 border-blue-500">
                <FileText className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">1. Audit Your Site</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[250px]">
                Our AI tool performs a deep, comprehensive audit, analyzing 200+ ranking factors for technical errors, content gaps, and security vulnerabilities.
              </p>
            </div>

            {/* Separator 1 */}
            <div className="hidden md:block w-[100px] h-px bg-gray-300 relative">
              <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-gray-300 transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center flex-1 min-w-0">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-4 border-4 border-green-500">
                <Lightbulb className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">2. Get Actionable Insights</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[250px]">
                We don&apos;t just show problems; provide a prioritized, easy-to-understand list of high-impact recommendations to make first.
              </p>
            </div>

            {/* Separator 2 */}
            <div className="hidden md:block w-[100px] h-px bg-gray-300 relative">
              <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-gray-300 transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center flex-1 min-w-0">
              <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center mb-4 border-4 border-purple-500">
                <TrendingUp className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">3. Track Your Progress</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[250px]">
                Monitor your site&apos;s performance in real-time with our live dashboard, tracking keyword rankings, traffic growth, and regular reports.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Live Graph Section - NEW */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              See How You Stack Up Against Competitors
            </h2>
          </div>
          <SeoGraph />
        </div>
      </section>
      ---
{/* Comparison Section - NEW */}
<section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
  <div className="container mx-auto max-w-6xl">
    <div className="text-center mb-12">
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
        Our AI Tool vs Manual SEO
      </h2>
      <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        See how our AI-powered platform gives you an unfair advantage by automating tasks and providing actionable insights that would take days to find manually.
      </p>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-4 px-6 text-xl font-bold text-foreground bg-muted/30">Feature</th>
            <th className="py-4 px-6 text-xl font-bold text-foreground bg-blue-50 dark:bg-blue-950">Our AI Tool</th>
            <th className="py-4 px-6 text-xl font-bold text-foreground bg-gray-50 dark:bg-gray-900">Manual SEO</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-4 px-6 text-lg font-semibold text-foreground">Comprehensive Audit Speed</td>
            <td className="py-4 px-6 text-green-600 font-medium">Minutes</td>
            <td className="py-4 px-6 text-red-600 font-medium">Days to weeks</td>
          </tr>
          <tr className="border-b bg-gray-50 dark:bg-gray-900">
            <td className="py-4 px-6 text-lg font-semibold text-foreground">Actionable Recommendations</td>
            <td className="py-4 px-6 text-green-600 font-medium">Yes, prioritized and clear</td>
            <td className="py-4 px-6 text-red-600 font-medium">No, requires expert interpretation</td>
          </tr>
          <tr className="border-b">
            <td className="py-4 px-6 text-lg font-semibold text-foreground">Competitor Analysis</td>
            <td className="py-4 px-6 text-green-600 font-medium">Included</td>
            <td className="py-4 px-6 text-red-600 font-medium">Time-consuming & difficult</td>
          </tr>
          <tr className="border-b bg-gray-50 dark:bg-gray-900">
            <td className="py-4 px-6 text-lg font-semibold text-foreground">Progress Tracking</td>
            <td className="py-4 px-6 text-green-600 font-medium">Automated dashboard</td>
            <td className="py-4 px-6 text-red-600 font-medium">Manual tracking with spreadsheets</td>
          </tr>
          <tr>
            <td className="py-4 px-6 text-lg font-semibold text-foreground">Cost</td>
            <td className="py-4 px-6 text-green-600 font-medium">Fixed monthly fee</td>
            <td className="py-4 px-6 text-red-600 font-medium">High hourly rates</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</section>
      {/* What Our Clients Say Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              What Our Clients Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <Card className="bg-white dark:bg-gray-900 border-border p-6 relative transition duration-300 hover:shadow-lg transform hover:-translate-y-2">
              <p className="absolute top-4 left-4 text-6xl dark:text-gray-700 font-serif leading-none">&ldquo;</p>
              <CardDescription className="text-lg my-6 leading-relaxed text-gray-700 dark:text-gray-300">
                As a small business owner, SEO felt like a mountain I couldn&apos;t climb. Within a month a mani-our ar a month, our organic traffic increased by 30%!
              </CardDescription>
              <div className="flex items-center mt-4">
                <img src="/icon.png" alt="Alex R." className="w-12 h-12 rounded-full mr-4 object-cover" />
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">Alex R.</CardTitle>
                  <p className="text-sm text-muted-foreground">Founder, Urban Urban Bloom</p>
                </div>
              </div>
              <p className="absolute bottom-4 right-4 text-6xl dark:text-gray-700 font-serif leading-none">&rdquo;</p>
            </Card>

            {/* Testimonial 2 */}
            <Card className="bg-white dark:bg-gray-900 border-border p-6 relative transition duration-300 hover:shadow-lg transform hover:-translate-y-2">
              <p className="absolute top-4 left-4 text-6xl dark:text-gray-700 font-serif leading-none">&ldquo;</p>
              <CardDescription className="text-lg my-6 leading-relaxed text-gray-700 dark:text-gray-300">
                We were struggling to figure why our site wasn&apos;t ranking. The detailed found key technical lien even know existed. After making flier pmniary keywords recommended jumps fhrnpd from page three to page one.
              </CardDescription>
              <div className="flex items-center mt-4">
                <img src="/icon.png" alt="Maria L." className="w-12 h-12 rounded-full mr-4 object-cover" />
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">Maria L.</CardTitle>
                  <p className="text-sm text-muted-foreground">Marketing Director, Connective Solutions</p>
                </div>
              </div>
              <p className="absolute bottom-4 right-4 text-6xl dark:text-gray-700 font-serif leading-none">&rdquo;</p>
            </Card>

            {/* Testimonial 3 */}
            <Card className="bg-white dark:bg-gray-900 border-border p-6 relative transition duration-300 hover:shadow-lg transform hover:-translate-y-2">
              <p className="absolute top-4 left-4 text-6xl dark:text-gray-700 font-serif leading-none">&ldquo;</p>
              <CardDescription className="text-lg my-6 leading-relaxed text-gray-700 dark:text-gray-300">
                I love the simplicity and the actionale It&apos;s powerful tool doesn&apos;t frequent require to easiddege el&apos;sJEL it uses us SEO. It saves te a on track to meet your growth goals.
              </CardDescription>
              <div className="flex items-center mt-4">
                <img src="/icon.png" alt="Sam T." className="w-12 h-12 rounded-full mr-4 object-cover" />
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">Sam T.</CardTitle>
                  <p className="text-sm text-muted-foreground">Web Developer</p>
                </div>
              </div>
              <p className="absolute bottom-4 right-4 text-6xl dark:text-gray-700 font-serif leading-none">&rdquo;</p>
            </Card>
          </div>
        </div>
      </section>
      {/* Who It's For Section - NEW */}
<section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
  <div className="container mx-auto text-center max-w-4xl">
    <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
      Who Can Benefit From SEO Analysis?
    </h2>
    <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
      Whether you're a seasoned pro or just starting, our tool is built for you. We provide the insights you need to succeed in a competitive digital landscape.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      <Card className="border-border hover:shadow-lg transition-shadow bg-muted/50">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl text-foreground">Marketing Professionals</CardTitle>
          <CardDescription>
            Impress clients with detailed, professional SEO reports and track campaign performance with ease.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card className="border-border hover:shadow-lg transition-shadow bg-muted/50">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl text-foreground">Small Business Owners</CardTitle>
          <CardDescription>
            Take control of your online presence without needing to hire an expensive SEO agency.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card className="border-border hover:shadow-lg transition-shadow bg-muted/50">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <Lightbulb className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl text-foreground">Bloggers & Content Creators</CardTitle>
          <CardDescription>
            Ensure your content is optimized for search engines to reach a wider audience and grow your organic traffic.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  </div>
</section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background" id="FAQ">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-6 text-primary">
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Find quick answers to common questions about SEO and AI-powered SEO tools.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border rounded-xl shadow-sm">
              <AccordionTrigger className="text-lg sm:text-xl font-semibold text-foreground px-4 sm:px-6 py-4 hover:text-primary hover:no-underline transition-colors">
                What is SEO and why is it important?
              </AccordionTrigger>
              <AccordionContent className="text-base sm:text-lg text-muted-foreground px-4 sm:px-6 pb-4 leading-relaxed">
                SEO (Search Engine Optimization) helps improve your website’s visibility in search engines, driving more
                organic traffic and building credibility for your brand.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border rounded-xl shadow-sm">
              <AccordionTrigger className="text-lg sm:text-xl font-semibold text-foreground px-4 sm:px-6 py-4 hover:text-primary hover:no-underline transition-colors">
                How does an AI SEO tool work?
              </AccordionTrigger>
              <AccordionContent className="text-base sm:text-lg text-muted-foreground px-4 sm:px-6 pb-4 leading-relaxed">
                AI SEO tools analyze your site using machine learning to identify issues, suggest optimizations, and highlight
                keyword opportunities to improve your rankings faster.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border rounded-xl shadow-sm">
              <AccordionTrigger className="text-lg sm:text-xl font-semibold text-foreground px-4 sm:px-6 py-4 hover:text-primary hover:no-underline transition-colors">
                Can AI replace human SEO experts?
              </AccordionTrigger>
              <AccordionContent className="text-base sm:text-lg text-muted-foreground px-4 sm:px-6 pb-4 leading-relaxed">
                AI speeds up analysis and provides data-driven insights, but human creativity and strategy remain essential for
                long-term SEO success.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border rounded-xl shadow-sm">
              <AccordionTrigger className="text-lg sm:text-xl font-semibold text-foreground px-4 sm:px-6 py-4 hover:text-primary hover:no-underline transition-colors">
                How often should I run an SEO audit?
              </AccordionTrigger>
              <AccordionContent className="text-base sm:text-lg text-muted-foreground px-4 sm:px-6 pb-4 leading-relaxed">
                Running an audit monthly (or after major site changes) ensures your site stays optimized and aligned with
                search engine updates.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border rounded-xl shadow-sm">
              <AccordionTrigger className="text-lg sm:text-xl font-semibold text-foreground px-4 sm:px-6 py-4 hover:text-primary hover:no-underline transition-colors">
                Will using an AI SEO tool guarantee first-page rankings?
              </AccordionTrigger>
              <AccordionContent className="text-base sm:text-lg text-muted-foreground px-4 sm:px-6 pb-4 leading-relaxed">
                No tool can guarantee #1 rankings, but AI tools give you the insights and recommendations needed to
                significantly improve your chances.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border rounded-xl shadow-sm">
              <AccordionTrigger className="text-lg sm:text-xl font-semibold text-foreground px-4 sm:px-6 py-4 hover:text-primary hover:no-underline transition-colors">
                Is an AI SEO tool suitable for beginners?
              </AccordionTrigger>
              <AccordionContent className="text-base sm:text-lg text-muted-foreground px-4 sm:px-6 pb-4 leading-relaxed">
                Absolutely! AI SEO tools simplify complex SEO tasks, making them easy to understand even if you have no
                technical background.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>


      {/* Pricing Section - NEW */}
<section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-800" id="Pricing">
  <div className="container mx-auto text-center max-w-5xl">
    <div className="text-center mb-12">
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
      Choose Your Path to SEO Excellence
      </h2>
      <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Choose a plan that fits your business needs and start improving your search rankings today. No hidden fees, just growth.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
      {/* Free Plan */}
      <Card className="flex flex-col h-full bg-white dark:bg-gray-900 border-border p-6 transition duration-300 hover:shadow-xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-foreground">Free</CardTitle>
          <CardDescription className="text-sm">For basic website audits</CardDescription>
        </CardHeader>
        <div className="flex-grow flex flex-col justify-center">
          <div className="text-4xl font-extrabold text-foreground mb-4">$0</div>
          <ul className="text-left space-y-2 text-muted-foreground">
            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> One-time audit</li>
            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> Basic SEO score</li>
            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> Top 5 issues identified</li>
            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> No PDF report</li>
          </ul>
        </div>
        <div className="mt-6">
          <Link href="/audit">
            <Button className="w-full">Start Free Audit</Button>
          </Link>
        </div>
      </Card>

      {/* Pro Plan - Highlighted */}
      <Card className="relative flex flex-col h-full bg-primary text-white p-8 rounded-xl shadow-xl transition duration-300 transform scale-105">
        <Badge className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold uppercase bg-accent-foreground text-primary">
          Most Popular
        </Badge>
        <CardHeader className="text-center pb-4 text-white">
          <CardTitle className="text-2xl font-bold">Pro</CardTitle>
          <CardDescription className="text-sm text-gray-200">For small businesses & pros</CardDescription>
        </CardHeader>
        <div className="flex-grow flex flex-col justify-center">
          <div className="text-4xl font-extrabold text-white mb-4">$29<span className="text-xl font-medium">/mo</span></div>
          <ul className="text-left space-y-2 text-gray-200">
            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-300 mr-2 flex-shrink-0" /> Unlimited monthly audits</li>
            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-300 mr-2 flex-shrink-0" /> Full performance report</li>
            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-300 mr-2 flex-shrink-0" /> Prioritized action plan</li>
            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-300 mr-2 flex-shrink-0" /> Competitor analysis</li>
            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-300 mr-2 flex-shrink-0" /> PDF report generation</li>
          </ul>
        </div>
        <div className="mt-6">
          <Link href="/signup">
            <Button variant="secondary" className="w-full font-semibold">Get Started</Button>
          </Link>
        </div>
      </Card>

      {/* Business Plan */}
      <Card className="flex flex-col h-full bg-white dark:bg-gray-900 border-border p-6 transition duration-300 hover:shadow-xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-foreground">Business</CardTitle>
          <CardDescription className="text-sm">For agencies & large sites</CardDescription>
        </CardHeader>
        <div className="flex-grow flex flex-col justify-center">
          <div className="text-4xl font-extrabold text-foreground mb-4">$99<span className="text-xl font-medium">/mo</span></div>
          <ul className="text-left space-y-2 text-muted-foreground">
            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> Everything in Pro</li>
            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> White-label reports</li>
            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> API access</li>
            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> Priority support</li>
          </ul>
        </div>
        <div className="mt-6">
          <Link href="/contact-us">
            <Button className="w-full">Contact Us</Button>
          </Link>
        </div>
      </Card>
    </div>
  </div>
</section>
    </div>
  )
}