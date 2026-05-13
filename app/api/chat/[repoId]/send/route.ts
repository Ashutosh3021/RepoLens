/**
 * API Route: POST /api/chat/[repoId]/send
 * Send a message and get AI response
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendMessage, initializeSystemMessage, getChatHistory } from "@/services/chat";
import { cache } from "@/lib/redis";
import type { AIProvider, RepoContext } from "@/lib/types";

interface RouteParams {
  params: Promise<{
    repoId: string;
  }>;
}

const RequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(4000, "Message too long"),
  provider: z.enum(["gemini", "openai", "anthropic", "groq", "ollama"]).optional(),
  model: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { repoId } = await params;
    const decodedRepoId = decodeURIComponent(repoId);

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

    const { message, provider, model } = parsed.data;

    // Get cached analysis
    const parts = decodedRepoId.split("/");
    const cacheKey = cache.generateRepoKey(parts[0], parts[1]);
    const cached = await cache.get<{
      context: RepoContext;
      analysis: { explanation: string };
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

    // Initialize system message if chat history is empty (first message)
    const existingHistory = getChatHistory(decodedRepoId, 1);
    if (existingHistory.length === 0) {
      initializeSystemMessage(
        decodedRepoId,
        cached.context as RepoContext,
        cached.analysis.explanation
      );
    }

    // Send message
    const result = await sendMessage(
      decodedRepoId,
      message,
      cached.context as RepoContext,
      cached.analysis.explanation,
      (provider || "gemini") as AIProvider,
      model
    );

    return NextResponse.json({
      success: true,
      data: {
        repoId: decodedRepoId,
        response: result.response,
        messages: result.messages,
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
