import { afterEach, describe, expect, it } from "vitest";
import { buildAllowedOrigins, normalizeOrigin } from "../../src/config/origins";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("normalizeOrigin", () => {
  it("normalises http(s) origins", () => {
    expect(normalizeOrigin("https://app.example.com/path")).toBe("https://app.example.com");
  });

  it("preserves the Capacitor non-special scheme", () => {
    expect(normalizeOrigin("capacitor://localhost")).toBe("capacitor://localhost");
  });

  it("returns null for malformed values", () => {
    expect(normalizeOrigin("not a url")).toBeNull();
  });
});

describe("buildAllowedOrigins", () => {
  it("always includes the Capacitor WebView origins", () => {
    const origins = buildAllowedOrigins();
    expect(origins.has("https://localhost")).toBe(true);
    expect(origins.has("capacitor://localhost")).toBe(true);
  });

  it("includes the configured CLIENT_URL", () => {
    process.env.CLIENT_URL = "https://portal.example.com";
    expect(buildAllowedOrigins().has("https://portal.example.com")).toBe(true);
  });

  it("adds comma-separated ALLOWED_ORIGINS entries", () => {
    process.env.ALLOWED_ORIGINS = "http://192.168.1.20:3000, https://staging.example.com";
    const origins = buildAllowedOrigins();
    expect(origins.has("http://192.168.1.20:3000")).toBe(true);
    expect(origins.has("https://staging.example.com")).toBe(true);
  });

  it("never contains a wildcard", () => {
    process.env.ALLOWED_ORIGINS = "*";
    expect(buildAllowedOrigins().has("*")).toBe(false);
  });
});
