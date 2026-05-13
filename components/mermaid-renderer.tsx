/**
 * MermaidRenderer Component
 *
 * Renders Mermaid diagrams safely:
 * - Sanitizes LLM output at display time (strips fences, finds first valid line)
 * - Falls back to a deterministic default diagram when the string is invalid
 * - Uses unique IDs per render to avoid Mermaid's internal registry collisions
 * - Catches render errors and shows the raw code so users can still read it
 */

"use client";

import { useEffect, useRef, useState, useId } from "react";
import mermaid from "mermaid";
import { CodeBlock } from "./code-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Workflow } from "lucide-react";

interface MermaidRendererProps {
  architectureDiagram: string;
  workflowDiagram: string;
}

// ─── Client-side sanitizer (mirrors services/analysis.ts extractMermaid) ─────

const MERMAID_KEYWORDS = [
  "flowchart", "graph ", "sequencediagram", "classdiagram",
  "statediagram", "erdiagram", "gantt", "pie", "gitgraph",
  "mindmap", "timeline",
];

function sanitizeMermaid(raw: string, fallback: string): string {
  if (!raw || !raw.trim()) return fallback;

  // Strip ```mermaid ... ``` fences
  const fencedMermaid = raw.match(/```mermaid\s*\n([\s\S]*?)```/);
  if (fencedMermaid) {
    const inner = fencedMermaid[1].trim();
    if (inner) return inner;
  }

  // Strip plain ``` ... ``` fences
  const fencedPlain = raw.match(/```\s*\n?([\s\S]*?)```/);
  if (fencedPlain) {
    const inner = fencedPlain[1].trim();
    if (MERMAID_KEYWORDS.some((kw) => inner.toLowerCase().startsWith(kw))) return inner;
  }

  // Find the first line that starts with a known Mermaid keyword
  const lines = raw.split("\n");
  const startIdx = lines.findIndex((l) =>
    MERMAID_KEYWORDS.some((kw) => l.trim().toLowerCase().startsWith(kw))
  );
  if (startIdx !== -1) {
    return lines.slice(startIdx).join("\n").trim();
  }

  return fallback;
}

const DEFAULT_ARCHITECTURE = `flowchart TB
    subgraph Frontend["Frontend"]
        A[UI Components] --> B[Pages]
    end
    subgraph Backend["Backend"]
        C[API Routes] --> D[Services]
        D --> E[(Database)]
    end
    Frontend --> Backend
    style A fill:#00e5ff,color:#000
    style C fill:#7c3aed,color:#fff
    style E fill:#22c55e,color:#000`;

const DEFAULT_WORKFLOW = `sequenceDiagram
    participant User
    participant App
    participant API
    participant DB
    User->>App: Open application
    App->>API: Request data
    API->>DB: Query
    DB-->>API: Results
    API-->>App: Response
    App-->>User: Display results`;

// ─── Single diagram panel ─────────────────────────────────────────────────────

interface DiagramPanelProps {
  rawDiagram: string;
  fallbackDiagram: string;
  filename: string;
  idPrefix: string;
}

