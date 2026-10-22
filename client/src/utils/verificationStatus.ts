import { Verification } from "@/types/user.types";

export type VerificationDocKey = "selfie" | "ghana_card_front" | "ghana_card_back";

export interface VerificationDocStatus {
  key: VerificationDocKey;
  status: Verification["status"] | "";
  submitted: boolean;
  submittedAt?: string;
  reviewedAt?: string;
  adminNote?: string | null;
  imageUrl?: string | null;
}

export function getStatusFromVerification(verifications: Verification[], key: VerificationDocKey): VerificationDocStatus {
  const item = verifications.find((v) => v.type === key);
  if (!item) return { key, status: "", submitted: false };
  return {
    key,
    status: item.status,
    submitted: true,
    submittedAt: item.submittedAt,
    reviewedAt: item.reviewedAt ?? undefined,
    adminNote: item.adminNote,
    imageUrl: item.imageUrl,
  };
}

export function getAllVerificationDocs(verifications: Verification[]): VerificationDocStatus[] {
  return (["selfie", "ghana_card_front", "ghana_card_back"] as VerificationDocKey[]).map((key) =>
    getStatusFromVerification(verifications, key)
  );
}

export function verificationProgress(verifications: Verification[]): { done: number; total: number } {
  const docs = getAllVerificationDocs(verifications);
  return { done: docs.filter((d) => d.status === "approved").length, total: docs.length };
}

export const VERIFICATION_DOC_LABELS: Record<VerificationDocKey, string> = {
  selfie: "Selfie",
  ghana_card_front: "Ghana Card — Front",
  ghana_card_back: "Ghana Card — Back",
};

export const VERIFICATION_DOC_ROUTES: Record<VerificationDocKey, string> = {
  selfie: "/dashboard/verification/selfie",
  ghana_card_front: "/dashboard/verification/ghana-card",
  ghana_card_back: "/dashboard/verification/ghana-card",
};

export function verificationChipClass(status: Verification["status"] | ""): string {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-secondary-100 text-secondary-400";
  }
}