import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/HttpError";
import { buildAllowedOrigins, normalizeOrigin } from "../config/origins";

/**
 * CSRF defense on top of SameSite=Lax: state-changing requests must either
 * carry no Origin/Referer (server-to-server integrations such as the
 * payment webhook) or come from an allowlisted origin.
 *
 * The allowlist is shared with CORS (`config/origins.ts`) and includes the
 * packaged Capacitor WebView origins so the native app can call the API
 * without loosening the web portal's rules. No wildcard is ever allowed.
 */
export function sameOriginGuard(req: Request, _res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const headerValue = req.headers.origin || req.headers.referer;
  if (!headerValue) return next();

  const origin = normalizeOrigin(headerValue);
  if (!origin) return next();

  if (!buildAllowedOrigins().has(origin)) {
    throw new HttpError(403, `Cross-origin request rejected from ${origin}`);
  }

  next();
}
