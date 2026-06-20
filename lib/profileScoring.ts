/**
 * Profile Scoring Engine — RepoLens
 * Computes 10-category scores for a GitHub profile.
 */

import type {
  GitHubUserProfile, GitHubRepo, CategoryScore, CategoryKey,
  FullProfileAnalysis, JobRole, RoadmapItem, VisualizationData,
  LanguageData, ActivityData, ProjectStrength, BenchmarkData, SubCriteria,
} from "./types/profile";

// ─── Grade ────────────────────────────────────────────────────────────────────
export function getLetterGrade(s: number) {
  if (s >= 95) return "A+"; if (s >= 90) return "A"; if (s >= 85) return "A-";
  if (s >= 80) return "B+"; if (s >= 75) return "B"; if (s >= 70) return "B-";
  if (s >= 65) return "C+"; if (s >= 60) return "C"; if (s >= 55) return "C-";
  if (s >= 50) return "D+"; if (s >= 45) return "D"; return "F";
}

// ─── Weights (sum = 1.0) ─────────────────────────────────────────────────────
const W: Record<CategoryKey, number> = {
  profileBasics: 0.10, activityConsistency: 0.15, repositoryAnalysis: 0.20,
  technicalDepth: 0.12, communityImpact: 0.10, learningGrowth: 0.08,
  collaborationSkills: 0.08, professionalPresence: 0.07,
  projectDiversity: 0.05, openSourceContribution: 0.05,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function clamp(v: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, v)); }
function mk(name: string, score: number, max: number, detail: string): SubCriteria {
  return { name, score: clamp(score, 0, max), maxScore: max, detail };
}
function avg(items: SubCriteria[]) {
  if (!items.length) return 0;
  return clamp(Math.round(items.reduce((s, i) => s + (i.score / i.maxScore) * 100, 0) / items.length));
}

// ─── 1. Profile Basics (10%) ─────────────────────────────────────────────────
function scoreProfileBasics(p: GitHubUserProfile): CategoryScore {
  const bio = p.bio?.trim() ?? "";
  const bd: SubCriteria[] = [
    mk("Bio Quality",        bio.length === 0 ? 0 : bio.length < 30 ? 10 : bio.length < 80 ? 20 : 25, 25, bio.length > 0 ? `"${bio.slice(0,50)}${bio.length>50?"...":""}"` : "No bio set"),
    mk("Display Name",       p.name ? 15 : 0,  15, p.name ? `Name: "${p.name}"` : "No display name"),
    mk("Profile Picture",    p.avatar_url && !p.avatar_url.includes("gravatar") ? 15 : 5, 15, "Custom vs default avatar"),
    mk("Location",           p.location ? 10 : 0, 10, p.location ?? "Not set"),
    mk("Website/Portfolio",  p.blog ? 10 : 0, 10, p.blog ?? "Not linked"),
    mk("Social Links",       (p.twitter_username ? 5 : 0) + (p.email ? 5 : 0), 10, "Twitter + email"),
    mk("Company",            p.company ? 5 : 0, 5, p.company ?? "Not listed"),
    mk("Open to Hire",       p.hireable ? 5 : 0, 5, p.hireable ? "Yes" : "No"),
    mk("Repo Volume",        clamp(Math.floor(p.public_repos / 5), 0, 5), 5, `${p.public_repos} public repos`),
  ];
  const recs: string[] = [];
  if (bio.length < 80) recs.push('Write a compelling bio (80+ chars). Example: "Full-stack engineer focused on React & Node.js. Open to remote opportunities."');
  if (!p.name) recs.push("Add your full display name to appear professional");
  if (!p.location) recs.push("Add your location for visibility in local searches");
  if (!p.blog) recs.push("Link your portfolio, personal site, or LinkedIn");
  if (!p.twitter_username) recs.push("Add your Twitter/X handle to connect with the dev community");
  return {
    score: avg(bd), weight: W.profileBasics, label: "Profile Basics",
    icon: "User", color: "#00e5ff", breakdown: bd, recommendations: recs,
    copyPasteText: bio.length < 80 ? `Suggested bio: "Software engineer specialising in ${p.public_repos > 20 ? "open-source development" : "building side projects"}. ${p.location ? `Based in ${p.location}. ` : ""}Passionate about clean code and developer experience."` : undefined,
  };
}

