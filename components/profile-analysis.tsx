/**
 * ProfileAnalysis — the full 10-category GitHub profile report.
 * Rendered inside AuthGuard so it only mounts when signed in.
 */
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, RefreshCw, AlertCircle, Github,
  User, Activity, GitBranch, Code2, Users, TrendingUp,
  GitMerge, Briefcase, Layers, GitPullRequest,
  Star, Copy, Check, ChevronDown, ChevronUp,
  Trophy, Target, Zap, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import type { FullProfileAnalysis, CategoryKey, CategoryScore } from "@/lib/types/profile";


// ─── Icon map for category keys ───────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  User, Activity, GitBranch, Code2, Users,
  TrendingUp, GitMerge, Briefcase, Layers, GitPullRequest,
};

// ─── Grade colour helper ──────────────────────────────────────────────────────
function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "text-green-400";
  if (grade.startsWith("B")) return "text-[#00e5ff]";
  if (grade.startsWith("C")) return "text-yellow-400";
  return "text-red-400";
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-green-400";
  if (score >= 55) return "text-[#00e5ff]";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 75) return "bg-green-400";
  if (score >= 55) return "bg-[#00e5ff]";
  if (score >= 40) return "bg-yellow-400";
  return "bg-red-400";
}

const PRIORITY_COLORS = {
  High:   "bg-red-500/10   text-red-400   border-red-500/20",
  Medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Low:    "bg-green-500/10  text-green-400  border-green-500/20",
};


// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? "#22c55e" : score >= 55 ? "#00e5ff" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold text-white">{score}</div>
        <div className={`text-lg font-bold ${gradeColor(grade)}`}>{grade}</div>
      </div>
    </div>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────
