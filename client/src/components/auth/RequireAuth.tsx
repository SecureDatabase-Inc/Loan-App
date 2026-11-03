"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader } from "@/components/ui/Loader";

/**
 * Client-side guard for borrower-only routes. It is defence-in-depth for the
 * UI: the API remains the security authority and rejects unauthenticated
 * requests regardless of what the client renders.
 *
 * While the session is being resolved it renders a loader instead of the
 * page, so protected content never flashes for a guest.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`/login${next}`);
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return <Loader fullScreen text="Checking your session" />;
  }

  return <>{children}</>;
}
