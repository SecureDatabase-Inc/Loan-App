"use client";

import { useEffect } from "react";
import { isNativeApp } from "@/utils/platform";

export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    if (isNativeApp()) {
      // The Capacitor shell ships its own bundled assets. Never let a service
      // worker cache and serve stale bundles inside the native app; unregister
      // anything a previous install may have left behind.
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
        .catch(() => {});
      return;
    }

    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
