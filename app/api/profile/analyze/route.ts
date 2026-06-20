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

    // Cache and return
    await cache.set(cacheKey, analysis, CACHE_TTL);

    return NextResponse.json({ success: true, data: analysis, cached: false });
  } catch (err) {
    console.error("Profile analysis error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
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
