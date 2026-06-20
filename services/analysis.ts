/**
 * Analysis Engine Service
 * Orchestrates LLM calls to generate comprehensive repository analysis
 */

import type {
  RepoContext,
  AnalysisResult,
  ScoreBreakdown,
  AIProvider,
  DeploymentOption,
} from "../lib/types";
import { llmService } from "./llm";

/**
 * System prompts for different analysis tasks
 */
const SYSTEM_PROMPTS = {
  explanation: `You are an expert software engineer analyzing a GitHub repository. Based on the detailed context provided (README, source files, dependencies, languages), write a thorough markdown explanation covering:
1. What the project does and who it's for
2. The full tech stack with specific libraries/frameworks
3. Architecture overview (how components connect)
4. Key files and their roles
5. Main user workflows
6. Notable design decisions or patterns

Be specific to THIS repository — use actual file names, library names, and features from the context. Do not write generic content.`,

  scoring: `You are a senior engineer doing a code review. Score this repository 1-10 across 6 dimensions based on the evidence in the context. Return ONLY valid JSON with no extra text:
{"overall":7.5,"breakdown":{"codeQuality":8,"documentation":7,"testing":6,"activity":8,"dependencies":7,"community":7},"details":{"codeQuality":["specific observation 1","specific observation 2"],"documentation":["specific observation"],"testing":["specific observation"],"activity":["specific observation"],"dependencies":["specific observation"],"community":["specific observation"]}}

Base scores on actual evidence: test files presence, README quality, commit frequency, dependency count, etc.`,

  architecture: `You are a software architect. Generate a Mermaid flowchart diagram that accurately represents THIS repository's architecture based on the provided file structure, dependencies, and code.

Rules:
- Use actual component names, file names, and layer names from the repository
- Show real data flow between components
- Return ONLY raw Mermaid code starting with "flowchart TB"
- No markdown fences, no explanatory text, just the diagram code
- Include at least 6-8 nodes reflecting the real architecture`,

  workflow: `You are a software architect. Generate a Mermaid sequence diagram showing the main user workflow for THIS repository based on the provided context.

Rules:
- Use actual participant names (real component/service names from the repo)
- Show the real sequence of operations that happen when a user uses the main feature
- Return ONLY raw Mermaid code starting with "sequenceDiagram"
- No markdown fences, no explanatory text, just the diagram code
- Include at least 5-6 meaningful steps`,

  deployment: `Recommend deployment platforms for this specific repository based on its tech stack and architecture. Return ONLY valid JSON with no extra text:
{"free":[{"name":"Vercel","description":"Best for Next.js","difficulty":"Easy","estimatedTime":"3 min","features":["HTTPS","CDN","Preview"],"steps":["Connect GitHub","Import project","Deploy"],"pricing":"Free tier"},{"name":"Railway","description":"Full-stack platform","difficulty":"Easy","estimatedTime":"5 min","features":["Auto-scale","DB hosting"],"steps":["Create account","Deploy from GitHub","Set env vars"],"pricing":"$5 credit free"}],"paid":[{"name":"AWS Amplify","description":"Enterprise AWS","difficulty":"Medium","estimatedTime":"10 min","features":["CI/CD","Auth","API Gateway"],"steps":["Create AWS account","Connect repo","Configure build","Deploy"],"pricing":"Pay as you go"}]}`,

  mcp: `Generate a minimal MCP server config JSON for this repository. Return ONLY valid JSON with keys: name, version, description, server (port, host), capabilities (tools array with name/description/parameters), ai (provider, model).`,
};

/**
 * Generate AI explanation for repository
 */
async function generateExplanation(
  contextPrompt: string,
  provider: AIProvider,
  model?: string
): Promise<string> {
  try {
    const response = await llmService.generateCompletion(provider, contextPrompt, {
      model,
      systemPrompt: SYSTEM_PROMPTS.explanation,
      temperature: 0.6,
      maxTokens: 2500,
    });
    return response.content;
  } catch (error) {
    console.error("Explanation generation failed:", error);
    return "Analysis failed. Please try again.";
  }
}

/**
 * Get default explanation
 */
