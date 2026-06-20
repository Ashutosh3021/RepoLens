/**
 * useJobHunt Hook
 * Generates personalized job hunting toolkit from analysis result
 */

import { useMemo } from "react";
import type { FullProfileAnalysis, JobRole } from "@/lib/types/profile";
import type { JobHuntData, JobHuntLink, JobHuntTip } from "@/lib/types/job-hunt";

export function useJobHunt(
  analysis: FullProfileAnalysis
): JobHuntData {
  const primaryRole = useMemo(() => {
    return analysis.suggestedRoles[0]?.title || "Software Engineer";
  }, [analysis.suggestedRoles]);

  const roleKeywords = useMemo(() => {
    return primaryRole.toLowerCase().replace(/\s+/g, "%20");
  }, [primaryRole]);

  const techKeywords = useMemo(() => {
    const techs = analysis.primaryLanguages.slice(0, 3);
    return techs.join("%20");
  }, [analysis.primaryLanguages]);

  // A. Job & Internship Search URLs
  const searchUrls = useMemo((): JobHuntLink[] => {
    const role = roleKeywords;
    return [
      {
        id: "1",
        title: "Internship-only feed",
        url: `https://www.linkedin.com/jobs/search/?keywords=${role}%20intern&f_E=1`,
        description: "Show only internship postings for your role"
      },
      {
        id: "2",
        title: "Internships posted in last 24 hours",
        url: `https://www.linkedin.com/jobs/search/?keywords=${role}%20intern&f_E=1&f_TPR=r86400`,
        description: "Fresh internships posted today"
      },
      {
        id: "3",
        title: "Remote internships",
        url: `https://www.linkedin.com/jobs/search/?keywords=${role}%20intern&f_E=1&f_WT=2`,
        description: "Work-from-anywhere opportunities"
      },
      {
        id: "4",
        title: "Paid internships",
        url: `https://www.linkedin.com/jobs/search/?keywords=paid%20${role}%20intern&f_E=1`,
        description: "Filter for paid roles only"
      },
      {
        id: "5",
        title: "Entry-level jobs only",
        url: `https://www.linkedin.com/jobs/search/?keywords=${role}&f_E=2`,
        description: "Junior/entry-level full-time roles"
      },
      {
        id: "6",
        title: "Fresher roles",
        url: `https://www.linkedin.com/jobs/search/?keywords=${role}%20fresher`,
        description: "Roles for recent graduates"
      },
      {
        id: "7",
        title: "Graduate roles",
        url: `https://www.linkedin.com/jobs/search/?keywords=${role}%20graduate`,
        description: "Graduate program openings"
      },
      {
        id: "8",
        title: `${primaryRole} with Easy Apply`,
        url: `https://www.linkedin.com/jobs/search/?keywords=${role}&f_E=2&f_AL=true`,
        description: "One-click applications"
      },
      {
        id: "9",
        title: "Startup internships",
        url: `https://www.linkedin.com/jobs/search/?keywords=${role}%20intern%20startup&f_E=1`,
        description: "High-growth startup opportunities"
      },
      {
        id: "10",
        title: `${primaryRole} at global companies`,
        url: `https://www.linkedin.com/jobs/search/?keywords=${role}%20global`,
        description: "MNC and international roles"
      },
      {
        id: "11",
        title: "Tech stack specific roles",
        url: `https://www.linkedin.com/jobs/search/?keywords=${techKeywords}%20${role}`,
        description: "Roles matching your tech stack"
      },
      {
        id: "12",
        title: "Recently posted full-time roles",
        url: `https://www.linkedin.com/jobs/search/?keywords=${role}&f_E=2&f_TPR=r604800`,
        description: "Roles posted in last week"
      },
      {
        id: "13",
        title: "Apprenticeship roles",
        url: `https://www.linkedin.com/jobs/search/?keywords=${role}%20apprenticeship`,
        description: "Apprenticeship and training programs"
      },
      {
        id: "14",
        title: "Hybrid roles",
        url: `https://www.linkedin.com/jobs/search/?keywords=${role}&f_WT=3`,
        description: "Hybrid work arrangements"
      },
      {
        id: "15",
        title: "On-site roles",
        url: `https://www.linkedin.com/jobs/search/?keywords=${role}&f_WT=1`,
        description: "In-office opportunities"
      },
    ];
  }, [roleKeywords, primaryRole, techKeywords]);

  // B. Recruiter & Hiring Manager Discovery
  const recruiterUrls = useMemo((): JobHuntLink[] => {
    const role = roleKeywords;
    return [
      {
        id: "16",
        title: "Recruiters for your role",
        url: `https://www.linkedin.com/search/results/people/?keywords=${role}%20recruiter`,
        description: "Find recruiters specializing in your field"
      },
      {
        id: "17",
        title: "Campus hiring recruiters",
        url: `https://www.linkedin.com/search/results/people/?keywords=campus%20recruiter%20${role}`,
        description: "University relations and campus recruiters"
      },
      {
        id: "18",
        title: "Early career recruiters",
        url: `https://www.linkedin.com/search/results/people/?keywords=early%20careers%20${role}`,
        description: "Recruiters focused on new grads and interns"
      },
      {
        id: "19",
        title: "Talent acquisition specialists",
        url: `https://www.linkedin.com/search/results/people/?keywords=talent%20acquisition%20${role}`,
        description: "TA professionals hiring for your role"
      },
      {
        id: "20",
        title: "Hiring managers",
        url: `https://www.linkedin.com/search/results/people/?keywords=hiring%20manager%20${role}`,
        description: "Directly connect with decision-makers"
      },
      {
        id: "21",
        title: "Engineering managers",
        url: `https://www.linkedin.com/search/results/people/?keywords=engineering%20manager`,
        description: "Engineering leadership"
      },
      {
        id: "22",
        title: "Team leads",
        url: `https://www.linkedin.com/search/results/people/?keywords=team%20lead%20${role}`,
        description: "Tech leads in your domain"
      },
      {
        id: "23",
        title: "Startup founders",
        url: `https://www.linkedin.com/search/results/people/?keywords=founder`,
        description: "Founders who hire directly"
      },
      {
        id: "24",
        title: "People operations",
        url: `https://www.linkedin.com/search/results/people/?keywords=people%20operations`,
        description: "HR without HR in title"
      },
      {
        id: "25",
        title: "Internship program coordinators",
        url: `https://www.linkedin.com/search/results/people/?keywords=internship%20program`,
        description: "Managers of internship programs"
      },
      {
        id: "26",
        title: "Technical recruiters",
        url: `https://www.linkedin.com/search/results/people/?keywords=technical%20recruiter%20${role}`,
        description: "Recruiters who understand tech"
      },
      {
        id: "27",
        title: "Headhunters",
        url: `https://www.linkedin.com/search/results/people/?keywords=headhunter%20${role}`,
        description: "Third-party recruiters"
      },
      {
        id: "28",
        title: "Sourcers",
        url: `https://www.linkedin.com/search/results/people/?keywords=sourcer%20${role}`,
        description: "Talent sourcers"
      },
      {
        id: "29",
        title: "HR business partners",
        url: `https://www.linkedin.com/search/results/people/?keywords=hr%20business%20partner`,
        description: "HRBPs"
      },
      {
        id: "30",
        title: "Recruitment managers",
        url: `https://www.linkedin.com/search/results/people/?keywords=recruitment%20manager`,
        description: "Recruitment leadership"
      },
    ];
  }, [roleKeywords]);

  // C. Alumni & Network Leverage
  const networkItems = useMemo((): JobHuntLink[] => {
    const role = roleKeywords;
    return [
      {
        id: "31",
        title: "Your college alumni",
        url: `https://www.linkedin.com/search/results/people/?keywords=${role}`,
        description: "Filter by your school on LinkedIn"
      },
      {
        id: "32",
        title: "Alumni recruiters",
        url: `https://www.linkedin.com/search/results/people/?keywords=alumni%20recruiter`,
        description: "Recruiters from your alma mater"
      },
      {
        id: "33",
        title: "Recent graduates in your role",
        url: `https://www.linkedin.com/search/results/people/?keywords=recent%20graduate%20${role}`,
        description: "People who recently got similar roles"
      },
      {
        id: "34",
        title: "Former interns now full-time",
        url: `https://www.linkedin.com/search/results/people/?keywords=former%20intern%20${role}`,
        description: "Learn from their journey"
      },
      {
        id: "35",
        title: "People in your target role",
        url: `https://www.linkedin.com/search/results/people/?keywords=${role}`,
        description: "Connect and learn from peers"
      },
      {
        id: "36",
        title: "Career transitioners",
        url: `https://www.linkedin.com/search/results/people/?keywords=career%20transition%20${role}`,
        description: "People who switched to your field"
      },
      {
        id: "37",
        title: "People posting about hiring",
        url: `https://www.linkedin.com/search/results/content/?keywords=hiring%20${role}`,
        description: "Content mentioning hiring for your role"
      },
      {
        id: "38",
        title: "People sharing opportunities",
        url: `https://www.linkedin.com/search/results/content/?keywords=${role}%20opening`,
        description: "Posts about job openings"
      },
      {
        id: "39",
        title: "LinkedIn Groups for your role",
        url: `https://www.linkedin.com/search/results/groups/?keywords=${role}`,
        description: "Join communities in your field"
      },
      {
        id: "40",
        title: "Events for your industry",
        url: `https://www.linkedin.com/search/results/events/?keywords=${role}`,
        description: "Virtual and in-person events"
      },
    ];
  }, [roleKeywords]);

  // D. Profile, Visibility & Algorithm Tricks
  const profileTips = useMemo((): JobHuntTip[] => [
    { id: "41", title: "Profile views tracking", content: "Check who viewed your profile at https://www.linkedin.com/me/profile-views/" },
    { id: "42", title: "Check views after applying", content: "See who looked at your profile after you apply to jobs" },
    { id: "43", title: "Skill reordering", content: `Move ${primaryRole}-related skills to the top 3 on your profile` },
    { id: "44", title: "Headline refresh", content: "Update your headline to include your target role, wait 3 minutes, then start applying" },
    { id: "45", title: "Open to Work (recruiters only)", content: "Enable Open to Work but keep it visible only to recruiters - no green frame, better privacy" },
    { id: "46", title: "Search yourself", content: `Search LinkedIn for "${primaryRole}" with your name to see how you appear` },
    { id: "47", title: "Avoid throttling", content: "Don't apply to more than 5-7 jobs per day to avoid LinkedIn algorithm throttling" },
    { id: "48", title: "Reposted jobs priority", content: "Prioritize applying to reposted jobs - they're actively hiring" },
    { id: "49", title: "Search imprint training", content: `Search for "${primaryRole}" daily to train LinkedIn's algorithm to show you more relevant jobs` },
    { id: "50", title: "Resume classification test", content: "Use LinkedIn's resume builder at https://www.linkedin.com/jobs/resume-builder/ to test how ATS reads your resume" },
  ], [primaryRole]);

  // Cold DM Template
  const coldDmTemplate = useMemo(() => {
    const techs = analysis.primaryLanguages.slice(0, 2).join(" and ");
    return `Hi [Name],

I came across the ${primaryRole} role at [Company] and liked how your team works on ${techs || "modern tech"}.
Would love to connect and learn more.

Best,
${analysis.profile.name || "@" + analysis.username}`;
  }, [primaryRole, analysis]);

  return {
    suggestedRoles: analysis.suggestedRoles,
    techStack: analysis.primaryLanguages,
    username: analysis.username,
    searchUrls,
    recruiterUrls,
    networkItems,
    profileTips,
    coldDmTemplate
  };
}
