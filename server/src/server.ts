import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import http from "http";
import app from "./app";
import { initSocket } from "./config/socket";
import { setupSocket } from "./socket/socket.server";
import { startExpireLoansJob } from "./jobs/expireLoans.job";
import { startReminderJob } from "./jobs/reminder.job";
import { startCleanupJob } from "./jobs/cleanup.job";
import { logger } from "./utils/logger";
import { assertStorageConfig } from "./config/storage";

const PORT = process.env.PORT || 5000;

assertStorageConfig();

const server = http.createServer(app);
const io = initSocket(server);
setupSocket(io);

startExpireLoansJob();
startReminderJob();
startCleanupJob();

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});