// ─── 2. Activity & Consistency (15%) ─────────────────────────────────────────
function scoreActivityConsistency(p: GitHubUserProfile, repos: GitHubRepo[]): CategoryScore {
  const now = Date.now();
  const ageDays = (now - new Date(p.created_at).getTime()) / 86400000;
  // Use reduce instead of Math.max(...array) — safe for any array size
  const lastPush = repos.reduce((best, r) => {
    const t = new Date(r.pushed_at).getTime();
    return t > best ? t : best;
  }, 0);
  const daysSince = lastPush ? (now - lastPush) / 86400000 : 999;
  const ms = (d: number) => d * 24 * 60 * 60 * 1000;
  const a90  = repos.filter(r => now - new Date(r.pushed_at).getTime() < ms(90)).length;
  const a365 = repos.filter(r => now - new Date(r.pushed_at).getTime() < ms(365)).length;
  const bd: SubCriteria[] = [
    mk("Recent Activity",    daysSince < 7 ? 30 : daysSince < 30 ? 22 : daysSince < 90 ? 14 : daysSince < 180 ? 8 : 2, 30, `Last push: ${Math.floor(daysSince)} days ago`),
    mk("90-Day Consistency", clamp(a90 * 3, 0, 25), 25, `${a90} repos pushed in 90 days`),
    mk("Yearly Activity",    clamp(a365 * 2, 0, 20), 20, `${a365} repos pushed in last year`),
    mk("Account Maturity",   ageDays > 1825 ? 15 : ageDays > 365 ? 10 : ageDays > 90 ? 5 : 2, 15, `Account age: ${Math.floor(ageDays/365)}y ${Math.floor((ageDays%365)/30)}m`),
    mk("Repo Volume",        clamp(Math.floor(repos.length / 3), 0, 10), 10, `${repos.length} public repos`),
  ];
  const recs = [];
  if (daysSince > 30) recs.push("Push code more frequently — aim for at least weekly commits");
  if (a90 < 3) recs.push("Work across multiple projects to show consistent engagement");
  if (a365 < 10) recs.push("Set a goal of completing at least 1 project per month");
  return { score: avg(bd), weight: W.activityConsistency, label: "Activity & Consistency", icon: "Activity", color: "#22c55e", breakdown: bd, recommendations: recs };
}

// ─── 3. Repository Analysis (20%) ────────────────────────────────────────────
function scoreRepositoryAnalysis(repos: GitHubRepo[]): CategoryScore {
  const own = repos.filter(r => !r.fork);
  const stars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const forks = repos.reduce((s, r) => s + r.forks_count, 0);
  const withDesc  = repos.filter(r => (r.description?.length ?? 0) > 10).length;
  const withTopic = repos.filter(r => (r.topics?.length ?? 0) > 0).length;
  const withPages = repos.filter(r => r.has_pages).length;
  const archived  = repos.filter(r => r.archived).length;
  const activeRatio = own.length > 0 ? (own.length - archived) / own.length : 0;
  const bd: SubCriteria[] = [
    mk("Star Traction",      stars > 1000 ? 25 : stars > 100 ? 20 : stars > 20 ? 14 : stars > 5 ? 8 : stars > 0 ? 4 : 0, 25, `${stars.toLocaleString()} total stars`),
    mk("Fork Traction",      forks > 200 ? 20 : forks > 50 ? 15 : forks > 10 ? 10 : forks > 0 ? 5 : 0, 20, `${forks.toLocaleString()} total forks`),
    mk("Documentation Rate", clamp(Math.round((withDesc / Math.max(1, repos.length)) * 20), 0, 20), 20, `${withDesc}/${repos.length} repos have descriptions`),
    mk("Topic Coverage",     clamp(Math.round((withTopic / Math.max(1, repos.length)) * 15), 0, 15), 15, `${withTopic}/${repos.length} repos have topics`),
    mk("Repo Health",        clamp(Math.round(activeRatio * 10) + (withPages > 0 ? 10 : 0), 0, 20), 20, `${Math.round(activeRatio * 100)}% active, ${withPages} with GitHub Pages`),
  ];
  const recs = [];
  if (withDesc / Math.max(1, repos.length) < 0.7) recs.push("Add descriptions to all repos — improves discoverability and professionalism");
  if (withTopic / Math.max(1, repos.length) < 0.5) recs.push("Add topics/tags (e.g. 'react', 'python') to repos for better SEO");
  if (stars < 10) recs.push("Promote your best projects on Twitter/dev.to to gain visibility and stars");
  return { score: avg(bd), weight: W.repositoryAnalysis, label: "Repository Analysis", icon: "GitBranch", color: "#7c3aed", breakdown: bd, recommendations: recs };
}

