/**
 * API Route: POST /api/readme/generate
 * Generate README content
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateReadme, generateReadmeWithAI } from "@/services/readme";
import { cache } from "@/lib/redis";
import type { AIProvider } from "@/lib/types";

const RequestSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  includeBadges: z.boolean().optional().default(true),
  includeBanner: z.boolean().optional().default(true),
  includeToc: z.boolean().optional().default(true),
  tone: z.enum(["professional", "casual", "technical"]).optional().default("professional"),
  useAI: z.boolean().optional().default(false),
  provider: z.enum(["gemini", "openai", "anthropic", "groq", "ollama"]).optional(),
  model: z.string().optional(),
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

    const {
      owner,
      repo,
      includeBadges,
      includeBanner,
      includeToc,
      tone,
      useAI,
      provider,
      model,
    } = parsed.data;

    // Get cached analysis
    const cacheKey = cache.generateRepoKey(owner, repo);
    const cached = await cache.get<{
      context: Record<string, unknown>;
      analysis: Record<string, unknown>;
    }>(cacheKey);

    if (!cached) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository not analyzed yet. Use POST /api/analyze first.",
        },
        { status: 404 }
      );
    }

    // Generate README
    let content: string;

    if (useAI && provider) {
      content = await generateReadmeWithAI(
        cached.context as unknown as Parameters<typeof generateReadmeWithAI>[0],
        cached.analysis as unknown as Parameters<typeof generateReadmeWithAI>[1],
        provider as AIProvider,
        model,
        {
          includeBadges,
          includeBanner,
          includeToc,
          tone,
        }
      );
    } else {
      content = generateReadme(
        cached.context as unknown as Parameters<typeof generateReadme>[0],
        cached.analysis as unknown as Parameters<typeof generateReadme>[1],
        {
          includeBadges,
          includeBanner,
          includeToc,
          tone,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        content,
        owner,
        repo,
      },
    });
  } catch (error) {
    console.error("README generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
