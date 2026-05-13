/**
 * API Route: POST /api/analyze
 * Main analysis endpoint - fetches repo data via GitHub API and runs AI analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseRepoUrl, buildRepoContext } from "@/lib/github";
import { analyzeRepository } from "@/services/analysis";
import { llmService } from "@/services/llm";
import { cache } from "@/lib/redis";
import type { AIProvider } from "@/lib/types";

const RequestSchema = z.object({
  url: z.string().url(),
  provider: z.enum(["gemini", "openai", "anthropic", "groq", "ollama"]).optional().default("gemini"),
  model: z.string().optional(),
  forceRefresh: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { url, provider, model, forceRefresh } = parsed.data;

    // Verify the requested provider is available before doing any expensive work
    if (!llmService.isRegistered(provider as AIProvider)) {
      return NextResponse.json(
        {
          success: false,
          error:
            provider === "ollama"
              ? "Ollama is not running. Start it with `ollama serve` and make sure OLLAMA_BASE_URL is set in .env.local."
              : `Provider "${provider}" is not configured. Add the API key to .env.local and restart the server.`,
        },
        { status: 400 }
      );
    }

    // Parse owner and repo from URL
    const parseResult = parseRepoUrl(url);
    if (!parseResult) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid GitHub URL format",
        },
        { status: 400 }
      );
    }

    const { owner, repo } = parseResult;
    const cacheKey = cache.generateRepoKey(owner, repo);

    // Check cache unless force refresh
    if (!forceRefresh) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        console.log(`📦 Cache hit for ${owner}/${repo}`);
        return NextResponse.json({
          success: true,
          data: cached,
          cached: true,
        });
      }
    }

    // Get GitHub access token from session (if available)
    const accessToken = request.headers.get("x-github-token") || undefined;

    // Fetch repository data via GitHub API
    console.log(`🔍 Fetching ${owner}/${repo} from GitHub API...`);
    const repoResult = await buildRepoContext(url, accessToken, forceRefresh);

    if (!repoResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: repoResult.error?.error || "Failed to fetch repository",
        },
        { status: 500 }
      );
    }

    const repoContext = repoResult.data;

    // Run analysis
    console.log(`🧠 Analyzing with ${provider}...`);
    const analysis = await analyzeRepository(repoContext, provider as AIProvider, model);

    // Prepare response
    const result = {
      context: repoContext,
      analysis,
      timestamp: new Date().toISOString(),
    };

    // Cache the result
    await cache.set(cacheKey, result, 60 * 60 * 24); // 24 hours

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
