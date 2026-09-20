"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { db } from "@/lib/db";
import { resolveMissingLocations, type GeocodeProgress } from "@/lib/geocode";
import { localBlobSource } from "@/lib/localBlobSource";
import { useDriveSession } from "@/lib/useDriveSession";
import type { GalleryItem, PhotoCategory } from "@/lib/types";
import ImportPanel from "@/components/ImportPanel";
import BackupPanel from "@/components/BackupPanel";
import DriveConnectPanel from "@/components/DriveConnectPanel";
import FilterBar, { type Filters } from "@/components/FilterBar";
import Gallery from "@/components/Gallery";
import Viewer from "@/components/Viewer";

type Mode = "local" | "drive";

const EMPTY_FILTERS: Filters = {
  dateFrom: "",
  dateTo: "",
  categories: new Set<PhotoCategory>(),
  locationQuery: "",
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("local");
  const drive = useDriveSession();

  const allLocalPhotos = useLiveQuery(() => db.photos.orderBy("takenAt").reverse().toArray(), []);
  const allDriveFiles = useLiveQuery(
    () => db.driveFiles.orderBy("takenAt").reverse().toArray(),
    []
  );

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [geoProgress, setGeoProgress] = useState<GeocodeProgress | null>(null);

  const localPhotos = useMemo(() => allLocalPhotos ?? [], [allLocalPhotos]);
  const driveFiles = useMemo(() => allDriveFiles ?? [], [allDriveFiles]);

  const items: GalleryItem[] = mode === "local" ? localPhotos : driveFiles;
  const blobSource = mode === "local" ? localBlobSource : drive.blobSource;

  // Switching modes clears filters/viewer so a selection from one catalog
  // doesn't linger in the other ("adjust state during render" pattern —
  // see the note on shownIndex in Viewer.tsx for why not an effect).
  const [shownMode, setShownMode] = useState(mode);
  if (shownMode !== mode) {
    setShownMode(mode);
    setFilters(EMPTY_FILTERS);
    setViewerIndex(null);
  }

  const filtered = useMemo(() => {
    const from = filters.dateFrom ? new Date(filters.dateFrom).getTime() : undefined;
    const to = filters.dateTo ? new Date(filters.dateTo).getTime() + 86_400_000 : undefined;
    const locationQuery = filters.locationQuery.trim().toLowerCase();

    return items.filter((p) => {
      if (from !== undefined && p.takenAt < from) return false;
      if (to !== undefined && p.takenAt > to) return false;
      if (filters.categories.size > 0 && !filters.categories.has(p.category)) return false;
      if (locationQuery && !p.locationName?.toLowerCase().includes(locationQuery)) return false;
      return true;
    });
  }, [items, filters]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of items) if (p.locationName) set.add(p.locationName);
    return Array.from(set).sort();
  }, [items]);

  const pendingLocationCount = useMemo(
    () => items.filter((p) => p.lat !== undefined && p.lng !== undefined && !p.locationName).length,
    [items]
  );

  async function handleResolveLocations() {
    setGeoProgress({ total: 0, processed: 0 });
    if (mode === "local") {
      await resolveMissingLocations(
        () => db.photos.toArray(),
        (ids, label) => db.photos.where("id").anyOf(ids).modify({ locationName: label }).then(() => {}),
        (p) => setGeoProgress(p)
      );
    } else {
      await resolveMissingLocations(
        () => db.driveFiles.toArray(),
        (ids, label) =>
          db.driveFiles.where("id").anyOf(ids).modify({ locationName: label }).then(() => {}),
        (p) => setGeoProgress(p)
      );
    }
    setGeoProgress(null);
  }

  return (
    <div className="relative min-h-screen text-black dark:text-white">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url(/hero-guimaraes.jpg)" }}
        aria-hidden
      />
      <div className="fixed inset-0 -z-10 bg-white/55 dark:bg-black/70" aria-hidden />

      <main className="mx-auto max-w-6xl px-4 py-8 flex flex-col gap-6">
        <header>
          <h1 className="text-3xl font-semibold drop-shadow-sm">Catálogo de Fotos</h1>
          <p className="text-sm opacity-80">
            Importe do Google Takeout, ou navegue direto de uma pasta do Google Drive.
          </p>
        </header>

        <div className="flex gap-1 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-sm p-1 w-fit">
          <ModeTab active={mode === "local"} onClick={() => setMode("local")}>
            Importado localmente
          </ModeTab>
          <ModeTab active={mode === "drive"} onClick={() => setMode("drive")}>
            Google Drive
          </ModeTab>
        </div>

        {mode === "local" ? (
          <>
            <ImportPanel />
            <BackupPanel photoCount={localPhotos.length} />
          </>
        ) : (
          <DriveConnectPanel
            connected={drive.connected}
            connecting={drive.connecting}
            syncing={drive.syncing}
            syncedCount={drive.syncedCount}
            folderName={drive.folderName}
            error={drive.error}
            onChooseFolder={drive.chooseFolder}
            onSync={drive.sync}
            onDisconnect={drive.disconnect}
          />
        )}

        <FilterBar
          filters={filters}
          onChange={setFilters}
          locationOptions={locationOptions}
          onResolveLocations={handleResolveLocations}
          resolvingLocations={geoProgress != null}
          pendingLocationCount={pendingLocationCount}
          resultCount={filtered.length}
        />

        {geoProgress && (
          <p className="text-xs opacity-80 px-3 py-2 rounded-md w-fit bg-white/85 dark:bg-black/55 backdrop-blur-sm shadow-sm">
            Resolvendo locais: {geoProgress.processed}/{geoProgress.total}
            {geoProgress.currentLabel ? ` — ${geoProgress.currentLabel}` : ""}
          </p>
        )}

        <Gallery
          items={filtered}
          blobSource={blobSource}
          onOpen={setViewerIndex}
          emptyMessage={
            mode === "local"
              ? "Nenhuma foto para exibir. Importe um arquivo do Google Takeout ou ajuste os filtros."
              : "Nenhuma foto para exibir. Conecte uma pasta do Google Drive ou ajuste os filtros."
          }
        />
      </main>

      {viewerIndex !== null && filtered[viewerIndex] && (
        <Viewer
          items={filtered}
          blobSource={blobSource}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-4 py-1.5 rounded-full transition-colors ${
        active
          ? "bg-white dark:bg-zinc-800 shadow-sm font-medium"
          : "opacity-70 hover:opacity-100"
      }`}
    >
      {children}
    </button>
  );
}
