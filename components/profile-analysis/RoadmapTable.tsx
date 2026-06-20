/**
 * RoadmapTable
 * Actionable improvement roadmap rendered as a styled table
 */

"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapItem } from "@/lib/types/profile";

interface Props {
  items: RoadmapItem[];
}

const priorityColors: Record<RoadmapItem["priority"], string> = {
  High:   "bg-red-500/15 text-red-400 border-red-500/30",
  Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Low:    "bg-green-500/15 text-green-400 border-green-500/30",
};

const effortColors: Record<RoadmapItem["effort"], string> = {
  Low:    "text-green-400",
  Medium: "text-yellow-400",
  High:   "text-red-400",
};

const impactColors: Record<RoadmapItem["impact"], string> = {
  Low:    "text-slate-400",
  Medium: "text-[#00e5ff]",
  High:   "text-[#7c3aed]",
};

export function RoadmapTable({ items }: Props) {
  return (
    <Card className="glass-card overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.08]">
        <div className="p-2 rounded-lg bg-[#7c3aed]/10">
          <Map className="w-5 h-5 text-[#7c3aed]" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Actionable Improvement Roadmap</h3>
          <p className="text-xs text-slate-400">{items.length} prioritised actions to level up your profile</p>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-xs text-slate-500 uppercase tracking-wider">
              <th className="text-left px-6 py-3">Priority</th>
              <th className="text-left px-4 py-3">Action</th>
              <th className="text-center px-4 py-3">Effort</th>
              <th className="text-center px-4 py-3">Impact</th>
              <th className="text-right px-6 py-3">Timeframe</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-6 py-3">
                  <Badge variant="secondary" className={cn("text-xs border", priorityColors[item.priority])}>
                    {item.priority}
                  </Badge>
                </td>
                <td className="px-4 py-3 max-w-sm">
                  <p className="text-slate-300 leading-relaxed">{item.action}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("text-xs font-medium", effortColors[item.effort])}>
                    {item.effort}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("text-xs font-semibold", impactColors[item.impact])}>
                    {item.impact}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <span className="text-xs text-slate-500 whitespace-nowrap">{item.timeframe}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-white/[0.05]">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="p-4 space-y-2"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className={cn("text-xs border", priorityColors[item.priority])}>
                {item.priority}
              </Badge>
              <span className="text-xs text-slate-500">{item.timeframe}</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{item.action}</p>
            <div className="flex items-center gap-4 text-xs">
              <span>Effort: <span className={effortColors[item.effort]}>{item.effort}</span></span>
              <span>Impact: <span className={impactColors[item.impact]}>{item.impact}</span></span>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
