import { describe, expect, it, vi } from "vitest";
import { detectImageMime, isAllowedImageMime } from "../../src/utils/imageSignature";
import { validateImageUpload } from "../../src/middleware/upload.middleware";
import { HttpError } from "../../src/utils/HttpError";

const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
]);
const webp = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from("WEBP"),
  Buffer.alloc(8),
]);
const gif = Buffer.concat([Buffer.from("GIF89a"), Buffer.alloc(16)]);
const pdf = Buffer.concat([Buffer.from("%PDF-1.7"), Buffer.alloc(16)]);
const html = Buffer.concat([Buffer.from("<!DOCTYPE html>"), Buffer.alloc(16)]);

function runValidation(buffer: Buffer, declaredMime = "image/jpeg") {
  const req = { file: { buffer, mimetype: declaredMime } } as unknown as Parameters<typeof validateImageUpload>[0];
  const next = vi.fn();
  validateImageUpload(req, {} as never, next);
  return { req, next };
}

describe("image signature detection", () => {
  it("detects JPEG, PNG, and WebP signatures", () => {
    expect(detectImageMime(jpeg)).toBe("image/jpeg");
    expect(detectImageMime(png)).toBe("image/png");
    expect(detectImageMime(webp)).toBe("image/webp");
  });

  it("rejects non-image payloads regardless of declared type", () => {
    expect(detectImageMime(gif)).toBeNull();
    expect(detectImageMime(pdf)).toBeNull();
    expect(detectImageMime(html)).toBeNull();
    expect(detectImageMime(Buffer.from("hello world, not an image"))).toBeNull();
  });

  it("rejects truncated and empty buffers", () => {
    expect(detectImageMime(Buffer.alloc(0))).toBeNull();
    expect(detectImageMime(Buffer.from([0xff, 0xd8]))).toBeNull();
    expect(detectImageMime(undefined)).toBeNull();
  });

  it("only allowlists JPEG, PNG, and WebP", () => {
    expect(isAllowedImageMime("image/jpeg")).toBe(true);
    expect(isAllowedImageMime("image/png")).toBe(true);
    expect(isAllowedImageMime("image/webp")).toBe(true);
    expect(isAllowedImageMime("image/gif")).toBe(false);
    expect(isAllowedImageMime("application/pdf")).toBe(false);
  });
});

describe("upload validation middleware", () => {
  it("accepts a real image and normalizes its MIME type from the signature", () => {
    const { req, next } = runValidation(png, "image/jpeg");
    expect(next).toHaveBeenCalledWith();
    expect((req as { file: Express.Multer.File }).file.mimetype).toBe("image/png");
  });

  it("rejects a spoofed image with a non-image signature", () => {
    const { next } = runValidation(html, "image/jpeg");
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(HttpError);
    expect((next.mock.calls[0][0] as HttpError).status).toBe(400);
  });

  it("rejects a request with no file", () => {
    const next = vi.fn();
    validateImageUpload({} as never, {} as never, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(HttpError);
    expect((next.mock.calls[0][0] as HttpError).status).toBe(400);
  });
});
