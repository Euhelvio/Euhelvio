import {
  BlobReader,
  BlobWriter,
  TextReader,
  TextWriter,
  ZipReader,
  ZipWriter,
  type FileEntry,
} from "@zip.js/zip.js";
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
  // Streams each photo's bytes straight into the zip (via Blob.slice()
  // ranges) instead of holding the whole archive in memory at once — the
  // same class of large-file issue that breaks importing a multi-GB
  // Takeout export can otherwise hit a large exported backup too.
  const zipWriter = new ZipWriter(new BlobWriter("application/zip"));
  const manifest: BackupManifestEntry[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const filePath = `${BLOBS_DIR}/${photo.id}`;
    await zipWriter.add(filePath, new BlobReader(photo.blob));
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
    onProgress?.({ total: photos.length, processed: i + 1, phase: "writing" });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const manifestPayload: BackupManifest = {
    version: 1,
    exportedAt: Date.now(),
    photos: manifest,
  };
  await zipWriter.add(MANIFEST_NAME, new TextReader(JSON.stringify(manifestPayload)));

  return zipWriter.close();
}

export interface RestoreResult {
  imported: number;
  skipped: number;
}

export async function importBackup(
  file: File | Blob,
  onProgress?: (p: BackupProgress) => void
): Promise<RestoreResult> {
  const zipReader = new ZipReader(new BlobReader(file));
  const allEntries = await zipReader.getEntries();
  const entryByPath = new Map(
    allEntries
      .filter((e): e is FileEntry => !e.directory)
      .map((e) => [e.filename, e] as const)
  );

  const manifestEntry = entryByPath.get(MANIFEST_NAME);
  if (!manifestEntry) {
    await zipReader.close();
    throw new Error("Arquivo de backup inválido: manifest.json não encontrado.");
  }

  const manifest: BackupManifest = JSON.parse(
    await manifestEntry.getData(new TextWriter())
  );
  const entries = manifest.photos ?? [];

  let imported = 0;
  let skipped = 0;
  let batch: PhotoRecord[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const fileEntry = entryByPath.get(entry.file);
    if (!fileEntry) {
      skipped++;
      onProgress?.({ total: entries.length, processed: i + 1, phase: "reading" });
      continue;
    }

    const arrayBuffer = await fileEntry.arrayBuffer();
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

  await zipReader.close();

  return { imported, skipped };
}