// ─── 4. Technical Depth (12%) ────────────────────────────────────────────────
function scoreTechnicalDepth(repos: GitHubRepo[]): CategoryScore {
  const langs  = new Set<string>();
  const topics = new Set<string>();
  for (const r of repos) {
    if (r.language) langs.add(r.language);
    for (const t of r.topics ?? []) topics.add(t);
  }
  const advanced = ["kubernetes","docker","terraform","graphql","microservices","machine-learning","deep-learning","blockchain","webassembly","rust","go","elixir"];
  const advList: string[] = [];
  for (const t of topics) if (advanced.some(a => t.includes(a))) advList.push(t);
  const adv   = advList.length;
  const large = repos.filter(r => r.size > 5000).length;
  const bd: SubCriteria[] = [
    mk("Language Diversity",   langs.size > 8 ? 25 : langs.size > 5 ? 20 : langs.size > 3 ? 14 : langs.size > 1 ? 8 : 4, 25, `${langs.size} languages: ${[...langs].slice(0,5).join(", ")}`),
    mk("Topic Coverage",       clamp(topics.size * 2, 0, 20), 20, `${topics.size} unique topics`),
    mk("Advanced Technologies",clamp(adv * 5, 0, 25), 25, adv > 0 ? `Found: ${advList.slice(0,4).join(", ")}` : "No advanced tech detected"),
    mk("Project Complexity",   clamp(large * 3, 0, 20), 20, `${large} large repos (>5MB)`),
    mk("Original Starred Work",clamp(repos.filter(r => !r.fork && r.stargazers_count > 5).length * 3, 0, 10), 10, `${repos.filter(r => !r.fork && r.stargazers_count > 5).length} starred originals`),
  ];
  const recs = [];
  if (langs.size < 3) recs.push("Expand to adjacent languages — if you know Python, try TypeScript; if JS, try Go or Rust");
  if (adv < 2) recs.push("Build projects using cloud-native tech (Docker, K8s) or ML to demonstrate advanced depth");
  if (large < 2) recs.push("Work on a substantial project (many modules, tests, CI) to show architectural thinking");
  return { score: avg(bd), weight: W.technicalDepth, label: "Technical Depth", icon: "Code2", color: "#f59e0b", breakdown: bd, recommendations: recs };
}

// ─── 5. Community Impact (10%) ────────────────────────────────────────────────
function scoreCommunityImpact(p: GitHubUserProfile, repos: GitHubRepo[]): CategoryScore {
  const stars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const forks = repos.reduce((s, r) => s + r.forks_count, 0);
  const bd: SubCriteria[] = [
    mk("Star Impact",         stars > 500 ? 30 : stars > 100 ? 22 : stars > 20 ? 14 : stars > 5 ? 7 : 1, 30, `${stars.toLocaleString()} stars received`),
    mk("Fork Impact",         forks > 100 ? 25 : forks > 30 ? 18 : forks > 10 ? 12 : forks > 2 ? 6 : 1, 25, `${forks.toLocaleString()} forks`),
    mk("Follower Count",      p.followers > 500 ? 25 : p.followers > 100 ? 18 : p.followers > 20 ? 12 : p.followers > 5 ? 6 : 1, 25, `${p.followers.toLocaleString()} followers`),
    mk("Network Engagement",  clamp(Math.floor(p.following / 10), 0, 10), 10, `Following ${p.following} devs`),
    mk("Gist Contributions",  clamp(p.public_gists * 2, 0, 10), 10, `${p.public_gists} public gists`),
  ];
  const recs = [];
  if (p.followers < 20) recs.push("Engage with the community: comment on issues, join discussions, and share your work on social media");
  if (stars < 20) recs.push("Write tutorials or blog posts about your projects to drive traffic and star growth");
  if (p.public_gists < 3) recs.push("Share useful code snippets as Gists — they rank on Google and help others");
  return { score: avg(bd), weight: W.communityImpact, label: "Community Impact", icon: "Users", color: "#ec4899", breakdown: bd, recommendations: recs };
}

