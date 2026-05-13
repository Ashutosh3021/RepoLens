/**
 * Settings Page
 *
 * - GitHub OAuth connection status (real NextAuth session)
 * - AI provider status (read from env via GET /api/settings/keys)
 * - Memory management (real chat history from GET /api/settings/chats)
 * - Theme toggle (dark only)
 */

"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Brain,
  Trash2,
  Moon,
  AlertCircle,
  Database,
  RefreshCw,
  Loader2,
  Check,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIProvider } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedChat {
  repo_id: string;
  last_message: string;
  last_message_time: string;
  message_count: number;
}

interface ProviderStatus {
  name: string;
  provider: AIProvider;
  icon: string;
  configured: boolean;
  maskedKey: string | null;
  /** For Ollama, show the base URL instead of a masked key */
  baseUrl?: string | null;
}

// ─── Provider status card ─────────────────────────────────────────────────────

function ProviderCard({ p }: { p: ProviderStatus }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
      <div className="flex items-center gap-3">
        <span className="text-lg">{p.icon}</span>
        <div>
          <p className="text-sm font-medium text-white">{p.name}</p>
          {p.configured && (
            <p className="text-xs text-slate-500 font-mono">
              {p.provider === "ollama"
                ? p.baseUrl ?? "http://localhost:11434"
                : p.maskedKey ?? "configured via env"}
            </p>
          )}
        </div>
      </div>
      <Badge
        variant="secondary"
        className={
          p.configured
            ? "bg-green-500/10 text-green-400"
            : "bg-white/[0.05] text-slate-500"
        }
      >
        {p.configured ? (
          <>
            <Check className="w-3 h-3 mr-1" />
            Active
          </>
        ) : (
          "Not set"
        )}
      </Badge>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = !!session;

  const [isDarkMode] = useState(true);

  // Provider statuses loaded from /api/settings/keys
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  // Saved chats loaded from /api/settings/chats
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [deletingChat, setDeletingChat] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  // ── Load provider statuses ──────────────────────────────────────────────────
  useEffect(() => {
    async function loadProviders() {
      setLoadingProviders(true);
      try {
        const res = await fetch("/api/settings/keys");
        if (!res.ok) return;
        const json = await res.json();
        const keys = (json.data?.apiKeys ?? {}) as Record<string, string | null>;

        const list: ProviderStatus[] = [
          {
            name: "Google Gemini",
            provider: "gemini",
            icon: "🔮",
            configured: !!keys.gemini,
            maskedKey: keys.gemini ?? null,
          },
          {
            name: "OpenAI",
            provider: "openai",
            icon: "🤖",
            configured: !!keys.openai,
            maskedKey: keys.openai ?? null,
          },
          {
            name: "Anthropic Claude",
            provider: "anthropic",
            icon: "🧠",
            configured: !!keys.anthropic,
            maskedKey: keys.anthropic ?? null,
          },
          {
            name: "Groq",
            provider: "groq",
            icon: "⚡",
            configured: !!keys.groq,
            maskedKey: keys.groq ?? null,
          },
          {
            name: "Ollama (Local)",
            provider: "ollama",
            icon: "🦙",
            configured: !!keys.ollama,
            maskedKey: null,
            baseUrl: keys.ollama ?? null,
          },
        ];
        setProviders(list);
      } catch {
        // Non-critical — leave empty
      } finally {
        setLoadingProviders(false);
      }
    }
    loadProviders();
  }, []);

  // ── Load saved chats ────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadChats() {
      setLoadingChats(true);
      setChatsError(null);
      try {
        const res = await fetch("/api/settings/chats");
        if (!res.ok) throw new Error("Failed to load chat history");
        const json = await res.json();
        setSavedChats(json.data ?? []);
      } catch (err) {
        setChatsError(err instanceof Error ? err.message : "Failed to load chat history");
      } finally {
        setLoadingChats(false);
      }
    }
    loadChats();
  }, []);

  // ── Chat management ─────────────────────────────────────────────────────────
  const handleDeleteChat = async (repoId: string) => {
    setDeletingChat(repoId);
    try {
      await fetch(`/api/chat/${encodeURIComponent(repoId)}`, { method: "DELETE" });
      setSavedChats((prev) => prev.filter((c) => c.repo_id !== repoId));
    } catch {
      // Silently fail — user can retry
    } finally {
      setDeletingChat(null);
    }
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    try {
      await Promise.all(
        savedChats.map((c) =>
          fetch(`/api/chat/${encodeURIComponent(c.repo_id)}`, { method: "DELETE" })
        )
      );
      setSavedChats([]);
    } catch {
      // Silently fail
    } finally {
      setClearingAll(false);
    }
  };

  // ── Timestamp formatter ─────────────────────────────────────────────────────
  const formatTimestamp = (ts: string) => {
    if (!ts) return "";
    try {
      const date = new Date(ts);
      const diffMs = Date.now() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch {
      return ts;
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">
            Manage your integrations, API keys, and preferences
          </p>
        </motion.div>

        <div className="space-y-6">

          {/* ── GitHub Connection ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "p-3 rounded-xl",
                    isAuthenticated ? "bg-green-500/10" : "bg-white/[0.05]"
                  )}
                >
                  <Github
                    className={cn(
                      "w-6 h-6",
                      isAuthenticated ? "text-green-400" : "text-slate-400"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">GitHub Connection</h3>
                    <Badge
                      variant="secondary"
                      className={cn(
                        isAuthenticated
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      )}
                    >
                      {sessionStatus === "loading"
                        ? "Checking…"
                        : isAuthenticated
                        ? "Connected"
                        : "Not Connected"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">
                    {isAuthenticated
                      ? `Connected as ${session?.user?.name ?? session?.user?.email ?? "GitHub user"}. You can push README changes to your repositories.`
                      : "Connect your GitHub account to push README changes and analyze private repositories."}
                  </p>
                  {isAuthenticated ? (
                    <Button
                      variant="outline"
                      onClick={() => signOut()}
                      className="border-white/[0.08] hover:bg-white/[0.05]"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={() => signIn("github")}
                      className="bg-[#00e5ff] hover:bg-[#00b8d4] text-[#0a0a0f]"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      Connect GitHub
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ── AI Providers ──────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-[#00e5ff]/10">
                  <Brain className="w-5 h-5 text-[#00e5ff]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI Providers</h3>
                  <p className="text-sm text-slate-400">
                    Configure keys in{" "}
                    <code className="font-mono text-[#00e5ff]">.env.local</code>{" "}
                    and restart the server
                  </p>
                </div>
              </div>

              {loadingProviders ? (
                <div className="flex items-center justify-center py-8 gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading provider status…</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {providers.map((p) => (
                    <ProviderCard key={p.provider} p={p} />
                  ))}
                </div>
              )}

              <div className="mt-5 p-3 rounded-lg bg-[#00e5ff]/5 border border-[#00e5ff]/10">
                <p className="text-xs text-slate-400">
                  <span className="text-[#00e5ff] font-medium">Ollama (Local):</span>{" "}
                  run{" "}
                  <code className="font-mono bg-white/[0.05] px-1 rounded">
                    ollama serve
                  </code>{" "}
                  and set{" "}
                  <code className="font-mono bg-white/[0.05] px-1 rounded">
                    OLLAMA_BASE_URL=http://localhost:11434
                  </code>{" "}
                  in <code className="font-mono">.env.local</code> to use local models
                  with no API key required.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* ── Memory Management ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-[#7c3aed]/10">
                  <Database className="w-5 h-5 text-[#7c3aed]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Memory Management</h3>
                  <p className="text-sm text-slate-400">
                    Manage saved chat history per repository
                  </p>
                </div>
              </div>

              {loadingChats ? (
                <div className="flex items-center justify-center py-8 gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading chat history…</span>
                </div>
              ) : chatsError ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{chatsError}</span>
                </div>
              ) : savedChats.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">
                  No saved chats.
                </p>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {savedChats.map((chat) => (
                      <div
                        key={chat.repo_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white text-sm">
                              {chat.repo_id}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-xs bg-white/[0.05]"
                            >
                              {chat.message_count} messages
                            </Badge>
                          </div>
                          {chat.last_message && (
                            <p className="text-xs text-slate-500 truncate">
                              Last: {chat.last_message}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">
                            {formatTimestamp(chat.last_message_time)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                            disabled={deletingChat === chat.repo_id}
                            onClick={() => handleDeleteChat(chat.repo_id)}
                          >
                            {deletingChat === chat.repo_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleClearAll}
                    disabled={clearingAll}
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                  >
                    {clearingAll ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Clearing…
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All Memory
                      </>
                    )}
                  </Button>
                </>
              )}
            </Card>
          </motion.div>

          {/* ── Appearance ────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-white/[0.05]">
                    <Moon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Theme</h3>
                    <p className="text-sm text-slate-400">
                      Dark mode is currently the only available theme
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isDarkMode}
                    disabled
                    className="data-[state=checked]:bg-[#00e5ff]"
                  />
                  <span className="text-sm text-slate-500">Dark</span>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-400">
                  Light theme is coming soon. Stay tuned for updates!
                </p>
              </div>
            </Card>
          </motion.div>

        </div>
      </div>
    </main>
  );
}
