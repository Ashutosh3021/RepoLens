/**
 * GitHub API Service for RepoLens
 *
 * Production-ready GitHub API integration:
 * - OAuth token > PAT > unauthenticated priority
 * - { data, error } pattern — never throws raw errors
 * - Full TypeScript typing
 * - SQLite/Redis caching with force refresh
 * - Rate limiting awareness
 *
 * @module github
 */

import { cache } from "./redis";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const MAX_FILES = 3000;
const MAX_FILE_SIZE = 1048576; // 1 MB

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function getAuthHeader(token?: string): Record<string, string> {
  return getHeaders(token);
}

function getToken(sessionToken?: string | null): string | undefined {
  return sessionToken || process.env.GITHUB_PAT || undefined;
}

async function fetchJson<T>(
  url: string,
  token?: string
): Promise<{ data?: T; error?: ApiError }> {
  try {
    const response = await fetch(url, { headers: getHeaders(token) });

    if (response.status === 404)
      return { error: { error: "Repository not found", code: "NOT_FOUND", retryable: false } };

    if (response.status === 403) {
      if (response.headers.get("X-RateLimit-Remaining") === "0")
        return {
          error: {
            error: "GitHub API rate limit reached. Connect your GitHub account for higher limits.",
            code: "RATE_LIMITED",
            retryable: true,
          },
        };
      return { error: { error: "Access denied. Repository may be private.", code: "FORBIDDEN", retryable: false } };
    }

    if (response.status === 422)
      return { error: { error: "Invalid repository URL", code: "INVALID_URL", retryable: false } };

    if (!response.ok)
      return { error: { error: `GitHub API error: ${response.statusText}`, code: "API_ERROR", retryable: true } };

    return { data: (await response.json()) as T };
  } catch {
    return { error: { error: "Unable to reach GitHub API. Check your connection.", code: "NETWORK_ERROR", retryable: true } };
  }
}

// ─── Parse URL ────────────────────────────────────────────────────────────────

export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  if (!url) return null;
  url = url.replace(/\/$/, "");

  let match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (match) {
    const repo = match[2].replace(/\.git$/, "").split("?")[0].split("#")[0];
    return { owner: match[1], repo };
  }

  match = url.match(/^([^/]+)\/([^/]+)$/);
  if (match) return { owner: match[1], repo: match[2] };

  return null;
}

// ─── Repo Metadata ────────────────────────────────────────────────────────────

export async function getRepoMetadata(
  owner: string,
  repo: string,
  token?: string
): Promise<{ data?: RepoMetadata; error?: ApiError }> {
  const result = await fetchJson<{
    name: string; full_name: string; description: string | null;
    language: string | null; stargazers_count: number; forks_count: number;
    watchers_count: number; open_issues_count: number;
    license: { spdx_id: string } | null; topics: string[];
    default_branch: string; created_at: string; updated_at: string;
    pushed_at: string; size: number; private: boolean;
    homepage: string | null; has_wiki: boolean; has_pages: boolean;
  }>(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, token);

  if (result.error) return { error: result.error };
  if (result.data?.private)
    return { error: { error: "Private repositories are not supported", code: "PRIVATE_REPO", retryable: false } };

  const d = result.data!;
  return {
    data: {
      name: d.name, fullName: d.full_name, description: d.description,
      language: d.language, stars: d.stargazers_count, forks: d.forks_count,
      watchers: d.watchers_count, openIssues: d.open_issues_count,
      license: d.license?.spdx_id || null, topics: d.topics || [],
      defaultBranch: d.default_branch, createdAt: d.created_at,
      updatedAt: d.updated_at, pushedAt: d.pushed_at, size: d.size,
      isPrivate: d.private, homepage: d.homepage,
      hasWiki: d.has_wiki, hasPages: d.has_pages,
    },
  };
}

// ─── File Tree ────────────────────────────────────────────────────────────────

