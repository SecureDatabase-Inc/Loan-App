# Database Schema

Source of truth: `server/prisma/schema.prisma`

## Models

### User
- id (String, cuid, PK)
- fullName (String)
- phone (String, unique)
- email (String?, nullable)
- password (String, hashed with bcrypt)
- avatarUrl (String?)
- verified (Boolean, default: false)
- isActive (Boolean, default: true)
- loanLevel (Int, default: 1)
- createdAt, updatedAt (timestamps)

Relations: loans, repayments, verifications, notifications

### Loan
- id (String, cuid, PK)
- userId (FK -> User)
- amount (Float)
- interestRate (Float, default: 0)
- status (enum: pending | approved | active | repaid | overdue | rejected | expired)
- purpose (String?)
- dueDate (DateTime?)
- approvedAt (DateTime?)
- approvedBy (String?)
- repaidAt (DateTime?)
- createdAt, updatedAt (timestamps)

Relations: user, repayments

### Repayment
- id (String, cuid, PK)
- loanId (FK -> Loan)
- userId (FK -> User)
- amount (Float)
- dueDate (DateTime)
- paidAt (DateTime?)
- status (enum: pending | paid | overdue)
- method (String?)
- reference (String?)
- clearedBy (String?)
- clearedAt (DateTime?)
- createdAt, updatedAt (timestamps)

Relations: loan, user

### Verification
- id (String, cuid, PK)
- userId (FK -> User, onDelete Cascade)
- type (enum: selfie | ghana_card_front | ghana_card_back)
- status (enum: pending | approved | rejected)
- storageProvider (String?, provider that holds the asset)
- storageAssetId (String?, provider-owned identifier)
- mimeType (String?)
- sizeBytes (Int?)
- imageUrl (String?, legacy rows only; null for new submissions)
- active (Boolean, default true; false once superseded)
- adminNote (String?)
- reviewedBy (String?, admin id)
- submittedAt, reviewedAt (timestamps)
- createdAt, updatedAt (timestamps)

Indexes: `(userId, type)`, `(active, status, submittedAt)`.
A partial unique index `Verification_active_user_type_key` enforces at most one
active submission per `(userId, type)` where `active = true`. It is created in
the migration SQL because Prisma cannot express partial indexes.

Relations: user, events

### VerificationEvent
- id (String, cuid, PK)
- verificationId (FK -> Verification, onDelete Cascade)
- actorType (String: `user` | `admin`)
- actorId (String?)
- action (String: `submitted` | `superseded` | `approved` | `rejected`)
- fromStatus, toStatus (enum, nullable)
- note (String?)
- createdAt (timestamp)

Index: `(verificationId, createdAt)`.

Relations: verification

### Admin
- id (String, cuid, PK)
- email (String, unique)
- password (String, hashed with bcrypt)
- name (String)
- role (String, default: "admin")
- isActive (Boolean, default: true)
- createdAt, updatedAt (timestamps)

### Notification
- id (String, cuid, PK)
- userId (FK -> User)
- title (String)
- message (String)
- type (String, default: "info")
- read (Boolean, default: false)
- createdAt (timestamp)

Relations: user

## Migrations

Migrations are committed under `server/prisma/migrations/`:

- `20260912000000_init` — initial schema.
- `20261022090000_kyc_storage_hardening` — adds the storage/asset columns,
  `VerificationEvent`, indexes, the active-submission unique index, and makes
  `imageUrl` nullable. It marks historical duplicate `(userId, type)` rows
  inactive without deleting them.

Apply in CI or on deploy with:

```bash
cd server
npx prisma migrate deploy
```

For local schema iteration use `npx prisma migrate dev`. Seed with
`npx prisma db seed`.