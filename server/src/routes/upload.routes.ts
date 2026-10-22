import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validateImageUpload, upload } from "../middleware/upload.middleware";
import { uploadLimiter } from "../middleware/uploadLimiter";
import { uploadVerificationImage } from "../controllers/upload.controller";

const router = Router();

router.post(
  "/verify",
  authenticate,
  uploadLimiter,
  upload.single("image"),
  validateImageUpload,
  uploadVerificationImage,
);

export default router;