export async function getFileTree(
  owner: string,
  repo: string,
  branch?: string,
  token?: string
): Promise<{ data?: FileNode[]; error?: ApiError }> {
  const result = await fetchJson<{
    tree: Array<{ path: string; type: string; size?: number }>;
    truncated: boolean;
  }>(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch || "main"}?recursive=1`, token);

  if (result.error) return { error: result.error };

  const exclude = [".git", "node_modules", ".next", "dist", "build", "__pycache__", ".cache", "vendor", "coverage"];
  const filtered = result.data!.tree
    .filter((i) => i.type === "blob" && !exclude.some((p) => i.path.includes(p)))
    .map((i) => ({ path: i.path, type: "file" as const, size: i.size || 0 }));

  if (result.data!.truncated || filtered.length > MAX_FILES) {
    console.warn(`⚠️ File tree truncated to ${MAX_FILES}`);
    return { data: filtered.slice(0, MAX_FILES) };
  }
  return { data: filtered };
}

// ─── File Content ─────────────────────────────────────────────────────────────

export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  token?: string
): Promise<{ data?: FileContent; error?: ApiError }> {
  const result = await fetchJson<{ content: string; encoding: string; size: number }>(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
    token
  );

  if (result.error) return { error: result.error };

  const { content, encoding, size } = result.data!;
  if (encoding !== "base64")
    return { error: { error: "Binary file skipped", code: "BINARY_FILE", retryable: false } };
  if (size > MAX_FILE_SIZE)
    return { error: { error: `File too large`, code: "FILE_TOO_LARGE", retryable: false } };

  try {
    return { data: { path, content: Buffer.from(content, "base64").toString("utf-8"), size } };
  } catch {
    return { error: { error: "Failed to decode file", code: "DECODE_ERROR", retryable: false } };
  }
}

// ─── Key Files ────────────────────────────────────────────────────────────────
// Cap at 8 files, fetch all in one parallel batch (no serial rounds).

export async function getKeyFiles(
  owner: string,
  repo: string,
  tree: FileNode[],
  token?: string
): Promise<{ data?: FileContent[]; error?: ApiError }> {
  const filePaths = tree.map((f) => f.path);
  const selected: string[] = [];

  // HIGH — config / manifest files
  const high = [
    "README.md", "README.rst", "readme.md",
    "package.json", "requirements.txt", "Cargo.toml", "go.mod", "pom.xml",
    "docker-compose.yml", "Dockerfile",
    "tsconfig.json", "next.config.js", "next.config.ts", "vite.config.ts",
  ];
  for (const p of high) {
    const found = filePaths.find((f) => f.toLowerCase().endsWith(p.toLowerCase()) || f === p);
    if (found && !selected.includes(found)) selected.push(found);
    if (selected.length >= 8) break;
  }

  // MEDIUM — entry points
  if (selected.length < 8) {
    const medPat = [/^index\.(ts|js|tsx|jsx|py)$/, /^main\.(ts|js|tsx|jsx|py)$/, /^app\.(ts|js|tsx|jsx|py)$/];
    for (const path of filePaths) {
      if (selected.length >= 8) break;
      if (selected.includes(path)) continue;
      const fn = path.split("/").pop() || "";
      if (medPat.some((r) => r.test(fn))) selected.push(path);
    }
  }

  // LOW — any code file
  if (selected.length < 8) {
    const exts = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs"];
    for (const path of filePaths) {
      if (selected.length >= 8) break;
      if (selected.includes(path)) continue;
      if (exts.some((e) => path.endsWith(e))) selected.push(path);
    }
  }

  // Fetch all 8 in a single parallel batch
  const results = await Promise.allSettled(
    selected.slice(0, 8).map((p) => getFileContent(owner, repo, p, token))
  );

  return {
    data: results
      .filter((r): r is PromiseFulfilledResult<{ data: FileContent }> =>
        r.status === "fulfilled" && !!r.value.data
      )
      .map((r) => r.value.data),
  };
}

// ─── Parse deps from already-fetched key files (no extra API calls) ───────────

export function parseDependenciesFromFiles(keyFiles: FileContent[]): Dependency[] {
  // package.json
  const pkg = keyFiles.find((f) => f.path.endsWith("package.json"));
  if (pkg) {
    try {
      const parsed = JSON.parse(pkg.content);
      const deps: Dependency[] = [];
      for (const [name, version] of Object.entries({ ...parsed.dependencies })) {
        deps.push({ name, version: String(version).replace(/[\^~>=<]/g, ""), isDev: false });
      }
      for (const [name, version] of Object.entries({ ...parsed.devDependencies })) {
        deps.push({ name, version: String(version).replace(/[\^~>=<]/g, ""), isDev: true });
      }
      if (deps.length > 0) return deps;
    } catch { /* ignore */ }
  }

  // requirements.txt
  const req = keyFiles.find((f) => f.path.endsWith("requirements.txt"));
  if (req) {
    const deps: Dependency[] = [];
    for (const line of req.content.split("\n")) {
      const m = line.match(/^([a-zA-Z0-9_-]+)(?:[==>=<~!]+(.+))?/);
      if (m && !line.startsWith("#")) deps.push({ name: m[1], version: m[2] || "latest", isDev: false });
    }
    if (deps.length > 0) return deps;
  }

  // Cargo.toml
  const cargo = keyFiles.find((f) => f.path.endsWith("Cargo.toml"));
  if (cargo) {
    const deps: Dependency[] = [];
    const section = cargo.content.match(/\[dependencies\]([\s\S]*?)(?=\[|$)/);
    if (section) {
      for (const line of section[1].split("\n")) {
        const m = line.match(/^([a-zA-Z0-9_-]+)\s*=/);
        if (m) deps.push({ name: m[1], version: "*", isDev: false });
      }
    }
    if (deps.length > 0) return deps;
  }

  return [];
}

// ─── Contributors ─────────────────────────────────────────────────────────────

export async function getContributors(
  owner: string,
  repo: string,
  token?: string
): Promise<{ data?: Contributor[]; error?: ApiError }> {
  const result = await fetchJson<Array<{
    login: string; avatar_url: string; contributions: number; html_url: string;
  }>>(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors?per_page=5`, token);

  if (result.error) return { error: result.error };
  return {
    data: result.data!.map((c) => ({
      login: c.login, avatarUrl: c.avatar_url,
      contributions: c.contributions, profileUrl: c.html_url,
    })),
  };
}

