/**
 * OverviewTab Component
 *
 * Dashboard Overview tab content:
 * - AI-generated project explanation (rendered safely via react-markdown)
 * - Top dependencies list
 * - Key repository statistics
 */

"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FolderTree,
  Package,
  GitCommit,
  Users,
  FileCode,
  ExternalLink,
} from "lucide-react";
import type { RepoData } from "@/lib/types";

export function OverviewTab({ data }: { data: RepoData | null }) {
  if (!data) {
    return (
      <div className="text-center py-12 text-slate-400">
        No repository data available
      </div>
    );
  }

  const { context, analysis } = data;
  const files = context.tree.tree.length;
  const commits = context.commitActivity.totalCommitsLastYear;
  const contributors = context.contributors.length;
  const dependencies = context.dependencies.length;
  // Show top 8 production deps first, then dev deps
  const prodDeps = context.dependencies.filter((d) => !d.isDev);
  const devDeps = context.dependencies.filter((d) => d.isDev);
  const topDependencies = [...prodDeps.slice(0, 6), ...devDeps.slice(0, 2)].slice(0, 8);
  const devDepsCount = devDeps.length;
  const prodDepsCount = prodDeps.length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileCode}  label="Files"        value={files}         color="cyan"   />
        <StatCard icon={GitCommit} label="Commits"      value={commits}       color="purple" />
        <StatCard icon={Users}     label="Contributors" value={contributors}  color="green"  />
        <StatCard icon={Package}   label="Dependencies" value={dependencies}  color="yellow" />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI Explanation — safe markdown rendering */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="glass-card p-6 h-full overflow-y-auto max-h-[520px]">
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink className="w-5 h-5 text-[#00e5ff]" />
              <h3 className="font-semibold text-lg">AI Explanation</h3>
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-slate-300">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mb-4 text-white border-b border-white/[0.08] pb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold mt-5 mb-2 text-[#00e5ff]">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-medium mt-4 mb-1 text-slate-200">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-slate-300 mb-3 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-3 text-slate-300 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-3 text-slate-300 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-slate-300">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-[#00e5ff] font-semibold">{children}</strong>
                  ),
                  code: ({ children }) => (
                    <code className="bg-[#00e5ff]/10 text-[#00e5ff] px-1.5 py-0.5 rounded font-mono text-xs">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-[#0a0a0f] border border-white/[0.08] rounded-lg p-3 mb-3 overflow-x-auto text-xs">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-[#7c3aed] pl-4 italic text-slate-400 my-3">
                      {children}
                    </blockquote>
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
                }}
              >
                {analysis.explanation || "_No explanation available._"}
              </ReactMarkdown>
            </div>
          </Card>
        </motion.div>

        {/* Dependencies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          {/* Top Dependencies */}
          <Card className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FolderTree className="w-5 h-5 text-[#7c3aed]" />
              <h3 className="font-semibold text-lg">Top Dependencies</h3>
            </div>
            {topDependencies.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No dependencies detected.
              </p>
            ) : (
              <div className="space-y-3">
                {topDependencies.map((dep, index) => (
                  <div
                    key={dep.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-mono text-sm">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-[#00e5ff] text-sm truncate max-w-[160px]">
                        {dep.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {dep.isDev && (
                        <span className="text-xs text-slate-500 px-1.5 py-0.5 rounded bg-white/[0.05]">dev</span>
                      )}
                      <span className="text-xs text-slate-400 font-mono">{dep.version}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Dependency Summary */}
          <Card className="glass-card p-6">
            <h3 className="font-semibold text-lg mb-4">Dependency Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-[#00e5ff]/5 border border-[#00e5ff]/10">
                <div className="text-2xl font-bold text-[#00e5ff]">{dependencies}</div>
                <div className="text-xs text-slate-400 mt-1">Total</div>
              </div>
              <div className="p-4 rounded-lg bg-[#7c3aed]/5 border border-[#7c3aed]/10">
                <div className="text-2xl font-bold text-[#7c3aed]">{prodDepsCount}</div>
                <div className="text-xs text-slate-400 mt-1">Production</div>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.05] border border-white/[0.08]">
                <div className="text-2xl font-bold text-white">{devDepsCount}</div>
                <div className="text-xs text-slate-400 mt-1">Development</div>
              </div>
            </div>
            {context.commitActivity.avgCommitsPerWeek > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center justify-between text-sm">
                <span className="text-slate-400">Avg commits/week</span>
                <span className="text-green-400 font-semibold">{context.commitActivity.avgCommitsPerWeek}</span>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "cyan" | "purple" | "green" | "yellow";
}) {
  const colorClasses = {
    cyan:   "text-[#00e5ff] bg-[#00e5ff]/10 border-[#00e5ff]/20",
    purple: "text-[#7c3aed] bg-[#7c3aed]/10 border-[#7c3aed]/20",
    green:  "text-green-400 bg-green-400/10 border-green-400/20",
    yellow: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`glass-card p-4 text-center border ${colorClasses[color]}`}>
        <Icon className="w-5 h-5 mx-auto mb-2 opacity-80" />
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs opacity-70 mt-0.5">{label}</div>
      </Card>
    </motion.div>
  );
}
