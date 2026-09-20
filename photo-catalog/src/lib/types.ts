export const PHOTO_CATEGORIES = [
  "nao_classificado",
  "paisagem",
  "pessoas",
  "objeto",
  "animal",
  "comida",
  "outro",
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<PhotoCategory, string> = {
  nao_classificado: "Não classificado",
  paisagem: "Paisagem",
  pessoas: "Pessoas",
  objeto: "Objeto",
  animal: "Animal",
  comida: "Comida",
  outro: "Outro",
};

interface PhotoBase {
  id: string;
  fileName: string;
  takenAt: number;
  lat?: number;
  lng?: number;
  locationName?: string;
  category: PhotoCategory;
}

export interface PhotoRecord extends PhotoBase {
  kind: "local";
  mimeType: string;
  blob: Blob;
  thumbBlob: Blob;
  width: number;
  height: number;
  albumName?: string;
  importedAt: number;
}

export type PhotoListItem = Omit<PhotoRecord, "blob" | "thumbBlob">;

/** Metadata for a photo browsed live from a connected Google Drive folder —
 * no image bytes are stored locally; they're fetched on demand. */
export interface DriveFileMeta extends PhotoBase {
  kind: "drive";
  mimeType: string;
  width?: number;
  height?: number;
  thumbnailLink?: string;
  size?: number;
}

/** What the gallery/viewer components render, regardless of where the bytes
 * actually live. */
export type GalleryItem = PhotoRecord | DriveFileMeta;

/** Supplies image bytes and mutations for a GalleryItem, so Gallery/Viewer
 * don't need to know whether they're showing locally-imported photos or
 * photos browsed live from Drive. */
export interface BlobSource {
  getThumb(item: GalleryItem): Promise<Blob | undefined>;
  getFull(item: GalleryItem): Promise<Blob | undefined>;
  setCategory(item: GalleryItem, category: PhotoCategory): Promise<void>;
  /** Persists an edited copy back into the catalog. Omit to hide that action
   * (e.g. Drive browsing doesn't have a "local catalog" to save into). */
  saveCopy?(item: GalleryItem, blob: Blob): Promise<void>;
}

export interface GeocodeCacheEntry {
  key: string;
  label: string;
}

export interface ImageAdjustments {
  blur: number;
  sepia: boolean;
  grayscale: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  blur: 0,
  sepia: false,
  grayscale: false,
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

export function adjustmentsToCssFilter(a: ImageAdjustments): string {
  const parts: string[] = [];
  if (a.blur > 0) parts.push(`blur(${a.blur}px)`);
  if (a.sepia) parts.push("sepia(1)");
  if (a.grayscale) parts.push("grayscale(1)");
  if (a.brightness !== 100) parts.push(`brightness(${a.brightness}%)`);
  if (a.contrast !== 100) parts.push(`contrast(${a.contrast}%)`);
  if (a.saturation !== 100) parts.push(`saturate(${a.saturation}%)`);
  return parts.length > 0 ? parts.join(" ") : "none";
}

export function hasActiveAdjustments(a: ImageAdjustments): boolean {
  return (
    a.blur > 0 ||
    a.sepia ||
    a.grayscale ||
    a.brightness !== 100 ||
    a.contrast !== 100 ||
    a.saturation !== 100
  );
}
