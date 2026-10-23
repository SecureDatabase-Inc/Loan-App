export const STORAGE_PROVIDERS = ["disabled", "test", "cloudinary"] as const;

export type StorageProviderName = (typeof STORAGE_PROVIDERS)[number];

export interface StoreInput {
  buffer: Buffer;
  mimeType: string;
  folder: string;
}

export interface StoredAsset {
  provider: StorageProviderName;
  assetId: string;
  mimeType: string;
  sizeBytes: number;
}

export interface AssetReference {
  assetId: string;
  mimeType: string;
}

export interface StorageProvider {
  readonly name: StorageProviderName;
  readonly enabled: boolean;
  store(input: StoreInput): Promise<StoredAsset>;
  createViewUrl(asset: AssetReference): Promise<string>;
  remove(assetId: string): Promise<void>;
}

export function isStorageProviderName(value: string): value is StorageProviderName {
  return (STORAGE_PROVIDERS as readonly string[]).includes(value);
}
