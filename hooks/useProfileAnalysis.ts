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

      const cacheKey = `profile-analysis:${username.trim().toLowerCase()}`;

      // --- sessionStorage cache (skip API call on repeat views) ---
      if (!forceRefresh) {
        try {
          const stored = sessionStorage.getItem(cacheKey);
          if (stored) {
            const parsed = JSON.parse(stored) as FullProfileAnalysis;
            setState({
              status: "complete",
              progress: 100,
              progressLabel: "Loaded from cache",
              analysis: parsed,
              error: null,
            });
            return;
          }
        } catch {
          // Corrupt cache entry — proceed with fresh fetch
          sessionStorage.removeItem(cacheKey);
        }
      }

      setState({
        status: "fetching-profile",
        progress: 15,
        progressLabel: "Fetching GitHub profile…",
        analysis: null,
        error: null,
      });

      try {
        const token = (session as { accessToken?: string })?.accessToken;

        setStep(STEPS[0]);
        setStep(STEPS[1]);

        const res = await fetch("/api/profile/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "x-github-token": token } : {}),
          },
          body: JSON.stringify({ username: username.trim() }),
        });

        // Read body once, immediately — before any awaits
        let json: { success: boolean; data?: FullProfileAnalysis; error?: string };
        try {
          const text = await res.text();
          json = JSON.parse(text);
        } catch {
          setState(prev => ({
            ...prev,
            status: "error",
            error: `Server returned an unreadable response (HTTP ${res.status}). Check the terminal running next dev for the full error.`,
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

        // Brief UI steps for perceived progress
        setStep(STEPS[2]);
        await delay(180);
        setStep(STEPS[3]);
        await delay(120);

        const result = json.data as FullProfileAnalysis;

        // Persist to sessionStorage for instant repeat loads
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(result));
        } catch {
          // sessionStorage quota exceeded — not critical
        }

        setState({
          status: "complete",
          progress: 100,
          progressLabel: "Analysis complete!",
          analysis: result,
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
