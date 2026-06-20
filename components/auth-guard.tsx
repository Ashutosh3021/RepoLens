/**
 * AuthGuard
 *
 * Wraps any feature that requires GitHub authentication.
 * Shows a full lock-screen CTA when the user is not signed in.
 * Renders children when authenticated.
 *
 * Usage:
 *   <AuthGuard featureName="Full Profile Analysis">
 *     <YourProtectedComponent />
 *   </AuthGuard>
 */

"use client";

import { motion } from "framer-motion";
import { Github, Lock, Zap, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

interface AuthGuardProps {
  children: React.ReactNode;
  featureName?: string;
}

const PERKS = [
  { icon: TrendingUp, text: "10-category developer profile score" },
  { icon: Zap,        text: "Authenticated GitHub API (60× higher rate limits)" },
  { icon: Shield,     text: "Analysis of all your public repositories" },
];

export function AuthGuard({ children, featureName = "this feature" }: AuthGuardProps) {
  const { isLoggedIn, isLoading, login } = useAuth();

  // While NextAuth checks the session, show a skeleton placeholder
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <div className="h-8 rounded-lg bg-white/[0.05] animate-pulse" />
          <div className="h-48 rounded-2xl bg-white/[0.03] animate-pulse" />
          <div className="h-12 rounded-lg bg-white/[0.05] animate-pulse" />
        </div>
      </div>
    );
  }

  // Not logged in → show prominent lock screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          <Card className="glass-card p-8 text-center relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00e5ff]/5 via-transparent to-[#7c3aed]/5 pointer-events-none" />

            <div className="relative z-10">
              {/* Lock icon */}
              <div className="w-16 h-16 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center mx-auto mb-5">
                <Lock className="w-8 h-8 text-[#00e5ff]" />
              </div>

              {/* Badge */}
              <Badge
                variant="secondary"
                className="mb-4 bg-[#7c3aed]/10 text-[#a78bfa] border-[#7c3aed]/20"
              >
                GitHub Login Required
              </Badge>

              <h2 className="text-2xl font-bold text-white mb-3">
                Unlock {featureName}
              </h2>
              <p className="text-slate-400 text-sm mb-7 max-w-sm mx-auto leading-relaxed">
                Sign in with GitHub to access deep profile analysis powered by your
                authenticated token — enabling higher rate limits and complete repo
                coverage.
              </p>

              {/* Perks list */}
              <ul className="space-y-3 mb-8 text-left">
                {PERKS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#00e5ff]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#00e5ff]" />
                    </span>
                    <span className="text-sm text-slate-300">{text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                size="lg"
                onClick={login}
                className="w-full bg-[#00e5ff] hover:bg-[#00b8d4] text-[#0a0a0f] font-semibold text-base"
              >
                <Github className="w-5 h-5 mr-2" />
                Continue with GitHub
              </Button>

              <p className="text-xs text-slate-500 mt-4">
                We only request read access to your public repositories.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Logged in → render the protected content
  return <>{children}</>;
}
