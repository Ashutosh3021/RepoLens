/**
 * API Route: POST /api/profile/analyze
 * Fetches a GitHub user profile + all repos, runs scoring engine,
 * and returns FullProfileAnalysis.
 *
 * NOTE: We intentionally do NOT import the SQLite cache here.
 * The db module opens a file at /tmp/repolens-data which may not exist
 * on all platforms. The profile analysis is fast enough without caching
 * (GitHub API ≈ 2-4s), and the browser can cache via sessionStorage.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchProfileData } from "@/lib/githubProfile";
import { computeFullProfileAnalysis } from "@/lib/profileScoring";

const Schema = z.object({
  username: z.string().min(1).max(39).trim(),
  forceRefresh: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid username — must be 1–39 characters." },
        { status: 400 }
      );
    }

    const { username } = parsed.data;

    // Use OAuth token if passed via header (for higher GitHub rate limits)
    const token =
      request.headers.get("x-github-token") ||
      process.env.GITHUB_TOKEN ||
      null;

    const isAuthenticated = !!token;

    // Fetch profile + all repos from GitHub
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

    // Run scoring engine (pure computation, ~5ms)
    const analysis = computeFullProfileAnalysis(profile, repos, isAuthenticated);

    // Strip raw repos array from response — it can be 500+ objects.
    // All display data is already pre-computed inside analysis.visualizations.
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

// GET is not needed without a cache — keep it as a no-op to avoid 405s
export async function GET() {
  return NextResponse.json(
    { success: false, error: "Use POST /api/profile/analyze" },
    { status: 405 }
  );
}
