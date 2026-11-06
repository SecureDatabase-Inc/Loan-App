"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { adminService } from "@/services/admin.service";
import { Loader } from "@/components/ui/Loader";

const LOGIN_PATH = "/admin/login";

function isLoginPath(pathname: string | null): boolean {
  return (pathname ?? "").replace(/\/+$/, "") === LOGIN_PATH;
}

/**
 * Client-side replacement for the old `middleware.ts` admin check, which
 * `output: "export"` cannot run. The admin session cookie is httpOnly, so the
 * only trustworthy check is asking the API: `GET /api/admin/session` runs the
 * existing `authenticateAdmin` middleware (same JWT verification).
 *
 * This is defence-in-depth for the UI only. Every admin API route keeps its own
 * `authenticateAdmin` guard and remains the security authority.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const onLogin = isLoginPath(pathname);
  const [status, setStatus] = useState<"checking" | "ok">(onLogin ? "ok" : "checking");

  useEffect(() => {
    if (onLogin) {
      setStatus("ok");
      return;
    }

    let cancelled = false;
    setStatus("checking");

    adminService
      .getSession()
      .then(() => {
        if (!cancelled) setStatus("ok");
      })
      .catch(() => {
        if (cancelled) return;
        router.replace(LOGIN_PATH);
      });

    return () => {
      cancelled = true;
    };
  }, [onLogin, pathname, router]);

  if (onLogin) return <>{children}</>;
  if (status !== "ok") return <Loader fullScreen text="Checking admin session" />;

  return <>{children}</>;
}
