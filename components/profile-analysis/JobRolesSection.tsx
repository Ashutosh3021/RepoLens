/**
 * JobRolesSection
 * Suggested job roles based on detected tech stack
 */

"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobRole } from "@/lib/types/profile";

interface Props {
  roles: JobRole[];
}

function matchColor(pct: number) {
  if (pct >= 70) return { bar: "#00e5ff", text: "text-[#00e5ff]", badge: "bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/30" };
  if (pct >= 50) return { bar: "#7c3aed", text: "text-[#7c3aed]", badge: "bg-[#7c3aed]/10 text-[#7c3aed] border-[#7c3aed]/30" };
  if (pct >= 30) return { bar: "#f59e0b", text: "text-yellow-400", badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" };
  return { bar: "#ef4444", text: "text-red-400", badge: "bg-red-500/10 text-red-400 border-red-500/30" };
}

export function JobRolesSection({ roles }: Props) {
  if (!roles.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#00e5ff]/10">
          <Briefcase className="w-5 h-5 text-[#00e5ff]" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Suggested Job Roles</h3>
          <p className="text-xs text-slate-400">Based on your detected tech stack and activity</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {roles.map((role, i) => {
          const colors = matchColor(role.match);
          return (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <Card className="glass-card glass-card-hover p-5 h-full">
                {/* Title + match */}
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-white text-sm leading-tight pr-2">{role.title}</h4>
                  <Badge variant="secondary" className={cn("text-xs border flex-shrink-0", colors.badge)}>
                    {role.match}% match
                  </Badge>
                </div>

                {/* Match bar */}
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-4">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: colors.bar }}
                    initial={{ width: 0 }}
                    animate={{ width: `${role.match}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.07, ease: "easeOut" }}
                  />
                </div>

                {/* Matched skills */}
                {role.matchedSkills.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1 mb-1.5">
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-slate-400">Matched</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {role.matchedSkills.slice(0, 5).map(s => (
                        <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-green-400/10 text-green-400">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing skills */}
                {role.missingSkills.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 mb-1.5">
                      <XCircle className="w-3 h-3 text-slate-500" />
                      <span className="text-xs text-slate-500">Missing</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {role.missingSkills.slice(0, 4).map(s => (
                        <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Salary */}
                {role.salary && (
                  <p className="text-xs text-slate-500 pt-2 border-t border-white/[0.06]">
                    💰 Typical range: <span className="text-slate-300">{role.salary}</span>
                  </p>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