function DiagramPanel({ rawDiagram, fallbackDiagram, filename, idPrefix }: DiagramPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sanitize at display time — fixes cached bad diagrams without re-analysis
  const diagram = sanitizeMermaid(rawDiagram, fallbackDiagram);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    setRenderError(false);

    // Unique ID per render — avoids Mermaid's internal registry collisions
    const uniqueId = `${idPrefix}-${Date.now()}`;

    mermaid
      .render(uniqueId, diagram)
      .then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      })
      .catch((err) => {
        console.warn(`Mermaid render failed for ${filename}:`, err);
        // Try once more with the fallback diagram
        if (diagram !== fallbackDiagram) {
          const fallbackId = `${idPrefix}-fb-${Date.now()}`;
          mermaid
            .render(fallbackId, fallbackDiagram)
            .then(({ svg }) => {
              if (containerRef.current) {
                containerRef.current.innerHTML = svg;
              }
            })
            .catch(() => setRenderError(true));
        } else {
          setRenderError(true);
        }
      });
  }, [mounted, diagram, fallbackDiagram, idPrefix, filename]);

  if (!mounted) {
    return <div className="h-64 animate-pulse bg-white/[0.05] rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-lg p-6 overflow-x-auto min-h-[320px]">
        {renderError ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 text-slate-500">
            <p className="text-sm text-center">
              Diagram could not be rendered. Re-analyze the repository to regenerate it.
            </p>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="mermaid-container flex justify-center min-h-[280px] [&_svg]:max-w-full [&_svg]:h-auto"
          />
        )}
      </div>

      {/* Raw code block — always shown */}
      <CodeBlock code={diagram} language="mermaid" filename={filename} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MermaidRenderer({
  architectureDiagram,
  workflowDiagram,
}: MermaidRendererProps) {
  const baseId = useId().replace(/:/g, "");

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      themeVariables: {
        primaryColor: "#00e5ff",
        primaryTextColor: "#0a0a0f",
        primaryBorderColor: "#00e5ff",
        lineColor: "#7c3aed",
        secondaryColor: "#7c3aed",
        tertiaryColor: "#0f0f19",
        background: "#0a0a0f",
        mainBkg: "#0f0f19",
        secondBkg: "#1a1a2e",
        tertiaryBkg: "#0f0f19",
        nodeBorder: "#00e5ff",
        clusterBkg: "rgba(124, 58, 237, 0.1)",
        clusterBorder: "#7c3aed",
        titleColor: "#f8fafc",
        edgeLabelBackground: "#0a0a0f",
        nodeTextColor: "#f8fafc",
        actorBkg: "#0f0f19",
        actorBorder: "#00e5ff",
        actorTextColor: "#f8fafc",
        actorLineColor: "#7c3aed",
        signalColor: "#00e5ff",
        signalTextColor: "#f8fafc",
        labelBoxBkgColor: "#0f0f19",
        labelBoxBorderColor: "#7c3aed",
        labelTextColor: "#f8fafc",
        loopTextColor: "#f8fafc",
        noteBorderColor: "#7c3aed",
        noteBkgColor: "#1a1a2e",
        noteTextColor: "#f8fafc",
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis",
        padding: 20,
      },
      sequence: {
        useMaxWidth: true,
        diagramMarginX: 20,
        diagramMarginY: 20,
        actorMargin: 80,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
      },
    });
  }, []);

  return (
    <Tabs defaultValue="architecture" className="w-full">
      <TabsList className="bg-white/[0.03] border border-white/[0.08] mb-4">
        <TabsTrigger
          value="architecture"
          className="data-[state=active]:bg-[#00e5ff]/10 data-[state=active]:text-[#00e5ff]"
        >
          <Layers className="w-4 h-4 mr-2" />
          Architecture
        </TabsTrigger>
        <TabsTrigger
          value="workflow"
          className="data-[state=active]:bg-[#00e5ff]/10 data-[state=active]:text-[#00e5ff]"
        >
          <Workflow className="w-4 h-4 mr-2" />
          Workflow
        </TabsTrigger>
      </TabsList>

      <TabsContent value="architecture" className="mt-0">
        <DiagramPanel
          rawDiagram={architectureDiagram}
          fallbackDiagram={DEFAULT_ARCHITECTURE}
          filename="architecture.mmd"
          idPrefix={`arch-${baseId}`}
        />
      </TabsContent>

      <TabsContent value="workflow" className="mt-0">
        <DiagramPanel
          rawDiagram={workflowDiagram}
          fallbackDiagram={DEFAULT_WORKFLOW}
          filename="workflow.mmd"
          idPrefix={`wf-${baseId}`}
        />
      </TabsContent>
    </Tabs>
  );
}
