/**
 * useProfileAnalysis hook
 * Manages fetching and state for Full Profile Analysis
 */

"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { FullProfileAnalysis, ProfileAnalysisState, AnalysisStatus } from "@/lib/types/profile";

const STEPS: Array<{ status: AnalysisStatus; label: string; progress: number }> = [
  { status: "fetching-profile",  label: "Fetching GitHub profile…",        progress: 15 },
  { status: "fetching-repos",    label: "Loading repositories…",           progress: 40 },
  { status: "computing-scores",  label: "Computing category scores…",      progress: 70 },
  { status: "generating-roadmap",label: "Building improvement roadmap…",   progress: 90 },
  { status: "complete",          label: "Analysis complete!",              progress: 100 },
];

export function useProfileAnalysis() {
  const { data: session } = useSession();
  const [state, setState] = useState<ProfileAnalysisState>({
    status: "idle",
    progress: 0,
    progressLabel: "",
    analysis: null,
    error: null,
  });

  const setStep = (step: (typeof STEPS)[number]) => {
    setState(prev => ({
      ...prev,
      status: step.status,
      progress: step.progress,
      progressLabel: step.label,
    }));
  };

  const analyze = useCallback(
    async (username: string, forceRefresh = false) => {
      if (!username.trim()) return;

      setState({ status: "fetching-profile", progress: 15, progressLabel: "Fetching GitHub profile…", analysis: null, error: null });

      try {
        const token = (session as { accessToken?: string })?.accessToken;

        // Step 1 — show fetching profile UI
        setStep(STEPS[0]);

        // Step 2 — show loading repos UI
        setStep(STEPS[1]);

        const res = await fetch("/api/profile/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "x-github-token": token } : {}),
          },
          body: JSON.stringify({ username: username.trim(), forceRefresh }),
        });

        // Read the body ONCE immediately — before any awaits that could let the
        // stream be garbage collected.
        let json: { success: boolean; data?: FullProfileAnalysis; error?: string };
        try {
          const text = await res.text();
          json = JSON.parse(text);
        } catch {
          setState(prev => ({
            ...prev,
            status: "error",
            error: `Server returned an unreadable response (HTTP ${res.status}). Check server logs.`,
          }));
          return;
        }

        if (!res.ok || !json.success) {
          setState(prev => ({
            ...prev,
            status: "error",
            error: json.error ?? `Server error (HTTP ${res.status})`,
          }));
          return;
        }

        // Step 3 — brief UI pause to show "computing scores" step
        setStep(STEPS[2]);
        await delay(200);

        // Step 4 — brief UI pause to show "building roadmap" step
        setStep(STEPS[3]);
        await delay(150);

        // Complete
        setState({
          status: "complete",
          progress: 100,
          progressLabel: "Analysis complete!",
          analysis: json.data as FullProfileAnalysis,
          error: null,
        });
      } catch (err) {
        setState(prev => ({
          ...prev,
          status: "error",
          error: err instanceof Error ? err.message : "An unexpected error occurred",
        }));
      }
    },
    [session]
  );

  const reset = useCallback(() => {
    setState({ status: "idle", progress: 0, progressLabel: "", analysis: null, error: null });
  }, []);

  return { state, analyze, reset, isAuthenticated: !!(session as { accessToken?: string })?.accessToken };
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
