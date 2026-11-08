import { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the BoA Micro Finance borrower app.
 *
 * `webDir` points at the Next.js static export (`npm run build`).
 * `server.cleartext` is intentionally false: release builds must use HTTPS.
 * Debug-only cleartext is configured per-build via `android/app/src/debug`.
 */
const config: CapacitorConfig = {
  appId: "com.boamicrofinance.loanapp",
  appName: "BoA Micro Finance",
  webDir: "out",
  server: {
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
