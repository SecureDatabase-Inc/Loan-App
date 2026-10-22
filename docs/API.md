# API Documentation

Base: `http://localhost:5000/api`

## Auth
- `POST /auth/register` - `{ fullName, phone, email?, password }`
- `POST /auth/login` - `{ phone, password }`
- `POST /auth/logout`
- `GET /auth/profile` - Auth required

## User
- `PUT /users/profile` - `{ fullName?, phone?, email? }` - Auth required. Validates Ghana phone + email format; returns 409 if phone/email already taken.
- `PUT /users/password` - `{ currentPassword, newPassword }` - Auth required. Verifies current password, re-hashes new one.
- `DELETE /users/account` - `{ password }` - Auth required. Soft-deletes the account (isActive=false). Blocked with 409 if an active/approved/pending loan exists.
- `GET /users/verifications` - Auth required. Returns the borrower's active verification submissions (type, status, adminNote, timestamps). Document image URLs are never returned.

## Notifications
- `GET /notifications/me` - Auth required. Latest 50 notifications.
- `GET /notifications/me/unread-count` - Auth required. `{ count }`.
- `PUT /notifications/:id/read` - Auth required.
- `PUT /notifications/read-all` - Auth required.
- Socket: server emits `notification:new` into `user:<id>` rooms on welcome, loan submitted/approved/rejected/overdue, repayment reminder, loan repaid and verification approved/rejected. Client can emit `notification:markRead` / `notification:markAllRead`.

## Loans
- `POST /loans/apply` - `{ amount, purpose? }` - Auth required
- `GET /loans` - Auth required
- `GET /loans/current` - Auth required
- `GET /loans/:id` - Auth required. Returns the loan with repayments plus `totalDue`, `daysRemaining`, `level` (name/maxAmount/repaymentDays) and `nextLevel` (or null).

## Payments
- `POST /payments/initiate` - `{ loanId, amount, method? }` - Auth required. `amount` must match the loan's stored due amount (principal + interest) exactly; otherwise returns 400. Returns `{ repayment, checkout }` where `checkout` contains `{ provider, paymentUrl?, instructions?, verified, confirmed }`. With the mock provider the payment is auto-confirmed; with a live gateway a `paymentUrl` is returned for the client to open.
- `GET /payments/methods` - Returns `{ gateway, live, methods }` describing the active provider and supported mobile money details.
- `POST /payments/webhook` - Gateway webhook endpooint. Body must be raw JSON (route uses `express.raw`). Signature verified against the active provider (`verif-hash` for Flutterwave); idempotent; marks the matching repayment paid.
- `GET /payments` - Auth required
- `GET /payments/:loanId` - Auth required

## Uploads
- `POST /uploads/verify` - Multipart `image` + `type` (`selfie` | `ghana_card_front` | `ghana_card_back`) - Auth required.
  - Accepts JPEG, PNG, or WebP only (magic-byte checked), max 5 MB, one file.
  - Per-user rate limit: `UPLOAD_LIMIT_MAX` per 15 minutes (default 10) → `429`.
  - `400` for a missing/invalid file or unsupported `type`; `409` if that document type is already pending review; `503` if document storage is disabled/misconfigured.
  - `201` returns `{ id, type, status, submittedAt }` only after the row is persisted. No document URL is returned.
  - Submitting a replacement for an `approved`/`rejected` document supersedes the previous submission.
- `GET /users/verifications` returns only the active submission per document type; no `imageUrl`.

## Admin
- `POST /admin/login`
- `GET /admin/dashboard`
- `GET /admin/users`
- `PUT /admin/users/:id/level`
- `GET /admin/loans`
- `PUT /admin/loans/:id/approve`
- `PUT /admin/loans/:id/reject`
- `GET /admin/verifications` - Active submissions only. Returns metadata and `hasDocument`/`legacyDocument`; never a document URL.
- `GET /admin/verifications/:id/document` - Auth required. Returns `{ url, expiresInSeconds, legacy }` with a short-lived provider URL (`expiresInSeconds: 300`), `Cache-Control: no-store`.
- `GET /admin/verifications/:id/history` - Auth required. Returns the `VerificationEvent` audit trail (actor, action, status transition, note, timestamp).
- `PUT /admin/verifications/:id/approve` - Only from `pending`; `409` otherwise.
- `PUT /admin/verifications/:id/reject` - `{ adminNote? }`, only from `pending`; `409` otherwise. Recomputed `user.verified` may flip to `false`.
- `GET /admin/repayments`
- `PUT /admin/repayments/:id/clear`
