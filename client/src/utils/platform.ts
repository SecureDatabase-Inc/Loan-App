import { Capacitor } from "@capacitor/core";

/** True only inside the packaged native shell (Android/iOS), false on the web. */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
