/**
 * End-to-end checks for the static export + client route guards.
 *
 * Runs against the real exported `out/` bundle in a headless Chrome/Edge
 * (whatever is installed) and a stub API, so it needs no database, no real
 * credentials and no production data.
 *
 *   npm run test:e2e
 */
import { spawnSync } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outDir = path.join(root, "out");

const API_PORT = 5099;
const WEB_PORT = 3200;
const WEB_ORIGIN = `http://127.0.0.1:${WEB_PORT}`;
const BASE = WEB_ORIGIN;
const USER_TOKEN = "test-token";
const ADMIN_TOKEN = "admin-token";

const USER = {
  id: "u1",
  fullName: "Test Borrower",
  phone: "0240000000",
  email: null,
  verified: true,
  loanLevel: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
  activeLoan: null,
};

const ADMIN = { id: "a1", email: "admin@example.com", role: "admin" };

/* ------------------------------------------------------------------ */
/* Stub API                                                            */
/* ------------------------------------------------------------------ */
const requests = [];

function corsHeaders(req) {
  return {
    "Access-Control-Allow-Origin": req.headers.origin || WEB_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };
}

function cookieValue(req, name) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

function json(req, res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    ...corsHeaders(req),
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

const apiServer = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(req));
    return res.end();
  }

  requests.push({
    method: req.method,
    url: req.url,
    authorization: req.headers.authorization || null,
    cookie: req.headers.cookie || null,
  });

  const url = req.url.split("?")[0];

  if (url === "/api/auth/login" || url === "/api/auth/register") {
    return json(req, res, 200, { user: USER, token: USER_TOKEN }, {
      "Set-Cookie": `token=${USER_TOKEN}; Path=/; HttpOnly; SameSite=Lax`,
    });
  }
  if (url === "/api/auth/logout") {
    return json(req, res, 200, { message: "Logged out" }, {
      "Set-Cookie": "token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
    });
  }
  if (url === "/api/auth/profile") {
    const bearer = req.headers.authorization === `Bearer ${USER_TOKEN}`;
    const cookie = cookieValue(req, "token") === USER_TOKEN;
    return bearer || cookie
      ? json(req, res, 200, USER)
      : json(req, res, 401, { message: "Authentication required" });
  }
  if (url === "/api/loans/current") {
    return json(req, res, 200, null);
  }
  if (url === "/api/loans") {
    return json(req, res, 200, []);
  }
  if (url === "/api/users/verifications") {
    return json(req, res, 200, []);
  }
  if (url === "/api/notifications") {
    return json(req, res, 200, []);
  }
  if (url === "/api/admin/login") {
    return json(req, res, 200, { admin: ADMIN, token: ADMIN_TOKEN }, {
      "Set-Cookie": `admin_token=${ADMIN_TOKEN}; Path=/; HttpOnly; SameSite=Lax`,
    });
  }
  if (url === "/api/admin/session") {
    return cookieValue(req, "admin_token") === ADMIN_TOKEN
      ? json(req, res, 200, { admin: ADMIN })
      : json(req, res, 401, { message: "Admin authentication required" });
  }
  if (url === "/api/admin/dashboard") {
    return json(req, res, 200, {
      totalUsers: 0, totalLoans: 0, activeLoans: 0, pendingLoans: 0,
      repaidLoans: 0, totalVerified: 0, totalLoanAmount: 0,
    });
  }

  return json(req, res, 404, { message: "Not found" });
});

/* ------------------------------------------------------------------ */
/* Static server for the exported `out/` bundle                        */
/* ------------------------------------------------------------------ */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const candidates = [];
  if (clean.endsWith("/")) candidates.push(path.join(outDir, clean, "index.html"));
  else {
    candidates.push(path.join(outDir, clean));
    candidates.push(path.join(outDir, clean, "index.html"));
    candidates.push(path.join(outDir, `${clean}.html`));
  }
  return candidates.find((p) => p.startsWith(outDir) && fs.existsSync(p) && fs.statSync(p).isFile());
}

const webServer = http.createServer((req, res) => {
  const file = resolveFile(req.url || "/");
  if (!file) {
    const notFound = path.join(outDir, "404.html");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : "Not found");
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  res.end(fs.readFileSync(file));
});

/* ------------------------------------------------------------------ */
/* Harness                                                             */
/* ------------------------------------------------------------------ */
function findBrowser() {
  const candidates = [
    process.env.BROWSER_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ].filter(Boolean);
  return candidates.find((c) => fs.existsSync(c));
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
}

