"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";
import { secureStorage } from "@/utils/secureStorage";

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
      hydration = (async () => {
        // Native: restore the Keystore-backed token before asking for the
        // profile so the first request is already authenticated. Web: resolves
        // to null and the httpOnly cookie is used instead.
        const storedToken = await secureStorage.getToken();
        if (storedToken) useAuthStore.getState().setToken(storedToken);
        return authService.getProfile();
      })()
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