// ─── 6. Learning & Growth (8%) ────────────────────────────────────────────────
function scoreLearningGrowth(repos: GitHubRepo[]): CategoryScore {
  const now = new Date();
  const yr = (offset: number) => repos.filter(r => {
    const d = new Date(r.created_at);
    return d.getFullYear() === now.getFullYear() - offset;
  }).length;
  const langs = new Set(repos.map(r => r.language).filter(Boolean));
  const recentLangs = new Set(repos.filter(r => Date.now() - new Date(r.created_at).getTime() < 365*86400000).map(r => r.language).filter(Boolean));
  const thisYear = yr(0); const lastYear = yr(1);
  const bd: SubCriteria[] = [
    mk("New Tech Exploration",  clamp(recentLangs.size * 8, 0, 30), 30, `${recentLangs.size} languages used in last year`),
    mk("Yearly Repo Growth",    clamp(thisYear * 4, 0, 25), 25, `${thisYear} repos created this year`),
    mk("Growth Trend",          thisYear >= lastYear ? 20 : 5, 20, thisYear >= lastYear ? "Output increasing YoY" : "Output slowed vs last year"),
    mk("Language Exploration",  clamp((langs.size - 1) * 5, 0, 25), 25, `${langs.size} distinct languages tried`),
  ];
  const recs = [];
  if (thisYear < 3) recs.push("Set a goal to create at least 4–6 new repos per year to show active learning");
  if (thisYear < lastYear) recs.push("Your output has slowed — pick a new technology to explore this quarter");
  if (recentLangs.size < 2) recs.push("Try a completely new language this quarter — even small experiments show curiosity");
  return { score: avg(bd), weight: W.learningGrowth, label: "Learning & Growth", icon: "TrendingUp", color: "#38bdf8", breakdown: bd, recommendations: recs };
}

// ─── 7. Collaboration Skills (8%) ────────────────────────────────────────────
function scoreCollaborationSkills(p: GitHubUserProfile, repos: GitHubRepo[]): CategoryScore {
  const forked = repos.filter(r => r.fork).length;
  const own    = repos.filter(r => !r.fork).length;
  const issues = repos.reduce((s, r) => s + r.open_issues_count, 0);
  const bd: SubCriteria[] = [
    mk("Forked Projects",   forked > 20 ? 30 : forked > 10 ? 22 : forked > 4 ? 14 : forked > 0 ? 7 : 0, 30, `${forked} forked repos`),
    mk("Network Size",      clamp(p.following * 0.5, 0, 20), 20, `Following ${p.following} devs`),
    mk("Issue Management",  clamp(own > 0 ? Math.round(Math.max(0, 25 - (issues / own) * 2)) : 12, 0, 25), 25, `~${issues} open issues across repos`),
    mk("Shareable Work",    clamp(own * 2, 0, 25), 25, `${own} original public repos`),
  ];
  const recs = [];
  if (forked < 5) recs.push("Fork and contribute to projects you use — even small doc fixes count");
  if (issues > own * 5) recs.push("Triage open issues in your repos to improve perceived maintainability");
  if (p.following < 10) recs.push("Follow engineers in your domain to stay connected and discover new ideas");
  return { score: avg(bd), weight: W.collaborationSkills, label: "Collaboration Skills", icon: "GitMerge", color: "#a855f7", breakdown: bd, recommendations: recs };
}

// ─── 8. Professional Presence (7%) ───────────────────────────────────────────
function scoreProfessionalPresence(p: GitHubUserProfile, repos: GitHubRepo[]): CategoryScore {
  const own      = repos.filter(r => !r.fork);
  const pages    = repos.filter(r => r.has_pages).length;
  const licensed = own.filter(r => r.license !== null).length;
  const starred  = own.filter(r => r.stargazers_count > 0).length;
  const withDesc = repos.filter(r => (r.description?.length ?? 0) > 20).length;
  const bd: SubCriteria[] = [
    mk("Professional Bio",  (p.bio?.length ?? 0) > 30 ? 25 : (p.bio?.length ?? 0) > 0 ? 12 : 0, 25, p.bio ? `"${p.bio.slice(0,60)}"` : "No bio"),
    mk("GitHub Pages",      clamp(pages * 12, 0, 25), 25, `${pages} projects with live demos`),
    mk("License Usage",     clamp(Math.round((licensed / Math.max(1, own.length)) * 20), 0, 20), 20, `${licensed}/${own.length} repos licensed`),
    mk("Starred Work",      clamp(starred * 5, 0, 20), 20, `${starred} repos with at least 1 star`),
    mk("Described Repos",   clamp(Math.round((withDesc / Math.max(1, repos.length)) * 10), 0, 10), 10, `${withDesc}/${repos.length} repos with descriptions`),
  ];
  const recs = [];
  if (pages < 2) recs.push("Deploy 2+ projects with live demos (GitHub Pages or Vercel) — links matter to recruiters");
  if (licensed / Math.max(1, own.length) < 0.5) recs.push("Add MIT or Apache 2.0 licenses to all significant projects");
  if (starred < 3) recs.push("Pin your 6 best repositories on your GitHub profile for a strong first impression");
  return { score: avg(bd), weight: W.professionalPresence, label: "Professional Presence", icon: "Briefcase", color: "#f97316", breakdown: bd, recommendations: recs };
}

