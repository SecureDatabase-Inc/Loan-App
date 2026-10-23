-- KYC storage hardening: additive columns, audit table, indexes, and a
-- non-destructive guarantee that only one submission per (user, document type)
-- is active at a time.

-- AlterTable
ALTER TABLE "Verification" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "sizeBytes" INTEGER,
ADD COLUMN     "storageAssetId" TEXT,
ADD COLUMN     "storageProvider" TEXT,
ALTER COLUMN "imageUrl" DROP NOT NULL;

-- Deactivate historical duplicate submissions, keeping the most recent row per
-- (userId, type) active. No rows are deleted.
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (
    PARTITION BY "userId", "type"
    ORDER BY "submittedAt" DESC, "id" DESC
  ) AS "rn"
  FROM "Verification"
)
UPDATE "Verification" AS v
SET "active" = false
FROM ranked
WHERE v."id" = ranked."id" AND ranked."rn" > 1;

-- CreateTable
CREATE TABLE "VerificationEvent" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "fromStatus" "VerificationStatus",
    "toStatus" "VerificationStatus",
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationEvent_verificationId_createdAt_idx" ON "VerificationEvent"("verificationId", "createdAt");

-- CreateIndex
CREATE INDEX "Verification_userId_type_idx" ON "Verification"("userId", "type");

-- CreateIndex
CREATE INDEX "Verification_active_status_submittedAt_idx" ON "Verification"("active", "status", "submittedAt");

-- CreateIndex (partial unique index, not expressible in the Prisma schema)
CREATE UNIQUE INDEX "Verification_active_user_type_key" ON "Verification"("userId", "type") WHERE "active" = true;

-- AddForeignKey
ALTER TABLE "VerificationEvent" ADD CONSTRAINT "VerificationEvent_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "Verification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
