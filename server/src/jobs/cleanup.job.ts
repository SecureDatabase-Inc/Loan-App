import cron from "node-cron";
import prisma from "../config/db";
import { getStorageProvider } from "../services/storage";
import { logger } from "../utils/logger";

export function startCleanupJob() {
  cron.schedule("0 3 * * 0", async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const expiredVerifications = await prisma.verification.findMany({
        where: {
          status: "pending",
          createdAt: { lt: thirtyDaysAgo },
        },
        select: { id: true, storageProvider: true, storageAssetId: true },
      });

      if (expiredVerifications.length === 0) return;

      const storage = getStorageProvider();

      for (const verification of expiredVerifications) {
        if (verification.storageAssetId && verification.storageProvider === storage.name) {
          await storage.remove(verification.storageAssetId).catch((error) => {
            logger.error(`Failed to remove expired identity asset ${verification.id}`, error);
          });
        }
      }

      const result = await prisma.verification.deleteMany({
        where: { id: { in: expiredVerifications.map((verification) => verification.id) } },
      });

      logger.info(`Cleaned up ${result.count} expired verifications`);
    } catch (error) {
      logger.error("Cleanup job failed:", error);
    }
  });
}