// ─── 9. Project Diversity (5%) ───────────────────────────────────────────────
function scoreProjectDiversity(repos: GitHubRepo[]): CategoryScore {
  const own    = repos.filter(r => !r.fork);
  const langs  = new Set(own.map(r => r.language).filter(Boolean));
  const topics = own.flatMap(r => r.topics ?? []);
  const domains = new Set(topics.map(t => {
    if (["react","vue","angular","svelte","nextjs"].some(f => t.includes(f))) return "frontend";
    if (["express","fastapi","django","flask","nestjs"].some(f => t.includes(f))) return "backend";
    if (["docker","kubernetes","terraform","aws","gcp"].some(f => t.includes(f))) return "devops";
    if (["ml","ai","deep-learning","tensorflow","pytorch"].some(f => t.includes(f))) return "ml-ai";
    if (["android","ios","react-native","flutter"].some(f => t.includes(f))) return "mobile";
    if (["cli","tool","automation","script"].some(f => t.includes(f))) return "tooling";
    return null;
  }).filter(Boolean));
  const bd: SubCriteria[] = [
    mk("Language Variety", langs.size > 5 ? 30 : langs.size > 3 ? 22 : langs.size > 1 ? 14 : 5, 30, `${langs.size} languages: ${[...langs].slice(0,5).join(", ")}`),
    mk("Domain Coverage",  clamp(domains.size * 12, 0, 40), 40, `${domains.size} domains: ${[...domains].join(", ")}`),
    mk("Project Volume",   clamp(own.length * 2, 0, 30), 30, `${own.length} original projects`),
  ];
  const recs = [];
  if (langs.size < 3) recs.push("Diversify your stack — try a backend language if you focus on frontend, or vice versa");
  if (domains.size < 2) recs.push("Build in a new domain (CLI tool, mobile app, or data project) to show versatility");
  return { score: avg(bd), weight: W.projectDiversity, label: "Project Diversity", icon: "Layers", color: "#14b8a6", breakdown: bd, recommendations: recs };
}

// ─── 10. Open Source Contribution (5%) ───────────────────────────────────────
function scoreOpenSourceContribution(repos: GitHubRepo[]): CategoryScore {
  const forked = repos.filter(r => r.fork);
  const topics = new Set<string>();
  for (const r of repos) for (const t of r.topics ?? []) topics.add(t);
  const osKw  = ["open-source","oss","hacktoberfest","good-first-issue","help-wanted"];
  let osHits  = 0;
  for (const t of topics) if (osKw.some(k => t.includes(k))) osHits++;
  const bd: SubCriteria[] = [
    mk("Forked Contributions", forked.length > 20 ? 40 : forked.length > 10 ? 30 : forked.length > 4 ? 18 : forked.length > 0 ? 8 : 0, 40, `${forked.length} forked/contributed repos`),
    mk("OS Community Signals", clamp(osHits * 12, 0, 30), 30, osHits > 0 ? "OS topics found" : "No Hacktoberfest/OSS topics"),
    mk("Public Originals",     clamp(repos.filter(r => !r.fork).length * 2, 0, 30), 30, `${repos.filter(r => !r.fork).length} original public repos`),
  ];
  const recs = [];
  if (forked.length < 5) recs.push("Participate in Hacktoberfest or find 'good first issue' labels to start contributing");
  if (osHits === 0) recs.push('Add "hacktoberfest" and "open-source" topics to your repos to signal community involvement');
  return { score: avg(bd), weight: W.openSourceContribution, label: "Open Source Contribution", icon: "GitPullRequest", color: "#10b981", breakdown: bd, recommendations: recs };
}

