import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import prisma from "../config/db";
import { updateProfileSchema, changePasswordSchema, deleteAccountSchema } from "../utils/validators";
import { IN_PROGRESS_LOAN_STATUSES } from "../constants/loan";
import { generateToken } from "../utils/generateToken";
import { cookieOptions, clearCookieOptions } from "../constants/session";

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
      },
      select: {
        id: true, fullName: true, email: true, phone: true,
        avatarUrl: true, verified: true, loanLevel: true,
      },
    });
    res.json(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = String((error.meta as any)?.target ?? "");
      return res.status(409).json({
        message: target.includes("phone")
          ? "This phone number is already registered to another account"
          : target.includes("email")
            ? "This email is already registered to another account"
            : "Profile already in use",
      });
    }
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    // Rotate the session token after a credential change so any token
    // issued before the change carries the stale login session.
    const token = generateToken({ id: user.id, phone: user.phone, role: "user" });
    res.cookie("token", token, cookieOptions());

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const { password } = deleteAccountSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Incorrect password" });

    const activeLoan = await prisma.loan.findFirst({
      where: { userId: user.id, status: { in: [...IN_PROGRESS_LOAN_STATUSES] } },
    });
    if (activeLoan) {
      return res.status(409).json({ message: "Deactivate active loans before deleting your account" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: false },
    });

    res.clearCookie("token", clearCookieOptions());
    res.json({ message: "Account deactivated" });
  } catch (error) {
    next(error);
  }
}

export async function getMyVerifications(req: Request, res: Response, next: NextFunction) {
  try {
    const verifications = await prisma.verification.findMany({
      where: { userId: req.user!.id, active: true },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true, type: true, status: true, adminNote: true,
        reviewedBy: true, submittedAt: true, reviewedAt: true,
      },
    });
    res.json(verifications);
  } catch (error) {
    next(error);
  }
}
