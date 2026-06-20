/**
 * NextAuth type declarations
 * Extends default types with custom properties
 */

import "next-auth";
import { JWT } from "next-auth/jwt";

interface GitHubProfile {
  login?: string;
  id?: number;
  avatar_url?: string;
  html_url?: string;
  name?: string;
  bio?: string;
  public_repos?: number;
  followers?: number;
  following?: number;
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    provider?: string;
    githubProfile?: GitHubProfile;
  }

  interface User {
    id?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    provider?: string;
    githubProfile?: GitHubProfile;
  }
}
