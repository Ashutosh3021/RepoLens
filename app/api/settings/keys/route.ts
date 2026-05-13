/**
 * API Route: GET /api/settings/keys
 * Returns which providers are configured (via env vars only — no DB storage)
 */

import { NextResponse } from "next/server";

export async function GET() {
  const mask = (key: string | undefined) => {
    if (!key) return null;
    return key.slice(0, 4) + "..." + key.slice(-4);
  };

  return NextResponse.json({
    success: true,
    data: {
      provider: process.env.GEMINI_API_KEY
        ? "gemini"
        : process.env.OPENAI_API_KEY
        ? "openai"
        : process.env.ANTHROPIC_API_KEY
        ? "anthropic"
        : process.env.GROQ_API_KEY
        ? "groq"
        : process.env.OLLAMA_BASE_URL
        ? "ollama"
        : null,
      apiKeys: {
        gemini: mask(process.env.GEMINI_API_KEY),
        openai: mask(process.env.OPENAI_API_KEY),
        anthropic: mask(process.env.ANTHROPIC_API_KEY),
        groq: mask(process.env.GROQ_API_KEY),
        ollama: process.env.OLLAMA_BASE_URL ? process.env.OLLAMA_BASE_URL : null,
      },
      note: "API keys are configured via .env.local — see README for setup.",
    },
  });
}