# KYC Document Storage & Verification

This document describes how identity documents (selfie, Ghana Card front/back)
are captured, validated, stored, persisted, reviewed, and deleted.

## End-to-end flow

```
CameraCapture (client)            client/src/components/camera/CameraCapture.tsx
  -> Blob + FormData              client/src/app/(borrower)/dashboard/verification/*/page.tsx
  -> POST /api/uploads/verify     server/src/routes/upload.routes.ts
     -> authenticate              server/src/middleware/auth.middleware.ts
     -> uploadLimiter             server/src/middleware/uploadLimiter.ts
     -> multer (memory)           server/src/middleware/upload.middleware.ts
     -> validateImageUpload       server/src/middleware/upload.middleware.ts
     -> uploadVerificationImage   server/src/controllers/upload.controller.ts
        -> VerificationService    server/src/services/verification.service.ts
           -> StorageProvider     server/src/services/storage/*
           -> prisma transaction  server/prisma/schema.prisma
```

Admin review:

```
GET  /api/admin/verifications             list (no document URL)
GET  /api/admin/verifications/:id/document short-lived URL from the provider
GET  /api/admin/verifications/:id/history  VerificationEvent audit trail
PUT  /api/admin/verifications/:id/approve  pending -> approved
PUT  /api/admin/verifications/:id/reject   pending -> rejected
```

## Storage contract

`server/src/services/storage/types.ts` defines the provider boundary:

```ts
interface StorageProvider {
  readonly name: "disabled" | "test" | "cloudinary";
  readonly enabled: boolean;
  store(input: { buffer: Buffer; mimeType: string; folder: string }): Promise<StoredAsset>;
  createViewUrl(asset: { assetId: string; mimeType: string }): Promise<string>;
  remove(assetId: string): Promise<void>;
}
```

`StoredAsset` carries `provider`, provider-owned `assetId`, `mimeType`, and
`sizeBytes`. Business logic never imports a vendor SDK directly.

Implementations:

- `cloudinary.provider.ts` — private delivery, signed short-lived URLs.
- `test.provider.ts` — deterministic in-process storage, no network I/O. Used by the test suite.
- `disabled.provider.ts` — reports `enabled = false` and rejects uploads with HTTP 503.

## Provider modes

`KYC_STORAGE_PROVIDER` selects the provider:

| Value | Behaviour |
| --- | --- |
| `cloudinary` | Private Cloudinary delivery. Requires the three `CLOUDINARY_*` variables. |
| `test` | In-process provider for automated tests. Never writes to disk or network. |
| `disabled` | Uploads are rejected with `503`; no database row is created. |

Resolution order when `KYC_STORAGE_PROVIDER` is unset:

1. `NODE_ENV=test` → `test`.
2. All three `CLOUDINARY_*` values present and non-placeholder → `cloudinary`.
3. Otherwise → `disabled`.

An unrecognised value is a configuration error: the server starts with storage
disabled and logs the error; `assertStorageConfig()` refuses to start a
`cloudinary` deployment whose required variables are missing. Error messages
name variables only and never include values.

## Configuration

Server-only variables (see `server/.env.example`):

| Variable | Purpose |
| --- | --- |
| `KYC_STORAGE_PROVIDER` | `cloudinary`, `test`, or `disabled`. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret. **Never** sent to the client. |
| `UPLOAD_LIMIT_MAX` | Max verification uploads per user per 15 minutes (default 10). |

No `NEXT_PUBLIC_*` variable may contain any Cloudinary credential.

## Private delivery

Identity documents are uploaded to Cloudinary with `type: "authenticated"` and
`resource_type: "image"`. The database stores the provider `public_id` in
`Verification.storageAssetId`, not a public URL. The admin UI never receives a
permanent document URL:

- `GET /api/admin/verifications` omits `imageUrl` and returns only metadata plus `hasDocument`.
- `GET /api/admin/verifications/:id/document` requires an admin session,
  returns `Cache-Control: no-store`, and yields a signed URL with a 300-second
  lifetime (`private_download_url`).

