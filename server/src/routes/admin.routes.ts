import { Router } from "express";
import { authenticateAdmin } from "../middleware/admin.middleware";
import { authIpLimiter, adminLoginLimiter } from "../middleware/authLimiter";
import {
  adminLogin, getDashboardStats, getAllUsers, getAllLoans,
  approveLoan, rejectLoan, getVerifications,
  approveVerification, rejectVerification, getAllRepayments,
  clearRepayment, updateUserLevel, getVerificationDocument,
  getVerificationHistory,
} from "../controllers/admin.controller";

const router = Router();

router.post("/login", authIpLimiter, adminLoginLimiter, adminLogin);
router.get("/dashboard", authenticateAdmin, getDashboardStats);
router.get("/users", authenticateAdmin, getAllUsers);
router.put("/users/:id/level", authenticateAdmin, updateUserLevel);
router.get("/loans", authenticateAdmin, getAllLoans);
router.put("/loans/:id/approve", authenticateAdmin, approveLoan);
router.put("/loans/:id/reject", authenticateAdmin, rejectLoan);
router.get("/verifications", authenticateAdmin, getVerifications);
router.get("/verifications/:id/document", authenticateAdmin, getVerificationDocument);
router.get("/verifications/:id/history", authenticateAdmin, getVerificationHistory);
router.put("/verifications/:id/approve", authenticateAdmin, approveVerification);
router.put("/verifications/:id/reject", authenticateAdmin, rejectVerification);
router.get("/repayments", authenticateAdmin, getAllRepayments);
router.put("/repayments/:id/clear", authenticateAdmin, clearRepayment);

export default router;
