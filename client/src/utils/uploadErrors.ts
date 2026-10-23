export function describeUploadError(error: unknown): string {
  const status = (error as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;

  switch (status) {
    case 400:
      return message || "That photo can't be used. Please upload a clear JPEG, PNG, or WebP image.";
    case 409:
      return message || "This document is already awaiting review.";
    case 413:
      return "That photo is too large. Please retake it and try again.";
    case 429:
      return "Too many attempts. Please wait a few minutes and try again.";
    case 503:
      return "Identity verification is temporarily unavailable. Please try again later.";
    default:
      return message || "Upload failed. Check your connection and try again.";
  }
}
