/**
 * Job Hunt Mode Types
 */

import type { JobRole } from "./profile";

export interface JobHuntLink {
  id: string;
  title: string;
  url: string;
  description?: string;
}

export interface JobHuntTip {
  id: string;
  title: string;
  content: string;
}

export interface JobHuntData {
  suggestedRoles: JobRole[];
  techStack: string[];
  username: string;
  // Section A: Job & Internship Search URLs
  searchUrls: JobHuntLink[];
  // Section B: Recruiter & Hiring Manager Discovery
  recruiterUrls: JobHuntLink[];
  // Section C: Alumni & Network Leverage
  networkItems: JobHuntLink[];
  // Section D: Profile, Visibility & Algorithm Tricks
  profileTips: JobHuntTip[];
  // Cold DM Template
  coldDmTemplate: string;
}
