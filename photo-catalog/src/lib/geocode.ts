import { db } from "./db";

// Uses OpenStreetMap Nominatim (free, no API key). Its usage policy caps
// requests at ~1/s and is meant for light, non-commercial use — fine for a
// personal catalog, but keep the queue serialized and the cache aggressive.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const MIN_REQUEST_GAP_MS = 1100;
const CACHE_PRECISION = 2; // ~1.1km buckets, keeps request volume low

let lastRequestAt = 0;

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(CACHE_PRECISION)},${lng.toFixed(CACHE_PRECISION)}`;
}

async function throttle() {
  const wait = lastRequestAt + MIN_REQUEST_GAP_MS - Date.now();
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();
}

async function fetchLabel(lat: number, lng: number): Promise<string> {
  await throttle();
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const json = await res.json();
  const addr = json?.address ?? {};
  const place = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county;
  const country = addr.country;
  return [place, country].filter(Boolean).join(", ") || json?.display_name || "Local desconhecido";
}

async function resolveLabel(lat: number, lng: number): Promise<string> {
  const key = cacheKey(lat, lng);
  const cached = await db.geocodeCache.get(key);
  if (cached) return cached.label;

  const label = await fetchLabel(lat, lng);
  await db.geocodeCache.put({ key, label });
  return label;
}

export interface GeocodeProgress {
  total: number;
  processed: number;
  currentLabel?: string;
}

/** Resolves location names for every stored photo that has coordinates but no label yet. */
export async function resolveMissingLocations(
  onProgress?: (p: GeocodeProgress) => void
): Promise<void> {
  const photos = await db.photos
    .filter((p) => p.lat !== undefined && p.lng !== undefined && !p.locationName)
    .toArray();

  const buckets = new Map<string, { lat: number; lng: number; ids: string[] }>();
  for (const photo of photos) {
    const key = cacheKey(photo.lat!, photo.lng!);
    const bucket = buckets.get(key) ?? { lat: photo.lat!, lng: photo.lng!, ids: [] };
    bucket.ids.push(photo.id);
    buckets.set(key, bucket);
  }

  const progress: GeocodeProgress = { total: buckets.size, processed: 0 };
  onProgress?.({ ...progress });

  for (const bucket of buckets.values()) {
    try {
      const label = await resolveLabel(bucket.lat, bucket.lng);
      progress.currentLabel = label;
      await db.photos.where("id").anyOf(bucket.ids).modify({ locationName: label });
    } catch {
      // Leave unresolved; a later call will retry.
    } finally {
      progress.processed++;
      onProgress?.({ ...progress });
    }
  }
}
