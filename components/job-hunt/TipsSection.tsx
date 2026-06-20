/**
 * TipsSection
 * Profile, Visibility & Algorithm Tricks section
 */

"use client";

import { Card } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import type { JobHuntTip } from "@/lib/types/job-hunt";

interface Props {
  tips: JobHuntTip[];
}

export function TipsSection({ tips }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#f59e0b]/10">
          <Lightbulb className="w-5 h-5 text-[#f59e0b]" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Profile, Visibility & Algorithm Tricks</h3>
          <p className="text-xs text-slate-400">Optimize your LinkedIn profile and job search strategy</p>
        </div>
      </div>

      <div className="grid gap-3">
        {tips.map((tip) => (
          <Card key={tip.id} className="glass-card glass-card-hover p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="w-6 h-6 rounded-full bg-[#f59e0b]/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-[#f59e0b]">{tip.id}</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">{tip.title}</p>
                <p className="text-xs text-slate-400">{tip.content}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