const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
    console.log(`FAIL  ${name}\n      ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForUrl(page, regex, timeout = 20000) {
  await page.waitForFunction(
    (source) => new RegExp(source).test(window.location.href),
    regex.source,
    { timeout }
  );
}

async function waitForSplash(page) {
  await page
    .locator('[aria-label="BoA Micro Finance is starting"]')
    .waitFor({ state: "detached", timeout: 15000 })
    .catch(() => {});
}

async function waitUntil(predicate, timeout = 15000, interval = 100) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return false;
}

async function main() {
  if (!fs.existsSync(path.join(outDir, "index.html"))) {
    throw new Error("Missing client/out. Run `npm run build` first.");
  }

  const browserPath = findBrowser();
  if (!browserPath) throw new Error("No Chrome/Edge found. Set BROWSER_PATH.");

  await listen(apiServer, API_PORT);
  await listen(webServer, WEB_PORT);

  const browser = await chromium.launch({ executablePath: browserPath, headless: true });
  const page = await browser.newPage();

  await check("welcome screen renders all three options", async () => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await waitForSplash(page);
    await page.getByRole("link", { name: "Create Account" }).waitFor({ timeout: 15000 });
    await page.getByRole("link", { name: "Log In" }).waitFor();
    await page.getByRole("link", { name: "Continue as Guest" }).waitFor();
  });

  await check("guest can reach the marketing page at /home", async () => {
    await page.getByRole("link", { name: "Continue as Guest" }).click();
    await waitForUrl(page, /\/home\/?$/);
    const heading = await page.locator("h1").first().innerText();
    assert(/Fast\s*&\s*Trusted/i.test(heading), `unexpected heading: ${heading}`);
  });

  await check("guest is redirected away from /dashboard", async () => {
    await page.goto(`${BASE}/dashboard/`, { waitUntil: "domcontentloaded" });
    await waitForUrl(page, /\/login\/?\?next=/);
    assert(!/\/dashboard/.test(page.url()), "guest stayed on a dashboard URL");
  });

  await check("guest is redirected away from the loan detail deep link", async () => {
    await page.goto(`${BASE}/dashboard/loans/detail/?id=abc`, { waitUntil: "domcontentloaded" });
    await waitForUrl(page, /\/login\/?\?next=/);
  });

  await check("borrower login reaches dashboard and sends a Bearer token", async () => {
    await page.goto(`${BASE}/login/`, { waitUntil: "domcontentloaded" });
    await page.locator('input[type="tel"]').waitFor({ timeout: 15000 });
    await page.locator('input[type="tel"]').fill("0240000000");
    await page.locator('input[type="password"]').fill("Password1!");
    await page.getByRole("button", { name: "Sign In" }).click();
    await waitForUrl(page, /\/dashboard\/?/, 20000);
    const gotBearer = await waitUntil(
      () => requests.some((r) => r.authorization === `Bearer ${USER_TOKEN}`),
      15000
    );
    assert(gotBearer, "no request carried Authorization: Bearer");
  });

  await check("session survives reload via the httpOnly cookie", async () => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForSplash(page);
    await waitForUrl(page, /\/dashboard\/?/, 20000);
    const cookieOnlyProfile = await waitUntil(
      () => requests.some((r) => r.url.startsWith("/api/auth/profile") && r.cookie?.includes(`token=${USER_TOKEN}`)),
      15000
    );
    assert(cookieOnlyProfile, "profile was not requested with the session cookie");
  });

  await check("logout clears the session and protects the dashboard again", async () => {
    await page.goto(`${BASE}/dashboard/settings/`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Sign Out" }).waitFor({ timeout: 20000 });
    await page.getByRole("button", { name: "Sign Out" }).click();
    await waitForUrl(page, /\/$/, 20000);
    await page.goto(`${BASE}/dashboard/`, { waitUntil: "domcontentloaded" });
    await waitForUrl(page, /\/login\/?\?next=/, 20000);
  });

  await check("admin routes redirect to admin login without a session", async () => {
    await page.goto(`${BASE}/admin/dashboard/`, { waitUntil: "domcontentloaded" });
    await waitForUrl(page, /\/admin\/login\/?/);
  });

  await check("admin login restores access to the admin dashboard", async () => {
    await page.locator('input[type="email"]').waitFor({ timeout: 20000 });
    await page.locator('input[type="email"]').fill("admin@example.com");
    await page.locator('input[type="password"]').fill("Password1!");
    await page.getByRole("button", { name: "Sign In" }).click();
    await waitForUrl(page, /\/admin\/dashboard\/?/, 20000);
  });

  await check("service worker is never registered in the native shell", async () => {
    const nativePage = await browser.newPage();
    await nativePage.addInitScript(() => {
      window.androidBridge = {};
    });
    await nativePage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await nativePage.waitForTimeout(3000);
    const count = await nativePage.evaluate(() =>
      navigator.serviceWorker ? navigator.serviceWorker.getRegistrations().then((r) => r.length) : 0
    );
    assert(count === 0, `expected 0 service workers, found ${count}`);
    await nativePage.close();
  });

  await browser.close();
  apiServer.close();
  webServer.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) process.exitCode = 1;
}

async function runBuild() {
  const env = {
    ...process.env,
    NEXT_PUBLIC_API_URL: `http://127.0.0.1:${API_PORT}/api`,
    NEXT_PUBLIC_SOCKET_URL: `http://127.0.0.1:${API_PORT}`,
  };
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const build = spawnSync(process.execPath, [nextBin, "build"], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (build.status !== 0) throw new Error("next build failed");
}

try {
  await runBuild();
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
