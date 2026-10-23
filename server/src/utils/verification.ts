import { VerificationStatus, VerificationType } from "@prisma/client";

export const REQUIRED_DOCUMENT_TYPES: VerificationType[] = [
  VerificationType.selfie,
  VerificationType.ghana_card_front,
  VerificationType.ghana_card_back,
];

export function canReview(from: VerificationStatus): boolean {
  return from === VerificationStatus.pending;
}

export function isFullyVerified(
  documents: Array<{ type: VerificationType; status: VerificationStatus; active?: boolean }>,
): boolean {
  return REQUIRED_DOCUMENT_TYPES.every((type) =>
    documents.some((doc) => doc.type === type && doc.status === VerificationStatus.approved && doc.active !== false),
  );
}
