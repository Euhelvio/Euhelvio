import Dexie, { type Table } from "dexie";
import type { GeocodeCacheEntry, PhotoRecord } from "./types";

class PhotoCatalogDB extends Dexie {
  photos!: Table<PhotoRecord, string>;
  geocodeCache!: Table<GeocodeCacheEntry, string>;

  constructor() {
    super("photo-catalog");
    this.version(1).stores({
      photos: "id, takenAt, category, albumName, [lat+lng]",
      geocodeCache: "key",
    });
  }
}

export const db = new PhotoCatalogDB();
