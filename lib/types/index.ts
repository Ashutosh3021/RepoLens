/**
 * Type definitions for RepoLens backend
 */

export type AIProvider = "gemini" | "openai" | "anthropic" | "groq" | "ollama";

export interface LLMResponse {
  content: string;
  model?: string;
  provider?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface RepoMetadata {
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  license: string | null;
  topics: string[];
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  size: number;
  isPrivate: boolean;
  homepage: string | null;
  hasWiki: boolean;
  hasPages: boolean;
}

export interface FileNode {
  path: string;
  type: "file" | "dir";
  size: number;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  language?: string;
}

export interface Contributor {
  login: string;
  avatarUrl: string;
  contributions: number;
  profileUrl: string;
}

export interface CommitActivity {
  totalCommitsLastYear: number;
  avgCommitsPerWeek: number;
  mostActiveWeek: string;
  lastCommitDate: string;
}

export interface LanguageBreakdown {
  [language: string]: number;
}

export interface Dependency {
  name: string;
  version: string;
  isDev: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: string;
  isLow: boolean;
}

export interface PushReadmeResult {
  success: boolean;
  commitUrl?: string;
  error?: string;
}

export interface ApiError {
  error: string;
  code: string;
  retryable: boolean;
}

export interface RepoContext {
  url: string;
  owner: string;
  repo: string;
  metadata: RepoMetadata;
  tree: { sha: string; tree: FileNode[]; truncated: boolean };
  readme: string;
  packageFile: { type: string; content: string; dependencies: string[] } | null;
  importantFiles: FileContent[];
  languages: LanguageBreakdown;
  contributors: Contributor[];
  lastCommit: { sha: string; message: string; date: string; author: string };
  commitActivity: CommitActivity;
  dependencies: Dependency[];
  scrapedAt: string;
  tokenUsed: "oauth" | "pat" | "none";
  fromCache?: boolean;
  cachedAt?: string;
}

export interface RepoTree {
  sha: string;
  tree: FileNode[];
  truncated: boolean;
}

export interface ImportantFile {
  path: string;
  content: string;
  size: number;
  language?: string;
}

export interface PackageFile {
  type: "package.json" | "requirements.txt" | "Cargo.toml" | "pom.xml" | "go.mod" | "Gemfile" | "build.gradle" | "composer.json" | "setup.py" | "pyproject.toml" | null;
  content: string;
  dependencies: string[];
}

export interface ScoreBreakdown {
  codeQuality: number;
  documentation: number;
  testing: number;
  activity: number;
  dependencies: number;
  community: number;
}

export interface AnalysisResult {
  explanation: string;
  score: {
    overall: number;
    breakdown: ScoreBreakdown;
    details: Record<keyof ScoreBreakdown, string[]>;
  };
  diagrams: {
    architecture: string;
    workflow: string;
  };
  deploymentGuide: {
    free: DeploymentOption[];
    paid: DeploymentOption[];
  };
  mcpConfig: Record<string, unknown>;
}

export interface DeploymentOption {
  name: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Advanced";
  steps: string[];
  features: string[];
  estimatedTime: string;
  pricing: string;
}

export interface ChatMessage {
  id: number;
  repoId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface ChatConversation {
  id: number;
  repoId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: number;
  userId: string;
  provider: AIProvider;
  model: string | null;
  apiKeys: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ReadmeGenerationRequest {
  repoContext: RepoContext;
  analysis: AnalysisResult;
  includeBadges: boolean;
  includeBanner: boolean;
  includeToc: boolean;
  tone: "professional" | "casual" | "technical";
}

export const AnalyzeRepoSchema = {
  url: "string",
  provider: "AIProvider.optional()",
  model: "string.optional()",
};

export const ChatMessageSchema = {
  message: "string",
  provider: "AIProvider.optional()",
  model: "string.optional()",
};

export interface RepoData {
  context: RepoContext;
  analysis: AnalysisResult;
  timestamp: string;
}

export const SaveApiKeysSchema = {
  provider: "AIProvider",
  apiKeys: "record",
};
