/**
 * Full Profile Analysis Types
 * Types for the GitHub profile-level deep analysis feature
 */

// ─── Raw GitHub API data ──────────────────────────────────────────────────────

export interface GitHubUserProfile {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  hireable: boolean | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  topics: string[];
  license: { spdx_id: string } | null;
  size: number;
  has_wiki: boolean;
  has_pages: boolean;
  archived: boolean;
  visibility: string;
}

// ─── Scoring types ─────────────────────────────────────────────────────────────

export interface SubCriteria {
  name: string;
  score: number;      // 0-100
  maxScore: number;
  detail: string;
}

export interface CategoryScore {
  score: number;        // 0-100
  weight: number;       // e.g. 0.15
  label: string;
  icon: string;         // Lucide icon name
  color: string;        // Tailwind/hex color
  breakdown: SubCriteria[];
  recommendations: string[];
  copyPasteText?: string; // copy-paste improvement text
}

export type CategoryKey =
  | "profileBasics"
  | "activityConsistency"
  | "repositoryAnalysis"
  | "technicalDepth"
  | "communityImpact"
  | "learningGrowth"
  | "collaborationSkills"
  | "professionalPresence"
  | "projectDiversity"
  | "openSourceContribution";

export interface JobRole {
  title: string;
  match: number;        // 0-100 match percentage
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  salary?: string;
}

export interface RoadmapItem {
  priority: "High" | "Medium" | "Low";
  action: string;
  effort: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High";
  timeframe: string;
  category: CategoryKey;
}

export interface LanguageData {
  language: string;
  bytes: number;
  percentage: number;
  repoCount: number;
}

export interface ActivityData {
  week: string;
  commits: number;
}

export interface ProjectStrength {
  name: string;
  score: number;
  stars: number;
  language: string | null;
  description: string | null;
}

export interface VisualizationData {
  languages: LanguageData[];
  activityHeatmap: ActivityData[];
  projectStrengths: ProjectStrength[];
  categoryScores: { category: string; score: number; fullMark: number }[];
}

export interface BenchmarkData {
  label: string;
  percentile: number;
  domain: string;
}

export interface FullProfileAnalysis {
  username: string;
  generatedAt: string;
  overallScore: number;       // 0-100
  letterGrade: string;        // A+, A, B+, B, C+, C, D, F
  benchmark: BenchmarkData;
  categories: Record<CategoryKey, CategoryScore>;
  suggestedRoles: JobRole[];
  visualizations: VisualizationData;
  roadmap: RoadmapItem[];
  // Raw data for display
  profile: GitHubUserProfile;
  repos: GitHubRepo[];        // stripped before API response, may be empty
  totalStars: number;
  totalForks: number;
  primaryLanguages: string[];
  topTopics: string[];
  accountAge: number; // days
  isAuthenticated: boolean; // whether token was used
}

// ─── Analysis state ────────────────────────────────────────────────────────────

export type AnalysisStatus =
  | "idle"
  | "fetching-profile"
  | "fetching-repos"
  | "computing-scores"
  | "generating-roadmap"
  | "complete"
  | "error";

export interface ProfileAnalysisState {
  status: AnalysisStatus;
  progress: number;         // 0-100
  progressLabel: string;
  analysis: FullProfileAnalysis | null;
  error: string | null;
}
