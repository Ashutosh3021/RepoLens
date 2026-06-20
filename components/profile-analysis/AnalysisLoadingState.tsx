/**
 * AnalysisLoadingState
 * Progress bar + animated skeleton while analysis runs.
 * Shows "Log in for fast results" hint when unauthenticated.
 */

"use client";

import { motion } from "framer-motion";
import { Github, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface Props {
  progress: number;
  label: string;
  isAuthenticated: boolean;
}

export function AnalysisLoadingState({ progress, label, isAuthenticated }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 space-y-8 max-w-md mx-auto">
      {/* Animated icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-[#00e5ff]/10 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#00e5ff] animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full animate-pulse-glow pointer-events-none" />
      </div>

      {/* Label */}
      <div className="text-center space-y-1">
        <p className="text-white font-semibold">{label}</p>
        <p className="text-slate-500 text-sm">This may take a moment…</p>
      </div>

      {/* Progress bar */}
      <div className="w-full space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #00e5ff, #7c3aed)" }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Steps checklist */}
      <div className="w-full space-y-2">
        {[
          { label: "Fetching GitHub profile",  done: progress >= 15 },
          { label: "Loading repositories",      done: progress >= 40 },
          { label: "Computing category scores", done: progress >= 70 },
          { label: "Building roadmap",           done: progress >= 90 },
        ].map(step => (
          <div key={step.label} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${step.done ? "bg-[#00e5ff]" : "bg-white/10"}`} />
            <span className={`text-sm transition-colors duration-300 ${step.done ? "text-slate-300" : "text-slate-600"}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Unauthenticated hint */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full p-4 rounded-xl bg-yellow-500/8 border border-yellow-500/20 text-center space-y-3"
        >
          <p className="text-sm text-yellow-300/90">
            ⚡ <span className="font-semibold">Log in for fast results</span>
          </p>
          <p className="text-xs text-slate-400">
            GitHub limits unauthenticated requests to 60/hour. Signing in raises
            this to 5,000/hour and speeds up analysis significantly.
          </p>
          <Button
            size="sm"
            onClick={() => signIn("github")}
            className="bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs"
          >
            <Github className="w-3.5 h-3.5 mr-1.5" />
            Sign in with GitHub
          </Button>
        </motion.div>
      )}
    </div>
  );
}
