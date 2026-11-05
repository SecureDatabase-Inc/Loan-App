import { describe, expect, it } from "vitest";
import { cookieOptions, clearCookieOptions, SESSION_TTL_DAYS, SESSION_MAX_AGE_MS } from "../../src/constants/session";
import { sameOriginGuard } from "../../src/middleware/security.middleware";
import { HttpError } from "../../src/utils/HttpError";

describe("session constants", () => {
  it("defaults to a 7-day httpOnly lax session cookie", () => {
    expect(SESSION_TTL_DAYS).toBe(7);
    expect(SESSION_MAX_AGE_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(cookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_MS,
    });
  });

  it("clear options mirror the set options minus maxAge", () => {
    expect(clearCookieOptions()).toMatchObject({ httpOnly: true, sameSite: "lax" });
    expect(clearCookieOptions().maxAge).toBeUndefined();
  });
});

describe("sameOriginGuard", () => {
  const run = (headers: Record<string, string | undefined>, method = "POST") =>
    sameOriginGuard(
      { method, headers } as any,
      {} as any,
      () => {}
    );

  it("allows allowlisted origin", () => {
    expect(() => run({ origin: "http://localhost:3000" })).not.toThrow();
  });

  it("allows the Capacitor https WebView origin", () => {
    expect(() => run({ origin: "https://localhost" })).not.toThrow();
  });

  it("allows the Capacitor custom-scheme origin", () => {
    expect(() => run({ origin: "capacitor://localhost" })).not.toThrow();
  });

  it("allows configured extra origins", () => {
    process.env.ALLOWED_ORIGINS = "https://staging.example.com";
    expect(() => run({ origin: "https://staging.example.com" })).not.toThrow();
  });

  it("allows origin-free requests (server-to-server, e.g. gateway webhook)", () => {
    expect(() => run({})).not.toThrow();
  });

  it("allows safe methods regardless of origin", () => {
    expect(() => run({ origin: "https://evil.example" }, "GET")).not.toThrow();
  });

  it("rejects cross-origin state changes with a 403", () => {
    try {
      run({ origin: "https://evil.example" });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(403);
    }
  });
});