// ─── Job Role Matcher ─────────────────────────────────────────────────────────
function detectJobRoles(repos: GitHubRepo[]): JobRole[] {
  const all: string[] = [];
  for (const r of repos) {
    for (const t of r.topics ?? []) all.push(t.toLowerCase());
    if (r.language) all.push(r.language.toLowerCase());
  }
  const defs: Array<{ title: string; required: string[]; salary: string }> = [
    { title: "Frontend Engineer",       required: ["react","typescript","css","html","vue","nextjs","tailwind"],    salary: "$80k–$160k" },
    { title: "Backend Engineer",        required: ["node","python","java","go","rust","express","django","fastapi"], salary: "$85k–$170k" },
    { title: "Full-Stack Engineer",     required: ["react","node","typescript","api","docker","postgresql"],         salary: "$90k–$180k" },
    { title: "DevOps / Platform Eng.",  required: ["docker","kubernetes","terraform","aws","gcp","ci-cd","linux"],  salary: "$100k–$200k" },
    { title: "ML / AI Engineer",        required: ["python","machine-learning","deep-learning","tensorflow","nlp"],  salary: "$110k–$220k" },
    { title: "Mobile Engineer",         required: ["android","ios","react-native","flutter","swift","kotlin"],       salary: "$85k–$170k" },
    { title: "Data Engineer",           required: ["python","sql","spark","kafka","dbt","snowflake"],                salary: "$95k–$190k" },
    { title: "Security Engineer",       required: ["security","cryptography","pentest","ctf","vulnerability"],       salary: "$100k–$200k" },
  ];
  return defs
    .map(d => {
      const matched = d.required.filter(s => all.some(a => a.includes(s)));
      const missing = d.required.filter(s => !all.some(a => a.includes(s)));
      return { title: d.title, match: Math.round((matched.length / d.required.length) * 100), requiredSkills: d.required, matchedSkills: matched, missingSkills: missing.slice(0, 4), salary: d.salary } as JobRole;
    })
    .filter(r => r.match >= 20)
    .sort((a, b) => b.match - a.match)
    .slice(0, 5);
}

// ─── Benchmark ───────────────────────────────────────────────────────────────
function computeBenchmark(score: number, repos: GitHubRepo[]): BenchmarkData {
  const t = new Set<string>();
  for (const r of repos) for (const topic of r.topics ?? []) t.add(topic);
  let domain = "General";
  if (["react","vue","angular","nextjs","frontend"].some(x => t.has(x))) domain = "Web Dev";
  else if (["machine-learning","deep-learning","pytorch","tensorflow"].some(x => t.has(x))) domain = "ML/AI";
  else if (["docker","kubernetes","devops","terraform"].some(x => t.has(x))) domain = "DevOps";
  else if (["android","ios","mobile","flutter"].some(x => t.has(x))) domain = "Mobile";
  const pct = score >= 90 ? 95 : score >= 80 ? 85 : score >= 70 ? 70 : score >= 60 ? 50 : score >= 50 ? 30 : 15;
  return { label: `Top ${100 - pct}% in ${domain}`, percentile: pct, domain };
}

// ─── Visualizations ───────────────────────────────────────────────────────────
function buildVisualizations(repos: GitHubRepo[], categories: Record<CategoryKey, CategoryScore>): VisualizationData {
  const langMap = new Map<string, { bytes: number; count: number }>();
  for (const r of repos) {
    if (!r.language) continue;
    const cur = langMap.get(r.language) ?? { bytes: 0, count: 0 };
    langMap.set(r.language, { bytes: cur.bytes + r.size * 1024, count: cur.count + 1 });
  }
  const totalBytes = [...langMap.values()].reduce((s, v) => s + v.bytes, 0) || 1;
  const languages: LanguageData[] = [...langMap.entries()]
    .sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 8)
    .map(([language, { bytes, count }]) => ({ language, bytes, percentage: Math.round((bytes / totalBytes) * 100), repoCount: count }));

  const now = new Date();
  const activityHeatmap: ActivityData[] = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const commits = repos.filter(r => { const p = new Date(r.pushed_at); return p.getFullYear() === d.getFullYear() && p.getMonth() === d.getMonth(); }).length;
    return { week: label, commits };
  });

  const projectStrengths: ProjectStrength[] = repos.filter(r => !r.fork)
    .map(r => ({ name: r.name, score: clamp(r.stargazers_count * 10 + r.forks_count * 5 + (r.description ? 15 : 0) + ((r.topics?.length ?? 0) > 2 ? 10 : 0) + (r.has_pages ? 10 : 0), 0, 100), stars: r.stargazers_count, language: r.language, description: r.description }))
    .sort((a, b) => b.score - a.score).slice(0, 8);

  const categoryScores = (Object.entries(categories) as [CategoryKey, CategoryScore][])
    .map(([, cat]) => ({ category: cat.label, score: cat.score, fullMark: 100 }));

  return { languages, activityHeatmap, projectStrengths, categoryScores };
}

