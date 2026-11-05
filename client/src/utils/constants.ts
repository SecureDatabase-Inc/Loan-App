/**
 * API endpoint resolution.
 *
 * Web builds keep the historical dev default. Capacitor builds must provide an
 * explicit endpoint (see `scripts/build-android.mjs`):
 *   - debug:   LAN HTTP endpoint allowed (physical device testing), never localhost.
 *   - release: HTTPS only, never localhost.
 */
const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim();
const NATIVE_TARGET = process.env.NEXT_PUBLIC_APP_TARGET === "capacitor";
const RELEASE_FLAVOR = process.env.NEXT_PUBLIC_BUILD_FLAVOR === "release";

function resolveApiUrl(): string {
  if (!NATIVE_TARGET) {
    return CONFIGURED_API_URL || "http://localhost:5000/api";
  }

  if (!CONFIGURED_API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is required for a Capacitor build (set it to the API base, e.g. https://api.example.com/api)."
    );
  }
  if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(CONFIGURED_API_URL)) {
    throw new Error("Capacitor builds must not point at localhost/loopback.");
  }
  if (RELEASE_FLAVOR && !CONFIGURED_API_URL.startsWith("https://")) {
    throw new Error("Release Capacitor builds require an explicit HTTPS API endpoint.");
  }

  return CONFIGURED_API_URL;
}

export const API_URL = resolveApiUrl();
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || API_URL.replace(/\/api\/?$/, "");

export const LOAN_LEVELS = [
  { level: 1, maxAmount: 100, interestRate: 10, repaymentDays: 6, name: "Bronze" },
  { level: 2, maxAmount: 300, interestRate: 8, repaymentDays: 6, name: "Silver" },
  { level: 3, maxAmount: 500, interestRate: 7, repaymentDays: 6, name: "Gold" },
  { level: 4, maxAmount: 1000, interestRate: 5, repaymentDays: 6, name: "Platinum" },
] as const;

export const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: "chip-pending", label: "Pending" },
  approved: { color: "chip-approved", label: "Approved" },
  active: { color: "chip-active", label: "Active" },
  repaid: { color: "chip-repaid", label: "Repaid" },
  overdue: { color: "chip-overdue", label: "Overdue" },
  rejected: { color: "chip-rejected", label: "Rejected" },
  expired: { color: "chip-overdue", label: "Expired" },
  paid: { color: "chip-paid", label: "Paid" },
};

export const MOMO_DETAILS = {
  mtn: { name: "MTN Mobile Money", number: "055 123 4567", accountName: "BoA Micro Finance Ltd", color: "#FFC107" },
  vodafone: { name: "Vodafone Cash", number: "020 123 4567", accountName: "BoA Micro Finance Ltd", color: "#E53935" },
  airteltigo: { name: "AirtelTigo Money", number: "027 123 4567", accountName: "BoA Micro Finance Ltd", color: "#1E88E5" },
};
