"use client";

import { RequireAdmin } from "@/components/admin/RequireAdmin";

/**
 * Protects every `/admin/*` route except the login page itself. Replaces the
 * route-level `middleware.ts` check that static export cannot run.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RequireAdmin>{children}</RequireAdmin>;
}
