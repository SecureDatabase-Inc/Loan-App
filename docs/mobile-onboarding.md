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

## Phase 4 pending (requires approval)

1. Static export: `next.config.js` `output: "export"`; remove `middleware.ts`
   (already superseded by `RequireAuth`); convert `dashboard/loans/[id]` to a
   query-param route.
2. Native auth: Bearer-token path (server already supports `Authorization:
   Bearer`); secure storage backed by Android Keystore (NOT plain Capacitor
   Preferences); keep tokens out of logs/URLs/source control.
3. CORS / `sameOriginGuard` allowlist must include Capacitor origins
   (`https://localhost`, `capacitor://localhost`) for native builds.
4. Disable the PWA service worker inside the native shell.

## Phase 5 pending

Capacitor + Android project, app icon/adaptive icon, native splash, signing
config (never commit keys/secrets/`.env`), debug APK, release APK config, AAB
instructions. Toolchain (JDK 17–21, Android SDK/Studio) install requires
approval.
