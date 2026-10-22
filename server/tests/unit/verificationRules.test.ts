import { beforeEach, describe, expect, it } from "vitest";
import { canReview, isFullyVerified, REQUIRED_DOCUMENT_TYPES } from "../../src/utils/verification";
import { verificationRejectionSchema, verificationTypeSchema } from "../../src/utils/validators";

const doc = (type: string, status: string, active = true) =>
  ({ type, status, active }) as Parameters<typeof isFullyVerified>[0][number];

describe("verification type validation", () => {
  it("accepts the three supported document types", () => {
    expect(verificationTypeSchema.parse("selfie")).toBe("selfie");
    expect(verificationTypeSchema.parse("ghana_card_front")).toBe("ghana_card_front");
    expect(verificationTypeSchema.parse("ghana_card_back")).toBe("ghana_card_back");
  });

  it("rejects unsupported or missing types", () => {
    expect(() => verificationTypeSchema.parse("passport")).toThrow();
    expect(() => verificationTypeSchema.parse(undefined)).toThrow();
    expect(() => verificationTypeSchema.parse(123)).toThrow();
  });

  it("bounds rejection notes", () => {
    expect(verificationRejectionSchema.parse({})).toEqual({});
    expect(verificationRejectionSchema.parse({ adminNote: "blurry" })).toEqual({ adminNote: "blurry" });
    expect(() => verificationRejectionSchema.parse({ adminNote: "x".repeat(501) })).toThrow();
  });
});

describe("verified flag computation", () => {
  it("requires all three document types", () => {
    expect(REQUIRED_DOCUMENT_TYPES).toHaveLength(3);
  });

  it("is false when only some documents are approved", () => {
    expect(isFullyVerified([doc("selfie", "approved")])).toBe(false);
    expect(
      isFullyVerified([doc("selfie", "approved"), doc("ghana_card_front", "approved")]),
    ).toBe(false);
    expect(
      isFullyVerified([
        doc("selfie", "approved"),
        doc("ghana_card_front", "approved"),
        doc("ghana_card_back", "pending"),
      ]),
    ).toBe(false);
  });

  it("is true only when every required document is approved", () => {
    expect(
      isFullyVerified([
        doc("selfie", "approved"),
        doc("ghana_card_front", "approved"),
        doc("ghana_card_back", "approved"),
      ]),
    ).toBe(true);
  });

  it("ignores superseded (inactive) approvals", () => {
    expect(
      isFullyVerified([
        doc("selfie", "approved", false),
        doc("ghana_card_front", "approved"),
        doc("ghana_card_back", "approved"),
      ]),
    ).toBe(false);
  });
});

describe("review transition rules", () => {
  it("allows reviewing only pending documents", () => {
    expect(canReview("pending")).toBe(true);
    expect(canReview("approved")).toBe(false);
    expect(canReview("rejected")).toBe(false);
  });
});
