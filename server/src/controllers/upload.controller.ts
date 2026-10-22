import { Request, Response, NextFunction } from "express";
import { VerificationService, parseVerificationType } from "../services/verification.service";
import { HttpError } from "../utils/HttpError";

const verificationService = new VerificationService();

export async function uploadVerificationImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new HttpError(400, "No file uploaded.");

    const type = parseVerificationType(req.body?.type);
    const verification = await verificationService.submit(req.user!.id, type, {
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });

    res.status(201).json({
      id: verification.id,
      type: verification.type,
      status: verification.status,
      submittedAt: verification.submittedAt,
    });
  } catch (error) {
    next(error);
  }
}
