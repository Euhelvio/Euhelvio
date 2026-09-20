import JSZip from "jszip";
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
  mediaEntries: JSZip.JSZipObject[],
  jsonEntries: JSZip.JSZipObject[]
): Map<string, JSZip.JSZipObject> {
  const jsonByDir = new Map<string, JSZip.JSZipObject[]>();
  for (const entry of jsonEntries) {
    const dir = dirOf(entry.name);
    const list = jsonByDir.get(dir) ?? [];
    list.push(entry);
    jsonByDir.set(dir, list);
  }

  const exactByPath = new Map<string, JSZip.JSZipObject>();
  for (const entry of jsonEntries) {
    const dir = dirOf(entry.name);
    const base = sidecarBaseName(baseNameOf(entry.name));
    exactByPath.set(`${dir}/${base}`, entry);
  }

  const claimed = new Set<string>();
  const result = new Map<string, JSZip.JSZipObject>();

  for (const media of mediaEntries) {
    const dir = dirOf(media.name);
    const mediaBase = baseNameOf(media.name);
    const exact = exactByPath.get(`${dir}/${mediaBase}`);
    if (exact && !claimed.has(exact.name)) {
      result.set(media.name, exact);
      claimed.add(exact.name);
      continue;
    }

    // Fallback: Takeout truncates very long filenames in the sidecar name.
    const candidates = (jsonByDir.get(dir) ?? []).filter(
      (j) => !claimed.has(j.name)
    );
    let best: JSZip.JSZipObject | undefined;
    let bestScore = 0;
    for (const candidate of candidates) {
      const candidateBase = sidecarBaseName(baseNameOf(candidate.name));
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
      result.set(media.name, best);
      claimed.add(best.name);
    }
  }

  return result;
}

async function parseSidecar(entry: JSZip.JSZipObject): Promise<ParsedSidecar> {
  try {
    const text = await entry.async("text");
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
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter((e) => !e.dir);
  const mediaEntries = entries.filter((e) => isImageFile(e.name));
  const jsonEntries = entries.filter((e) => isJsonFile(e.name));
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
    progress.currentFile = baseNameOf(entry.name);

    const ext = extOf(entry.name);
    const mime = IMAGE_MIME_BY_EXT[ext] ?? "application/octet-stream";
    const arrayBuffer = await entry.async("arraybuffer");
    const blob = new Blob([arrayBuffer], { type: mime });

    const decoded = await createThumbnail(blob);
    if (!decoded) {
      progress.skipped++;
      progress.processed++;
      onProgress?.({ ...progress });
      continue;
    }

    const sidecar = sidecarMap.get(entry.name);
    const meta = sidecar ? await parseSidecar(sidecar) : {};

    const record: PhotoRecord = {
      id: entry.name,
      fileName: baseNameOf(entry.name),
      mimeType: mime,
      blob,
      thumbBlob: decoded.thumbBlob,
      width: decoded.width,
      height: decoded.height,
      takenAt: meta.takenAt ?? Date.now(),
      lat: meta.lat,
      lng: meta.lng,
      category: "nao_classificado",
      albumName: albumNameFromPath(entry.name),
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

  progress.currentFile = undefined;
  progress.done = true;
  onProgress?.({ ...progress });
  return progress;
}
