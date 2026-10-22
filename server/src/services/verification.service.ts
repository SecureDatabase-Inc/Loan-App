import { Prisma, PrismaClient, Verification, VerificationStatus, VerificationType } from "@prisma/client";
import prisma from "../config/db";
import { getStorageProvider } from "./storage";
import { HttpError } from "../utils/HttpError";
import { logger } from "../utils/logger";
import { canReview, isFullyVerified } from "../utils/verification";
import { verificationTypeSchema } from "../utils/validators";

export interface UploadedDocument {
  buffer: Buffer;
  mimeType: string;
}

export interface DocumentViewUrl {
  url: string;
  expiresInSeconds: number | null;
  legacy: boolean;
}

export class VerificationService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async submit(userId: string, type: VerificationType, file: UploadedDocument): Promise<Verification> {
    const storage = getStorageProvider();
    if (!storage.enabled) {
      throw new HttpError(
        503,
        "Document storage is not configured. Contact support to enable identity verification.",
      );
    }

    const existing = await this.db.verification.findFirst({
      where: { userId, type, active: true },
    });

    if (existing && existing.status === VerificationStatus.pending) {
      throw new HttpError(409, "This document is already awaiting review.");
    }

    const asset = await storage.store({
      buffer: file.buffer,
      mimeType: file.mimeType,
      folder: `verifications/${type}`,
    });

    let created: Verification;

    try {
      created = await this.db.$transaction(async (tx) => {
        if (existing) {
          await tx.verification.update({ where: { id: existing.id }, data: { active: false } });
          await tx.verificationEvent.create({
            data: {
              verificationId: existing.id,
              actorType: "user",
              actorId: userId,
              action: "superseded",
              fromStatus: existing.status,
              toStatus: existing.status,
            },
          });
        }

        const verification = await tx.verification.create({
          data: {
            userId,
            type,
            active: true,
            status: VerificationStatus.pending,
            storageProvider: asset.provider,
            storageAssetId: asset.assetId,
            mimeType: asset.mimeType,
            sizeBytes: asset.sizeBytes,
          },
        });

        await tx.verificationEvent.create({
          data: {
            verificationId: verification.id,
            actorType: "user",
            actorId: userId,
            action: "submitted",
            toStatus: VerificationStatus.pending,
          },
        });

        await this.recomputeVerified(tx, userId);
        return verification;
      });
    } catch (error) {
      await storage.remove(asset.assetId).catch((cleanupError) => {
        logger.error("Failed to remove orphaned identity asset after database error", cleanupError);
      });
      throw error;
    }

    if (existing?.storageAssetId && existing.storageProvider === storage.name) {
      await storage.remove(existing.storageAssetId).catch((cleanupError) => {
        logger.error("Failed to remove superseded identity asset", cleanupError);
      });
    }

    return created;
  }

  async review(
    verificationId: string,
    adminId: string,
    decision: Extract<VerificationStatus, "approved" | "rejected">,
    note?: string,
  ): Promise<Verification> {
    const current = await this.db.verification.findUnique({ where: { id: verificationId } });
    if (!current) throw new HttpError(404, "Verification not found.");
    if (!current.active) throw new HttpError(409, "This submission was replaced by a newer one.");
    if (!canReview(current.status)) {
      throw new HttpError(409, `This document is already ${current.status}.`);
    }

    return this.db.$transaction(async (tx) => {
      const result = await tx.verification.updateMany({
        where: { id: verificationId, status: VerificationStatus.pending, active: true },
        data: {
          status: decision,
          adminNote: note ?? current.adminNote,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      if (result.count !== 1) {
        throw new HttpError(409, "This document has already been reviewed.");
      }

      await tx.verificationEvent.create({
        data: {
          verificationId,
          actorType: "admin",
          actorId: adminId,
          action: decision,
          fromStatus: current.status,
          toStatus: decision,
          note: note ?? null,
        },
      });

      const updated = await tx.verification.findUniqueOrThrow({ where: { id: verificationId } });
      await this.recomputeVerified(tx, updated.userId);
      return updated;
    });
  }

  async getDocumentViewUrl(verificationId: string): Promise<DocumentViewUrl> {
    const verification = await this.db.verification.findUnique({ where: { id: verificationId } });
    if (!verification) throw new HttpError(404, "Verification not found.");
    if (!verification.active) throw new HttpError(409, "This submission was replaced by a newer one.");

    if (verification.storageAssetId && verification.storageProvider) {
      const storage = getStorageProvider();
      if (storage.name !== verification.storageProvider) {
        throw new HttpError(
          503,
          "The configured document storage provider does not match this document.",
        );
      }
      const url = await storage.createViewUrl({
        assetId: verification.storageAssetId,
        mimeType: verification.mimeType || "image/jpeg",
      });
      return { url, expiresInSeconds: 300, legacy: false };
    }

    if (verification.imageUrl) {
      return { url: verification.imageUrl, expiresInSeconds: null, legacy: true };
    }

    throw new HttpError(404, "Document not available.");
  }

  async getHistory(verificationId: string) {
    return this.db.verificationEvent.findMany({
      where: { verificationId },
      orderBy: { createdAt: "asc" },
    });
  }

  private async recomputeVerified(tx: Prisma.TransactionClient, userId: string): Promise<void> {
    const documents = await tx.verification.findMany({
      where: { userId },
      select: { type: true, status: true, active: true },
    });

    await tx.user.update({
      where: { id: userId },
      data: { verified: isFullyVerified(documents) },
    });
  }
}

export function parseVerificationType(value: unknown): VerificationType {
  return verificationTypeSchema.parse(value) as VerificationType;
}
