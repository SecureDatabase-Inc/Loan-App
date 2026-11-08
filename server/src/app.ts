import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes";
import loanRoutes from "./routes/loan.routes";
import paymentRoutes from "./routes/payment.routes";
import uploadRoutes from "./routes/upload.routes";
import adminRoutes from "./routes/admin.routes";
import userRoutes from "./routes/user.routes";
import notificationRoutes from "./routes/notification.routes";
import { errorHandler } from "./middleware/error.middleware";
import { apiLimiter } from "./middleware/rateLimiter";
import { sameOriginGuard } from "./middleware/security.middleware";
import { buildAllowedOrigins, normalizeOrigin } from "./config/origins";

const app = express();

const allowedOrigins = buildAllowedOrigins();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: (origin, callback) => {
    // No Origin header: same-origin navigation, server-to-server calls and
    // non-browser clients. The same-origin guard handles their CSRF rules.
    if (!origin) return callback(null, true);
    const normalized = normalizeOrigin(origin);
    callback(null, normalized !== null && allowedOrigins.has(normalized));
  },
  credentials: true,
}));
app.use("/api/payments/webhook", express.raw({ type: "*/*" }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.use("/api", apiLimiter);
app.use("/api", sameOriginGuard);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
