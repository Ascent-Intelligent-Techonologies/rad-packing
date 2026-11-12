/**
 * Browser-side photo handling: validate, decode, resize, re-encode, upload.
 * Everything here runs in the browser only (canvas, XMLHttpRequest).
 */
import { IMAGE } from "@/lib/catalogue/shared";

/** An error whose message is safe and useful to show to staff as-is. */
export class PhotoError extends Error {}

const ACCEPTED: readonly string[] = IMAGE.accept.split(",");
const BY_EXTENSION = /\.(jpe?g|png|webp)$/i;
const HEIC = /\.hei[cf]$/i;

const FULL_WEBP_QUALITY = [0.85, 0.75, 0.65, 0.55, 0.45];
const FULL_JPEG_QUALITY = [0.88, 0.8, 0.7, 0.6, 0.5];
const THUMB_QUALITY = [0.8, 0.7, 0.6, 0.5];

/** Returns a friendly reason when the file can't be used, otherwise null. */
export function checkFile(file: File): string | null {
  if (/^image\/hei[cf]/i.test(file.type) || HEIC.test(file.name)) {
    return `"${file.name}" is a HEIC photo, which the website can't show. Please choose a JPG, PNG or WebP picture instead.`;
  }
  const genericType = file.type === "" || file.type === "application/octet-stream";
  if (ACCEPTED.includes(file.type) || (genericType && BY_EXTENSION.test(file.name))) return null;
  return `"${file.name}" isn't a picture the website can use. Please choose JPG, PNG or WebP files.`;
}

type Decoded = { source: CanvasImageSource; width: number; height: number; release: () => void };

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // fall through to the <img> decoder
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new PhotoError(`Couldn't read "${file.name}". The file may be damaged.`);
  }
}

/** Draws `source` onto a canvas whose longest side is at most `maxSide` (never enlarges). */
function drawScaled(source: CanvasImageSource, width: number, height: number, maxSide: number, opaque: boolean): HTMLCanvasElement {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PhotoError("This browser can't resize pictures. Please try a recent version of Chrome, Safari or Firefox.");
  if (opaque) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Encodes `canvas` as `type`, lowering the quality step by step until the file fits `maxBytes`.
 * Returns whatever the browser produced if it fits (some browsers answer PNG when asked for WebP).
 * Returns null when nothing fits, or when the browser ignored the type and quality can't help.
 */
async function encode(canvas: HTMLCanvasElement, type: string, qualities: number[], maxBytes: number): Promise<Blob | null> {
  for (const quality of qualities) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    if (!blob || !ACCEPTED.includes(blob.type)) return null;
    if (blob.size <= maxBytes) return blob;
    if (blob.type !== type) return null;
  }
  return null;
}

export type PreparedPhoto = { full: Blob; thumb: Blob; width: number; height: number };

/** Resize to at most IMAGE.fullPx and make a IMAGE.thumbPx thumbnail, both within the server's size limits. */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const decoded = await decode(file);
  try {
    let canvas = drawScaled(decoded.source, decoded.width, decoded.height, IMAGE.fullPx, false);
    let full = await encode(canvas, "image/webp", FULL_WEBP_QUALITY, IMAGE.maxFullBytes);
    if (!full) {
      // No WebP support (or it never got small enough as PNG): JPEG on a white background
      canvas = drawScaled(decoded.source, decoded.width, decoded.height, IMAGE.fullPx, true);
      full = await encode(canvas, "image/jpeg", FULL_JPEG_QUALITY, IMAGE.maxFullBytes);
    }
    if (!full) throw new PhotoError(`"${file.name}" is too detailed to shrink enough. Please try a smaller picture.`);

    const thumbCanvas = drawScaled(canvas, canvas.width, canvas.height, IMAGE.thumbPx, false);
    // the server requires the thumbnail to be the same format as the full picture
    const thumb = await encode(thumbCanvas, full.type, THUMB_QUALITY, IMAGE.maxThumbBytes);
    if (!thumb || thumb.type !== full.type) throw new PhotoError(`Couldn't make a preview of "${file.name}". Please try another picture.`);

    return { full, thumb, width: canvas.width, height: canvas.height };
  } finally {
    decoded.release();
  }
}

const EXTENSION: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

const isUploadResult = (v: unknown): v is { id: string } =>
  typeof v === "object" && v !== null && "id" in v && typeof v.id === "string" && v.id !== "";

const errorMessage = (v: unknown): string | null =>
  typeof v === "object" && v !== null && "error" in v && typeof v.error === "string" ? v.error : null;

/** POST the prepared photo to the admin upload endpoint. Resolves with the new photo's id. */
export function uploadPhoto(photo: PreparedPhoto, onProgress: (percent: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("full", photo.full, `photo.${EXTENSION[photo.full.type] ?? "webp"}`);
    form.append("thumb", photo.thumb, `thumb.${EXTENSION[photo.thumb.type] ?? "webp"}`);
    form.append("width", String(photo.width));
    form.append("height", String(photo.height));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/catalogue-upload");
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new PhotoError("The upload failed. Check your connection and try again."));
    xhr.onload = () => {
      const body: unknown = xhr.response;
      if (xhr.status === 201 && isUploadResult(body)) return resolve(body.id);
      if (xhr.status === 401 || xhr.responseURL.includes("/admin/login")) {
        return reject(
          new PhotoError("Your session has expired. Sign in again in another tab, then add this photo again. Everything else on this page is kept."),
        );
      }
      reject(new PhotoError(errorMessage(body) ?? `The upload failed (error ${xhr.status}). Please try again.`));
    };
    xhr.send(form);
  });
}
