"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { db } from "@/lib/db";
import { resolveMissingLocations, type GeocodeProgress } from "@/lib/geocode";
import type { PhotoCategory, PhotoRecord } from "@/lib/types";
import ImportPanel from "@/components/ImportPanel";
import FilterBar, { type Filters } from "@/components/FilterBar";
import Gallery from "@/components/Gallery";
import Viewer from "@/components/Viewer";

const EMPTY_FILTERS: Filters = {
  dateFrom: "",
  dateTo: "",
  categories: new Set<PhotoCategory>(),
  locationQuery: "",
};

export default function Home() {
  const allPhotos = useLiveQuery(() => db.photos.orderBy("takenAt").reverse().toArray(), []);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [geoProgress, setGeoProgress] = useState<GeocodeProgress | null>(null);

  const photos = useMemo(() => allPhotos ?? [], [allPhotos]);

  const filtered = useMemo(() => {
    const from = filters.dateFrom ? new Date(filters.dateFrom).getTime() : undefined;
    const to = filters.dateTo ? new Date(filters.dateTo).getTime() + 86_400_000 : undefined;
    const locationQuery = filters.locationQuery.trim().toLowerCase();

    return photos.filter((p: PhotoRecord) => {
      if (from !== undefined && p.takenAt < from) return false;
      if (to !== undefined && p.takenAt > to) return false;
      if (filters.categories.size > 0 && !filters.categories.has(p.category)) return false;
      if (locationQuery && !p.locationName?.toLowerCase().includes(locationQuery)) return false;
      return true;
    });
  }, [photos, filters]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of photos) if (p.locationName) set.add(p.locationName);
    return Array.from(set).sort();
  }, [photos]);

  const pendingLocationCount = useMemo(
    () => photos.filter((p) => p.lat !== undefined && p.lng !== undefined && !p.locationName).length,
    [photos]
  );

  async function handleResolveLocations() {
    setGeoProgress({ total: 0, processed: 0 });
    await resolveMissingLocations((p) => setGeoProgress(p));
    setGeoProgress(null);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white">
      <main className="mx-auto max-w-6xl px-4 py-8 flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold">Catálogo de Fotos</h1>
          <p className="text-sm opacity-70">
            Importado do Google Takeout, armazenado localmente no seu navegador.
          </p>
        </header>

        <ImportPanel />

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
          <p className="text-xs opacity-60">
            Resolvendo locais: {geoProgress.processed}/{geoProgress.total}
            {geoProgress.currentLabel ? ` — ${geoProgress.currentLabel}` : ""}
          </p>
        )}

        <Gallery photos={filtered} onOpen={setViewerIndex} />
      </main>

      {viewerIndex !== null && filtered[viewerIndex] && (
        <Viewer
          photos={filtered}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}
