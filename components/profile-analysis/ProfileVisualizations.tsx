/**
 * ProfileVisualizations
 * Language pie, activity bar, project strength bars — all pure SVG / CSS
 * No external chart library required.
 */

"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { BarChart2, Globe, Zap } from "lucide-react";
import type { VisualizationData } from "@/lib/types/profile";

// ─── Language Chart ───────────────────────────────────────────────────────────

const LANG_COLORS = [
  "#00e5ff","#7c3aed","#22c55e","#f59e0b","#ec4899",
  "#38bdf8","#a855f7","#14b8a6","#f97316","#10b981",
];

function LanguageChart({ languages }: { languages: VisualizationData["languages"] }) {
  if (!languages.length) return null;
  const topLangs = languages.slice(0, 8);

  return (
    <Card className="glass-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <Globe className="w-4 h-4 text-[#00e5ff]" />
        <h4 className="font-semibold text-sm">Language Breakdown</h4>
      </div>

      {/* Segmented bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-4 gap-px">
        {topLangs.map((l, i) => (
          <motion.div
            key={l.language}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ backgroundColor: LANG_COLORS[i % LANG_COLORS.length], width: `${l.percentage}%` }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: i * 0.07, ease: "easeOut" }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {topLangs.map((l, i) => (
          <div key={l.language} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: LANG_COLORS[i % LANG_COLORS.length] }} />
            <span className="text-xs text-slate-300 truncate">{l.language}</span>
            <span className="text-xs text-slate-500 ml-auto">{l.percentage}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Activity Heatmap (mini bar chart) ───────────────────────────────────────

function ActivityChart({ activity }: { activity: VisualizationData["activityHeatmap"] }) {
  const maxVal = Math.max(...activity.map(a => a.commits), 1);

  return (
    <Card className="glass-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <Zap className="w-4 h-4 text-[#7c3aed]" />
        <h4 className="font-semibold text-sm">Push Activity (12 months)</h4>
      </div>

      <div className="flex items-end gap-1 h-20">
        {activity.map((a, i) => {
          const pct = (a.commits / maxVal) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                <div className="bg-[#0f0f19] border border-white/10 rounded px-2 py-1 text-xs text-white whitespace-nowrap shadow-lg">
                  {a.week}: {a.commits} pushes
                </div>
              </div>
              <motion.div
                className="w-full rounded-t"
                style={{ backgroundColor: pct > 0 ? "#7c3aed" : "rgba(255,255,255,0.05)" }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(pct, 4)}%` }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: "easeOut" }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-1.5 text-xs text-slate-600">
        <span>{activity[0]?.week}</span>
        <span>{activity[activity.length - 1]?.week}</span>
      </div>
    </Card>
  );
}

// ─── Project Strength Bars ────────────────────────────────────────────────────

function ProjectStrengthChart({ projects }: { projects: VisualizationData["projectStrengths"] }) {
  const maxScore = Math.max(...projects.map(p => p.score), 1);

  return (
    <Card className="glass-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <BarChart2 className="w-4 h-4 text-[#00e5ff]" />
        <h4 className="font-semibold text-sm">Top Projects by Strength</h4>
      </div>

      <div className="space-y-3">
        {projects.slice(0, 7).map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-300 font-mono truncate max-w-[140px]">{p.name}</span>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {p.language && <span className="text-[#00e5ff]">{p.language}</span>}
                <span>⭐ {p.stars}</span>
              </div>
            </div>
            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #00e5ff, #7c3aed)" }}
                initial={{ width: 0 }}
                animate={{ width: `${(p.score / maxScore) * 100}%` }}
                transition={{ duration: 0.7, delay: 0.2 + i * 0.06, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfileVisualizations({ data }: { data: VisualizationData }) {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <LanguageChart languages={data.languages} />
      <ActivityChart activity={data.activityHeatmap} />
      <div className="md:col-span-2 xl:col-span-1">
        <ProjectStrengthChart projects={data.projectStrengths} />
      </div>
    </div>
  );
}