The client renders documents through `client/src/components/admin/VerificationDocument.tsx`,
which fetches that endpoint per document.

## Upload validation

`server/src/middleware/upload.middleware.ts` + `server/src/utils/imageSignature.ts`:

- `multer.memoryStorage()` — no temp files are written, eliminating the
  previous temp-file leak class. The buffer is handed directly to the provider.
- One file per request, 5 MB maximum.
- Declared MIME must be `image/jpeg`, `image/png`, or `image/webp`.
- **Magic-byte detection is authoritative**: JPEG (`FF D8 FF`), PNG
  (`89 50 4E 47 0D 0A 1A 0A`), WebP (`RIFF....WEBP`). A valid signature
  normalises the stored MIME type; an invalid signature is rejected with `400`.
- `type` is validated with a Zod enum (`selfie`, `ghana_card_front`, `ghana_card_back`).
- `uploadLimiter` applies a per-user limit; multer failures map to `400`.

## Persistence and lifecycle

`Verification` now stores `storageProvider`, `storageAssetId`, `mimeType`,
`sizeBytes`, and `active`. `imageUrl` is nullable and retained only for legacy
rows.

Lifecycle:

- **Submit** (`pending`, `active = true`).
  - If an active submission of the same type is still `pending`, the request is
    rejected with `409` rather than silently replacing it.
  - Otherwise an existing `approved`/`rejected` row is marked `active = false`
    (superseded), its asset is removed, and a new `pending` row is created.
- **Approve / reject** only from `pending` and only while `active = true`;
  otherwise `409`.
- **Replacement** never deletes history rows. `VerificationEvent` records
  `submitted`, `superseded`, `approved`, and `rejected` with actor, note, and
  timestamps.

A partial unique index `Verification_active_user_type_key` guarantees at most
one active submission per `(userId, type)` at the database level. Older
duplicate legacy rows are marked inactive by the migration; no rows are deleted.

`user.verified` is recomputed **inside the same transaction** on every submit,
approval, and rejection. It is true only when all three document types have an
active `approved` row.

### Cross-system compensation

The flow touches storage and Postgres, so failures are compensated:

- Storage error → no database write; the request fails.
- Database error after a successful upload → `storage.remove(assetId)` is
  called and the error is returned; no row is created.
- Superseded row → its old asset is removed after the new transaction commits.

Compensating deletes are best-effort and log failures without document data.
They are scoped to the exact asset id; nothing is deleted by URL or prefix.

## Cleanup job

`server/src/jobs/cleanup.job.ts` removes pending verifications older than 30
days. Before deleting each row it asks the provider to remove the matching
asset when the row's provider matches the configured provider.

## Legacy data

Rows created before this change have `storageAssetId = null` and an `imageUrl`.
`GET /admin/verifications/:id/document` returns that legacy URL with
`legacy: true` and `expiresInSeconds: null`. New submissions never produce a
public URL. Legacy rows remain reviewable but should be re-captured or migrated
to private storage during a follow-up data migration.

## Threat notes

- **Credential exposure** — credentials are server-only; startup validation
  names missing variables but never prints values.
- **Content spoofing** — declared MIME is untrusted; magic bytes decide.
- **Resource exhaustion** — 5 MB cap, one file per request, per-user rate limit.
- **Public PII** — new documents use authenticated delivery plus short-lived
  signed URLs; the list endpoint does not expose document links.
- **Partial writes** — uploads and database writes are explicitly compensated.
- **Unauthorized review** — document access and transitions require an admin
  session; every decision is recorded with the acting admin id.

## Not verified in this environment

Cloudinary credentials were unavailable. The following are implemented but were
**not** executed against the real service:

- live upload with `type: "authenticated"`,
- `private_download_url` signature output,
- provider-side `destroy`.

Automated tests cover provider selection, configuration validation, the
`disabled`/`test` providers, validation, persistence, compensation, transitions,
and an in-process HTTP smoke test against an isolated Postgres instance.
