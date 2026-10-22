import { getCloudinary } from "../../config/cloudinary";
import { AssetReference, StorageProvider, StoreInput, StoredAsset } from "./types";

const MIME_FORMAT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const VIEW_URL_TTL_SECONDS = 300;

export class CloudinaryStorageProvider implements StorageProvider {
  readonly name = "cloudinary";
  readonly enabled = true;

  private client() {
    return getCloudinary();
  }

  async store(input: StoreInput): Promise<StoredAsset> {
    const result = await new Promise<{ public_id: string }>((resolve, reject) => {
      const stream = this.client().uploader.upload_stream(
        {
          folder: `boa/${input.folder}`,
          resource_type: "image",
          type: "authenticated",
          transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
        },
        (error, response) => {
          if (error || !response) {
            reject(error instanceof Error ? error : new Error("Cloudinary upload failed"));
            return;
          }
          resolve(response);
        },
      );
      stream.end(input.buffer);
    });

    return {
      provider: "cloudinary",
      assetId: result.public_id,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length,
    };
  }

  async createViewUrl(asset: AssetReference): Promise<string> {
    const format = MIME_FORMAT[asset.mimeType] || "jpg";
    return this.client().utils.private_download_url(asset.assetId, format, {
      resource_type: "image",
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + VIEW_URL_TTL_SECONDS,
    });
  }

  async remove(assetId: string): Promise<void> {
    await this.client().uploader.destroy(assetId, {
      resource_type: "image",
      type: "authenticated",
      invalidate: true,
    });
  }
}
