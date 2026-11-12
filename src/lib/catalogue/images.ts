/** Server-side image checks. Never trust the Content-Type the browser sent: look at the bytes. */
export type ImageMime = "image/jpeg" | "image/png" | "image/webp";

export function sniffImage(b: Uint8Array): ImageMime | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 12 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (
    b.length > 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 //  WEBP
  ) {
    return "image/webp";
  }
  return null;
}
