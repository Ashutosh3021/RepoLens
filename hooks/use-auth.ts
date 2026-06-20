/**
 * useAuth — thin wrapper around NextAuth's useSession.
 *
 * Provides a stable, ergonomic interface for the app:
 *   const { isLoggedIn, isLoading, user, login, logout } = useAuth();
 *
 * `user.accessToken` is NOT exposed on the client (it lives in the server JWT).
 * All authenticated API calls go through the session cookie automatically.
 */

"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export interface AuthUser {
  name:  string | null;
  email: string | null;
  image: string | null;
}

export interface UseAuthReturn {
  isLoggedIn:  boolean;
  isLoading:   boolean;
  user:        AuthUser | null;
  login:       () => void;
  logout:      () => void;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();

  const isLoading  = status === "loading";
  const isLoggedIn = !!session;

  const user: AuthUser | null = session?.user
    ? {
        name:  session.user.name  ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }
    : null;

  const login  = () => signIn("github");
  const logout = () => signOut({ callbackUrl: "/" });

  return { isLoggedIn, isLoading, user, login, logout };
}
