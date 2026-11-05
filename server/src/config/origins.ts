/**
 * Single allowlist shared by CORS and the same-origin CSRF guard.
 *
 * - `CLIENT_URL` — the deployed web portal origin.
 * - `ALLOWED_ORIGINS` — optional comma-separated extra origins (e.g. a LAN
 *   address used while developing against a physical device).
 * - Capacitor WebView origins — the packaged app's own origin. `https://localhost`
 *   is used with the default `androidScheme: "https"`; `capacitor://localhost`
 *   is the iOS scheme.
 *
 * Never use a wildcard: credentialed requests must echo a single explicit
 * origin.
 */
const CAPACITOR_ORIGINS = ["https://localhost", "capacitor://localhost"];

/** Normalises an origin, tolerating non-special schemes such as `capacitor://`. */
export function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.origin && url.origin !== "null") return url.origin;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

function splitList(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>();

  const clientUrl =
    process.env.CLIENT_URL?.trim() ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");

  for (const candidate of [
    clientUrl,
    ...CAPACITOR_ORIGINS,
    ...splitList(process.env.ALLOWED_ORIGINS),
  ]) {
    if (!candidate) continue;
    const normalized = normalizeOrigin(candidate);
    if (normalized) origins.add(normalized);
  }

  return origins;
}
