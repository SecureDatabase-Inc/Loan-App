import { HttpError } from "../../utils/HttpError";
import { AssetReference, StorageProvider, StoreInput } from "./types";

export class DisabledStorageProvider implements StorageProvider {
  readonly name = "disabled";
  readonly enabled = false;

  async store(_input: StoreInput): Promise<never> {
    throw new HttpError(
      503,
      "Document storage is not configured. Contact support to enable identity verification.",
    );
  }

  async createViewUrl(_asset: AssetReference): Promise<never> {
    throw new HttpError(503, "Document storage is not configured.");
  }

  async remove(_assetId: string): Promise<void> {
    return;
  }
}
