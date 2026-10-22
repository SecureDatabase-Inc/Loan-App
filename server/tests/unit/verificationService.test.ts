import { beforeEach, describe, expect, it } from "vitest";
import { PrismaClient, VerificationStatus, VerificationType } from "@prisma/client";
import { VerificationService } from "../../src/services/verification.service";
import { getStorageProvider, resetStorageProvider, TestStorageProvider } from "../../src/services/storage";

type Row = Record<string, any>;

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === "createdAt") {
      const lt = (value as { lt?: Date })?.lt;
      return lt ? new Date(row.createdAt) < lt : true;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if ("in" in (value as Row)) return (value as { in: unknown[] }).in.includes(row[key]);
      return true;
    }
    return row[key] === value;
  });
}

function createFakeDb(options: { verifications?: Row[]; verified?: boolean; failTransaction?: boolean } = {}) {
  const verifications: Row[] = options.verifications ? options.verifications.map((row) => ({ ...row })) : [];
  const events: Row[] = [];
  let verified = options.verified ?? false;
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}${++seq}`;

  const verification = {
    findFirst: async ({ where }: Row) => verifications.find((row) => matches(row, where)) ?? null,
    findUnique: async ({ where }: Row) => verifications.find((row) => row.id === where.id) ?? null,
    findUniqueOrThrow: async ({ where }: Row) => {
      const found = verifications.find((row) => row.id === where.id);
      if (!found) throw new Error("Record not found");
      return found;
    },
    create: async ({ data }: Row) => {
      const row = {
        id: nextId("v"),
        submittedAt: new Date(),
        reviewedAt: null,
        adminNote: null,
        reviewedBy: null,
        imageUrl: null,
        active: true,
        ...data,
      };
      verifications.push(row);
      return row;
    },
    update: async ({ where, data }: Row) => {
      const row = verifications.find((item) => item.id === where.id);
      if (!row) throw new Error("Record not found");
      Object.assign(row, data);
      return row;
    },
    updateMany: async ({ where, data }: Row) => {
      const rows = verifications.filter((row) => matches(row, where));
      rows.forEach((row) => Object.assign(row, data));
      return { count: rows.length };
    },
    findMany: async ({ where, select }: Row) => {
      const rows = verifications.filter((row) => matches(row, where));
      if (!select) return rows;
      return rows.map((row) => Object.fromEntries(Object.keys(select).map((key) => [key, row[key]])));
    },
  };

  const verificationEvent = {
    create: async ({ data }: Row) => {
      const row = { id: nextId("e"), createdAt: new Date(), ...data };
      events.push(row);
      return row;
    },
    findMany: async ({ where }: Row) => events.filter((event) => event.verificationId === where.verificationId),
  };

  const user = {
    update: async ({ data }: Row) => {
      verified = data.verified;
      return { id: "u1", verified };
    },
  };

  const tx = { verification, verificationEvent, user };
  const db = {
    ...tx,
    $transaction: async (fn: (client: typeof tx) => Promise<unknown>) => {
      if (options.failTransaction) throw new Error("database unavailable");
      return fn(tx);
    },
  };

  return {
    db: db as unknown as PrismaClient,
    verifications,
    events,
    isVerified: () => verified,
  };
}

const doc = (overrides: Row = {}): Row => ({
  id: "existing",
  userId: "u1",
  type: VerificationType.selfie,
  status: VerificationStatus.pending,
  active: true,
  imageUrl: null,
  storageProvider: "test",
  storageAssetId: "old-asset",
  mimeType: "image/jpeg",
  ...overrides,
});

const file = { buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]), mimeType: "image/jpeg" };

beforeEach(() => {
  process.env.KYC_STORAGE_PROVIDER = "test";
  resetStorageProvider();
});

describe("VerificationService.submit", () => {
  it("rejects when storage is disabled and persists nothing", async () => {
    process.env.KYC_STORAGE_PROVIDER = "disabled";
    resetStorageProvider();
    const fake = createFakeDb();
    const service = new VerificationService(fake.db);

    await expect(service.submit("u1", VerificationType.selfie, file)).rejects.toMatchObject({ status: 503 });
    expect(fake.verifications).toHaveLength(0);
  });

  it("persists provider metadata and an audit event on success", async () => {
    const fake = createFakeDb();
    const service = new VerificationService(fake.db);

    const created = await service.submit("u1", VerificationType.ghana_card_front, file);

    expect(created.status).toBe(VerificationStatus.pending);
    expect(created.active).toBe(true);
    expect(created.storageProvider).toBe("test");
    expect(created.storageAssetId).toBeTruthy();
    expect(created.sizeBytes).toBe(file.buffer.length);
    expect(fake.events.map((event) => event.action)).toEqual(["submitted"]);
  });

  it("does not create a second row while a submission is pending", async () => {
    const fake = createFakeDb({
      verifications: [doc({ id: "pending", type: VerificationType.selfie, status: VerificationStatus.pending })],
    });
    const service = new VerificationService(fake.db);

    await expect(service.submit("u1", VerificationType.selfie, file)).rejects.toMatchObject({ status: 409 });
    expect(fake.verifications).toHaveLength(1);
  });

  it("supersedes an approved document and removes the previous asset", async () => {
    const fake = createFakeDb({
      verifications: [doc({ id: "approved", status: VerificationStatus.approved })],
    });
    const provider = getStorageProvider() as TestStorageProvider;
    const service = new VerificationService(fake.db);

    await service.submit("u1", VerificationType.selfie, file);

    expect(fake.verifications).toHaveLength(2);
    expect(fake.verifications.find((row) => row.id === "approved")?.active).toBe(false);
    expect(provider.removed).toContain("old-asset");
    expect(fake.events.map((event) => event.action)).toContain("superseded");
  });

  it("compensates by removing the uploaded asset when the database write fails", async () => {
    const fake = createFakeDb({ failTransaction: true });
    const provider = getStorageProvider() as TestStorageProvider;
    const service = new VerificationService(fake.db);

    await expect(service.submit("u1", VerificationType.selfie, file)).rejects.toThrow("database unavailable");

    const storedAsset = provider.stored[0];
    expect(storedAsset).toBeDefined();
    expect(provider.removed).toContain(storedAsset.assetId);
    expect(fake.verifications).toHaveLength(0);
  });
});

describe("VerificationService.review", () => {
  it("approves a pending document and records the actor", async () => {
    const fake = createFakeDb({
      verifications: [doc({ id: "v1", type: VerificationType.selfie, status: VerificationStatus.pending })],
    });
    const service = new VerificationService(fake.db);

    const updated = await service.review("v1", "admin-1", "approved");

    expect(updated.status).toBe(VerificationStatus.approved);
    expect(updated.reviewedBy).toBe("admin-1");
    expect(fake.events).toHaveLength(1);
    expect(fake.events[0]).toMatchObject({ action: "approved", actorType: "admin", actorId: "admin-1" });
  });

  it("rejects reviews of already-reviewed documents", async () => {
    const fake = createFakeDb({
      verifications: [doc({ id: "v1", status: VerificationStatus.approved })],
    });
    const service = new VerificationService(fake.db);

    await expect(service.review("v1", "admin-1", "rejected")).rejects.toMatchObject({ status: 409 });
  });

  it("rejects reviews of superseded submissions", async () => {
    const fake = createFakeDb({
      verifications: [doc({ id: "v1", status: VerificationStatus.pending, active: false })],
    });
    const service = new VerificationService(fake.db);

    await expect(service.review("v1", "admin-1", "approved")).rejects.toMatchObject({ status: 409 });
  });

  it("marks the user verified only after all three documents are approved", async () => {
    const fake = createFakeDb({
      verified: false,
      verifications: [
        doc({ id: "front", type: VerificationType.ghana_card_front, status: VerificationStatus.approved }),
        doc({ id: "back", type: VerificationType.ghana_card_back, status: VerificationStatus.approved }),
        doc({ id: "selfie", type: VerificationType.selfie, status: VerificationStatus.pending }),
      ],
    });
    const service = new VerificationService(fake.db);

    await service.review("selfie", "admin-1", "approved");

    expect(fake.isVerified()).toBe(true);
  });

  it("revokes verified status when a required document is rejected", async () => {
    const fake = createFakeDb({
      verified: true,
      verifications: [
        doc({ id: "front", type: VerificationType.ghana_card_front, status: VerificationStatus.approved }),
        doc({ id: "back", type: VerificationType.ghana_card_back, status: VerificationStatus.approved }),
        doc({ id: "selfie", type: VerificationType.selfie, status: VerificationStatus.pending }),
      ],
    });
    const service = new VerificationService(fake.db);

    await service.review("selfie", "admin-1", "rejected", "blurry");

    expect(fake.isVerified()).toBe(false);
    expect(fake.events[0]).toMatchObject({ action: "rejected", note: "blurry" });
  });
});

describe("VerificationService.getDocumentViewUrl", () => {
  it("returns a short-lived provider URL for stored assets", async () => {
    const fake = createFakeDb({ verifications: [doc({ id: "v1", storageAssetId: "asset-1" })] });
    const service = new VerificationService(fake.db);

    const view = await service.getDocumentViewUrl("v1");

    expect(view).toEqual({ url: "test://documents/asset-1", expiresInSeconds: 300, legacy: false });
  });

  it("marks legacy rows that only have a stored URL", async () => {
    const fake = createFakeDb({
      verifications: [doc({ id: "v1", storageAssetId: null, storageProvider: null, imageUrl: "https://legacy/x.jpg" })],
    });
    const service = new VerificationService(fake.db);

    const view = await service.getDocumentViewUrl("v1");

    expect(view).toEqual({ url: "https://legacy/x.jpg", expiresInSeconds: null, legacy: true });
  });

  it("refuses to expose superseded documents", async () => {
    const fake = createFakeDb({ verifications: [doc({ id: "v1", active: false })] });
    const service = new VerificationService(fake.db);

    await expect(service.getDocumentViewUrl("v1")).rejects.toMatchObject({ status: 409 });
  });
});
