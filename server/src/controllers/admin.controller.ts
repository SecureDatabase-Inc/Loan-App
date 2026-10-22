import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/db";
import { generateToken } from "../utils/generateToken";
import { LoanService } from "../services/loan.service";
import { PaymentService } from "../services/payment.service";
import { NotificationService } from "../services/notification.service";
import { VerificationService } from "../services/verification.service";
import { verificationRejectionSchema } from "../utils/validators";

const loanService = new LoanService();
const paymentService = new PaymentService();
const notificationService = new NotificationService();
const verificationService = new VerificationService();

export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !admin.isActive) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(
      { id: admin.id, phone: admin.email, role: admin.role },
      process.env.ADMIN_JWT_EXPIRES_IN
    );

    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const { password: _, ...safe } = admin;
    res.json({ admin: safe, token });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [totalUsers, totalLoans, activeLoans, pendingLoans, repaidLoans, totalVerified] = await Promise.all([
      prisma.user.count(),
      prisma.loan.count(),
      prisma.loan.count({ where: { status: "active" } }),
      prisma.loan.count({ where: { status: "pending" } }),
      prisma.loan.count({ where: { status: "repaid" } }),
      prisma.user.count({ where: { verified: true } }),
    ]);

    const loanAmounts = await prisma.loan.aggregate({ _sum: { amount: true } });

    res.json({
      totalUsers, totalLoans, activeLoans, pendingLoans, repaidLoans,
      totalVerified, totalLoanAmount: loanAmounts._sum.amount || 0,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, fullName: true, phone: true, email: true, verified: true,
        isActive: true, loanLevel: true, createdAt: true,
        _count: { select: { loans: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
}

export async function getAllLoans(_req: Request, res: Response, next: NextFunction) {
  try {
    const loans = await prisma.loan.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true, phone: true } } },
    });
    res.json(loans);
  } catch (error) {
    next(error);
  }
}

export async function approveLoan(req: Request, res: Response, next: NextFunction) {
  try {
    const loan = await loanService.approveLoan(req.params.id, req.admin!.id);
    res.json(loan);
  } catch (error) {
    next(error);
  }
}

export async function rejectLoan(req: Request, res: Response, next: NextFunction) {
  try {
    const loan = await loanService.rejectLoan(req.params.id);
    res.json(loan);
  } catch (error) {
    next(error);
  }
}

export async function getVerifications(_req: Request, res: Response, next: NextFunction) {
  try {
    const verifications = await prisma.verification.findMany({
      where: { active: true },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        userId: true,
        type: true,
        status: true,
        adminNote: true,
        reviewedBy: true,
        submittedAt: true,
        reviewedAt: true,
        storageProvider: true,
        mimeType: true,
        sizeBytes: true,
        imageUrl: true,
        storageAssetId: true,
        user: { select: { fullName: true, phone: true } },
      },
    });

    res.json(
      verifications.map(({ imageUrl, storageAssetId, ...verification }) => ({
        ...verification,
        hasDocument: Boolean(storageAssetId || imageUrl),
        legacyDocument: Boolean(!storageAssetId && imageUrl),
      })),
    );
  } catch (error) {
    next(error);
  }
}

export async function approveVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const verification = await verificationService.review(req.params.id, req.admin!.id, "approved");

    await notificationService.create({
      userId: verification.userId,
      title: "Verification approved",
      message: "Your identity document was approved.",
      type: "verification",
    });

    res.json(verification);
  } catch (error) {
    next(error);
  }
}

export async function rejectVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const { adminNote } = verificationRejectionSchema.parse(req.body ?? {});
    const verification = await verificationService.review(
      req.params.id,
      req.admin!.id,
      "rejected",
      adminNote,
    );

    await notificationService.create({
      userId: verification.userId,
      title: "Verification rejected",
      message: `Your verification was rejected${adminNote ? `: ${adminNote}` : ". Please resubmit."}`,
      type: "verification",
    });

    res.json(verification);
  } catch (error) {
    next(error);
  }
}

export async function getVerificationDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const view = await verificationService.getDocumentViewUrl(req.params.id);
    res.setHeader("Cache-Control", "no-store");
    res.json(view);
  } catch (error) {
    next(error);
  }
}

export async function getVerificationHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const history = await verificationService.getHistory(req.params.id);
    res.json(history);
  } catch (error) {
    next(error);
  }
}

export async function getAllRepayments(_req: Request, res: Response, next: NextFunction) {
  try {
    const repayments = await paymentService.getAllRepayments();
    res.json(repayments);
  } catch (error) {
    next(error);
  }
}

export async function clearRepayment(req: Request, res: Response, next: NextFunction) {
  try {
    const repayment = await paymentService.clearRepayment(req.params.id, req.admin!.id);
    res.json(repayment);
  } catch (error) {
    next(error);
  }
}

export async function updateUserLevel(req: Request, res: Response, next: NextFunction) {
  try {
    const { level } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { loanLevel: level },
      select: { id: true, fullName: true, loanLevel: true },
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
}
