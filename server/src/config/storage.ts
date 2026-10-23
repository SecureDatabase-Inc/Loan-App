import { isStorageProviderName, STORAGE_PROVIDERS, StorageProviderName } from "../services/storage/types";

const CLOUDINARY_VARS = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const;

const PLACEHOLDER_FRAGMENTS = ["change-me", "changeme", "placeholder", "your-key", "your_key", "example", "xxx"];

export interface StorageConfigReport {
  provider: StorageProviderName;
  enabled: boolean;
  missing: string[];
  valid: boolean;
  error: string | null;
}

export function isConfiguredValue(name: string): boolean {
  const value = (process.env[name] || "").trim();
  if (!value) return false;
  const normalized = value.toLowerCase();
  return !PLACEHOLDER_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

export function getStorageConfig(): StorageConfigReport {
  const configured = (process.env.KYC_STORAGE_PROVIDER || "").trim().toLowerCase();
  let provider: StorageProviderName;
  let error: string | null = null;

  if (configured) {
    if (isStorageProviderName(configured)) {
      provider = configured;
    } else {
      provider = "disabled";
      error = `KYC_STORAGE_PROVIDER must be one of: ${STORAGE_PROVIDERS.join(", ")}`;
    }
  } else if (process.env.NODE_ENV === "test") {
    provider = "test";
  } else if (CLOUDINARY_VARS.every(isConfiguredValue)) {
    provider = "cloudinary";
  } else {
    provider = "disabled";
  }

  const missing = provider === "cloudinary" ? CLOUDINARY_VARS.filter((name) => !isConfiguredValue(name)) : [];

  return {
    provider,
    enabled: provider !== "disabled",
    missing,
    valid: error === null && missing.length === 0,
    error,
  };
}

export function assertStorageConfig(): void {
  const config = getStorageConfig();
  if (config.error) throw new Error(`Invalid storage configuration: ${config.error}`);
  if (config.provider === "cloudinary" && config.missing.length > 0) {
    throw new Error(
      `Storage provider "cloudinary" is enabled but missing required configuration: ${config.missing.join(", ")}. ` +
        "Set these variables in the server environment or set KYC_STORAGE_PROVIDER=disabled.",
    );
  }
}
