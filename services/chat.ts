/**
 * Chat Service
 * Handles chat history persistence and LLM-powered responses
 */

import type { ChatMessage, RepoContext, AIProvider } from "../lib/types";
import { chatDb } from "../lib/db";
import { llmService } from "./llm";

/**
 * System prompt for repository chat — rich, repo-specific context
 */
function buildSystemPrompt(context: RepoContext, explanation: string): string {
  const languageInfo = context.languages
    ? Object.entries(context.languages)
        .slice(0, 5)
        .map(([lang]) => lang)
        .join(", ")
    : context.metadata.language || "Unknown";

  const depsList = context.dependencies.length > 0
    ? context.dependencies
        .slice(0, 20)
        .map((d) => `${d.name}@${d.version}${d.isDev ? " (dev)" : ""}`)
        .join(", ")
    : "None detected";

  const fileTree = context.tree.tree
    .slice(0, 80)
    .map((f) => f.path)
    .join("\n");

  const keyFileContents = context.importantFiles
    .slice(0, 5)
    .map((f) => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 600)}\n\`\`\``)
    .join("\n\n");

  return `You are RepoLens AI, an expert assistant for the GitHub repository **${context.metadata.fullName}**.

## Repository Summary
${explanation.slice(0, 2000)}

## Tech Stack
- Languages: ${languageInfo}
- Primary Language: ${context.metadata.language || "Unknown"}
- Stars: ${context.metadata.stars} | Forks: ${context.metadata.forks}
- License: ${context.metadata.license || "N/A"}
- Topics: ${context.metadata.topics.slice(0, 8).join(", ") || "N/A"}

## Dependencies
${depsList}

## File Structure
\`\`\`
${fileTree}
\`\`\`

## Key File Contents
${keyFileContents}

## Instructions
- Answer questions specifically about THIS repository using the context above
- Reference actual file names, functions, and components from the codebase
- Provide accurate, detailed technical answers
- When asked about code, explain how it actually works in this repo
- For "how to" questions, give concrete steps based on the actual codebase
- Keep answers focused and practical
- If you don't know something specific about this repo, say so rather than guessing`;
}

/**
 * Get chat history for a repository
 */
export function getChatHistory(repoId: string, limit: number = 50): ChatMessage[] {
  const messages = chatDb.getHistory(repoId, limit) as Array<{
    id: number;
    repo_id: string;
    role: string;
    content: string;
    timestamp: string;
  }>;

  // Map DB column names to the ChatMessage type
  return messages.map((m) => ({
    id: m.id,
    repoId: m.repo_id,
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
    createdAt: m.timestamp,
  }));
}

/**
 * Send a message and get AI response using proper message-history format
 */
export async function sendMessage(
  repoId: string,
  message: string,
  context: RepoContext,
  explanation: string,
  provider: AIProvider = "gemini",
  model?: string,
  userId?: string
): Promise<{ response: string; messages: ChatMessage[] }> {
  console.log(`💬 Sending message for ${repoId}: ${message.slice(0, 50)}...`);

  if (!llmService.isRegistered(provider)) {
    throw new Error(
      `Provider ${provider} not registered. Please set the API key in settings.`
    );
  }

  // Save user message first
  chatDb.saveMessage(repoId, "user", message, userId);

  // Get recent history (last 30 messages for context window)
  const historyRaw = getChatHistory(repoId, 30);

  // Build the rich system prompt
  const systemPrompt = buildSystemPrompt(context, explanation);

  // Build proper conversation history for the LLM
  // Exclude system messages and the just-saved user message (passed as current prompt)
  const conversationHistory = historyRaw
    .filter((m) => m.role !== "system")
    .slice(0, -1) // exclude the current user message we just saved
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  try {
    const llmResponse = await llmService.generateCompletion(
      provider,
      message,
      {
        model,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 2000,
        conversationHistory,
      }
    );

    // Save AI response
    chatDb.saveMessage(repoId, "assistant", llmResponse.content, userId);

    console.log(`✅ Response received (${llmResponse.content.length} chars)`);

    const updatedHistory = getChatHistory(repoId, 50);

    return {
      response: llmResponse.content,
      messages: updatedHistory,
    };
  } catch (error) {
    const errorMessage = error instanceof Error
      ? `Sorry, I encountered an error: ${error.message}. Please try again.`
      : "Sorry, I encountered an unexpected error. Please try again.";

    chatDb.saveMessage(repoId, "assistant", errorMessage, userId);
    console.error("Chat error:", error);

    const updatedHistory = getChatHistory(repoId, 50);
    return {
      response: errorMessage,
      messages: updatedHistory,
    };
  }
}

/**
 * Clear chat history for a repository
 */
export function clearChatHistory(repoId: string): void {
  console.log(`🗑️ Clearing chat history for ${repoId}`);
  chatDb.clearHistory(repoId);
}

/**
 * Get message count for a repository
 */
export function getMessageCount(repoId: string): number {
  return chatDb.getMessageCount(repoId);
}

/**
 * Get all repositories with chat history for a user
 */
export function getUserChats(userId: string) {
  return chatDb.getUserChats(userId);
}

/**
 * Initialize system message for a repository (welcome message on first chat)
 */
export function initializeSystemMessage(
  repoId: string,
  context: RepoContext,
  explanation: string,
  userId?: string
): void {
  const history = getChatHistory(repoId, 1);
  if (history.length === 0) {
    const primaryLang = context.metadata.language || "various technologies";
    const depCount = context.dependencies.length;
    const fileCount = context.tree.tree.length;

    const welcomeMessage = `Hi! I'm your AI assistant for **${context.metadata.name}**.

${context.metadata.description ? `> ${context.metadata.description}` : ""}

Here's what I know about this repo:
- **${fileCount} files** tracked | **${depCount} dependencies** detected
- Primary language: **${primaryLang}**
- **${context.contributors.length}** contributors | **${context.metadata.stars.toLocaleString()}** stars

I have full access to the codebase structure, key file contents, and the complete dependency list. Ask me anything about how this code works!

Some things you can ask:
- "Walk me through the project architecture"
- "How does authentication work in this codebase?"
- "What does \`[specific file]\` do?"
- "How do I add a new feature?"`;

    chatDb.saveMessage(repoId, "assistant", welcomeMessage, userId);
  }
}

/**
 * Send a message with streaming response (simulated via regular completion)
 */
export async function sendMessageStream(
  repoId: string,
  message: string,
  context: RepoContext,
  explanation: string,
  provider: AIProvider = "gemini",
  model?: string,
  onChunk?: (chunk: string) => void,
  userId?: string
): Promise<string> {
  const result = await sendMessage(repoId, message, context, explanation, provider, model, userId);

  if (onChunk) {
    const words = result.response.split(" ");
    for (const word of words) {
      onChunk(word + " ");
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
  }

  return result.response;
}
