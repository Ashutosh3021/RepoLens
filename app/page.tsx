/**
 * Landing Page
 *
 * Hero section flow:
 * 1. User types a repo URL and clicks Analyze
 * 2. A provider + model picker slides in below the input
 * 3. User picks provider/model and clicks "Start Analysis"
 * 4. Analysis runs and redirects to /dashboard
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProviderSelector } from "@/components/provider-selector";
import type { AIProvider } from "@/lib/types";
import { useSession, signIn } from "next-auth/react";
import {
  Search,
  Sparkles,
  BarChart3,
  GitGraph,
  FileText,
  MessageSquare,
  Rocket,
  Server,
  Shield,
  Github,
  ArrowRight,
  Zap,
  ChevronRight,
  X,
} from "lucide-react";

// ─── Static content ────────────────────────────────────────────────────────────

const features = [
  { icon: Sparkles,     title: "AI Explanation",       description: "Get instant, natural language explanations of any codebase",          color: "#00e5ff" },
  { icon: BarChart3,    title: "Score /10",             description: "Multi-dimensional repository scoring across 6 key areas",             color: "#7c3aed" },
  { icon: GitGraph,     title: "Mermaid Diagrams",      description: "Auto-generated architecture and workflow visualizations",             color: "#22c55e" },
  { icon: FileText,     title: "README Generator",      description: "AI-powered README creation with live markdown preview",               color: "#f59e0b" },
  { icon: MessageSquare,title: "Chat with Repo",        description: "Ask questions and get contextual answers about the code",             color: "#ec4899" },
  { icon: Rocket,       title: "Deploy Guide",          description: "Step-by-step deployment instructions for any platform",               color: "#38bdf8" },
  { icon: Server,       title: "MCP Server",            description: "Model Context Protocol integration for AI assistants",                color: "#a855f7" },
  { icon: Shield,       title: "Profile Deep Dive",     description: "10-category GitHub profile analysis with job role matching & roadmap", color: "#10b981" },
];

const steps = [
  { number: "01", title: "Paste URL",    description: "Enter any GitHub repository URL" },
  { number: "02", title: "Pick Model",   description: "Choose your preferred AI provider" },
  { number: "03", title: "AI Analysis",  description: "Our AI analyzes the codebase instantly" },
  { number: "04", title: "Get Score",    description: "See overall score and breakdown" },
  { number: "05", title: "Chat",         description: "Ask questions about the code" },
  { number: "06", title: "Deploy",       description: "Follow deployment guides" },
];

// Default model per provider — mirrors DEFAULT_MODELS in services/llm.ts
const DEFAULT_MODEL: Record<AIProvider, string> = {
  gemini:    "gemini-1.5-flash",
  openai:    "gpt-4o-mini",
  anthropic: "claude-3-haiku-20240307",
  groq:      "llama-3.1-8b-instant",
  ollama:    "llama3.2",
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = !!session;

  const [repoUrl, setRepoUrl]           = useState("");
  const [showPicker, setShowPicker]     = useState(false);
  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [error, setError]               = useState("");

  // Provider / model selection
  const [provider, setProvider]         = useState<AIProvider>("gemini");
  const [model, setModel]               = useState<string>(DEFAULT_MODEL.gemini);

  // Sync default model when provider changes
  useEffect(() => {
    setModel(DEFAULT_MODEL[provider]);
  }, [provider]);

  // Step 1: validate URL then reveal picker
  const handleAnalyzeClick = () => {
    if (!repoUrl.trim()) return;
    setError("");
    setShowPicker(true);
  };

  // Step 2: user confirmed provider — run analysis
  const handleStartAnalysis = async () => {
    let fullUrl = repoUrl.trim();
    if (!fullUrl.startsWith("http")) {
      fullUrl = `https://github.com/${fullUrl}`;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fullUrl, provider, model }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to analyze repository");
        setIsAnalyzing(false);
        setShowPicker(false);
        return;
      }

      sessionStorage.setItem("repoData", JSON.stringify(result.data));
      const { context } = result.data as { context: { owner: string; repo: string } };
      router.push(
        `/dashboard?owner=${encodeURIComponent(context.owner)}&repo=${encodeURIComponent(context.repo)}`
      );
    } catch {
      setError("Failed to analyze repository. Please try again.");
      setIsAnalyzing(false);
      setShowPicker(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !showPicker) handleAnalyzeClick();
  };

  const handleCancelPicker = () => {
    setShowPicker(false);
    setError("");
  };

  return (
    <main className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00e5ff]/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-[#7c3aed]/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="secondary" className="mb-6 bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/20 hover:bg-[#00e5ff]/20">
              <Zap className="w-3 h-3 mr-1" />
              Powered by AI
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
          >
            <span className="text-white">Understand Any </span>
            <span className="gradient-text glow-cyan-text">Repo</span>
            <span className="text-white">, Instantly</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10"
          >
            AI-powered GitHub repository analysis. Get explanations, diagrams,
            scores, and deployment guides in seconds.
          </motion.p>

          {/* ── URL input + provider picker ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-xl mx-auto"
          >
            {/* URL bar */}
            <div className="glass-card rounded-2xl p-2 glow-cyan-sm">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 text-slate-400 font-mono text-sm">
                  <Github className="w-4 h-4" />
                  <span className="hidden sm:inline">github.com/</span>
                </div>
                <Input
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    // If user edits URL after picker opened, close picker
                    if (showPicker) setShowPicker(false);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="user/repository"
                  disabled={isAnalyzing}
                  className="flex-1 bg-transparent border-0 text-white placeholder:text-slate-500 focus-visible:ring-0"
                />
                <Button
                  onClick={showPicker ? handleCancelPicker : handleAnalyzeClick}
                  disabled={isAnalyzing || !repoUrl.trim()}
                  variant={showPicker ? "ghost" : "default"}
                  className={
                    showPicker
                      ? "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                      : "bg-[#00e5ff] hover:bg-[#00b8d4] text-[#0a0a0f] font-semibold px-6"
                  }
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0a0a0f]/30 border-t-[#0a0a0f] rounded-full animate-spin mr-2" />
                      Analyzing…
                    </>
                  ) : showPicker ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* ── Provider picker — slides in after URL entered ─────────── */}
            <AnimatePresence>
              {showPicker && (
                <motion.div
                  key="picker"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="mt-3"
                >
                  <Card className="glass-card p-5 border border-[#00e5ff]/20 text-left">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-[#00e5ff]" />
                      <p className="text-sm font-medium text-white">
                        Choose AI provider &amp; model
                      </p>
                      <span className="ml-auto text-xs text-slate-500">
                        for{" "}
                        <span className="text-slate-300 font-mono">
                          {repoUrl.replace(/^https?:\/\/github\.com\//, "")}
                        </span>
                      </span>
                    </div>

                    {/* Provider + model selectors */}
                    <ProviderSelector
                      value={provider}
                      onChange={setProvider}
                      showModelSelector
                      selectedModel={model}
                      onModelChange={setModel}
                    />

                    {/* Ollama hint */}
                    {provider === "ollama" && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 text-xs text-slate-500"
                      >
                        🦙 Make sure{" "}
                        <code className="font-mono bg-white/[0.05] px-1 rounded">
                          ollama serve
                        </code>{" "}
                        is running and{" "}
                        <code className="font-mono bg-white/[0.05] px-1 rounded">
                          OLLAMA_BASE_URL
                        </code>{" "}
                        is set in{" "}
                        <code className="font-mono bg-white/[0.05] px-1 rounded">
                          .env.local
                        </code>
                        .
                      </motion.p>
                    )}

                    {/* Action row */}
                    <div className="flex items-center gap-3 mt-5">
                      <Button
                        onClick={handleStartAnalysis}
                        disabled={isAnalyzing}
                        className="flex-1 bg-[#00e5ff] hover:bg-[#00b8d4] text-[#0a0a0f] font-semibold"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-[#0a0a0f]/30 border-t-[#0a0a0f] rounded-full animate-spin mr-2" />
                            Analyzing…
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Start Analysis
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelPicker}
                        disabled={isAnalyzing}
                        className="border-white/[0.08] hover:bg-white/[0.05] text-slate-400"
                      >
                        Cancel
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Helper text / error */}
            {!showPicker && (
              <p className="text-sm text-slate-500 mt-3">
                Try: facebook/react, vercel/next.js, or microsoft/vscode
              </p>
            )}
            {error && (
              <p className="text-sm text-red-400 mt-3">{error}</p>
            )}
          </motion.div>

          {/* GitHub OAuth CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            {status === "loading" ? (
              <div className="h-11 w-52 rounded-lg bg-white/[0.05] animate-pulse" />
            ) : isLoggedIn ? (
              /* Signed in → go straight to profile analysis */
              <Button
                asChild
                size="lg"
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold px-6"
              >
                <a href="/profile">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Full Profile Analysis
                </a>
              </Button>
            ) : (
              /* Not signed in → trigger GitHub OAuth */
              <Button
                variant="outline"
                size="lg"
                onClick={() => signIn("github", { callbackUrl: "/profile" })}
                className="border-white/[0.08] hover:bg-white/[0.05] text-slate-300"
              >
                <Github className="w-5 h-5 mr-2" />
                Continue with GitHub
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-slate-400">Comprehensive repository analysis powered by cutting-edge AI</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="glass-card glass-card-hover h-full p-5 group">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400">Get comprehensive repository insights in 6 simple steps</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="glass-card p-6 relative overflow-hidden group">
                  <span className="absolute top-4 right-4 text-4xl font-bold text-white/[0.03] font-mono">
                    {step.number}
                  </span>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-full bg-[#00e5ff]/10 flex items-center justify-center mb-4 group-hover:bg-[#00e5ff]/20 transition-colors">
                      <span className="text-[#00e5ff] font-mono font-bold">{step.number}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-400">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                      <ChevronRight className="w-6 h-6 text-[#00e5ff]/30" />
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="glass-card p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00e5ff]/5 to-[#7c3aed]/5" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Analyze Your First Repo?
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Join thousands of developers using RepoLens to understand codebases faster and ship better software.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-[#00e5ff] hover:bg-[#00b8d4] text-[#0a0a0f] font-semibold px-8"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/[0.08] hover:bg-white/[0.05] text-slate-300"
                  onClick={() => isLoggedIn ? router.push("/profile") : signIn("github", { callbackUrl: "/profile" })}
                >
                  <Github className="w-5 h-5 mr-2" />
                  {isLoggedIn ? "My Profile Analysis" : "Connect GitHub"}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#00e5ff]" />
            <span className="font-heading font-bold">
              <span className="text-white">Repo</span>
              <span className="text-[#00e5ff]">Lens</span>
            </span>
          </div>
          <p className="text-sm text-slate-500">© 2026 RepoLens. All rights reserved.</p>
        </div>
      </footer>

    </main>
  );
}
