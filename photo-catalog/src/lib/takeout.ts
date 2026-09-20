import { BlobReader, TextWriter, ZipReader, type FileEntry } from "@zip.js/zip.js";
import { db } from "./db";
import { createThumbnail } from "./thumbnail";
import type { PhotoRecord } from "./types";

const IMAGE_MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  heic: "image/heic",
  heif: "image/heif",
};

const BATCH_SIZE = 25;

export interface ImportProgress {
  total: number;
  processed: number;
  imported: number;
  skipped: number;
  currentFile?: string;
  done?: boolean;
}

interface ParsedSidecar {
  takenAt?: number;
  lat?: number;
  lng?: number;
}

function extOf(name: string): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name);
  return m ? m[1].toLowerCase() : "";
}

function isImageFile(name: string): boolean {
  return extOf(name) in IMAGE_MIME_BY_EXT;
}

function isJsonFile(name: string): boolean {
  return extOf(name) === "json";
}

function dirOf(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx === -1 ? "" : path.slice(0, idx);
}

function baseNameOf(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx === -1 ? path : path.slice(idx + 1);
}

/** Strips Google's ".json" / ".supplemental-metadata.json" sidecar suffixes. */
function sidecarBaseName(jsonName: string): string {
  return jsonName
    .replace(/\.supplemental-metadata(\(\d+\))?\.json$/i, "")
    .replace(/\.json$/i, "");
}

/** Matches each media entry to its Google Takeout metadata sidecar, if any. */
function buildSidecarMap(
  mediaEntries: FileEntry[],
  jsonEntries: FileEntry[]
): Map<string, FileEntry> {
  const jsonByDir = new Map<string, FileEntry[]>();
  for (const entry of jsonEntries) {
    const dir = dirOf(entry.filename);
    const list = jsonByDir.get(dir) ?? [];
    list.push(entry);
    jsonByDir.set(dir, list);
  }

  const exactByPath = new Map<string, FileEntry>();
  for (const entry of jsonEntries) {
    const dir = dirOf(entry.filename);
    const base = sidecarBaseName(baseNameOf(entry.filename));
    exactByPath.set(`${dir}/${base}`, entry);
  }

  const claimed = new Set<string>();
  const result = new Map<string, FileEntry>();

  for (const media of mediaEntries) {
    const dir = dirOf(media.filename);
    const mediaBase = baseNameOf(media.filename);
    const exact = exactByPath.get(`${dir}/${mediaBase}`);
    if (exact && !claimed.has(exact.filename)) {
      result.set(media.filename, exact);
      claimed.add(exact.filename);
      continue;
    }

    // Fallback: Takeout truncates very long filenames in the sidecar name.
    const candidates = (jsonByDir.get(dir) ?? []).filter(
      (j) => !claimed.has(j.filename)
    );
    let best: FileEntry | undefined;
    let bestScore = 0;
    for (const candidate of candidates) {
      const candidateBase = sidecarBaseName(baseNameOf(candidate.filename));
      let common = 0;
      const max = Math.min(candidateBase.length, mediaBase.length);
      while (common < max && candidateBase[common] === mediaBase[common]) {
        common++;
      }
      if (common > bestScore && common >= mediaBase.length - 8) {
        bestScore = common;
        best = candidate;
      }
    }
    if (best) {
      result.set(media.filename, best);
      claimed.add(best.filename);
    }
  }

  return result;
}

async function parseSidecar(entry: FileEntry): Promise<ParsedSidecar> {
  try {
    const text = await entry.getData(new TextWriter());
    const json = JSON.parse(text);
    const result: ParsedSidecar = {};

    const takenTs = json?.photoTakenTime?.timestamp ?? json?.creationTime?.timestamp;
    if (takenTs) {
      result.takenAt = Number(takenTs) * 1000;
    }

    const geo = json?.geoData ?? json?.geoDataExif;
    if (geo && (geo.latitude !== 0 || geo.longitude !== 0)) {
      result.lat = geo.latitude;
      result.lng = geo.longitude;
    }

    return result;
  } catch {
    return {};
  }
}

function albumNameFromPath(path: string): string | undefined {
  const parts = path.split("/").filter(Boolean);
  // Typical layout: Takeout/Google Fotos/<Album>/<file>
  const gfIdx = parts.findIndex((p) => p.toLowerCase().includes("photos") || p.toLowerCase().includes("fotos"));
  if (gfIdx !== -1 && parts.length > gfIdx + 2) {
    return parts[gfIdx + 1];
  }
  return undefined;
}

export async function importTakeoutZip(
  file: File | Blob,
  onProgress?: (p: ImportProgress) => void
): Promise<ImportProgress> {
  // Reads the zip's central directory and each entry's bytes via Blob.slice()
  // ranges instead of loading the whole archive into memory — JSZip's
  // whole-file read makes Chrome throw a NotReadableError on multi-GB
  // Takeout exports (a real, fairly common size for a photo library).
  const zipReader = new ZipReader(new BlobReader(file));
  const allEntries = await zipReader.getEntries();
  const entries = allEntries.filter((e): e is FileEntry => !e.directory);
  const mediaEntries = entries.filter((e) => isImageFile(e.filename));
  const jsonEntries = entries.filter((e) => isJsonFile(e.filename));
  const sidecarMap = buildSidecarMap(mediaEntries, jsonEntries);

  const progress: ImportProgress = {
    total: mediaEntries.length,
    processed: 0,
    imported: 0,
    skipped: 0,
  };
  onProgress?.({ ...progress });

  let batch: PhotoRecord[] = [];

  for (const entry of mediaEntries) {
    progress.currentFile = baseNameOf(entry.filename);

    const ext = extOf(entry.filename);
    const mime = IMAGE_MIME_BY_EXT[ext] ?? "application/octet-stream";
    const arrayBuffer = await entry.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: mime });

    const decoded = await createThumbnail(blob);
    if (!decoded) {
      progress.skipped++;
      progress.processed++;
      onProgress?.({ ...progress });
      continue;
    }

    const sidecar = sidecarMap.get(entry.filename);
    const meta = sidecar ? await parseSidecar(sidecar) : {};

    const record: PhotoRecord = {
      kind: "local",
      id: entry.filename,
      fileName: baseNameOf(entry.filename),
      mimeType: mime,
      blob,
      thumbBlob: decoded.thumbBlob,
      width: decoded.width,
      height: decoded.height,
      takenAt: meta.takenAt ?? Date.now(),
      lat: meta.lat,
      lng: meta.lng,
      category: "nao_classificado",
      albumName: albumNameFromPath(entry.filename),
      importedAt: Date.now(),
    };

    batch.push(record);
    progress.imported++;
    progress.processed++;

    if (batch.length >= BATCH_SIZE) {
      await db.photos.bulkPut(batch);
      batch = [];
    }

    onProgress?.({ ...progress });
    // Yield to the event loop so the UI stays responsive on large imports.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  if (batch.length > 0) {
    await db.photos.bulkPut(batch);
  }

  await zipReader.close();

  progress.currentFile = undefined;
  progress.done = true;
  onProgress?.({ ...progress });
  return progress;
}