function getDefaultExplanation(context: RepoContext): string {
  return `# ${context.metadata.name}

${context.metadata.description || "A GitHub repository"}

## Overview

This is a ${context.metadata.language || "software"} project with ${context.metadata.stars} stars on GitHub.

## Tech Stack

${context.packageFile ? `Package Manager: ${context.packageFile.type}` : "Package manager: Unknown"}

${context.languages ? `Languages: ${Object.entries(context.languages).slice(0, 3).map(([lang, bytes]) => lang).join(", ")}` : ""}

## Getting Started

Please refer to the README.md for setup instructions.

## License

${context.metadata.license || "No license specified"}`;
}

/**
 * Generate repository score
 */
async function generateScore(
  contextPrompt: string,
  provider: AIProvider,
  model?: string
): Promise<{
  overall: number;
  breakdown: ScoreBreakdown;
  details: Record<keyof ScoreBreakdown, string[]>;
}> {
  try {
    const response = await llmService.generateCompletion(provider, contextPrompt, {
      model,
      systemPrompt: SYSTEM_PROMPTS.scoring,
      temperature: 0.3,
      maxTokens: 1200,
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        overall: parsed.overall || 7.0,
        breakdown: {
          codeQuality:   parsed.breakdown?.codeQuality   || 7.0,
          documentation: parsed.breakdown?.documentation || 7.0,
          testing:       parsed.breakdown?.testing       || 7.0,
          activity:      parsed.breakdown?.activity      || 7.0,
          dependencies:  parsed.breakdown?.dependencies  || 7.0,
          community:     parsed.breakdown?.community     || 7.0,
        },
        details: parsed.details || {},
      };
    }
  } catch (error) {
    console.error("Failed to parse score JSON:", error);
  }

  return {
    overall: 7.0,
    breakdown: {
      codeQuality: 7.0, documentation: 7.0, testing: 7.0,
      activity: 7.0, dependencies: 7.0, community: 7.0,
    },
    details: {
      codeQuality:   ["Code structure analyzed"],
      documentation: ["Documentation reviewed"],
      testing:       ["Test coverage assessed"],
      activity:      ["Activity metrics evaluated"],
      dependencies:  ["Dependencies checked"],
      community:     ["Community engagement reviewed"],
    },
  };
}

/**
 * Extract and sanitize a Mermaid diagram from raw LLM output.
 *
 * The LLM sometimes wraps the diagram in markdown fences, adds prose before/after,
 * or returns plain text. This function:
 * 1. Strips ```mermaid ... ``` fences
 * 2. Strips plain ``` ... ``` fences
 * 3. Finds the first line that starts with a known Mermaid keyword
 * 4. Returns everything from that line onward
 * 5. Returns empty string if nothing valid is found
 */
function extractMermaid(raw: string, expectedKeyword: string): string {
  if (!raw || !raw.trim()) return "";

  // Strip ```mermaid ... ``` fences
  const fencedMermaid = raw.match(/```mermaid\s*\n([\s\S]*?)```/);
  if (fencedMermaid) return fencedMermaid[1].trim();

  // Strip plain ``` ... ``` fences
  const fencedPlain = raw.match(/```\s*\n?([\s\S]*?)```/);
  if (fencedPlain) {
    const inner = fencedPlain[1].trim();
    if (inner.toLowerCase().startsWith(expectedKeyword)) return inner;
  }

  // Find the first line that starts with the expected keyword
  const lines = raw.split("\n");
  const startIdx = lines.findIndex((l) =>
    l.trim().toLowerCase().startsWith(expectedKeyword)
  );
  if (startIdx !== -1) {
    return lines.slice(startIdx).join("\n").trim();
  }

  // Also accept any known Mermaid keyword as a fallback
  const KEYWORDS = ["flowchart", "graph ", "sequencediagram", "classdiagram",
    "statediagram", "erdiagram", "gantt", "pie", "gitgraph"];
  const anyIdx = lines.findIndex((l) =>
    KEYWORDS.some((kw) => l.trim().toLowerCase().startsWith(kw))
  );
  if (anyIdx !== -1) {
    return lines.slice(anyIdx).join("\n").trim();
  }

  return "";
}

