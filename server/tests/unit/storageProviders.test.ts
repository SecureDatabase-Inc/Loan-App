import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getStorageProvider,
  resetStorageProvider,
  TestStorageProvider,
} from "../../src/services/storage";
import { assertStorageConfig, getStorageConfig } from "../../src/config/storage";
import { resetCloudinaryClient } from "../../src/config/cloudinary";
import { HttpError } from "../../src/utils/HttpError";

const originalNodeEnv = process.env.NODE_ENV;

function clearStorageEnv() {
  delete process.env.KYC_STORAGE_PROVIDER;
  delete process.env.CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_API_KEY;
  delete process.env.CLOUDINARY_API_SECRET;
}

beforeEach(() => {
  clearStorageEnv();
  resetStorageProvider();
  resetCloudinaryClient();
  process.env.NODE_ENV = "test";
});

afterEach(() => {
  clearStorageEnv();
  resetStorageProvider();
  process.env.NODE_ENV = originalNodeEnv;
});

describe("storage configuration", () => {
  it("defaults to the test provider under the test runner", () => {
    const config = getStorageConfig();
    expect(config.provider).toBe("test");
    expect(config.enabled).toBe(true);
    expect(config.valid).toBe(true);
  });

  it("honours an explicit disabled selection", () => {
    process.env.KYC_STORAGE_PROVIDER = "disabled";
    resetStorageProvider();
    expect(getStorageConfig().provider).toBe("disabled");
    expect(getStorageProvider().enabled).toBe(false);
  });

  it("auto-detects cloudinary when all credentials are present outside tests", () => {
    process.env.NODE_ENV = "production";
    process.env.CLOUDINARY_CLOUD_NAME = "demo-cloud";
    process.env.CLOUDINARY_API_KEY = "123456789";
    process.env.CLOUDINARY_API_SECRET = "super-secret-value";
    resetStorageProvider();

    const config = getStorageConfig();
    expect(config.provider).toBe("cloudinary");
    expect(config.valid).toBe(true);
    expect(getStorageProvider().name).toBe("cloudinary");
  });

  it("reports missing variables without exposing values", () => {
    process.env.NODE_ENV = "production";
    process.env.CLOUDINARY_CLOUD_NAME = "demo-cloud";
    process.env.KYC_STORAGE_PROVIDER = "cloudinary";

    const config = getStorageConfig();
    expect(config.valid).toBe(false);
    expect(config.missing).toEqual(["CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]);
  });

  it("treats placeholder values as missing", () => {
    process.env.NODE_ENV = "production";
    process.env.KYC_STORAGE_PROVIDER = "cloudinary";
    process.env.CLOUDINARY_CLOUD_NAME = "demo-cloud";
    process.env.CLOUDINARY_API_KEY = "change-me";
    process.env.CLOUDINARY_API_SECRET = "placeholder";

    expect(getStorageConfig().missing).toEqual(["CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]);
  });

  it("rejects an unknown provider name", () => {
    process.env.KYC_STORAGE_PROVIDER = "s3";
    resetStorageProvider();
    const config = getStorageConfig();
    expect(config.provider).toBe("disabled");
    expect(config.error).toContain("KYC_STORAGE_PROVIDER");
  });

  it("fails fast with variable names only when cloudinary is misconfigured", () => {
    process.env.NODE_ENV = "production";
    process.env.KYC_STORAGE_PROVIDER = "cloudinary";
    process.env.CLOUDINARY_CLOUD_NAME = "demo-cloud";
    process.env.CLOUDINARY_API_KEY = "api-key-value";
    delete process.env.CLOUDINARY_API_SECRET;

    let message = "";
    try {
      assertStorageConfig();
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain("CLOUDINARY_API_SECRET");
    expect(message).not.toContain("api-key-value");
  });

  it("passes startup validation in disabled mode", () => {
    process.env.NODE_ENV = "production";
    process.env.KYC_STORAGE_PROVIDER = "disabled";
    expect(() => assertStorageConfig()).not.toThrow();
  });
});

describe("disabled storage provider", () => {
  it("rejects uploads with a 503 and no secret detail", async () => {
    process.env.KYC_STORAGE_PROVIDER = "disabled";
    resetStorageProvider();
    const provider = getStorageProvider();

    await expect(
      provider.store({ buffer: Buffer.from("x"), mimeType: "image/jpeg", folder: "verifications/selfie" }),
    ).rejects.toMatchObject({ status: 503 });

    try {
      await provider.store({ buffer: Buffer.from("x"), mimeType: "image/jpeg", folder: "verifications/selfie" });
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as Error).message).not.toContain("CLOUDINARY");
    }
  });
});

describe("test storage provider", () => {
  beforeEach(() => {
    process.env.KYC_STORAGE_PROVIDER = "test";
    resetStorageProvider();
  });

  it("produces deterministic, non-network asset identifiers", async () => {
    const provider = getStorageProvider() as TestStorageProvider;
    expect(provider).toBeInstanceOf(TestStorageProvider);

    const first = await provider.store({
      buffer: Buffer.from([1, 2, 3]),
      mimeType: "image/png",
      folder: "verifications/selfie",
    });
    const second = await provider.store({
      buffer: Buffer.from([4, 5]),
      mimeType: "image/webp",
      folder: "verifications/selfie",
    });

    expect(first.assetId).not.toBe(second.assetId);
    expect(first.assetId.startsWith("verifications/selfie/")).toBe(true);
    expect(first.sizeBytes).toBe(3);
    expect(first.provider).toBe("test");
  });

  it("tracks removed assets for compensation assertions", async () => {
    const provider = getStorageProvider() as TestStorageProvider;
    await provider.remove("asset-1");
    await provider.remove("asset-2");
    expect(provider.removed).toEqual(["asset-1", "asset-2"]);
  });

  it("returns a document URL without a public HTTP host", async () => {
    const provider = getStorageProvider() as TestStorageProvider;
    const url = await provider.createViewUrl({ assetId: "asset-1", mimeType: "image/jpeg" });
    expect(url.startsWith("test://documents/")).toBe(true);
  });
});
