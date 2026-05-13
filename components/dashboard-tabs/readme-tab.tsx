/**
 * ReadmeTab Component
 *
 * Dashboard README tab content:
 * - Split view with markdown editor and preview
 * - Live preview with badges
 * - "Generate README" button calls POST /api/readme/generate
 * - "Push to GitHub" button calls POST /api/readme/push (requires auth)
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BadgeStrip } from "@/components/badge-strip";
import {
  Github,
  Save,
  Sparkles,
  Eye,
  Edit3,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { RepoData } from "@/lib/types";

export function ReadmeTab({ data }: { data: RepoData | null }) {
  const [content, setContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushSuccess, setPushSuccess] = useState<string | null>(null);

  // Seed with existing README from context on first load
  useEffect(() => {
    if (data?.context?.readme) {
      setContent(data.context.readme);
    }
  }, [data]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGenerate = async () => {
    if (!data) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/readme/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: data.context.owner,
          repo: data.context.repo,
          includeBadges: true,
          includeBanner: true,
          includeToc: true,
          tone: "professional",
          useAI: false,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to generate README");
      }

      setContent(json.data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate README");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePushToGitHub = async () => {
    if (!data || !content) return;

    setIsPushing(true);
    setError(null);
    setPushSuccess(null);

    try {
      // Get access token from session (NextAuth)
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const accessToken = (session as Record<string, string>)?.accessToken;

      if (!accessToken) {
        throw new Error(
          "GitHub authentication required. Please sign in with GitHub to push changes."
        );
      }

      const res = await fetch("/api/readme/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          owner: data.context.owner,
          repo: data.context.repo,
          content,
          message: "docs: update README via RepoLens",
          branch: data.context.metadata.defaultBranch || "main",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to push README");
      }

      setPushSuccess(json.data?.url || "README pushed successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to push README");
    } finally {
      setIsPushing(false);
    }
  };

  if (!data) {
    return (
      <div className="text-center py-12 text-slate-400">
        No repository data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error / Success Banners */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="h-6 px-2 text-red-400 hover:text-red-300"
          >
            ✕
          </Button>
        </div>
      )}
      {pushSuccess && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">
            README pushed!{" "}
            {pushSuccess.startsWith("http") && (
              <a
                href={pushSuccess}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View commit
              </a>
            )}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPushSuccess(null)}
            className="h-6 px-2 text-green-400 hover:text-green-300"
          >
            ✕
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditing(true)}
            className={
              isEditing
                ? "bg-[#00e5ff] hover:bg-[#00b8d4] text-[#0a0a0f]"
                : "border-white/[0.08] hover:bg-white/[0.05]"
            }
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant={!isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditing(false)}
            className={
              !isEditing
                ? "bg-[#00e5ff] hover:bg-[#00b8d4] text-[#0a0a0f]"
                : "border-white/[0.08] hover:bg-white/[0.05]"
            }
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="border-[#7c3aed]/30 text-[#7c3aed] hover:bg-[#7c3aed]/10"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {content ? "Regenerate" : "Generate README"}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            className="border-white/[0.08] hover:bg-white/[0.05]"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-400" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={handlePushToGitHub}
            disabled={isPushing || !content}
            className="bg-[#00e5ff] hover:bg-[#00b8d4] text-[#0a0a0f]"
          >
            {isPushing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Pushing…
              </>
            ) : (
              <>
                <Github className="w-4 h-4 mr-2" />
                Push to GitHub
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Empty state — no content yet */}
      {!content && !isGenerating && (
        <Card className="glass-card p-12 text-center space-y-4">
          <Sparkles className="w-10 h-10 text-[#7c3aed] mx-auto opacity-60" />
          <p className="text-slate-400 text-sm">
            No README content yet. Click{" "}
            <span className="text-[#7c3aed] font-medium">Generate README</span>{" "}
            to create one from the repository analysis.
          </p>
          <Button
            onClick={handleGenerate}
            className="border-[#7c3aed]/30 text-[#7c3aed] hover:bg-[#7c3aed]/10"
            variant="outline"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate README
          </Button>
        </Card>
      )}

      {/* Split View — only shown when there's content */}
      {(content || isGenerating) && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Editor */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`${!isEditing ? "hidden lg:block" : ""}`}
          >
            <Card className="glass-card overflow-hidden">
              <div className="px-4 py-2 border-b border-white/[0.08] bg-white/[0.02]">
                <span className="text-sm text-slate-400 font-mono">README.md</span>
              </div>
              {isGenerating ? (
                <div className="flex items-center justify-center min-h-[500px] gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Generating README…</span>
                </div>
              ) : (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[500px] border-0 rounded-none bg-transparent resize-none font-mono text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Write your README here…"
                />
              )}
            </Card>
          </motion.div>

          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`${isEditing ? "hidden lg:block" : ""}`}
          >
            <Card className="glass-card overflow-hidden">
              <div className="px-4 py-2 border-b border-white/[0.08] bg-white/[0.02]">
                <span className="text-sm text-slate-400">Preview</span>
              </div>
              <div className="p-6 custom-scrollbar overflow-y-auto max-h-[500px]">
                {/* Badges Preview */}
                <div className="mb-6">
                  <BadgeStrip />
                </div>

                {/* Markdown Preview */}
                <div className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-3xl font-bold text-white mb-4 border-b border-white/[0.08] pb-2">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-semibold text-[#00e5ff] mt-6 mb-3">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-medium text-slate-200 mt-4 mb-2">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-slate-300 mb-4 leading-relaxed">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-4 text-slate-300 space-y-1">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-4 text-slate-300 space-y-1">
                          {children}
                        </ol>
                      ),
                      code: ({ children }) => (
                        <code className="bg-[#00e5ff]/10 text-[#00e5ff] px-1.5 py-0.5 rounded font-mono text-sm">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-[#0a0a0f] border border-[#00e5ff]/10 rounded-lg p-4 mb-4 overflow-x-auto">
                          {children}
                        </pre>
                      ),
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          className="text-[#00e5ff] hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-[#7c3aed] pl-4 italic text-slate-400 my-4">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
