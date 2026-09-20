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

export interface PhotoRecord {
  id: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  thumbBlob: Blob;
  width: number;
  height: number;
  takenAt: number;
  lat?: number;
  lng?: number;
  locationName?: string;
  category: PhotoCategory;
  albumName?: string;
  importedAt: number;
}

export type PhotoListItem = Omit<PhotoRecord, "blob" | "thumbBlob">;

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