// ─── Commit Activity ──────────────────────────────────────────────────────────
// Max 3 retries with back-off; returns zeroed fallback instead of hanging.

export async function getCommitActivity(
  owner: string,
  repo: string,
  token?: string,
  _attempt = 0
): Promise<{ data?: CommitActivity; error?: ApiError }> {
  const MAX_RETRIES = 2;
  const DELAYS = [1500, 3000];
  const fallback: CommitActivity = { totalCommitsLastYear: 0, avgCommitsPerWeek: 0, mostActiveWeek: "", lastCommitDate: "" };

  const result = await fetchJson<{ all: number[]; total: number[]; week: number }>(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/stats/commit_activity`,
    token
  );

  if (result.error?.code === "API_ERROR") {
    if (_attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, DELAYS[_attempt] ?? 3000));
      return getCommitActivity(owner, repo, token, _attempt + 1);
    }
    return { data: fallback };
  }

  if (result.error) return { data: fallback };

  const raw = result.data!;
  if (!Array.isArray(raw.total) || raw.total.length === 0) {
    if (_attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, DELAYS[_attempt] ?? 3000));
      return getCommitActivity(owner, repo, token, _attempt + 1);
    }
    return { data: fallback };
  }

  const totalCommitsLastYear = raw.total.reduce((a, b) => a + b, 0);
  const avgCommitsPerWeek = Math.round(totalCommitsLastYear / 52);
  let mostActiveWeek = "";
  let maxC = 0;
  const now = new Date();
  for (let i = 0; i < raw.total.length; i++) {
    if (raw.total[i] > maxC) {
      maxC = raw.total[i];
      mostActiveWeek = new Date(now.getTime() - (51 - i) * 7 * 86400000).toISOString().split("T")[0];
    }
  }
  const lastCommitDate = new Date(now.getTime() - (51 - (raw.week ?? 0)) * 7 * 86400000).toISOString().split("T")[0];

  return { data: { totalCommitsLastYear, avgCommitsPerWeek, mostActiveWeek, lastCommitDate } };
}

// ─── Languages ────────────────────────────────────────────────────────────────

export async function getLanguages(
  owner: string,
  repo: string,
  token?: string
): Promise<{ data?: LanguageBreakdown; error?: ApiError }> {
  const result = await fetchJson<Record<string, number>>(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/languages`,
    token
  );
  if (result.error) return result;

  const sorted: LanguageBreakdown = {};
  Object.entries(result.data!).sort((a, b) => b[1] - a[1]).forEach(([l, b]) => { sorted[l] = b; });
  return { data: sorted };
}

// ─── Last Commit ──────────────────────────────────────────────────────────────

export async function getLastCommit(
  owner: string,
  repo: string,
  branch: string,
  token?: string
): Promise<{ data?: { sha: string; message: string; date: string; author: string }; error?: ApiError }> {
  const result = await fetchJson<{
    sha: string; commit: { message: string; author: { date: string; name: string } };
  }>(`${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${branch}?per_page=1`, token);

  if (result.error) return { error: result.error };
  return {
    data: {
      sha: result.data!.sha,
      message: result.data!.commit.message,
      date: result.data!.commit.author.date,
      author: result.data!.commit.author.name,
    },
  };
}

// ─── Push README ──────────────────────────────────────────────────────────────

export async function pushReadme(
  owner: string,
  repo: string,
  content: string,
  token: string
): Promise<{ data?: PushReadmeResult; error?: ApiError }> {
  if (!token)
    return { error: { error: "GitHub token required to push README", code: "NO_TOKEN", retryable: false } };

  const currentResult = await fetchJson<{ sha: string }>(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/README.md`,
    token
  );

  const body: Record<string, unknown> = {
    message: "docs: update README via RepoLens",
    content: Buffer.from(content).toString("base64"),
  };
  if (currentResult.data?.sha) body.sha = currentResult.data.sha;

  const result = await fetchJson<{ commit: { html_url: string } }>(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/README.md`,
    token
  );
  if (result.error) return { error: result.error };
  return { data: { success: true, commitUrl: result.data!.commit.html_url } };
}

