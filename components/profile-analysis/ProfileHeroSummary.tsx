/**
 * ProfileHeroSummary
 * Big score, letter grade, radar chart, benchmark badge, and key stats.
 */

"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Users, GitBranch, Calendar, MapPin, Globe, Twitter, ExternalLink } from "lucide-react";
import { ProfileRadarChart } from "./ProfileRadarChart";
import { cn } from "@/lib/utils";
import type { FullProfileAnalysis } from "@/lib/types/profile";

interface Props {
  analysis: FullProfileAnalysis;
}

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "text-[#00e5ff]";
  if (grade.startsWith("B")) return "text-green-400";
  if (grade.startsWith("C")) return "text-yellow-400";
  if (grade.startsWith("D")) return "text-orange-400";
  return "text-red-400";
}

function scoreGlow(score: number) {
  if (score >= 75) return "0 0 40px rgba(0,229,255,0.25), 0 0 80px rgba(0,229,255,0.1)";
  if (score >= 55) return "0 0 40px rgba(124,58,237,0.2)";
  return "0 0 30px rgba(239,68,68,0.15)";
}

function StatPill({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.07]">
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export function ProfileHeroSummary({ analysis }: Props) {
  const { profile, overallScore, letterGrade, benchmark, categories } = analysis;

  const radarData = Object.values(categories).map(c => ({
    category: c.label,
    score: c.score,
    fullMark: 100,
  }));

  const accountYears = Math.floor(analysis.accountAge / 365);
  const accountMonths = Math.floor((analysis.accountAge % 365) / 30);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Profile card */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <Card className="glass-card p-6 flex flex-col gap-5 h-full">
          {/* Avatar + name */}
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 border-2 border-[#00e5ff]/30 flex-shrink-0">
              <AvatarImage src={profile.avatar_url} alt={profile.login} />
              <AvatarFallback className="bg-[#7c3aed] text-white text-xl">
                {profile.login[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white truncate">{profile.name ?? profile.login}</h2>
              <a
                href={profile.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#00e5ff] hover:underline flex items-center gap-1"
              >
                @{profile.login}
                <ExternalLink className="w-3 h-3" />
              </a>
              {profile.bio && (
                <p className="text-sm text-slate-400 mt-1.5 leading-relaxed line-clamp-2">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="space-y-1.5 text-sm text-slate-400">
            {profile.company   && <div className="flex items-center gap-2"><span className="text-slate-500">🏢</span>{profile.company}</div>}
            {profile.location  && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{profile.location}</div>}
            {profile.blog      && (
              <a href={profile.blog.startsWith("http") ? profile.blog : `https://${profile.blog}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#00e5ff] transition-colors">
                <Globe className="w-3.5 h-3.5" />{profile.blog.replace(/^https?:\/\//, "")}
              </a>
            )}
            {profile.twitter_username && (
              <a href={`https://twitter.com/${profile.twitter_username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#00e5ff] transition-colors">
                <Twitter className="w-3.5 h-3.5" />@{profile.twitter_username}
              </a>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2">
            <StatPill icon={Users}     value={analysis.profile.followers.toLocaleString()} label="Followers"  color="#00e5ff" />
            <StatPill icon={Star}      value={analysis.totalStars.toLocaleString()}         label="Total Stars" color="#f59e0b" />
            <StatPill icon={GitBranch} value={analysis.profile.public_repos.toString()}     label="Repos"       color="#7c3aed" />
            <StatPill icon={Calendar}  value={accountYears > 0 ? `${accountYears}y ${accountMonths}m` : `${accountMonths}m`} label="Member" color="#22c55e" />
          </div>

          {/* Languages */}
          {analysis.primaryLanguages.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {analysis.primaryLanguages.map(l => (
                <span key={l} className="text-xs px-2 py-0.5 rounded-full bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20">
                  {l}
                </span>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Score + grade */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="glass-card p-6 flex flex-col items-center justify-center gap-5 h-full text-center">
          {/* Big score */}
          <div
            className="relative w-36 h-36 rounded-full flex flex-col items-center justify-center"
            style={{ background: "rgba(15,15,25,0.8)", boxShadow: scoreGlow(overallScore) }}
          >
            <motion.span
              className={cn("text-5xl font-bold font-mono", gradeColor(letterGrade))}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 120, delay: 0.3 }}
            >
              {overallScore}
            </motion.span>
            <span className="text-xs text-slate-500 mt-0.5">out of 100</span>

            {/* Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 144 144">
              <circle cx="72" cy="72" r="64" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <motion.circle
                cx="72" cy="72" r="64"
                fill="none"
                stroke={overallScore >= 75 ? "#00e5ff" : overallScore >= 55 ? "#7c3aed" : "#ef4444"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 64}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 64 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 64 * (1 - overallScore / 100) }}
                transition={{ duration: 1.4, ease: "easeOut", delay: 0.4 }}
                style={{ filter: `drop-shadow(0 0 8px ${overallScore >= 75 ? "#00e5ff40" : "#7c3aed40"})` }}
              />
            </svg>
          </div>

          {/* Letter grade */}
          <div>
            <p className={cn("text-5xl font-bold font-mono", gradeColor(letterGrade))}>{letterGrade}</p>
            <p className="text-sm text-slate-400 mt-1">Letter Grade</p>
          </div>

          {/* Benchmark */}
          <Badge variant="secondary" className="bg-[#7c3aed]/15 text-[#a78bfa] border border-[#7c3aed]/30 px-3 py-1 text-xs">
            🏆 {benchmark.label}
          </Badge>

          {/* Top topics */}
          {analysis.topTopics.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center">
              {analysis.topTopics.slice(0, 6).map(t => (
                <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400">#{t}</span>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Radar chart */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="glass-card p-6 flex flex-col items-center justify-center gap-4 h-full">
          <h3 className="font-semibold text-white self-start">Category Overview</h3>
          <ProfileRadarChart data={radarData} size={260} />
          <p className="text-xs text-slate-500 text-center">Hover dots for details · Click categories below</p>
        </Card>
      </motion.div>
    </div>
  );
}
