"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SplashScreen } from "@/components/brand/SplashScreen";

const MIN_SPLASH_MS = 600;
const MAX_SPLASH_MS = 3000;
const FADE_MS = 300;

/**
 * Holds the branded splash until the session has been resolved (or a hard
 * timeout is hit, so a slow API can never trap the user on the splash).
 */
export function AppBoot({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const min = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    const max = setTimeout(() => setTimedOut(true), MAX_SPLASH_MS);
    return () => {
      clearTimeout(min);
      clearTimeout(max);
    };
  }, []);

  const ready = minElapsed && (!isLoading || timedOut);

  useEffect(() => {
    if (!ready) return;
    const fade = setTimeout(() => setHidden(true), FADE_MS);
    return () => clearTimeout(fade);
  }, [ready]);

  return (
    <>
      {children}
      {!hidden && <SplashScreen fading={ready} />}
    </>
  );
}
