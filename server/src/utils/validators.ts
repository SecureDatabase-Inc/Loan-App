import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  phone: z.string().regex(/^0[235]\d{8}$/, "Invalid Ghana phone number"),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters").optional(),
  phone: z.string().regex(/^0[235]\d{8}$/, "Invalid Ghana phone number").optional(),
  email: z.string().email("Invalid email address").nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const loanApplicationSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(10000, "Maximum loan amount is GHS 10,000"),
  purpose: z.string().optional(),
});

export const repaymentSchema = z.object({
  loanId: z.string().min(1, "Loan ID is required"),
  amount: z.number().positive("Amount must be positive"),
  method: z.string().optional(),
});

export const verificationTypeSchema = z.enum(["selfie", "ghana_card_front", "ghana_card_back"]);

export const verificationRejectionSchema = z.object({
  adminNote: z.string().max(500).optional(),
});
