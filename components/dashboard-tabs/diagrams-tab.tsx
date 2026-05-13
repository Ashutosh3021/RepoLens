/**
 * DiagramsTab Component
 * 
 * Dashboard Diagrams tab content:
 * - Mermaid diagram renderer
 * - Toggle between Architecture and Workflow
 * - Raw code block with copy button
 */

"use client";

import { MermaidRenderer } from "@/components/mermaid-renderer";
import { RepoData } from "@/lib/types";

export function DiagramsTab({ data }: { data: RepoData | null }) {
  if (!data) {
    return <div className="text-center py-12 text-slate-400">No repository data available</div>;
  }

  const diagrams = data.analysis.diagrams;

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="glass-card rounded-lg p-4 border-l-4 border-[#00e5ff]">
        <h3 className="font-semibold text-white mb-2">
          Architecture & Workflow Diagrams
        </h3>
        <p className="text-sm text-slate-400">
          AI-generated diagrams showing the repository structure and data flow.
          Toggle between Architecture overview and Workflow sequence diagram.
        </p>
      </div>

      {/* Mermaid Renderer */}
      <MermaidRenderer
        architectureDiagram={diagrams.architecture}
        workflowDiagram={diagrams.workflow}
      />
    </div>
  );
}
