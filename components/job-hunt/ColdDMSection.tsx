/**
 * ColdDMSection
 * Cold DM Template section
 */

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Copy, CheckCircle2, RefreshCw } from "lucide-react";

interface Props {
  template: string;
}

export function ColdDMSection({ template }: Props) {
  const [message, setMessage] = useState(template);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetTemplate = () => {
    setMessage(template);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#ec4899]/10">
          <MessageSquare className="w-5 h-5 text-[#ec4899]" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Cold DM Template</h3>
          <p className="text-xs text-slate-400">Personalized outreach message for recruiters</p>
        </div>
      </div>

      <Card className="glass-card glass-card-hover p-4">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-transparent border border-white/[0.08] text-white placeholder:text-slate-500 resize-y min-h-[200px] text-sm"
        />
        <div className="flex gap-2 mt-3">
          <Button
            onClick={copyToClipboard}
            className="bg-[#ec4899] hover:bg-[#db2777] text-white"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Message
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={resetTemplate}
            className="text-slate-400 hover:text-white hover:bg-white/[0.05]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </Card>
    </div>
  );
}
