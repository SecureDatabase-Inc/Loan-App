/**
 * Reads a `next` destination from the current URL for post-login redirects.
 * Only same-origin relative paths are accepted (blocks open redirects such as
 * `//evil.example` or `https://evil.example`).
 */
export function getSafeNextPath(fallback = "/dashboard"): string {
  if (typeof window === "undefined") return fallback;

  const next = new URLSearchParams(window.location.search).get("next");
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;

  return next;
}
