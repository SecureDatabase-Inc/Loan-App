import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/HttpError";
import { detectImageMime, isAllowedImageMime, MAX_UPLOAD_BYTES } from "../utils/imageSignature";

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (isAllowedImageMime(file.mimetype) || file.mimetype === "image/jpg") {
    cb(null, true);
    return;
  }
  cb(new HttpError(400, "Only JPEG, PNG, and WebP images are allowed."));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

export function validateImageUpload(req: Request, _res: Response, next: NextFunction) {
  if (!req.file) {
    next(new HttpError(400, "No file uploaded."));
    return;
  }

  const detected = detectImageMime(req.file.buffer);
  if (!detected) {
    next(new HttpError(400, "Unsupported image. Upload a JPEG, PNG, or WebP photo."));
    return;
  }

  req.file.mimetype = detected;
  next();
}
