/**
 * Navbar Component
 *
 * Fixed navigation bar with:
 * - Logo/brand
 * - GitHub OAuth status (real NextAuth session)
 * - Settings icon link
 *
 * Used across all pages
 */

"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Github, Settings, Search } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session;
  const user = session?.user;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] backdrop-blur-xl"
      style={{ background: "rgba(10, 10, 15, 0.8)" }}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Search className="h-6 w-6 text-[#00e5ff] transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 bg-[#00e5ff] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight">
            <span className="text-white">Repo</span>
            <span className="text-[#00e5ff]">Lens</span>
          </span>
        </Link>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* GitHub OAuth Status */}
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-white/[0.05] animate-pulse" />
          ) : isAuthenticated && user ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/[0.05]"
                >
                  <Avatar className="h-7 w-7 border border-[#00e5ff]/30">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                    <AvatarFallback className="bg-[#7c3aed] text-white text-xs">
                      {(user.name ?? user.email ?? "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">
                    {user.name ?? user.email}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Connected to GitHub — click to sign out</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => signIn("github")}
                  className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/[0.05]"
                >
                  <Github className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm">Sign In</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Connect with GitHub</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Settings Link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/settings">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-[#00e5ff] hover:bg-white/[0.05]"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </motion.header>
  );
}
