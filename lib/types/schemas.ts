/**
 * Zod validation schemas for RepoLens API
 */

import { z } from "zod";
import type { AIProvider } from "./index";

/**
 * AI Provider enum
 */
export const AIProviderSchema = z.enum(["gemini", "openai", "anthropic", "groq", "ollama"]);

/**
 * Repository URL validation
 */
export const RepoUrlSchema = z.object({
  url: z
    .string()
    .url("Invalid URL format")
    .refine(
      (url) => url.includes("github.com"),
      "URL must be a GitHub repository"
    )
    .refine(
      (url) => {
        const parts = url.replace("https://", "").replace("http://", "").split("/");
        return parts.length >= 2 && parts[0] === "github.com" && parts[1] && parts[2];
      },
      "Invalid GitHub repository URL format (expected: github.com/owner/repo)"
    ),
});

/**
 * Analysis request validation
 */
export const AnalyzeRequestSchema = z.object({
  url: z.string().url(),
  provider: AIProviderSchema.optional().default("gemini"),
  model: z.string().optional(),
  forceRefresh: z.boolean().optional().default(false),
});

/**
 * Chat message validation
 */
export const ChatMessageRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(4000, "Message too long"),
  provider: AIProviderSchema.optional(),
  model: z.string().optional(),
});

/**
 * API key validation
 */
export const ApiKeySchema = z.object({
  provider: AIProviderSchema,
  apiKey: z.string().min(10, "API key too short"),
  model: z.string().optional(),
});

/**
 * Settings update validation
 */
export const UpdateSettingsSchema = z.object({
  provider: AIProviderSchema.optional(),
  model: z.string().optional(),
  apiKeys: z
    .object({
      gemini: z.string().optional(),
      openai: z.string().optional(),
      anthropic: z.string().optional(),
      groq: z.string().optional(),
      ollama: z.string().optional(),
    })
    .optional(),
});

/**
 * README generation request validation
 */
export const ReadmeGenerateSchema = z.object({
  repoOwner: z.string(),
  repoName: z.string(),
  includeBadges: z.boolean().optional().default(true),
  includeBanner: z.boolean().optional().default(true),
  includeToc: z.boolean().optional().default(true),
  tone: z.enum(["professional", "casual", "technical"]).optional().default("professional"),
});

/**
 * README push request validation
 */
export const ReadmePushSchema = z.object({
  repoOwner: z.string(),
  repoName: z.string(),
  content: z.string().min(10, "README content too short"),
  message: z.string().optional().default("Update README.md via RepoLens"),
  branch: z.string().optional().default("main"),
});

/**
 * Route parameters validation
 */
export const RepoParamsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
});

/**
 * Type exports
 */
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type ChatMessageRequest = z.infer<typeof ChatMessageRequestSchema>;
export type ApiKeyRequest = z.infer<typeof ApiKeySchema>;
export type UpdateSettingsRequest = z.infer<typeof UpdateSettingsSchema>;
export type ReadmeGenerateRequest = z.infer<typeof ReadmeGenerateSchema>;
export type ReadmePushRequest = z.infer<typeof ReadmePushSchema>;
export type RepoParams = z.infer<typeof RepoParamsSchema>;
