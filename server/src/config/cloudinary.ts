import { v2 as cloudinary } from "cloudinary";
import { HttpError } from "../utils/HttpError";
import { getStorageConfig } from "./storage";

let isConfigured = false;

export function getCloudinary() {
  const config = getStorageConfig();

  if (config.provider !== "cloudinary") {
    throw new HttpError(503, "Cloudinary storage is not enabled.");
  }

  if (!config.valid) {
    throw new HttpError(500, `Cloudinary storage is misconfigured: ${config.missing.join(", ")}`);
  }

  if (!isConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    isConfigured = true;
  }

  return cloudinary;
}

export function resetCloudinaryClient(): void {
  isConfigured = false;
}
