import { DRIVE_SCOPE, GOOGLE_API_KEY, GOOGLE_CLIENT_ID } from "./googleConfig";
import type { DriveFileMeta, PhotoCategory } from "./types";

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GAPI_SCRIPT_SRC = "https://apis.google.com/js/api.js";
const DRIVE_API_ROOT = "https://www.googleapis.com/drive/v3";

// The GIS/Picker/gapi globals come from scripts loaded at runtime — there's
// no first-party type package worth pulling in for a handful of calls.
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function loadScriptOnce(src: string): Promise<void> {
  if (document.querySelector(`script[src="${src}"]`)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.head.appendChild(script);
  });
}

async function getTokenClient(onToken: (token: string) => void) {
  await loadScriptOnce(GIS_SCRIPT_SRC);
  return window.google!.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: (resp: { access_token?: string; error?: string }) => {
      if (resp.access_token) onToken(resp.access_token);
    },
  });
}

/** Opens Google's sign-in/consent popup and resolves with an access token. */
export function requestAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    getTokenClient((token) => resolve(token))
      .then((client) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (client as any).requestAccessToken({ prompt: "consent" });
      })
      .catch(reject);
  });
}

/** Tries to get a new token without showing UI (works if the browser still
 * has an active Google session and prior consent) — falls back to null so
 * the caller can prompt the user to reconnect instead of failing silently. */
export function requestAccessTokenSilently(): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    getTokenClient((token) => {
      settled = true;
      resolve(token);
    })
      .then((client) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (client as any).requestAccessToken({ prompt: "" });
        setTimeout(() => {
          if (!settled) resolve(null);
        }, 4000);
      })
      .catch(() => resolve(null));
  });
}

export interface PickedFolder {
  id: string;
  name: string;
}

/** Opens the Google Picker UI scoped to folders and resolves with the one
 * the user chose, or null if they cancelled. */
export function pickDriveFolder(accessToken: string): Promise<PickedFolder | null> {
  return new Promise((resolve, reject) => {
    loadScriptOnce(GAPI_SCRIPT_SRC)
      .then(
        () =>
          new Promise<void>((res) => {
            window.gapi!.load("picker", () => res());
          })
      )
      .then(() => {
        const google = window.google!;
        const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
          .setSelectFolderEnabled(true)
          .setIncludeFolders(true)
          .setMimeTypes("application/vnd.google-apps.folder");

        const picker = new google.picker.PickerBuilder()
          .addView(view)
          .setOAuthToken(accessToken)
          .setDeveloperKey(GOOGLE_API_KEY)
          .setTitle("Escolha a pasta com suas fotos")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .setCallback((data: any) => {
            if (data.action === google.picker.Action.PICKED) {
              const doc = data.docs[0];
              resolve({ id: doc.id, name: doc.name });
            } else if (data.action === google.picker.Action.CANCEL) {
              resolve(null);
            }
          })
          .build();
        picker.setVisible(true);
      })
      .catch(reject);
  });
}

interface DriveApiFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
  createdTime?: string;
  imageMediaMetadata?: {
    width?: number;
    height?: number;
    time?: string;
    location?: { latitude?: number; longitude?: number };
  };
}

function parseDriveTime(value: string | undefined): number | undefined {
  if (!value) return undefined;
  // imageMediaMetadata.time has no timezone (EXIF-style "YYYY-MM-DD HH:MM:SS");
  // treating it as local time is close enough for filtering purposes.
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const ts = new Date(normalized).getTime();
  return Number.isNaN(ts) ? undefined : ts;
}

function toDriveFileMeta(file: DriveApiFile, existingCategory?: PhotoCategory): DriveFileMeta {
  const meta = file.imageMediaMetadata;
  const loc = meta?.location;
  return {
    kind: "drive",
    id: file.id,
    fileName: file.name,
    mimeType: file.mimeType,
    width: meta?.width,
    height: meta?.height,
    takenAt: parseDriveTime(meta?.time) ?? parseDriveTime(file.createdTime) ?? Date.now(),
    lat: loc?.latitude,
    lng: loc?.longitude,
    category: existingCategory ?? "nao_classificado",
    thumbnailLink: file.thumbnailLink,
    size: file.size ? Number(file.size) : undefined,
  };
}

export interface DriveListProgress {
  fetched: number;
}

/** Lists every image file directly inside a Drive folder (paginated). */
export async function listImagesInFolder(
  folderId: string,
  accessToken: string,
  onProgress?: (p: DriveListProgress) => void,
  categoryFor?: (fileId: string) => PhotoCategory | undefined
): Promise<DriveFileMeta[]> {
  const results: DriveFileMeta[] = [];
  let pageToken: string | undefined;

  const query = `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`;
  const fields =
    "nextPageToken,files(id,name,mimeType,size,thumbnailLink,createdTime,imageMediaMetadata(width,height,time,location))";

  do {
    const url = new URL(`${DRIVE_API_ROOT}/files`);
    url.searchParams.set("q", query);
    url.searchParams.set("fields", fields);
    url.searchParams.set("pageSize", "1000");
    url.searchParams.set("spaces", "drive");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Drive API ${res.status}: ${body.slice(0, 300)}`);
    }
    const json = await res.json();
    for (const file of (json.files ?? []) as DriveApiFile[]) {
      results.push(toDriveFileMeta(file, categoryFor?.(file.id)));
    }
    pageToken = json.nextPageToken;
    onProgress?.({ fetched: results.length });
  } while (pageToken);

  return results;
}

/** Downloads a Drive file's raw bytes (used for the full-resolution photo). */
export async function fetchDriveFileBlob(fileId: string, accessToken: string): Promise<Blob> {
  const res = await fetch(`${DRIVE_API_ROOT}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Drive API ${res.status} ao baixar a foto`);
  return res.blob();
}

/** Fetches a Drive-generated thumbnail; falls back to null so the caller can
 * derive one from the full image instead (thumbnailLink isn't guaranteed to
 * accept a bearer token the same way the Drive API itself does). */
export async function fetchDriveThumbnailBlob(
  thumbnailLink: string,
  accessToken: string
): Promise<Blob | null> {
  try {
    const res = await fetch(thumbnailLink, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}