/**
 * Generate architecture diagram
 */
async function generateArchitectureDiagram(
  contextPrompt: string,
  context: RepoContext,
  provider: AIProvider,
  model?: string
): Promise<string> {
  try {
    const response = await llmService.generateCompletion(provider, contextPrompt, {
      model,
      systemPrompt: SYSTEM_PROMPTS.architecture,
      temperature: 0.2,
      maxTokens: 1500,
    });

    const extracted = extractMermaid(response.content, "flowchart");
    if (extracted) return extracted;
  } catch (error) {
    console.error("Architecture diagram generation failed:", error);
  }
  return getDefaultArchitectureDiagram(context);
}

/**
 * Get default architecture diagram
 */
function getDefaultArchitectureDiagram(context: RepoContext): string {
  return `flowchart TB
    subgraph Main["${context.metadata.name}"]
        A[App Entry]
        B[Core Logic]
        C[Data Layer]
    end
    
    style A fill:#00e5ff,stroke:#0a0a0f,color:#0a0a0f
    style B fill:#7c3aed,stroke:#0a0a0f,color:#fff
    style C fill:#22c55e,stroke:#0a0a0f,color:#0a0a0f`;
}

/**
 * Generate workflow diagram
 */
async function generateWorkflowDiagram(
  contextPrompt: string,
  context: RepoContext,
  provider: AIProvider,
  model?: string
): Promise<string> {
  try {
    const response = await llmService.generateCompletion(provider, contextPrompt, {
      model,
      systemPrompt: SYSTEM_PROMPTS.workflow,
      temperature: 0.2,
      maxTokens: 1500,
    });

    const extracted = extractMermaid(response.content, "sequencediagram");
    if (extracted) return extracted;
  } catch (error) {
    console.error("Workflow diagram generation failed:", error);
  }
  return getDefaultWorkflowDiagram(context);
}

/**
 * Get default workflow diagram
 */
function getDefaultWorkflowDiagram(context: RepoContext): string {
  return `sequenceDiagram
    participant User
    participant System as ${context.metadata.name}
    participant GitHub as GitHub API
    
    User->>System: Request Analysis
    System->>GitHub: Fetch Repository
    GitHub-->>System: Return Data
    System->>System: Process & Analyze
    System-->>User: Return Results`;
}

/**
 * Generate deployment guide
 */
async function generateDeploymentGuide(
  contextPrompt: string,
  context: RepoContext,
  provider: AIProvider,
  model?: string
): Promise<{ free: DeploymentOption[]; paid: DeploymentOption[] }> {
  try {
    const response = await llmService.generateCompletion(provider, contextPrompt, {
      model,
      systemPrompt: SYSTEM_PROMPTS.deployment,
      temperature: 0.4,
      maxTokens: 1500,
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        free: parsed.free || getDefaultDeploymentOptions("free", context),
        paid: parsed.paid || getDefaultDeploymentOptions("paid", context),
      };
    }
  } catch (error) {
    console.error("Failed to parse deployment JSON:", error);
  }

  return {
    free: getDefaultDeploymentOptions("free", context),
    paid: getDefaultDeploymentOptions("paid", context),
  };
}

/**
 * Generate MCP configuration
 */
