/**
 * Full Profile Analysis Page
 * Protected — shows AuthGuard lock screen when not signed in.
 */
"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { ProfileAnalysis } from "@/components/profile-analysis";

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="pt-16 min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#00e5ff] animate-spin" />
        </main>
      }
    >
      <main className="pt-16 min-h-screen">
        <AuthGuard featureName="Full Profile Analysis">
          <ProfileAnalysis />
        </AuthGuard>
      </main>
    </Suspense>
  );
}
