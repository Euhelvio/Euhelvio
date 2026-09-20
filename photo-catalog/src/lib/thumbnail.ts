export const THUMB_MAX_SIZE = 480;

export interface ThumbnailResult {
  thumbBlob: Blob;
  /** Original (full-resolution) image dimensions, not the thumbnail's. */
  width: number;
  height: number;
}

export async function createThumbnail(
  blob: Blob,
  maxSize = THUMB_MAX_SIZE
): Promise<ThumbnailResult | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    const width = bitmap.width;
    const height = bitmap.height;
    const scale = Math.min(1, maxSize / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const thumbBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    if (!thumbBlob) return null;

    return { thumbBlob, width, height };
  } catch {
    return null;
  }
}
