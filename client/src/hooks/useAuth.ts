"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";

/**
 * Single in-flight profile hydration shared by every component that calls
 * useAuth() (boot splash, welcome screen, protected layout). Without this,
 * mounting several consumers at once fired duplicate /auth/profile requests.
 */
let hydration: Promise<void> | null = null;

export function useAuth() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!useAuthStore.getState().isLoading) return;

    if (!hydration) {
      hydration = authService
        .getProfile()
        .then((profile) => useAuthStore.getState().setUser(profile))
        .catch(() => useAuthStore.getState().logout())
        .finally(() => {
          useAuthStore.getState().setLoading(false);
          hydration = null;
        });
    }
  }, []);

  return { user, isAuthenticated, isLoading };
}
