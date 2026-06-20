/**
 * CategoryCard
 * Individual category section with score badge, sub-metrics grid,
 * and actionable recommendations.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown, ChevronUp, Copy, Check,
  User, Activity, GitBranch, Code2, Users, TrendingUp,
  GitMerge, Briefcase, Layers, GitPullRequest,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryScore } from "@/lib/types/profile";

const ICON_MAP: Record<string, React.ElementType> = {
  User, Activity, GitBranch, Code2, Users, TrendingUp,
  GitMerge, Briefcase, Layers, GitPullRequest,
};

interface Props {
  categoryKey: string;
  category: CategoryScore;
  index: number;
}

function scoreColor(score: number) {
  if (score >= 80) return { text: "text-[#00e5ff]", bg: "bg-[#00e5ff]/10", border: "border-[#00e5ff]/30" };
  if (score >= 65) return { text: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/30" };
  if (score >= 50) return { text: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" };
  if (score >= 35) return { text: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30" };
  return { text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" };
}

function scoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 35) return "Needs Work";
  return "Critical";
}

export function CategoryCard({ categoryKey, category, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const Icon = ICON_MAP[category.icon] ?? Code2;
  const colors = scoreColor(category.score);

  const handleCopy = async () => {
    if (!category.copyPasteText) return;
    await navigator.clipboard.writeText(category.copyPasteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <Card className={cn("glass-card overflow-hidden transition-colors duration-200", expanded && "border-[#00e5ff]/20")}>
        {/* Header row */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
        >
          {/* Icon */}
          <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${category.color}18` }}>
            <Icon className="w-5 h-5" style={{ color: category.color }} />
          </div>

          {/* Label + score */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white">{category.label}</h3>
              <Badge variant="secondary" className={cn("text-xs font-mono", colors.bg, colors.text, colors.border)}>
                {scoreLabel(category.score)}
              </Badge>
            </div>
            {/* Mini progress bar */}
            <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden w-48 max-w-full">
              <motion.div
                className="h-full rounded-full"
                style={{ background: category.color }}
                initial={{ width: 0 }}
                animate={{ width: `${category.score}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 + index * 0.06 }}
              />
            </div>
          </div>

          {/* Score number */}
          <span className={cn("text-2xl font-bold font-mono flex-shrink-0", colors.text)}>
            {category.score}
          </span>

          {/* Expand toggle */}
          <span className="text-slate-500 flex-shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-5 border-t border-white/[0.06]">
                {/* Sub-criteria grid */}
                <div className="pt-4 grid sm:grid-cols-2 gap-3">
                  {category.breakdown.map((sub, i) => {
                    const pct = Math.round((sub.score / sub.maxScore) * 100);
                    const subColors = scoreColor(pct);
                    return (
                      <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-slate-300">{sub.name}</span>
                          <span className={cn("text-xs font-mono font-bold", subColors.text)}>
                            {sub.score}/{sub.maxScore}
                          </span>
                        </div>
                        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-1.5">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: category.color }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{sub.detail}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Recommendations */}
                {category.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {category.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: category.color }} />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Copy-paste text */}
                {category.copyPasteText && (
                  <div className="p-3 rounded-lg bg-[#00e5ff]/5 border border-[#00e5ff]/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-[#00e5ff]">Copy-paste suggestion</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-6 px-2 text-[#00e5ff] hover:bg-[#00e5ff]/10"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 italic">{category.copyPasteText}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