// ─── MASTER: Build Repo Context ───────────────────────────────────────────────
//
// Optimised call graph (all I/O runs in parallel):
//
//   Step 1: parseRepoUrl                          (sync, ~0ms)
//   Step 2: cache lookup                          (~5ms)
//   Step 3: getRepoMetadata                       (~200ms)  ← need defaultBranch first
//   Step 4: Promise.all([                         (~400–800ms total)
//             getFileTree,                        ← needed for getKeyFiles
//             getContributors,
//             getCommitActivity,
//             getLanguages,
//             getFileContent(README),
//             getLastCommit,
//           ])
//   Step 5: getKeyFiles(tree)                     (~300ms, 8 files in 1 batch)
//   Step 6: parseDependenciesFromFiles(keyFiles)  (sync, ~0ms — no extra API calls)

export async function buildRepoContext(
  url: string,
  sessionToken?: string | null,
  forceRefresh = false
): Promise<{ data?: RepoContext; error?: ApiError }> {
  const token = getToken(sessionToken);
  const tokenUsed: "oauth" | "pat" | "none" = sessionToken ? "oauth" : process.env.GITHUB_PAT ? "pat" : "none";

  // Step 1
  const parsed = parseRepoUrl(url);
  if (!parsed)
    return { error: { error: "Invalid GitHub repository URL", code: "INVALID_URL", retryable: false } };

  const { owner, repo } = parsed;
  const cacheKey = `repolens:repo:${owner}:${repo}`;

  // Step 2 — cache
  if (!forceRefresh) {
    const cached = await cache.get<RepoContext>(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit for ${owner}/${repo}`);
      return { data: { ...cached, fromCache: true, cachedAt: new Date().toISOString() } };
    }
  }

  // Step 3 — metadata (need defaultBranch before parallel batch)
  const metadataResult = await getRepoMetadata(owner, repo, token);
  if (metadataResult.error) return { error: metadataResult.error };
  const branch = metadataResult.data!.defaultBranch;

  // Step 4 — all independent GitHub calls in parallel
  const t4 = Date.now();
  const [fileTreeResult, contributorsResult, activityResult, languagesResult, readmeResult, lastCommitResult] =
    await Promise.all([
      getFileTree(owner, repo, branch, token),
      getContributors(owner, repo, token),
      getCommitActivity(owner, repo, token),
      getLanguages(owner, repo, token),
      getFileContent(owner, repo, "README.md", token),
      getLastCommit(owner, repo, branch, token),
    ]);
  console.log(`⏱ Parallel GitHub fetch: ${Date.now() - t4}ms`);

  // Step 5 — key files (single parallel batch, no serial rounds)
  const t5 = Date.now();
  const keyFilesResult = fileTreeResult.data
    ? await getKeyFiles(owner, repo, fileTreeResult.data, token)
    : { data: [] as FileContent[] };
  console.log(`⏱ Key files fetch: ${Date.now() - t5}ms`);

  // Step 6 — parse deps from already-fetched files (zero extra API calls)
  const keyFiles = keyFilesResult.data ?? [];
  const dependencies = parseDependenciesFromFiles(keyFiles);

  // Build packageFile from key files
  let packageFile: { type: string; content: string; dependencies: string[] } | null = null;
  const pkgFile = keyFiles.find((f) => f.path.endsWith("package.json"));
  const reqFile = keyFiles.find((f) => f.path.endsWith("requirements.txt"));
  const cargoFile = keyFiles.find((f) => f.path.endsWith("Cargo.toml"));
  if (pkgFile) {
    packageFile = { type: "package.json", content: pkgFile.content, dependencies: dependencies.map((d) => d.name) };
  } else if (reqFile) {
    packageFile = { type: "requirements.txt", content: reqFile.content, dependencies: dependencies.map((d) => d.name) };
  } else if (cargoFile) {
    packageFile = { type: "Cargo.toml", content: cargoFile.content, dependencies: dependencies.map((d) => d.name) };
  }

  const context: RepoContext = {
    url,
    owner,
    repo,
    metadata: metadataResult.data!,
    tree: { sha: "", tree: fileTreeResult.data || [], truncated: false },
    readme: readmeResult.data?.content || "",
    packageFile,
    importantFiles: keyFiles,
    contributors: contributorsResult.data || [],
    lastCommit: lastCommitResult.data || { sha: "", message: "", date: "", author: "" },
    commitActivity: activityResult.data || { totalCommitsLastYear: 0, avgCommitsPerWeek: 0, mostActiveWeek: "", lastCommitDate: "" },
    languages: languagesResult.data || {},
    dependencies,
    scrapedAt: new Date().toISOString(),
    tokenUsed,
  };

  await cache.set(cacheKey, context, 3600);
  console.log(`✅ Built repo context for ${owner}/${repo}`);
  return { data: context };
}

export default buildRepoContext;
