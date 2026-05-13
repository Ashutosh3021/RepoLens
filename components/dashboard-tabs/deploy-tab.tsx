/**
 * DeployTab Component
 *
 * Dashboard Deploy tab content:
 * - Two columns: Free vs Paid
 * - Step-by-step deployment cards per platform
 * - Platform-specific instructions from analysis.deploymentGuide
 */

"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  DollarSign,
  Check,
  ExternalLink,
  Server,
} from "lucide-react";
import type { RepoData, DeploymentOption } from "@/lib/types";

export function DeployTab({ data }: { data: RepoData | null }) {
  if (!data) {
    return (
      <div className="text-center py-12 text-slate-400">
        No repository data available
      </div>
    );
  }

  const deploymentGuide = data.analysis.deploymentGuide;
  const freePlatforms = deploymentGuide?.free ?? [];
  const paidPlatforms = deploymentGuide?.paid ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-lg p-6 border-l-4 border-[#00e5ff]">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-[#00e5ff]/10">
            <Rocket className="w-6 h-6 text-[#00e5ff]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Deployment Guide
            </h3>
            <p className="text-slate-400 max-w-2xl">
              Choose the deployment platform that best fits your needs. We&apos;ve
              curated the most popular options with step-by-step instructions.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Free Tier */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-white/[0.08]">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Free Tier</h3>
              <p className="text-sm text-slate-400">Best for side projects</p>
            </div>
          </div>

          {freePlatforms.length === 0 ? (
            <EmptyPlatforms />
          ) : (
            <div className="space-y-4">
              {freePlatforms.map((platform, index) => (
                <motion.div
                  key={`${platform.name}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <DeployCard platform={platform} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Paid Tier */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-white/[0.08]">
            <div className="p-2 rounded-lg bg-[#7c3aed]/10">
              <DollarSign className="w-5 h-5 text-[#7c3aed]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Paid Tier</h3>
              <p className="text-sm text-slate-400">
                For production applications
              </p>
            </div>
          </div>

          {paidPlatforms.length === 0 ? (
            <EmptyPlatforms />
          ) : (
            <div className="space-y-4">
              {paidPlatforms.map((platform, index) => (
                <motion.div
                  key={`${platform.name}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
                >
                  <DeployCard platform={platform} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyPlatforms() {
  return (
    <div className="text-center py-8 text-slate-500 text-sm">
      <Server className="w-8 h-8 mx-auto mb-2 opacity-30" />
      No deployment guides generated.
    </div>
  );
}

function DeployCard({ platform }: { platform: DeploymentOption }) {
  return (
    <Card className="glass-card p-5 hover:border-[#00e5ff]/20 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-white">{platform.name}</h4>
          <p className="text-sm text-slate-400">{platform.description}</p>
        </div>
        {platform.difficulty && (
          <Badge
            variant="secondary"
            className={
              platform.difficulty === "Easy"
                ? "bg-green-500/10 text-green-400"
                : platform.difficulty === "Medium"
                ? "bg-yellow-500/10 text-yellow-400"
                : "bg-red-500/10 text-red-400"
            }
          >
            {platform.difficulty}
          </Badge>
        )}
      </div>

      {/* Steps */}
      {platform.steps && platform.steps.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-slate-300 mb-2">
            Deployment Steps:
          </p>
          {platform.steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#00e5ff]/10 text-[#00e5ff] text-xs flex items-center justify-center font-mono mt-0.5">
                {index + 1}
              </span>
              <span className="text-sm text-slate-400">
                {typeof step === "string" ? step : JSON.stringify(step)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Features */}
      {platform.features && platform.features.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {platform.features.map((feature) => (
            <span
              key={feature}
              className="text-xs px-2 py-1 rounded-full bg-white/[0.05] text-slate-400"
            >
              {feature}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-4 text-sm text-slate-500">
          {platform.estimatedTime && (
            <span>⏱️ {platform.estimatedTime}</span>
          )}
          {platform.pricing && (
            <span>💰 {platform.pricing}</span>
          )}
        </div>
        <Button
          size="sm"
          className="bg-[#00e5ff] hover:bg-[#00b8d4] text-[#0a0a0f]"
          onClick={() => {
            // Open a search for the platform name
            window.open(
              `https://www.google.com/search?q=${encodeURIComponent(platform.name + " deploy")}`,
              "_blank"
            );
          }}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Deploy Now
        </Button>
      </div>
    </Card>
  );
}
