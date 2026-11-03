"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";

/**
 * Wraps every borrower dashboard route. `/login`, `/register` and the public
 * pages live outside this segment and stay reachable for guests.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