function CategoryCard({ cat, expanded, onToggle }: {
  cat: CategoryScore;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const Icon = CATEGORY_ICONS[cat.icon] ?? Star;

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card className="glass-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${cat.color}15` }}>
          <Icon className="w-5 h-5" style={{ color: cat.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">{cat.label}</span>
            <span className="text-xs text-slate-500">({Math.round(cat.weight * 100)}% weight)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
              <motion.div
                className={`h-full rounded-full ${scoreBg(cat.score)}`}
                initial={{ width: 0 }}
                animate={{ width: `${cat.score}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className={`text-sm font-bold tabular-nums ${scoreColor(cat.score)}`}>
              {cat.score}
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 border-t border-white/[0.06] pt-4 space-y-4">
              {/* Sub-criteria */}
              <div className="space-y-2">
                {cat.breakdown.map(sub => (
                  <div key={sub.name} className="flex items-center gap-3">
                    <div className="w-28 flex-shrink-0">
                      <span className="text-xs text-slate-400 truncate block">{sub.name}</span>
                    </div>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full ${scoreBg(Math.round((sub.score / sub.maxScore) * 100))}`}
                        style={{ width: `${(sub.score / sub.maxScore) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-14 text-right tabular-nums">
                      {sub.score}/{sub.maxScore}
                    </span>
                  </div>
                ))}
              </div>
              {/* Recommendations */}
              {cat.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recommendations</p>
                  {cat.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.03]">
                      <Target className="w-3.5 h-3.5 text-[#00e5ff] flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-300">{r}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Copy-paste text */}
              {cat.copyPasteText && (
                <div className="p-3 rounded-lg bg-[#00e5ff]/5 border border-[#00e5ff]/10">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-slate-300 flex-1">{cat.copyPasteText}</p>
                    <button onClick={() => handleCopy(cat.copyPasteText!)}
                      className="flex-shrink-0 p-1 rounded hover:bg-white/[0.05]">
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}


// ─── Status steps shown during loading ───────────────────────────────────────
const STEPS = [
  "Authenticating with GitHub…",
  "Fetching your profile data…",
  "Loading all repositories…",
  "Computing 10-category scores…",
  "Building roadmap & role matches…",
  "Finalizing report…",
];

// ─── Main component ───────────────────────────────────────────────────────────
export function ProfileAnalysis() {
  const { user, accessToken } = useAuth();
  const [analysis, setAnalysis]   = useState<FullProfileAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [step, setStep]           = useState(0);
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({});

  const runAnalysis = useCallback(async () => {
    if (!user?.username) {
      setError("Could not find GitHub username. Please re-authenticate.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setStep(0);

    // Cycle through status messages while fetching
    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 1800);

    try {
      const res = await fetch("/api/profile/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "x-github-token": accessToken } : {}),
        },
        body: JSON.stringify({ username: user.username }),
      });
      const json = await res.json();
      clearInterval(timer);

      if (!json.success) {
        setError(json.error || "Analysis failed. Please try again.");
      } else {
        setAnalysis(json.data as FullProfileAnalysis);
      }
    } catch {
      clearInterval(timer);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user, accessToken]);

  function toggleCategory(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm w-full"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-[#00e5ff]/20 animate-pulse" />
            <div className="absolute inset-2 rounded-full border-2 border-t-[#00e5ff] border-r-[#7c3aed] border-transparent animate-spin" />
            <div className="absolute inset-4 rounded-full bg-[#00e5ff]/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#00e5ff]" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white mb-2">Running Full Profile Analysis</h3>
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-sm text-slate-400"
            >
              {STEPS[step]}
            </motion.p>
          </AnimatePresence>

          <div className="mt-6 space-y-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i <= step ? "bg-[#00e5ff]" : "bg-white/[0.08]"}`} />
                <span className={`text-xs transition-colors duration-300 ${i <= step ? "text-slate-300" : "text-slate-600"}`}>{s}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Hero / CTA (before first run) ─────────────────────────────────────────
  if (!analysis) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <Card className="glass-card p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00e5ff]/5 to-[#7c3aed]/5 pointer-events-none" />
            <div className="relative z-10">
              {user && (
                <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <Avatar className="w-9 h-9 border border-[#00e5ff]/30">
                    <AvatarImage src={user.image ?? undefined} />
                    <AvatarFallback className="bg-[#7c3aed] text-white text-xs">
                      {(user.name ?? user.email ?? "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{user.name ?? user.email}</p>
                    <p className="text-xs text-green-400">GitHub connected ✓</p>
                  </div>
                </div>
              )}

              <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center mx-auto mb-5">
                <BarChart3 className="w-8 h-8 text-[#7c3aed]" />
              </div>

              <Badge variant="secondary" className="mb-4 bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/20">
                <Zap className="w-3 h-3 mr-1" /> Authenticated Analysis
              </Badge>

              <h2 className="text-2xl font-bold text-white mb-3">Full Profile Analysis</h2>
              <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                A comprehensive 10-category report scoring your GitHub profile on activity, technical depth,
                community impact, professional presence, and more.
              </p>

              {error && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-6 text-left">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button
                size="lg"
                onClick={runAnalysis}
                className="w-full bg-[#00e5ff] hover:bg-[#00b8d4] text-[#0a0a0f] font-semibold text-base"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Run Full Profile Analysis
              </Button>

              <p className="text-xs text-slate-500 mt-4">
                Uses your GitHub OAuth token — no extra configuration needed.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }


  // ── Full results view ──────────────────────────────────────────────────────
  const categoryEntries = Object.entries(analysis.categories) as [CategoryKey, CategoryScore][];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      {/* ── Header bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Full Profile Analysis</h1>
          <p className="text-sm text-slate-400 mt-1">
            Generated {new Date(analysis.generatedAt).toLocaleString()}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={runAnalysis}
          disabled={isLoading}
          className="border-white/[0.08] hover:bg-white/[0.05] text-slate-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Re-run Analysis
        </Button>
      </div>

      {/* ── Hero card (score + profile) ───────────────────────────────────── */}
      <Card className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00e5ff]/5 to-[#7c3aed]/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          {/* Score ring */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <ScoreRing score={analysis.overallScore} grade={analysis.letterGrade} />
            <Badge variant="secondary" className="text-xs bg-white/[0.05] text-slate-300">
              {analysis.benchmark.percentile}th percentile
            </Badge>
          </div>

          {/* Profile info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-12 h-12 border-2 border-[#00e5ff]/30">
                <AvatarImage src={analysis.profile.avatar_url} />
                <AvatarFallback className="bg-[#7c3aed] text-white">
                  {analysis.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-white">{analysis.profile.name ?? analysis.username}</h2>
                <a
                  href={analysis.profile.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#00e5ff] hover:underline"
                >
                  @{analysis.username}
                </a>
              </div>
            </div>

            {analysis.profile.bio && (
              <p className="text-sm text-slate-300 mb-4 line-clamp-2">{analysis.profile.bio}</p>
            )}

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Repos", value: analysis.profile.public_repos ?? 0 },
                { label: "Stars", value: analysis.totalStars.toLocaleString() },
                { label: "Followers", value: analysis.profile.followers.toLocaleString() },
                { label: "Account Age", value: `${Math.floor(analysis.accountAge / 365)}y` },
              ].map(s => (
                <div key={s.label} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.06]">
                  <span className="text-xs text-slate-500 block">{s.label}</span>
                  <span className="text-sm font-semibold text-white">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Domain badge */}
          <div className="flex-shrink-0 text-center hidden sm:block">
            <div className="px-4 py-3 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20">
              <Trophy className="w-5 h-5 text-[#a78bfa] mx-auto mb-1" />
              <p className="text-xs text-[#a78bfa] font-medium">{analysis.benchmark.domain}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Primary languages + top topics ───────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#00e5ff]" /> Primary Languages
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.primaryLanguages.map(l => (
              <Badge key={l} variant="secondary" className="bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/20 text-xs">
                {l}
              </Badge>
            ))}
            {analysis.primaryLanguages.length === 0 && (
              <span className="text-xs text-slate-500">No language data</span>
            )}
          </div>
        </Card>
        <Card className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> Top Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.topTopics.slice(0, 8).map(t => (
              <Badge key={t} variant="secondary" className="bg-white/[0.05] text-slate-300 text-xs">
                {t}
              </Badge>
            ))}
            {analysis.topTopics.length === 0 && (
              <span className="text-xs text-slate-500">No topic data</span>
            )}
          </div>
        </Card>
      </div>

      {/* ── 10 Category scores ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">10-Category Breakdown</h2>
        <div className="space-y-3">
          {categoryEntries.map(([key, cat]) => (
            <CategoryCard
              key={key}
              cat={cat}
              expanded={!!expanded[key]}
              onToggle={() => toggleCategory(key)}
            />
          ))}
        </div>
      </div>

      {/* ── Suggested roles ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Suggested Job Roles</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {analysis.suggestedRoles.map(role => (
            <Card key={role.title} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white text-sm">{role.title}</h3>
                <span className={`text-sm font-bold tabular-nums ${scoreColor(role.match)}`}>
                  {role.match}% match
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] mb-3">
                <div
                  className={`h-full rounded-full ${scoreBg(role.match)}`}
                  style={{ width: `${role.match}%` }}
                />
              </div>
              {role.salary && (
                <p className="text-xs text-slate-400 mb-3">{role.salary}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {role.matchedSkills.slice(0, 4).map(s => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{s}</span>
                ))}
                {role.missingSkills.slice(0, 2).map(s => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-500">{s}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Roadmap ───────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Improvement Roadmap</h2>
        <div className="space-y-3">
          {analysis.roadmap.map((item, i) => (
            <Card key={i} className="glass-card p-4">
              <div className="flex items-start gap-3">
                <Badge
                  variant="secondary"
                  className={`text-xs flex-shrink-0 mt-0.5 border ${PRIORITY_COLORS[item.priority]}`}
                >
                  {item.priority}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 leading-relaxed">{item.action}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span>⏱ {item.timeframe}</span>
                    <span>Effort: {item.effort}</span>
                    <span>Impact: {item.impact}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
        <Github className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <p className="text-xs text-slate-500">
          Analysis based on {analysis.profile.public_repos ?? 0} public repositories using your authenticated GitHub token.
          {" "}Scores are computed deterministically from public data — no AI inference required.
        </p>
      </div>
    </motion.div>
  );
}
