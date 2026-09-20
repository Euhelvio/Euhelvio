import { adjustmentsToCssFilter, type ImageAdjustments } from "./types";

/**
 * Bakes the given adjustments into a new image (used for save/share). Live
 * preview in the viewer uses the same CSS filter string directly on an
 * <img> element instead, which is far cheaper than re-rendering a canvas
 * on every slider change.
 */
export async function renderFilteredBlob(
  sourceBlob: Blob,
  adjustments: ImageAdjustments,
  mimeType = "image/jpeg"
): Promise<Blob> {
  const bitmap = await createImageBitmap(sourceBlob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D não disponível");

  ctx.filter = adjustmentsToCssFilter(adjustments);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, 0.92)
  );
  if (!blob) throw new Error("Falha ao gerar imagem filtrada");
  return blob;
}
