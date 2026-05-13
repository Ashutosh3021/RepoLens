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
  explanation: `Analyze this repository and write a concise markdown explanation covering: purpose, tech stack, key files, and main workflows. Be brief.`,

  scoring: `Score this repository 1-10 across 6 dimensions. Return ONLY valid JSON:
{"overall":7.5,"breakdown":{"codeQuality":8,"documentation":7,"testing":6,"activity":8,"dependencies":7,"community":7},"details":{"codeQuality":["point1","point2"],"documentation":["point1"],"testing":["point1"],"activity":["point1"],"dependencies":["point1"],"community":["point1"]}}`,

  architecture: `Generate a Mermaid flowchart for this repository's architecture.
Return ONLY raw Mermaid code starting with "flowchart TB". No fences, no prose.

flowchart TB
    subgraph Frontend
        A[UI] --> B[Components]
    end
    subgraph Backend
        C[API] --> D[Services]
        D --> E[(DB)]
    end
    Frontend --> Backend`,

  workflow: `Generate a Mermaid sequence diagram for this repository's main user workflow.
Return ONLY raw Mermaid code starting with "sequenceDiagram". No fences, no prose.

sequenceDiagram
    participant User
    participant App
    participant API
    User->>App: Action
    App->>API: Request
    API-->>App: Response
    App-->>User: Result`,

  deployment: `Recommend deployment platforms for this repo. Return ONLY valid JSON:
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
      temperature: 0.7,
      maxTokens: 1500,
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
      temperature: 0.3,
      maxTokens: 1000,
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
      temperature: 0.3,
      maxTokens: 1000,
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
 */
export function buildContextPrompt(context: RepoContext): string {
  const importantFilesSummary = context.importantFiles
    .slice(0, 8)
    .map((f) => `- ${f.path} (${f.language || "unknown"})`)
    .join("\n");

  const packageInfo = context.packageFile
    ? `Package File: ${context.packageFile.type}\nDependencies: ${context.packageFile.dependencies.slice(0, 15).join(", ")}`
    : "No package file detected";

  // Trim README to 1500 chars — enough context, less tokens
  const readmeSummary = context.readme
    ? context.readme.slice(0, 1500) + (context.readme.length > 1500 ? "..." : "")
    : "No README found";

  return `Repository: ${context.metadata.fullName}
Description: ${context.metadata.description || "N/A"}
Language: ${context.metadata.language || "N/A"}
Stars: ${context.metadata.stars}
Forks: ${context.metadata.forks}
License: ${context.metadata.license || "N/A"}
Topics: ${context.metadata.topics.join(", ") || "N/A"}

${packageInfo}

README Summary:
${readmeSummary}

Important Files:
${importantFilesSummary}

File Count: ${context.tree.tree.length}
Contributors: ${context.contributors.length}
Last Commit: ${context.lastCommit.date}`;
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
