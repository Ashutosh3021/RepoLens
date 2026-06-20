/**
 * SearchLinksSection
 * Job & Internship Search URLs section
 */

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, CheckCircle2 } from "lucide-react";
import type { JobHuntLink } from "@/lib/types/job-hunt";

interface Props {
  links: JobHuntLink[];
}

export function SearchLinksSection({ links }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#00e5ff]/10">
          <ExternalLink className="w-5 h-5 text-[#00e5ff]" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Job & Internship Search URLs</h3>
          <p className="text-xs text-slate-400">Personalized LinkedIn search links for your target roles</p>
        </div>
      </div>

      <div className="grid gap-3">
        {links.map((link) => (
          <Card key={link.id} className="glass-card glass-card-hover p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white mb-1">{link.id}. {link.title}</p>
                {link.description && (
                  <p className="text-xs text-slate-500 mb-2">{link.description}</p>
                )}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#00e5ff] hover:underline truncate block"
                >
                  {link.url}
                </a>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(link.url, link.id)}
                  className="text-slate-400 hover:text-white hover:bg-white/[0.05]"
                >
                  {copiedId === link.id ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
