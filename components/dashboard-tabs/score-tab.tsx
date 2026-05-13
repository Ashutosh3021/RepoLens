/**
 * ScoreTab Component
 *
 * Dashboard Score tab content:
 * - Radial dial showing /10 score
 * - Breakdown bars for each dimension
 * - Detailed scoring criteria from analysis.score.details
 */

"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ScoreDial, ScoreBar } from "@/components/score-dial";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Code2,
  FileText,
  TestTube,
  Activity,
  Package,
  Users,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { RepoData, ScoreBreakdown } from "@/lib/types";

const labels: Record<keyof ScoreBreakdown, string> = {
  codeQuality: "Code Quality",
  documentation: "Documentation",
  testing: "Testing",
  activity: "Activity",
  dependencies: "Dependencies",
  community: "Community",
};

const descriptions: Record<keyof ScoreBreakdown, string> = {
  codeQuality: "Code structure, consistency, readability, and adherence to best practices",
  documentation: "README quality, inline comments, and API documentation",
  testing: "Test coverage, test quality, and CI integration",
  activity: "Commit frequency, issue resolution, and maintenance",
  dependencies: "Dependency health, update frequency, and security",
  community: "Contributors, discussions, and adoption metrics",
};

const getTrend = (score: number): "up" | "neutral" | "down" => {
  if (score >= 8) return "up";
  if (score >= 5) return "neutral";
  return "down";
};

export function ScoreTab({ data }: { data: RepoData | null }) {
  if (!data) {
    return (
      <div className="text-center py-12 text-slate-400">
        No repository data available
      </div>
    );
  }

  const score = data.analysis.score;

  if (!score) {
    return (
      <div className="text-center py-12 text-slate-400">
        No score data available for this repository.
      </div>
    );
  }

  const overall = score.overall ?? 0;
  const breakdown = score.breakdown ?? ({} as ScoreBreakdown);
  const details = score.details ?? ({} as Record<keyof ScoreBreakdown, string[]>);

  const getScoreLabel = (s: number) => {
    if (s >= 8) return "Excellent";
    if (s >= 6) return "Good";
    if (s >= 4) return "Fair";
    return "Needs Improvement";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Score Dial */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card p-8 flex flex-col items-center justify-center min-h-[320px]">
            <ScoreDial score={overall} size={200} strokeWidth={14} />
            <div className="mt-6 text-center">
              <Badge
                variant="secondary"
                className="bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/20"
              >
                {getScoreLabel(overall)}
              </Badge>
              <p className="text-sm text-slate-400 mt-2">
                Based on 6 key dimensions
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Score Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="glass-card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Score Breakdown</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Scores are calculated based on automated AI analysis</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="space-y-5">
              {(Object.entries(breakdown) as [keyof ScoreBreakdown, number][]).map(
                ([key, scoreValue], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ScoreIcon type={key} />
                        <span className="font-medium text-slate-200">
                          {labels[key] ?? key}
                        </span>
                        <TrendIcon trend={getTrend(scoreValue)} />
                      </div>
                      <span className="text-sm text-slate-400">
                        {scoreValue}/10
                      </span>
                    </div>
                    <ScoreBar
                      label={labels[key] ?? key}
                      score={scoreValue}
                      maxScore={10}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {descriptions[key]}
                    </p>
                  </motion.div>
                )
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.entries(breakdown) as [keyof ScoreBreakdown, number][]).map(
          ([key, scoreValue], index) => {
            const keyDetails: string[] = details[key] ?? [];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
              >
                <Card className="glass-card p-5 hover:border-[#00e5ff]/20 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ScoreIcon type={key} />
                      <h4 className="font-medium">{labels[key] ?? key}</h4>
                    </div>
                    <span
                      className={`text-lg font-bold ${
                        scoreValue >= 8
                          ? "text-[#00e5ff]"
                          : scoreValue >= 6
                          ? "text-[#7c3aed]"
                          : scoreValue >= 4
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}
                    >
                      {scoreValue}
                    </span>
                  </div>
                  {keyDetails.length > 0 ? (
                    <ul className="space-y-1.5">
                      {keyDetails.map((detail, i) => (
                        <li
                          key={i}
                          className="text-sm text-slate-400 flex items-start gap-2"
                        >
                          <span className="w-1 h-1 rounded-full bg-[#00e5ff] mt-2 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No details available
                    </p>
                  )}
                </Card>
              </motion.div>
            );
          }
        )}
      </div>
    </div>
  );
}

function ScoreIcon({ type }: { type: string }) {
  const icons: Record<string, React.ElementType> = {
    codeQuality: Code2,
    documentation: FileText,
    testing: TestTube,
    activity: Activity,
    dependencies: Package,
    community: Users,
  };

  const Icon = icons[type] ?? Code2;
  return <Icon className="w-4 h-4 text-[#00e5ff]" />;
}

function TrendIcon({ trend }: { trend: "up" | "neutral" | "down" }) {
  const icons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };

  const colors = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-slate-400",
  };

  const Icon = icons[trend];
  return <Icon className={`w-3.5 h-3.5 ${colors[trend]}`} />;
}
