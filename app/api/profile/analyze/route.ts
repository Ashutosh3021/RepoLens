/**
 * API Route: POST /api/profile/analyze
 * Fetches a GitHub user profile + all repos, runs scoring engine,
 * caches result, and returns FullProfileAnalysis.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchProfileData } from "@/lib/githubProfile";
import { computeFullProfileAnalysis } from "@/lib/profileScoring";
import { cache } from "@/lib/redis";

const Schema = z.object({
  username: z.string().min(1).max(39).trim(),
  forceRefresh: z.boolean().optional().default(false),
});

const CACHE_TTL = 60 * 60 * 6; // 6 hours

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid username" },
        { status: 400 }
      );
    }

    const { username, forceRefresh } = parsed.data;
    const cacheKey = `profile-analysis:${username.toLowerCase()}`;

    // Return cached result unless force-refresh
    if (!forceRefresh) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, data: cached, cached: true });
      }
    }

    // Use OAuth token if passed via header (for higher rate limits)
    const token =
      request.headers.get("x-github-token") ||
      process.env.GITHUB_TOKEN ||
      null;

    const isAuthenticated = !!token;

    // Fetch from GitHub
    const { profile, repos, error, rateLimited } = await fetchProfileData(username, token);

    if (error || !profile || !repos) {
      return NextResponse.json(
        { success: false, error: error ?? "Failed to fetch profile", rateLimited: !!rateLimited },
        { status: rateLimited ? 429 : 404 }
      );
    }

    // Compute scores
    const analysis = computeFullProfileAnalysis(profile, repos, isAuthenticated);

    // Strip the full repos array before caching — it can be 500+ items and
    // bloats the SQLite cache. The display layer only needs the top repos
    // already embedded in visualizations.projectStrengths.
    const { repos: _stripped, ...analysisToStore } = analysis;

    // Cache and return (without the raw repos array)
    await cache.set(cacheKey, analysisToStore, CACHE_TTL);

    return NextResponse.json({ success: true, data: analysisToStore, cached: false });
  } catch (err) {
    // Log the full error server-side for debugging
    console.error("[/api/profile/analyze] Unhandled error:", err);
    if (err instanceof Error) {
      console.error("Stack:", err.stack);
    }
    // Always return valid JSON — never let the body be empty
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error
          ? `Server error: ${err.message}`
          : "An unexpected server error occurred. Check server logs.",
      },
      { status: 500 }
    );
  }
}

// Allow GET for cache retrieval
export async function GET(request: NextRequest) {
  const username = new URL(request.url).searchParams.get("username");
  if (!username) {
    return NextResponse.json({ success: false, error: "username required" }, { status: 400 });
  }
  const cacheKey = `profile-analysis:${username.toLowerCase()}`;
  const cached = await cache.get(cacheKey);
  if (!cached) {
    return NextResponse.json({ success: false, error: "Not analyzed yet" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: cached, cached: true });
}
