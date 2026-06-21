"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Sparkles } from "lucide-react";

interface WizardFormData {
  type: string;
  keywords: string;
  postedWithin: string;
  workType: string;
  location: string;
  easyApply: boolean;
  companyType: string;
  experienceLevel: string;
}

export function JobSearchWizard() {
  const [formData, setFormData] = useState<WizardFormData>({
    type: "internship",
    keywords: "",
    postedWithin: "any",
    workType: "any",
    location: "",
    easyApply: false,
    companyType: "any",
    experienceLevel: "1",
  });

  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateLinkedInUrl = () => {
    const params: string[] = [];
    let keywords = formData.keywords.trim();

    if (!keywords && formData.type !== "job") {
      if (formData.type === "internship") keywords = "intern";
      else if (formData.type === "fresher") keywords = "fresher";
      else if (formData.type === "graduate") keywords = "graduate";
      else if (formData.type === "apprenticeship") keywords = "apprenticeship";
    } else if (keywords && formData.type !== "job") {
      if (formData.type === "internship") keywords += " intern";
      else if (formData.type === "fresher") keywords += " fresher";
      else if (formData.type === "graduate") keywords += " graduate";
      else if (formData.type === "apprenticeship") keywords += " apprenticeship";
    }

    if (formData.companyType === "mnc" && keywords) keywords += " global";
    else if (formData.companyType === "startup" && keywords) keywords += " startup";

    if (keywords) {
      params.push(`keywords=${encodeURIComponent(keywords)}`);
    }

    if (formData.experienceLevel) {
      params.push(`f_E=${formData.experienceLevel}`);
    }

    if (formData.postedWithin === "24h") {
      params.push("f_TPR=r86400");
    } else if (formData.postedWithin === "week") {
      params.push("f_TPR=r604800");
    }

    if (formData.workType === "remote") {
      params.push("f_WT=2");
    } else if (formData.workType === "hybrid") {
      params.push("f_WT=3");
    } else if (formData.workType === "onsite") {
      params.push("f_WT=1");
    }

    if (formData.easyApply) {
      params.push("f_AL=true");
    }

    if (formData.location.trim()) {
      params.push(`location=${encodeURIComponent(formData.location.trim())}`);
    }

    const url = `https://www.linkedin.com/jobs/search/?${params.join("&")}`;
    setGeneratedUrl(url);
  };

  const copyUrl = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[#00e5ff]/10">
            <Sparkles className="w-5 h-5 text-[#00e5ff]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Job Search Wizard</h3>
            <p className="text-sm text-slate-400">Customize your search and get a ready-to-use LinkedIn URL</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm text-slate-300">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="job">Job</SelectItem>
                <SelectItem value="fresher">Fresher</SelectItem>
                <SelectItem value="graduate">Graduate</SelectItem>
                <SelectItem value="apprenticeship">Apprenticeship</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords" className="text-sm text-slate-300">Keywords</Label>
            <Input
              id="keywords"
              placeholder="e.g., software intern, data intern, marketing intern"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postedWithin" className="text-sm text-slate-300">Posted within</Label>
            <Select
              value={formData.postedWithin}
              onValueChange={(value) => setFormData({ ...formData, postedWithin: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any time</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="week">Last week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workType" className="text-sm text-slate-300">Work type</Label>
            <Select
              value={formData.workType}
              onValueChange={(value) => setFormData({ ...formData, workType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select work type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm text-slate-300">Location (optional)</Label>
            <Input
              id="location"
              placeholder="e.g., New York, London, Remote"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyType" className="text-sm text-slate-300">Company type</Label>
            <Select
              value={formData.companyType}
              onValueChange={(value) => setFormData({ ...formData, companyType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="mnc">MNC</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experienceLevel" className="text-sm text-slate-300">Experience level</Label>
            <Select
              value={formData.experienceLevel}
              onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Internship</SelectItem>
                <SelectItem value="2">Entry-level</SelectItem>
                <SelectItem value="3">Associate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div>
              <Label htmlFor="easyApply" className="text-sm text-slate-300">Easy Apply</Label>
              <p className="text-xs text-slate-500">Only show jobs with one-click apply</p>
            </div>
            <Switch
              id="easyApply"
              checked={formData.easyApply}
              onCheckedChange={(checked) => setFormData({ ...formData, easyApply: checked })}
            />
          </div>
        </div>

        <Button
          onClick={generateLinkedInUrl}
          className="w-full bg-[#00e5ff] hover:bg-[#00b8d4] text-[#0a0a0f] mb-6"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate LinkedIn Search URL
        </Button>

        {generatedUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-4"
          >
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between gap-3 mb-2">
                <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                  Ready to use
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyUrl}
                    className="text-slate-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(generatedUrl, "_blank")}
                    className="text-slate-400 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open
                  </Button>
                </div>
              </div>
              <p className="text-sm font-mono text-slate-300 break-all">{generatedUrl}</p>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}
