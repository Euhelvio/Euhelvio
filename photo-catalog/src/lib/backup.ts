import JSZip from "jszip";
import { db } from "./db";
import { createThumbnail } from "./thumbnail";
import type { PhotoListItem, PhotoRecord } from "./types";

const MANIFEST_NAME = "manifest.json";
const BLOBS_DIR = "blobs";
const BATCH_SIZE = 25;

interface BackupManifestEntry extends PhotoListItem {
  file: string;
}

interface BackupManifest {
  version: 1;
  exportedAt: number;
  photos: BackupManifestEntry[];
}

export interface BackupProgress {
  total: number;
  processed: number;
  phase: "reading" | "writing";
}

export async function exportBackup(
  onProgress?: (p: BackupProgress) => void
): Promise<Blob> {
  const photos = await db.photos.toArray();
  const zip = new JSZip();
  const manifest: BackupManifestEntry[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const filePath = `${BLOBS_DIR}/${photo.id}`;
    zip.file(filePath, photo.blob);
    manifest.push({
      id: photo.id,
      fileName: photo.fileName,
      mimeType: photo.mimeType,
      width: photo.width,
      height: photo.height,
      takenAt: photo.takenAt,
      lat: photo.lat,
      lng: photo.lng,
      locationName: photo.locationName,
      category: photo.category,
      albumName: photo.albumName,
      importedAt: photo.importedAt,
      file: filePath,
    });
    onProgress?.({ total: photos.length, processed: i + 1, phase: "reading" });
  }

  const manifestPayload: BackupManifest = {
    version: 1,
    exportedAt: Date.now(),
    photos: manifest,
  };
  zip.file(MANIFEST_NAME, JSON.stringify(manifestPayload));

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" }, (metadata) => {
    onProgress?.({
      total: 100,
      processed: Math.round(metadata.percent),
      phase: "writing",
    });
  });
}

export interface RestoreResult {
  imported: number;
  skipped: number;
}

export async function importBackup(
  file: File | Blob,
  onProgress?: (p: BackupProgress) => void
): Promise<RestoreResult> {
  const zip = await JSZip.loadAsync(file);
  const manifestEntry = zip.file(MANIFEST_NAME);
  if (!manifestEntry) {
    throw new Error("Arquivo de backup inválido: manifest.json não encontrado.");
  }

  const manifest: BackupManifest = JSON.parse(await manifestEntry.async("text"));
  const entries = manifest.photos ?? [];

  let imported = 0;
  let skipped = 0;
  let batch: PhotoRecord[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const fileEntry = zip.file(entry.file);
    if (!fileEntry) {
      skipped++;
      continue;
    }

    const arrayBuffer = await fileEntry.async("arraybuffer");
    const blob = new Blob([arrayBuffer], { type: entry.mimeType });
    const thumb = await createThumbnail(blob);
    if (!thumb) {
      skipped++;
      onProgress?.({ total: entries.length, processed: i + 1, phase: "reading" });
      continue;
    }

    batch.push({
      id: entry.id,
      fileName: entry.fileName,
      mimeType: entry.mimeType,
      blob,
      thumbBlob: thumb.thumbBlob,
      width: entry.width,
      height: entry.height,
      takenAt: entry.takenAt,
      lat: entry.lat,
      lng: entry.lng,
      locationName: entry.locationName,
      category: entry.category,
      albumName: entry.albumName,
      importedAt: entry.importedAt,
    });
    imported++;

    if (batch.length >= BATCH_SIZE) {
      await db.photos.bulkPut(batch);
      batch = [];
    }

    onProgress?.({ total: entries.length, processed: i + 1, phase: "reading" });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  if (batch.length > 0) {
    await db.photos.bulkPut(batch);
  }

  return { imported, skipped };
}
