"use client";

import { CATEGORY_LABELS, PHOTO_CATEGORIES, type PhotoCategory } from "@/lib/types";

export interface Filters {
  dateFrom: string;
  dateTo: string;
  categories: Set<PhotoCategory>;
  locationQuery: string;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  locationOptions: string[];
  onResolveLocations: () => void;
  resolvingLocations: boolean;
  pendingLocationCount: number;
  resultCount: number;
}

export default function FilterBar({
  filters,
  onChange,
  locationOptions,
  onResolveLocations,
  resolvingLocations,
  pendingLocationCount,
  resultCount,
}: FilterBarProps) {
  function toggleCategory(cat: PhotoCategory) {
    const next = new Set(filters.categories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    onChange({ ...filters, categories: next });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-black/10 dark:border-white/15 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs opacity-70">De</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
            className="border border-black/15 dark:border-white/20 rounded px-2 py-1 text-sm bg-transparent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs opacity-70">Até</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
            className="border border-black/15 dark:border-white/20 rounded px-2 py-1 text-sm bg-transparent"
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-xs opacity-70">Local</label>
          <input
            type="text"
            list="location-options"
            placeholder="Cidade, país…"
            value={filters.locationQuery}
            onChange={(e) => onChange({ ...filters, locationQuery: e.target.value })}
            className="border border-black/15 dark:border-white/20 rounded px-2 py-1 text-sm bg-transparent"
          />
          <datalist id="location-options">
            {locationOptions.map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>

        {pendingLocationCount > 0 && (
          <button
            onClick={onResolveLocations}
            disabled={resolvingLocations}
            className="text-sm px-3 py-1.5 rounded border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
          >
            {resolvingLocations
              ? "Resolvendo locais…"
              : `Resolver ${pendingLocationCount} local(is)`}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {PHOTO_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              filters.categories.has(cat)
                ? "bg-blue-600 text-white border-blue-600"
                : "border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <p className="text-xs opacity-60">{resultCount} foto(s) encontrada(s)</p>
    </div>
  );
}
