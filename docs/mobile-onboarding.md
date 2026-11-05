# Mobile onboarding, splash & Android packaging

Status: Phase 1–3 implemented on branch `feat/mobile-onboarding-splash`. Phase 4–5
(Capacitor, Android) pending explicit approval for security-sensitive changes.

## Routes

- `/` — welcome screen (Create Account / Log In / Continue as Guest). Authenticated
  users are redirected to `/dashboard`.
- `/home` — full-width marketing page (preserved verbatim). Guest browsing entry.
- `/login`, `/register` — existing auth flows; honour `?next=` (same-origin only).
- `/dashboard/*` — protected by `RequireAuth` (client guard, defence in depth).

## Components

- `components/brand/Logo.tsx` — `BrandMark`, `BrandLockup` (inline SVG mirroring
  `public/favicon.svg`).
- `components/brand/SplashScreen.tsx` — branded in-app splash (logo, name, green).
- `components/AppBoot.tsx` — splash gate: 600 ms minimum, 3000 ms hard timeout,
  300 ms fade; waits for `useAuth` hydration.
- `components/auth/AuthPrompt.tsx` — modal prompting guests to sign in/register.
- `components/auth/RequireAuth.tsx` — client guard; renders loader while resolving.
- `hooks/useAuth.ts` — single in-flight hydration promise.
- `utils/redirect.ts` — `getSafeNextPath` (blocks open redirects).

## Guest rules

Guests browse public info only. Restricted actions (apply, dashboard, balances,
repayments, transactions, KYC, account info) show `AuthPrompt`. No guest
account, token, or dummy session is ever created; the API remains the security
authority.

## Phase 4 implemented

- Static export (`output: "export"`, `trailingSlash`, `images.unoptimized`) — `client/next.config.js`.
- Dynamic route converted: `/dashboard/loans/detail?id=...` (no `[id]`).
- `middleware.ts` removed; `RequireAuth` (borrower) and `RequireAdmin` (admin) client guards.
- Bearer token plumbing: `api` attaches `Authorization: Bearer` from the in-memory token; `auth.service` persists the issued token to Keystore-backed secure storage on native and never to localStorage/Preferences.
- CORS / `sameOriginGuard` use a shared allowlist (`server/src/config/origins.ts`) including `https://localhost` and `capacitor://localhost`, plus `ALLOWED_ORIGINS` for LAN dev. No wildcard.
- Service worker registration and stale-SW cleanup are disabled in the native shell (`isNativeApp()`).
- API URL resolution validates native builds (HTTPS + non-localhost for release; LAN HTTP allowed in debug).

## Phase 5 prepared (toolchain pending)

- Capacitor config (`client/capacitor.config.ts`), Android project (`client/android/`), app + adaptive icons and splash generated.
- Signing config reads `RELEASE_*` from env/gradle properties; debug manifest allows cleartext for LAN dev; release manifest defaults to `usesCleartextTraffic=false`.
- Build script `client/scripts/build-android.mjs` validates env, builds the export, syncs Capacitor, then stops with the toolchain proposal when the SDK is absent.
- E2E suite `client/e2e/run.mjs` (Playwright + stub API) covers guards, Bearer, cookie session, logout, admin, native SW exclusion — 10/10 passing.

## Toolchain installation proposal (awaiting approval)

- JDK 17 or 21 (Temurin 21 recommended; current machine has JDK 25 only).
- Android Studio (or command-line tools) + SDK Platform 35 + Build-Tools 35.x + Platform-Tools.
- ~6-8 GB total. Env: `JAVA_HOME`, `ANDROID_HOME`/`ANDROID_SDK_ROOT`, PATH entries.
- Existing JDK 25 remains; switch JAVA_HOME for Gradle. Node/npm unaffected.
- No JDK/SDK/Studio has been installed by this work. Run `npm run build:android:debug` once approved.
