/**
 * ChatTab Component
 *
 * Dashboard Chat tab content:
 * - ChatGPT-style chat interface
 * - Message bubbles (user + assistant)
 * - Input bar
 * - Provider label
 * - Memory indicator
 *
 * Data flow:
 * 1. On mount: GET /api/chat/[repoId] to load history
 * 2. If empty, the first POST /api/chat/[repoId]/send will trigger
 *    server-side initializeSystemMessage automatically
 * 3. Subsequent sends: POST /api/chat/[repoId]/send
 * 4. Clear: DELETE /api/chat/[repoId]
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ChatBubble, ChatInput } from "@/components/chat-bubble";
import { ProviderBadge } from "@/components/provider-selector";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Trash2,
  Brain,
  Sparkles,
  Zap,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { RepoData, ChatMessage, AIProvider } from "@/lib/types";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function toDisplayMessage(msg: ChatMessage): DisplayMessage {
  return {
    id: String(msg.id),
    role: msg.role === "user" ? "user" : "assistant",
    content: msg.content,
    timestamp: new Date(msg.createdAt),
  };
}

export function ChatTab({ data }: { data: RepoData | null }) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Active provider — loaded from /api/settings/keys, defaults to gemini-1.5-flash
  const [provider, setProvider] = useState<AIProvider>("gemini");
  const [model, setModel] = useState<string>("gemini-1.5-flash");

  const repoId = data ? `${data.context.owner}/${data.context.repo}` : null;

  // Load active provider from settings on mount
  useEffect(() => {
    async function loadProvider() {
      try {
        const res = await fetch("/api/settings/keys");
        if (!res.ok) return;
        const json = await res.json();
        const savedProvider = json.data?.provider as AIProvider | null;
        if (savedProvider) {
          setProvider(savedProvider);
          // Set a sensible default model for the provider
          const defaultModels: Record<AIProvider, string> = {
            gemini:    "gemini-1.5-flash",
            openai:    "gpt-4o-mini",
            anthropic: "claude-3-haiku-20240307",
            groq:      "llama-3.1-8b-instant",
            ollama:    "llama3.2",
          };
          setModel(defaultModels[savedProvider] ?? "gemini-1.5-flash");
        }
      } catch {
        // Non-critical — keep defaults
      }
    }
    loadProvider();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Load chat history on mount
  const loadHistory = useCallback(async () => {
    if (!repoId) {
      setIsInitializing(false);
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const res = await fetch(`/api/chat/${encodeURIComponent(repoId)}`);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to load chat history");
      }
      const json = await res.json();
      const history: ChatMessage[] = json.data?.messages ?? [];

      // Filter out system messages for display
      const displayable = history
        .filter((m) => m.role !== "system")
        .map(toDisplayMessage);

      setMessages(displayable);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsInitializing(false);
    }
  }, [repoId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSendMessage = async (content: string) => {
    if (!repoId || !data) return;

    // Optimistically add user message
    const userMsg: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/chat/${encodeURIComponent(repoId)}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, provider, model }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to get response");
      }

      // Replace optimistic messages with server-confirmed history
      const serverMessages: ChatMessage[] = json.data?.messages ?? [];
      const displayable = serverMessages
        .filter((m) => m.role !== "system")
        .map(toDisplayMessage);
      setMessages(displayable);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      // Remove the optimistic user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!repoId) return;

    try {
      await fetch(`/api/chat/${encodeURIComponent(repoId)}`, {
        method: "DELETE",
      });
      setMessages([]);
      setError(null);
    } catch {
      setError("Failed to clear chat history");
    }
  };

  const memoryCount = messages.length;

  if (!data) {
    return (
      <div className="text-center py-12 text-slate-400">
        No repository data available
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-280px)] min-h-[500px] flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
            <MessageSquare className="w-4 h-4 text-[#00e5ff]" />
            <span className="text-sm text-slate-300">Chat with Repository</span>
          </div>
          <ProviderBadge provider={provider} />
        </div>

        <div className="flex items-center gap-2">
          {/* Memory Indicator */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
              memoryCount > 40
                ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                : "bg-[#7c3aed]/10 border-[#7c3aed]/30 text-[#7c3aed]"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">
              {memoryCount} message{memoryCount !== 1 ? "s" : ""} remembered
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            disabled={isLoading || messages.length === 0}
            className="text-slate-400 hover:text-red-400 hover:bg-red-400/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-3 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto h-6 px-2 text-red-400 hover:text-red-300"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Chat Messages */}
      <Card className="glass-card flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {isInitializing ? (
              <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading chat history…</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p>No messages yet. Ask something about this repository!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
                >
                  <ChatBubble
                    content={message.content}
                    role={message.role}
                    timestamp={message.timestamp}
                  />
                </motion.div>
              ))
            )}

            {isLoading && (
              <ChatBubble content="" role="assistant" isLoading={true} />
            )}
          </div>
        </ScrollArea>

        {/* Suggested Prompts — only when no messages yet */}
        {!isInitializing && messages.length === 0 && (
          <div className="px-4 py-3 border-t border-white/[0.08]">
            <p className="text-xs text-slate-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Explain the project structure",
                "How does authentication work?",
                "What are the main components?",
                "Suggest improvements",
              ].map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="text-xs border-white/[0.08] hover:bg-white/[0.05] hover:border-[#00e5ff]/30"
                >
                  <Sparkles className="w-3 h-3 mr-1.5 text-[#00e5ff]" />
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-white/[0.08]">
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading || isInitializing}
            placeholder="Ask about this repository…"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-500">
              Powered by{" "}
              <span className="text-[#00e5ff] font-mono">{model}</span>
            </p>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Zap className="w-3 h-3" />
              <span>Real AI responses</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
