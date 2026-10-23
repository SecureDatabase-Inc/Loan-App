# KYC Storage & Verification Reliability — Baseline

Captured before any changes on branch `feat/kyc-cloudinary-storage`
(based on `audit/full-production-investigation` @ `b110b5f`).

## Repository baseline

- Repository: `SecureDatabase-Inc/Loan-App` (public), default branch `main`.
- `gh` authenticated as `NANAOBENG1234` with `repo` + `workflow` scopes; viewer permission `ADMIN`.
- Milestones before this work: `MVP - Core borrower experience` (#1).
- Issues before this work: 18 (all closed). Pull requests: 0.
- Labels: GitHub defaults only. No issue/PR templates, no `CONTRIBUTING.md`, no `AGENTS.md`.
- Node v24.15.0 / npm 11.12.1 locally; CI targets Node 20.
- Dependencies installed with `npm ci` (lockfiles unchanged).

## Verified quality gates (before changes)

| Gate | Command | Result |
| --- | --- | --- |
| Server unit tests | `npm test` (server) | 6 files, 36 tests, all pass |
| Server typecheck | `npm run build` (server) | pass |
| Client production build | `npm run build` (client) | pass, 22 routes |
| Prisma schema | `npx prisma validate` | pass |

Pre-existing environment gaps recorded, not fixed:

- `client/package.json` defines a `lint` script but the repository has **no ESLint configuration**; `npx next lint` prompts interactively. CI does not run lint.
- `npm audit --omit=dev` (server) reports 7 findings (5 moderate, 1 high, 1 critical `proxy-addr` via `express`). `client` reports 11. Upgrading is out of scope for this milestone.

## Baseline upload implementation

Request path:

1. `client/src/components/camera/CameraCapture.tsx` + `client/src/hooks/useCamera.ts` capture a frame to a data URL.
2. `client/src/app/(borrower)/dashboard/verification/selfie/page.tsx` and
   `.../ghana-card/page.tsx` convert it to a `Blob` and `POST /api/uploads/verify`.
3. `server/src/routes/upload.routes.ts` → `authenticate` → `upload.single("image")`.
4. `server/src/middleware/upload.middleware.ts`:
   - `multer.diskStorage` into `server/uploads`;
   - filename built from `path.extname(file.originalname)` (attacker-controlled);
   - MIME allowlist on `file.mimetype` only;
   - 5 MB limit.
5. `server/src/controllers/upload.controller.ts`:
   - `type` from `req.body.type`, checked against a hard-coded array;
   - calls `UploadService.uploadToCloudinary(file.path, ...)`;
   - then `prisma.verification.create({ imageUrl })`.
6. `server/src/services/upload.service.ts`:
   - `cloudinary.uploader.upload(...)`, transform 800×800 limit, default (public) delivery;
   - `fs.unlink(filePath, () => {})` only after a successful upload;
   - returns `result.secure_url`.
7. `server/src/config/cloudinary.ts` reads the three `CLOUDINARY_*` variables with no validation.
8. Admin UI `client/src/app/admin/verifications/page.tsx` renders `<img src={v.imageUrl}>`.

## Baseline data model (`server/prisma/schema.prisma`)

`Verification`: `id`, `userId`, `type`, `imageUrl String` (required), `status`,
`adminNote`, `reviewedBy`, `submittedAt`, `reviewedAt`, `createdAt`, `updatedAt`.
No storage provider/asset identity, no `active` concept, no uniqueness per
`(userId, type)`, indexes only on primary key. `reviewedBy` has no FK.

`server/prisma/migrations/20260912000000_init/migration.sql` **is** committed
(`Verification_userId_fkey` exists); `docs/DATABASE.md` incorrectly claimed no
migrations were committed.

## Baseline defects confirmed

- Public delivery URLs for identity documents; the URL is persisted and rendered directly.
- Temp files leak on any failure before the success-path `fs.unlink`.
- Cloudinary assets are orphaned when the DB write fails after upload.
- No idempotency or duplicate handling; unlimited repeat uploads per `(user, type)`.
- `approveVerification` sets `user.verified = true` after any single approval;
  `rejectVerification` never recomputes it.
- No status-transition checks and no review audit trail.
- Weekly cleanup deleted expired rows without removing their stored assets.
- No magic-byte validation; declared `Content-Type` was trusted.
- No per-user upload rate limit beyond the global API limiter.

## Constraints for this milestone

- Cloudinary credentials were not available. Real Cloudinary uploads and signed
  URLs could therefore **not** be executed; only `disabled` and `test` modes
  are exercised by automated tests and the HTTP smoke test.
- No destructive database operations against any shared or production database.
- No changes to loan, repayment, interest, or payment logic.
