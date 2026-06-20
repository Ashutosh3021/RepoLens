/**
 * API Route: POST /api/profile/analyze
 * Fetches a GitHub user profile + repos, runs the scoring engine,
 * and returns FullProfileAnalysis.
 *
 * No SQLite/Redis imports — avoids the better-sqlite3 native addon
 * crash on Vercel serverless. The browser caches results in sessionStorage.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchProfileData } from "@/lib/githubProfile";
import { computeFullProfileAnalysis } from "@/lib/profileScoring";

// Tell Vercel to allow up to 30s for this route.
// On Hobby plan the max is 10s — sign in with GitHub for faster requests.
export const maxDuration = 30;

const Schema = z.object({
  username: z.string().min(1).max(39).trim(),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid username — must be 1–39 characters." },
        { status: 400 }
      );
    }

    const { username } = parsed.data;

    // OAuth token → 5000/hr rate limit vs 60/hr unauthenticated
    const token =
      request.headers.get("x-github-token") ||
      process.env.GITHUB_TOKEN ||
      null;

    const isAuthenticated = !!token;

    // Fetch profile + repos from GitHub
    const { profile, repos, error, rateLimited } = await fetchProfileData(username, token);

    if (error || !profile || !repos) {
      return NextResponse.json(
        {
          success: false,
          error: error ?? "Failed to fetch GitHub profile",
          rateLimited: !!rateLimited,
        },
        { status: rateLimited ? 429 : 404 }
      );
    }

    // Pure computation — no I/O, ~5ms
    const analysis = computeFullProfileAnalysis(profile, repos, isAuthenticated);

    // Strip raw repos array — not needed by the UI, keeps payload small
    const { repos: _raw, ...payload } = analysis;

    return NextResponse.json({ success: true, data: payload });
  } catch (err) {
    console.error("[POST /api/profile/analyze] error:", err);
    if (err instanceof Error) console.error("Stack:", err.stack);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: "Use POST /api/profile/analyze" },
    { status: 405 }
  );
}
