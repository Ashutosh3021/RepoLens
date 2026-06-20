/**
 * ProfileAnalysisDashboard
 * Full entry point for the "Full Profile Analysis" feature.
 * Handles input, loading state, and the complete report view.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, RefreshCw, AlertCircle, ChevronRight,
  User, Activity, GitBranch, Code2, Users, TrendingUp,
  GitMerge, Briefcase, Layers, GitPullRequest,
  BarChart2, Map, Github,
} from "lucide-react";
import { signIn } from "next-auth/react";

import { useProfileAnalysis } from "@/hooks/useProfileAnalysis";
import { ProfileHeroSummary } from "./ProfileHeroSummary";
import { CategoryCard } from "./CategoryCard";
import { ProfileVisualizations } from "./ProfileVisualizations";
import { JobRolesSection } from "./JobRolesSection";
import { RoadmapTable } from "./RoadmapTable";
import { ExportButton } from "./ExportButton";
import { AnalysisLoadingState } from "./AnalysisLoadingState";
import { JobHuntDashboard } from "../job-hunt/JobHuntDashboard";
import type { CategoryKey } from "@/lib/types/profile";

// ─── Sidebar nav sections ─────────────────────────────────────────────────────

const NAV_SECTIONS = [
  { id: "hero",       label: "Overview",       icon: BarChart2 },
  { id: "categories", label: "10 Categories",  icon: Layers },
  { id: "visuals",    label: "Visualizations", icon: Activity },
  { id: "roles",      label: "Job Roles",      icon: Briefcase },
  { id: "roadmap",    label: "Roadmap",        icon: Map },
] as const;

const CATEGORY_ICON_MAP: Record<CategoryKey, React.ElementType> = {
  profileBasics:          User,
  activityConsistency:    Activity,
  repositoryAnalysis:     GitBranch,
  technicalDepth:         Code2,
  communityImpact:        Users,
  learningGrowth:         TrendingUp,
  collaborationSkills:    GitMerge,
  professionalPresence:   Briefcase,
  projectDiversity:       Layers,
  openSourceContribution: GitPullRequest,
};

// ─── Input panel (shown before analysis) ─────────────────────────────────────

function InputPanel({
  onAnalyze,
  initialUsername,
  isAuthenticated,
}: {
  onAnalyze: (username: string) => void;
  initialUsername?: string;
  isAuthenticated: boolean;
}) {
  const [value, setValue] = useState(initialUsername ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onAnalyze(value.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 space-y-8 max-w-lg mx-auto">
      {/* Icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00e5ff]/20 to-[#7c3aed]/20 flex items-center justify-center border border-white/[0.08]">
          <Search className="w-10 h-10 text-[#00e5ff]" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#7c3aed] flex items-center justify-center">
          <span className="text-white text-xs font-bold">✦</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Full Profile Analysis</h2>
        <p className="text-slate-400 text-sm max-w-sm">
          Deep-dive analysis across 10 categories, job role suggestions, and an
          actionable improvement roadmap.
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <Card className="glass-card p-2 glow-cyan-sm">
          <div className="flex items-center gap-2">
            <div className="pl-3 text-slate-400">
              <Github className="w-4 h-4" />
            </div>
            <Input
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="github-username"
              className="flex-1 bg-transparent border-0 text-white placeholder:text-slate-500 focus-visible:ring-0 font-mono"
            />
            <Button
              type="submit"
              disabled={!value.trim()}
              className="bg-[#00e5ff] hover:bg-[#00b8d4] text-[#0a0a0f] font-semibold px-5"
            >
              Analyze
            </Button>
          </div>
        </Card>
        <p className="text-xs text-slate-500 text-center">
          Try: torvalds, gaearon, sindresorhus, yyx990803
        </p>
      </form>

      {/* Auth hint */}
      {!isAuthenticated && (
        <div className="w-full p-4 rounded-xl bg-[#00e5ff]/5 border border-[#00e5ff]/15 text-center space-y-2">
          <p className="text-sm text-slate-300">
            🚀 <span className="font-medium text-[#00e5ff]">Sign in with GitHub</span> for higher
            rate limits and faster analysis
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signIn("github")}
            className="border-white/[0.08] hover:bg-white/[0.05] text-slate-300 text-xs"
          >
            <Github className="w-3.5 h-3.5 mr-1.5" />
            Connect GitHub
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

interface Props {
  /** Pre-fill the username input (e.g. from repo owner) */
  initialUsername?: string;
}

export function ProfileAnalysisDashboard({ initialUsername }: Props) {
  const { data: session } = useSession();
  const isAuthenticated = !!(session as { accessToken?: string })?.accessToken;
  const { state, analyze, reset } = useProfileAnalysis();
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [isJobHuntMode, setIsJobHuntMode] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll spy
  useEffect(() => {
    if (state.status !== "complete") return;
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [state.status]);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Loading state ──
  if (state.status !== "idle" && state.status !== "complete" && state.status !== "error") {
    return (
      <AnalysisLoadingState
        progress={state.progress}
        label={state.progressLabel}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  // ── Error state ──
  if (state.status === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 space-y-5 max-w-md mx-auto text-center">
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-white">Analysis Failed</h3>
          <p className="text-sm text-slate-400">{state.error}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={reset}
            variant="outline"
            className="border-white/[0.08] hover:bg-white/[0.05]"
          >
            Try Again
          </Button>
          {!isAuthenticated && (
            <Button
              onClick={() => signIn("github")}
              className="bg-[#00e5ff] hover:bg-[#00b8d4] text-[#0a0a0f]"
            >
              <Github className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Idle: show input ──
  if (state.status === "idle" || !state.analysis) {
    return (
      <InputPanel
        onAnalyze={username => analyze(username)}
        initialUsername={initialUsername}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  // ── Complete: show full report or job hunt mode ──
  const analysis = state.analysis;

  if (isJobHuntMode) {
    return (
      <JobHuntDashboard
        analysis={analysis}
        onBack={() => setIsJobHuntMode(false)}
      />
    );
  }

  return (
    <div className="flex gap-0 relative">
      {/* ── Sticky sidebar nav ─────────────────────────────── */}
      <aside className="hidden xl:flex flex-col w-52 flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] pr-4">
        <div className="glass-card rounded-xl p-3 space-y-1">
          <p className="text-xs text-slate-500 uppercase tracking-wider px-2 pb-1 font-medium">Report Sections</p>

          {NAV_SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left ${
                activeSection === s.id
                  ? "bg-[#00e5ff]/10 text-[#00e5ff]"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <s.icon className="w-4 h-4 flex-shrink-0" />
              <span>{s.label}</span>
              {activeSection === s.id && <ChevronRight className="w-3 h-3 ml-auto" />}
            </button>
          ))}

          <div className="pt-2 border-t border-white/[0.06] space-y-1">
            <p className="text-xs text-slate-600 uppercase tracking-wider px-2 pb-1">Categories</p>
            {(Object.entries(analysis.categories) as [CategoryKey, (typeof analysis.categories)[CategoryKey]][]).map(([key, cat]) => {
              const Icon = CATEGORY_ICON_MAP[key];
              const score = cat.score;
              return (
                <button
                  key={key}
                  onClick={() => scrollTo(`cat-${key}`)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] transition-colors"
                >
                  <Icon className="w-3 h-3 flex-shrink-0" style={{ color: cat.color }} />
                  <span className="truncate">{cat.label}</span>
                  <span className="ml-auto font-mono" style={{ color: cat.color }}>{score}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── Main report ────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-10">
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-white/[0.05] text-slate-300 border-white/[0.08]">
              @{analysis.username}
            </Badge>
            <span className="text-xs text-slate-500">
              Generated {new Date(analysis.generatedAt).toLocaleDateString()}
            </span>
            {!analysis.isAuthenticated && (
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">
                Unauthenticated
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => analyze(analysis.username, true)}
              className="text-slate-400 hover:text-white hover:bg-white/[0.05]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-slate-400 hover:text-white hover:bg-white/[0.05]"
            >
              New Search
            </Button>
            <ExportButton analysis={analysis} />
          </div>
        </div>

        {/* Section 1: Hero */}
        <div id="hero" ref={el => { sectionRefs.current["hero"] = el; }}>
          <ProfileHeroSummary analysis={analysis} />
        </div>

        {/* Section 2: 10 Categories */}
        <div id="categories" ref={el => { sectionRefs.current["categories"] = el; }} className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-white/[0.07]">
            <Layers className="w-5 h-5 text-[#00e5ff]" />
            <h2 className="text-lg font-semibold text-white">10-Category Deep Dive</h2>
            <span className="text-xs text-slate-500 ml-1">click to expand each category</span>
          </div>

          {(Object.entries(analysis.categories) as [CategoryKey, (typeof analysis.categories)[CategoryKey]][]).map(
            ([key, cat], i) => (
              <div key={key} id={`cat-${key}`}>
                <CategoryCard categoryKey={key} category={cat} index={i} />
              </div>
            )
          )}
        </div>

        {/* Section 3: Visualizations */}
        <div id="visuals" ref={el => { sectionRefs.current["visuals"] = el; }} className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-white/[0.07]">
            <Activity className="w-5 h-5 text-[#7c3aed]" />
            <h2 className="text-lg font-semibold text-white">Visualizations</h2>
          </div>
          <ProfileVisualizations data={analysis.visualizations} />
        </div>

        {/* Section 4: Job Roles */}
        <div id="roles" ref={el => { sectionRefs.current["roles"] = el; }}>
          <JobRolesSection
            roles={analysis.suggestedRoles}
            onStartJobHunt={() => setIsJobHuntMode(true)}
          />
        </div>

        {/* Section 5: Roadmap */}
        <div id="roadmap" ref={el => { sectionRefs.current["roadmap"] = el; }}>
          <RoadmapTable items={analysis.roadmap} />
        </div>

        {/* Footer */}
        <div className="pb-8 text-center text-xs text-slate-600">
          Analysis based on publicly available GitHub data ·{" "}
          <span className="text-[#00e5ff]">{analysis.profile.public_repos} repos</span> analysed ·{" "}
          {analysis.isAuthenticated ? "Authenticated request" : "Unauthenticated — sign in for faster results"}
        </div>
      </div>
    </div>
  );
}
