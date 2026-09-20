"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "./db";
import {
  fetchDriveFileBlob,
  fetchDriveThumbnailBlob,
  listImagesInFolder,
  pickDriveFolder,
  requestAccessToken,
  requestAccessTokenSilently,
} from "./drive";
import { createThumbnail } from "./thumbnail";
import type { BlobSource, PhotoCategory } from "./types";

export function useDriveSession() {
  const [token, setToken] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // The chosen folder survives reloads; the access token never does (it's
  // short-lived and only ever kept in memory).
  useEffect(() => {
    db.driveConfig.get("current").then((row) => {
      if (row) {
        setFolderId(row.folderId);
        setFolderName(row.folderName);
      }
    });
  }, []);

  const connect = useCallback(async (): Promise<string | null> => {
    setConnecting(true);
    setError(null);
    try {
      const t = await requestAccessToken();
      setToken(t);
      return t;
    } catch {
      setError("Não foi possível conectar com sua conta Google.");
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const ensureToken = useCallback(async (): Promise<string | null> => {
    if (tokenRef.current) return tokenRef.current;
    const silent = await requestAccessTokenSilently();
    if (silent) {
      setToken(silent);
      return silent;
    }
    return connect();
  }, [connect]);

  const sync = useCallback(
    async (overrideFolderId?: string, overrideToken?: string) => {
      const fId = overrideFolderId ?? folderId;
      if (!fId) return;
      const t = overrideToken ?? (await ensureToken());
      if (!t) return;

      setSyncing(true);
      setError(null);
      setSyncedCount(0);
      try {
        const existing = await db.driveFiles.toArray();
        const categoryById = new Map(existing.map((f) => [f.id, f.category]));
        const files = await listImagesInFolder(
          fId,
          t,
          (p) => setSyncedCount(p.fetched),
          (id) => categoryById.get(id)
        );
        await db.transaction("rw", db.driveFiles, async () => {
          await db.driveFiles.clear();
          await db.driveFiles.bulkPut(files);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao listar as fotos do Drive.");
      } finally {
        setSyncing(false);
      }
    },
    [folderId, ensureToken]
  );

  const chooseFolder = useCallback(async () => {
    const t = await ensureToken();
    if (!t) return;
    const picked = await pickDriveFolder(t);
    if (!picked) return;
    await db.driveConfig.put({ key: "current", folderId: picked.id, folderName: picked.name });
    setFolderId(picked.id);
    setFolderName(picked.name);
    await sync(picked.id, t);
  }, [ensureToken, sync]);

  const disconnect = useCallback(async () => {
    setToken(null);
    setFolderId(null);
    setFolderName(null);
    await db.driveConfig.delete("current");
    await db.driveFiles.clear();
  }, []);

  const blobSource: BlobSource = useMemo(
    () => ({
      async getThumb(item) {
        if (item.kind !== "drive") return undefined;
        const t = await ensureToken();
        if (!t) return undefined;
        if (item.thumbnailLink) {
          const thumb = await fetchDriveThumbnailBlob(item.thumbnailLink, t);
          if (thumb) return thumb;
        }
        // Fallback: Drive's own thumbnail wasn't reachable with our token —
        // derive one from the full image instead.
        const full = await fetchDriveFileBlob(item.id, t);
        const generated = await createThumbnail(full);
        return generated?.thumbBlob ?? full;
      },
      async getFull(item) {
        if (item.kind !== "drive") return undefined;
        const t = await ensureToken();
        if (!t) return undefined;
        return fetchDriveFileBlob(item.id, t);
      },
      async setCategory(item, category: PhotoCategory) {
        await db.driveFiles.update(item.id, { category });
      },
    }),
    [ensureToken]
  );

  return {
    connected: folderId != null,
    connecting,
    folderName,
    syncing,
    syncedCount,
    error,
    connect,
    chooseFolder,
    sync: () => sync(),
    disconnect,
    blobSource,
  };
}
