import Dexie, { type Table } from "dexie";
import type { DriveFileMeta, GeocodeCacheEntry, PhotoRecord } from "./types";

export interface DriveConfigRow {
  key: "current";
  folderId: string;
  folderName: string;
}

class PhotoCatalogDB extends Dexie {
  photos!: Table<PhotoRecord, string>;
  geocodeCache!: Table<GeocodeCacheEntry, string>;
  driveFiles!: Table<DriveFileMeta, string>;
  driveConfig!: Table<DriveConfigRow, string>;

  constructor() {
    super("photo-catalog");
    this.version(1).stores({
      photos: "id, takenAt, category, albumName, [lat+lng]",
      geocodeCache: "key",
    });
    this.version(2).stores({
      photos: "id, takenAt, category, albumName, [lat+lng]",
      geocodeCache: "key",
      driveFiles: "id, takenAt, category, [lat+lng]",
      driveConfig: "key",
    });
  }
}

export const db = new PhotoCatalogDB();