// ─── Roadmap ─────────────────────────────────────────────────────────────────
function buildRoadmap(categories: Record<CategoryKey, CategoryScore>): RoadmapItem[] {
  const items: RoadmapItem[] = [];
  for (const [key, cat] of Object.entries(categories) as [CategoryKey, CategoryScore][]) {
    for (const action of cat.recommendations.slice(0, 2)) {
      const impact: RoadmapItem["impact"] = cat.score < 40 ? "High" : cat.score < 65 ? "Medium" : "Low";
      const effort: RoadmapItem["effort"] = action.length > 120 ? "High" : action.length > 70 ? "Medium" : "Low";
      const priority: RoadmapItem["priority"] = impact === "High" ? "High" : impact === "Medium" ? "Medium" : "Low";
      const timeframe = effort === "High" ? "1–3 months" : effort === "Medium" ? "2–4 weeks" : "This week";
      items.push({ priority, action, effort, impact, timeframe, category: key });
    }
  }
  const ord: Record<RoadmapItem["priority"], number> = { High: 0, Medium: 1, Low: 2 };
  return items.sort((a, b) => ord[a.priority] - ord[b.priority]).slice(0, 15);
}

// ─── Master function ──────────────────────────────────────────────────────────
export function computeFullProfileAnalysis(
  profile: GitHubUserProfile,
  repos: GitHubRepo[],
  isAuthenticated: boolean
): FullProfileAnalysis {
  // Sanitise repos — filter out any items with missing required fields
  const safeRepos = repos.filter(r =>
    r && typeof r.name === "string" && typeof r.stargazers_count === "number"
  );

  let categories: Record<CategoryKey, CategoryScore>;
  try {
    categories = {
      profileBasics:          scoreProfileBasics(profile),
      activityConsistency:    scoreActivityConsistency(profile, safeRepos),
      repositoryAnalysis:     scoreRepositoryAnalysis(safeRepos),
      technicalDepth:         scoreTechnicalDepth(safeRepos),
      communityImpact:        scoreCommunityImpact(profile, safeRepos),
      learningGrowth:         scoreLearningGrowth(safeRepos),
      collaborationSkills:    scoreCollaborationSkills(profile, safeRepos),
      professionalPresence:   scoreProfessionalPresence(profile, safeRepos),
      projectDiversity:       scoreProjectDiversity(safeRepos),
      openSourceContribution: scoreOpenSourceContribution(safeRepos),
    };
  } catch (err) {
    console.error("Scoring error:", err);
    throw new Error(`Scoring failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  const overallScore = clamp(Math.round(
    (Object.entries(categories) as [CategoryKey, CategoryScore][])
      .reduce((sum, [, cat]) => sum + cat.score * cat.weight, 0)
  ));
  const totalStars = safeRepos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = safeRepos.reduce((s, r) => s + r.forks_count, 0);
  const lc = new Map<string, number>();
  for (const r of safeRepos) if (r.language) lc.set(r.language, (lc.get(r.language) ?? 0) + 1);
  const primaryLanguages = [...lc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([l]) => l);
  const tc = new Map<string, number>();
  for (const r of safeRepos) for (const t of r.topics ?? []) tc.set(t, (tc.get(t) ?? 0) + 1);
  const topTopics = [...tc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  const accountAge = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000);
  return {
    username: profile.login, generatedAt: new Date().toISOString(),
    overallScore, letterGrade: getLetterGrade(overallScore),
    benchmark: computeBenchmark(overallScore, safeRepos),
    categories, suggestedRoles: detectJobRoles(safeRepos),
    visualizations: buildVisualizations(safeRepos, categories),
    roadmap: buildRoadmap(categories),
    profile, repos: safeRepos, totalStars, totalForks,
    primaryLanguages, topTopics, accountAge, isAuthenticated,
  };
}
