/**
 * JobHuntDashboard
 * Main page for Job Hunt Mode
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Briefcase, ExternalLink, Users, GraduationCap, Lightbulb, MessageSquare, CheckCircle2 } from "lucide-react";
import { useJobHunt } from "@/hooks/useJobHunt";
import { SearchLinksSection } from "./SearchLinksSection";
import { RecruiterDiscoverySection } from "./RecruiterDiscoverySection";
import { NetworkSection } from "./NetworkSection";
import { TipsSection } from "./TipsSection";
import { ColdDMSection } from "./ColdDMSection";
import type { FullProfileAnalysis } from "@/lib/types/profile";

interface Props {
  analysis: FullProfileAnalysis;
  onBack: () => void;
}

export function JobHuntDashboard({ analysis, onBack }: Props) {
  const jobHuntData = useJobHunt(analysis);
  const [activeTab, setActiveTab] = useState("search");
  const [applicationsSent, setApplicationsSent] = useState(0);

  const tabItems = [
    { id: "search", label: "Search Links", icon: ExternalLink },
    { id: "recruiters", label: "Recruiters", icon: Users },
    { id: "network", label: "Network", icon: GraduationCap },
    { id: "tips", label: "Tips", icon: Lightbulb },
    { id: "dm", label: "Cold DM", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-white/[0.05]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analysis
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00e5ff]/10">
              <Briefcase className="w-5 h-5 text-[#00e5ff]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Job Hunt Mode</h2>
              <p className="text-xs text-slate-400">Personalized toolkit for @{analysis.username}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Card className="glass-card p-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/20">
                {applicationsSent}
              </Badge>
              <span className="text-sm text-slate-300">Applications Sent</span>
            </div>
            <Button
              size="sm"
              onClick={() => setApplicationsSent(prev => prev + 1)}
              className="bg-[#00e5ff] hover:bg-[#00b8d4] text-[#0a0a0f]"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              +1
            </Button>
          </Card>
        </div>
      </div>

      {/* Role Tags */}
      <div className="flex flex-wrap gap-2">
        {jobHuntData.suggestedRoles.map((role) => (
          <Badge
            key={role.title}
            variant="secondary"
            className="bg-white/[0.05] text-slate-300 border-white/[0.08]"
          >
            {role.title} ({role.match}% match)
          </Badge>
        ))}
        {jobHuntData.techStack.map((tech) => (
          <Badge
            key={tech}
            variant="secondary"
            className="bg-[#7c3aed]/10 text-[#7c3aed] border-[#7c3aed]/20"
          >
            {tech}
          </Badge>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white/[0.03] border border-white/[0.06]">
          {tabItems.map((item) => {
            const Icon = item.icon;
            return (
              <TabsTrigger key={item.id} value={item.id} className="data-[state=active]:bg-white/[0.08]">
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <TabsContent value="search" className="mt-0">
            <SearchLinksSection links={jobHuntData.searchUrls} />
          </TabsContent>

          <TabsContent value="recruiters" className="mt-0">
            <RecruiterDiscoverySection links={jobHuntData.recruiterUrls} />
          </TabsContent>

          <TabsContent value="network" className="mt-0">
            <NetworkSection links={jobHuntData.networkItems} />
          </TabsContent>

          <TabsContent value="tips" className="mt-0">
            <TipsSection tips={jobHuntData.profileTips} />
          </TabsContent>

          <TabsContent value="dm" className="mt-0">
            <ColdDMSection template={jobHuntData.coldDmTemplate} />
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
}
