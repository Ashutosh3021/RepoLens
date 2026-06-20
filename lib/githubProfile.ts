/**
 * GitHub Profile API Service
 * Fetches user profile + all repos with rate-limit awareness
 */

import type { GitHubUserProfile, GitHubRepo } from "./types/profile";

const BASE = "https://api.github.com";
const VERSION = "2022-11-28";

function headers(token?: string | null): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": VERSION,
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function ghFetch<T>(
  path: string,
  token?: string | null
): Promise<{ data?: T; error?: string; rateLimited?: boolean }> {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: headers(token) });

    if (res.status === 404) return { error: "User not found" };
    if (res.status === 403) {
      const remaining = res.headers.get("X-RateLimit-Remaining");
      if (remaining === "0") {
        return { error: "GitHub API rate limit reached. Sign in with GitHub for higher limits.", rateLimited: true };
      }
      return { error: "Access denied" };
    }
    if (!res.ok) return { error: `GitHub API error: ${res.status} ${res.statusText}` };

    return { data: (await res.json()) as T };
  } catch {
    return { error: "Network error — unable to reach GitHub API" };
  }
}

/** Fetch basic user profile */
export async function fetchGitHubProfile(
  username: string,
  token?: string | null
): Promise<{ data?: GitHubUserProfile; error?: string; rateLimited?: boolean }> {
  return ghFetch<GitHubUserProfile>(`/users/${username}`, token);
}

/** Fetch ALL public repos (handles pagination, capped at 200 for Vercel compatibility) */
export async function fetchAllRepos(
  username: string,
  token?: string | null
): Promise<{ data?: GitHubRepo[]; error?: string; rateLimited?: boolean }> {
  const allRepos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;
  const MAX_REPOS = 200; // cap at 200 — enough for accurate scoring, safe on Vercel

  while (true) {
    const result = await ghFetch<GitHubRepo[]>(
      `/users/${username}/repos?per_page=${perPage}&page=${page}&sort=pushed&direction=desc`,
      token
    );
    if (result.error) return { error: result.error, rateLimited: result.rateLimited };
    const batch = result.data ?? [];
    allRepos.push(...batch);
    if (batch.length < perPage || allRepos.length >= MAX_REPOS) break;
    page++;
  }

  return { data: allRepos.slice(0, MAX_REPOS) };
}

/** Fetch profile + repos in parallel */
export async function fetchProfileData(
  username: string,
  token?: string | null
): Promise<{
  profile?: GitHubUserProfile;
  repos?: GitHubRepo[];
  error?: string;
  rateLimited?: boolean;
}> {
  const [profileResult, reposResult] = await Promise.all([
    fetchGitHubProfile(username, token),
    fetchAllRepos(username, token),
  ]);

  if (profileResult.error) {
    return { error: profileResult.error, rateLimited: profileResult.rateLimited };
  }
  if (reposResult.error) {
    return { error: reposResult.error, rateLimited: reposResult.rateLimited };
  }

  return { profile: profileResult.data, repos: reposResult.data };
}