async function generateMcpConfig(
  contextPrompt: string,
  context: RepoContext,
  provider: AIProvider,
  model?: string
): Promise<Record<string, unknown>> {
  try {
    const response = await llmService.generateCompletion(provider, contextPrompt, {
      model,
      systemPrompt: SYSTEM_PROMPTS.mcp,
      temperature: 0.4,
      maxTokens: 1000,
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Failed to parse MCP JSON:", error);
  }

  return getDefaultMcpConfig(context);
}

/**
 * Build context prompt from repository data.
 * Called once and reused across all 6 LLM tasks.
 * Includes actual file contents for rich, repo-specific analysis.
 */
export function buildContextPrompt(context: RepoContext): string {
  // Full README (up to 3000 chars)
  const readmeSummary = context.readme
    ? context.readme.slice(0, 3000) + (context.readme.length > 3000 ? "\n...(truncated)" : "")
    : "No README found";

  // Package file with FULL dependency list
  let packageInfo = "No package file detected";
  if (context.packageFile) {
    packageInfo = `Package File: ${context.packageFile.type}\nDependencies (${context.packageFile.dependencies.length} total): ${context.packageFile.dependencies.join(", ")}`;
  }

  // Language breakdown
  const languageInfo = context.languages
    ? Object.entries(context.languages)
        .slice(0, 8)
        .map(([lang, bytes]) => {
          const total = Object.values(context.languages).reduce((a, b) => a + b, 0);
          return `${lang} (${total > 0 ? ((bytes / total) * 100).toFixed(1) : 0}%)`;
        })
        .join(", ")
    : context.metadata.language || "Unknown";

  // Actual content of important files (up to 800 chars each, max 6 files)
  const fileContents = context.importantFiles
    .slice(0, 6)
    .map((f) => {
      const snippet = f.content.slice(0, 800) + (f.content.length > 800 ? "\n...(truncated)" : "");
      return `### ${f.path}\n\`\`\`\n${snippet}\n\`\`\``;
    })
    .join("\n\n");

  // File tree summary (top-level structure)
  const fileTree = context.tree.tree
    .slice(0, 60)
    .map((f) => f.path)
    .join("\n");

  // Dependencies with versions
  const depsList = context.dependencies.length > 0
    ? context.dependencies
        .slice(0, 30)
        .map((d) => `${d.name}@${d.version}${d.isDev ? " (dev)" : ""}`)
        .join(", ")
    : "None detected";

  // Contributor list
  const contributorList = context.contributors.length > 0
    ? context.contributors.map((c) => `${c.login} (${c.contributions} commits)`).join(", ")
    : "Unknown";

  return `=== REPOSITORY CONTEXT ===

Repository: ${context.metadata.fullName}
URL: ${context.url}
Description: ${context.metadata.description || "N/A"}
Topics: ${context.metadata.topics.join(", ") || "N/A"}
License: ${context.metadata.license || "N/A"}
Stars: ${context.metadata.stars} | Forks: ${context.metadata.forks} | Open Issues: ${context.metadata.openIssues}
Total Files: ${context.tree.tree.length}
Last Commit: ${context.lastCommit.date} by ${context.lastCommit.author} — "${context.lastCommit.message}"
Commits (last year): ${context.commitActivity.totalCommitsLastYear}
Contributors: ${contributorList}

=== LANGUAGES ===
${languageInfo}

=== DEPENDENCIES ===
${depsList}

${packageInfo}

=== README ===
${readmeSummary}

=== FILE STRUCTURE (first 60 files) ===
${fileTree}

=== KEY FILE CONTENTS ===
${fileContents}`;
}

/**
 * Get default deployment options
 * @param tier - Free or paid
 * @param context - Repository context
 */
function getDefaultDeploymentOptions(
  tier: "free" | "paid",
  context: RepoContext
): DeploymentOption[] {
  const isNode = context.packageFile?.type === "package.json";
  const isPython =
    context.packageFile?.type === "requirements.txt" ||
    context.metadata.language === "Python";

  if (tier === "free") {
    return [
      {
        name: "Vercel",
        description: isNode
          ? "Perfect for Next.js/React apps with zero config"
          : "Great for static sites and serverless functions",
        difficulty: "Easy",
        estimatedTime: "3 minutes",
        steps: [
          "Connect GitHub repo to Vercel",
          "Auto-detect framework settings",
          "Deploy with one click",
        ],
        features: ["Auto HTTPS", "Global CDN", "Preview deployments"],
        pricing: "Free tier available",
      },
      {
        name: "Railway",
        description: "Modern platform for full-stack applications",
        difficulty: "Easy",
        estimatedTime: "5 minutes",
        steps: [
          "Create Railway account",
          "Deploy from GitHub",
          "Configure environment variables",
        ],
        features: ["Auto-scaling", "Database hosting", "Environment variables"],
        pricing: "Free tier with $5 credit",
      },
      {
        name: "Render",
        description: "Unified platform for all your apps",
        difficulty: "Easy",
        estimatedTime: "5 minutes",
        steps: [
          "Connect repository",
          "Select service type",
          "Deploy automatically",
        ],
        features: ["Free tier", "Auto-deploy", "Managed databases"],
        pricing: "Generous free tier",
      },
    ];
  } else {
    return [
      {
        name: "AWS Amplify",
        description: "Enterprise-grade AWS infrastructure",
        difficulty: "Medium",
        estimatedTime: "10 minutes",
        steps: [
          "Create AWS account",
          "Connect repository",
          "Configure build settings",
          "Set up custom domain",
        ],
        features: ["CI/CD", "Auth integration", "API Gateway", "Scalable"],
        pricing: "Pay as you go",
      },
      {
        name: "DigitalOcean App Platform",
        description: "Developer-friendly with predictable pricing",
        difficulty: "Medium",
        estimatedTime: "8 minutes",
        steps: [
          "Create DO account",
          "Connect GitHub",
          "Configure app",
          "Deploy",
        ],
        features: ["Global CDN", "Auto-deploy", "Databases included"],
        pricing: "From $5/month",
      },
      {
        name: "Google Cloud Run",
        description: "Serverless containers on GCP",
        difficulty: "Advanced",
        estimatedTime: "15 minutes",
        steps: [
          "Set up GCP project",
          "Configure Cloud Run",
          "Set up CI/CD pipeline",
          "Deploy",
        ],
        features: ["Auto-scaling", "Pay-per-use", "Global load balancing"],
        pricing: "Free tier then pay-per-use",
      },
    ];
  }
}

/**
 * Get default MCP configuration
 * @param context - Repository context
 */
function getDefaultMcpConfig(context: RepoContext): Record<string, unknown> {
  return {
    name: `${context.metadata.name} MCP Server`,
    version: "1.0.0",
    description: `Model Context Protocol server for ${context.metadata.fullName}`,
    server: {
      port: 3001,
      host: "localhost",
    },
    capabilities: {
      tools: [
        {
          name: "analyze_code",
          description: "Analyze code in the repository",
          parameters: {
            type: "object",
            properties: {
              filePath: { type: "string" },
              question: { type: "string" },
            },
            required: ["filePath"],
          },
        },
        {
          name: "get_file_content",
          description: "Get content of a specific file",
          parameters: {
            type: "object",
            properties: {
              path: { type: "string" },
            },
            required: ["path"],
          },
        },
      ],
      resources: [
        {
          name: "repo_info",
          description: "Basic repository information",
          template: `repo://${context.metadata.fullName}/info`,
        },
      ],
    },
    ai: {
      provider: "gemini",
      model: "gemini-1.5-flash",
      temperature: 0.7,
    },
    features: {
      streaming: true,
      caching: true,
    },
  };
}

/**
 * Analyze repository comprehensively.
 *
 * Performance notes:
 * - Context prompt is built ONCE and reused across all 6 LLM calls.
 * - All 6 LLM calls run in parallel via Promise.all.
 * - Faster models (flash / haiku / groq) finish in ~10–20s total.
 */
export async function analyzeRepository(
  context: RepoContext,
  provider: AIProvider = "gemini",
  model?: string
): Promise<AnalysisResult> {
  console.log(`🧠 Analyzing repository with ${provider}...`);

  if (!llmService.isRegistered(provider)) {
    throw new Error(
      `Provider ${provider} not registered. Please set the API key in settings.`
    );
  }

  // Build the context prompt once — all generators receive the same string
  const contextPrompt = buildContextPrompt(context);

  // Run all 6 analyses in parallel, each reusing the pre-built prompt
  const [explanation, score, architecture, workflow, deployment, mcpConfig] =
    await Promise.all([
      generateExplanation(contextPrompt, provider, model),
      generateScore(contextPrompt, provider, model),
      generateArchitectureDiagram(contextPrompt, context, provider, model),
      generateWorkflowDiagram(contextPrompt, context, provider, model),
      generateDeploymentGuide(contextPrompt, context, provider, model),
      generateMcpConfig(contextPrompt, context, provider, model),
    ]);

  console.log(`✅ Analysis complete`);

  return {
    explanation,
    score,
    diagrams: { architecture, workflow },
    deploymentGuide: deployment,
    mcpConfig,
  };
}
