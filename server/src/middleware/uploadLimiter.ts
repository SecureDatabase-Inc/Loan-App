import { rateLimit } from "express-rate-limit";

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.UPLOAD_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many upload attempts. Please wait and try again." },
  keyGenerator: (req) => `upload:${req.user?.id || req.ip}`,
});
