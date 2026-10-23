import { randomUUID } from "crypto";
import { AssetReference, StorageProvider, StoreInput, StoredAsset } from "./types";

export class TestStorageProvider implements StorageProvider {
  readonly name = "test";
  readonly enabled = true;
  readonly removed: string[] = [];
  readonly stored: StoredAsset[] = [];

  async store(input: StoreInput): Promise<StoredAsset> {
    const asset: StoredAsset = {
      provider: "test",
      assetId: `${input.folder}/${randomUUID()}`,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length,
    };
    this.stored.push(asset);
    return asset;
  }

  async createViewUrl(asset: AssetReference): Promise<string> {
    return `test://documents/${asset.assetId}`;
  }

  async remove(assetId: string): Promise<void> {
    this.removed.push(assetId);
  }
}
