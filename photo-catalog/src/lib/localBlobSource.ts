import { db } from "./db";
import { createThumbnail } from "./thumbnail";
import type { BlobSource, PhotoRecord } from "./types";

export const localBlobSource: BlobSource = {
  async getThumb(item) {
    if (item.kind !== "local") return undefined;
    return item.thumbBlob;
  },
  async getFull(item) {
    if (item.kind !== "local") return undefined;
    return item.blob;
  },
  async setCategory(item, category) {
    await db.photos.update(item.id, { category });
  },
  async saveCopy(item, blob) {
    if (item.kind !== "local") return;
    const thumb = await createThumbnail(blob);
    const copy: PhotoRecord = {
      ...item,
      id: `${item.id}::edit-${Date.now()}`,
      fileName: `editada-${item.fileName}`,
      mimeType: "image/jpeg",
      blob,
      thumbBlob: thumb?.thumbBlob ?? item.thumbBlob,
      width: thumb?.width ?? item.width,
      height: thumb?.height ?? item.height,
      importedAt: Date.now(),
    };
    await db.photos.put(copy);
  },
};
