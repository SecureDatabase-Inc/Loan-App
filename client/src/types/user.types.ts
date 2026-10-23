export interface VerificationEvent {
  id: string;
  verificationId: string;
  actorType: "user" | "admin" | string;
  actorId?: string | null;
  action: string;
  fromStatus?: "pending" | "approved" | "rejected" | null;
  toStatus?: "pending" | "approved" | "rejected" | null;
  note?: string | null;
  createdAt: string;
}

export interface Verification {
  id: string;
  userId: string;
  type: "selfie" | "ghana_card_front" | "ghana_card_back";
  imageUrl?: string | null;
  status: "pending" | "approved" | "rejected";
  adminNote?: string | null;
  reviewedBy?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  storageProvider?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  hasDocument?: boolean;
  legacyDocument?: boolean;
  events?: VerificationEvent[];
  user?: { fullName: string; phone: string };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}
