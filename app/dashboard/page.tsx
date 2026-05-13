/**
 * Dashboard Page
 *
 * Main dashboard with:
 * - Sidebar with repo info
 * - Tab navigation (Overview, Score, Diagrams, README, Chat, Deploy, MCP)
 * - Content area for active tab
 *
 * Data flow:
 * 1. Read from sessionStorage (set by landing page after analysis)
 * 2. If missing (e.g. page refresh), attempt to re-fetch from /api/repo/[owner]/[repo]
 *    using owner/repo stored in URL query params
 * 3. If neither available, show "No repository analyzed" state
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { OverviewTab } from "@/components/dashboard-tabs/overview-tab";
import { ScoreTab } from "@/components/dashboard-tabs/score-tab";
import { DiagramsTab } from "@/components/dashboard-tabs/diagrams-tab";
import { ReadmeTab } from "@/components/dashboard-tabs/readme-tab";
import { ChatTab } from "@/components/dashboard-tabs/chat-tab";
import { DeployTab } from "@/components/dashboard-tabs/deploy-tab";
import { McpTab } from "@/components/dashboard-tabs/mcp-tab";
import {
  LayoutDashboard,
  BarChart3,
  GitGraph,
  FileText,
  MessageSquare,
  Rocket,
  Server,
  Star,
  GitCommit,
  Users,
  Code2,
  Calendar,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { RepoData } from "@/lib/types";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "score", label: "Score", icon: BarChart3 },
  { id: "diagrams", label: "Diagrams", icon: GitGraph },
  { id: "readme", label: "README", icon: FileText },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "deploy", label: "Deploy", icon: Rocket },
  { id: "mcp", label: "MCP", icon: Server },
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      // 1. Try sessionStorage first
      try {
        const stored = sessionStorage.getItem("repoData");
        if (stored) {
          const parsed: RepoData = JSON.parse(stored);
          setRepoData(parsed);
          setIsLoading(false);
          return;
        }
      } catch {
        // sessionStorage parse failed, continue to fallback
      }

      // 2. Fallback: try to re-fetch from cache API using URL params
      const owner = searchParams.get("owner");
      const repo = searchParams.get("repo");

      if (owner && repo) {
        try {
          const res = await fetch(`/api/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              setRepoData(json.data as RepoData);
              // Restore sessionStorage so subsequent tab switches work
              sessionStorage.setItem("repoData", JSON.stringify(json.data));
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // network error
        }
        setError("Could not reload repository data. Please analyze again.");
      } else {
        setError("No repository data found. Please analyze a repository first.");
      }

      setIsLoading(false);
    }

    loadData();
  }, [searchParams]);

  // Loading state
  if (isLoading) {
    return (
      <main className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#00e5ff] animate-spin mx-auto" />
          <p className="text-slate-400">Loading repository data…</p>
        </div>
      </main>
    );
  }

  // Error / no data state
  if (error || !repoData) {
    return (
      <main className="pt-16 min-h-screen flex items-center justify-center px-4">
        <Card className="glass-card p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto" />
          <h2 className="text-xl font-semibold text-white">No Repository Data</h2>
          <p className="text-slate-400 text-sm">
            {error || "No repository has been analyzed yet."}
          </p>
          <Button
            onClick={() => router.push("/")}
            className="bg-[#00e5ff] hover:bg-[#00b8d4] text-[#0a0a0f]"
          >
            Analyze a Repository
          </Button>
        </Card>
      </main>
    );
  }

  const { context } = repoData;

  const displayData = {
    name: context.repo,
    owner: context.owner,
    fullName: context.metadata.fullName,
    description: context.metadata.description,
    stars: context.metadata.stars,
    forks: context.metadata.forks,
    language: context.metadata.language || "Unknown",
    lastCommit: context.lastCommit.date
      ? new Date(context.lastCommit.date).toLocaleDateString()
      : "Unknown",
    contributors: context.contributors.length,
    issues: context.metadata.openIssues,
    created: new Date(context.metadata.createdAt).toLocaleDateString(),
    url: context.url,
  };

  return (
    <main className="pt-16 min-h-screen">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 fixed left-0 top-16 bottom-0 border-r border-white/[0.08] bg-[#0a0a0f]/95 backdrop-blur-xl">
          <ScrollArea className="h-full">
            <div className="p-6">
              {/* Repo Info Card */}
              <Card className="glass-card p-4 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="w-12 h-12 border-2 border-[#00e5ff]/30">
                    <AvatarImage src={`https://github.com/${displayData.owner}.png`} />
                    <AvatarFallback className="bg-[#7c3aed] text-white">
                      {displayData.owner[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-white truncate">
                      {displayData.name}
                    </h2>
                    <p className="text-sm text-slate-400 truncate">
                      {displayData.owner}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                  {displayData.description || "No description available"}
                </p>

                <a
                  href={displayData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-[#00e5ff] hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on GitHub
                </a>
              </Card>

              {/* Stats */}
              <div className="space-y-3 mb-6">
                <StatItem
                  icon={Star}
                  label="Stars"
                  value={displayData.stars.toLocaleString()}
                  color="yellow"
                />
                <StatItem
                  icon={Code2}
                  label="Language"
                  value={displayData.language}
                  color="cyan"
                />
                <StatItem
                  icon={GitCommit}
                  label="Last Commit"
                  value={displayData.lastCommit}
                  color="purple"
                />
                <StatItem
                  icon={Users}
                  label="Contributors"
                  value={displayData.contributors.toString()}
                  color="green"
                />
                <StatItem
                  icon={Calendar}
                  label="Created"
                  value={displayData.created}
                  color="slate"
                />
              </div>

              <Separator className="bg-white/[0.08] mb-6" />

              {/* Language Badge */}
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#00e5ff]" />
                <span className="text-sm text-slate-300">{displayData.language}</span>
                {context.languages && Object.keys(context.languages).length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs bg-white/[0.05]">
                    {(() => {
                      const total = Object.values(context.languages).reduce((a, b) => a + b, 0);
                      const primary = Object.values(context.languages)[0] || 0;
                      return total > 0 ? `${((primary / total) * 100).toFixed(1)}%` : "";
                    })()}
                  </Badge>
                )}
              </div>

              {/* Cache indicator */}
              {context.fromCache && (
                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Cached result
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:ml-72">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
            {/* Mobile Repo Info */}
            <div className="lg:hidden mb-6">
              <Card className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-[#7c3aed] text-white text-sm">
                      {displayData.owner[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-white">{displayData.name}</h2>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        {displayData.stars.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Code2 className="w-3.5 h-3.5" />
                        {displayData.language}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="bg-white/[0.03] border border-white/[0.08] p-1 flex flex-wrap h-auto gap-1">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="data-[state=active]:bg-[#00e5ff]/10 data-[state=active]:text-[#00e5ff] flex items-center gap-2"
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <TabsContent value="overview" className="mt-0">
                  <OverviewTab data={repoData} />
                </TabsContent>

                <TabsContent value="score" className="mt-0">
                  <ScoreTab data={repoData} />
                </TabsContent>

                <TabsContent value="diagrams" className="mt-0">
                  <DiagramsTab data={repoData} />
                </TabsContent>

                <TabsContent value="readme" className="mt-0">
                  <ReadmeTab data={repoData} />
                </TabsContent>

                <TabsContent value="chat" className="mt-0">
                  <ChatTab data={repoData} />
                </TabsContent>

                <TabsContent value="deploy" className="mt-0">
                  <DeployTab data={repoData} />
                </TabsContent>

                <TabsContent value="mcp" className="mt-0">
                  <McpTab data={repoData} />
                </TabsContent>
              </motion.div>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="pt-16 min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#00e5ff] animate-spin" />
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: "yellow" | "cyan" | "purple" | "green" | "slate";
}) {
  const colorClasses = {
    yellow: "text-yellow-400",
    cyan: "text-[#00e5ff]",
    purple: "text-[#7c3aed]",
    green: "text-green-400",
    slate: "text-slate-400",
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className={`text-sm font-medium ${colorClasses[color]}`}>
        {value}
      </span>
    </div>
  );
}
