"use client";

import type { BlobSource, GalleryItem } from "@/lib/types";
import PhotoThumb from "./PhotoThumb";

export default function Gallery({
  items,
  blobSource,
  onOpen,
  emptyMessage,
}: {
  items: GalleryItem[];
  blobSource: BlobSource;
  onOpen: (index: number) => void;
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm opacity-70 py-12 text-center rounded-lg border border-black/10 dark:border-white/15 bg-white/85 dark:bg-black/55 backdrop-blur-sm shadow-sm">
        {emptyMessage ?? "Nenhuma foto para exibir."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
      {items.map((item, i) => (
        <PhotoThumb key={item.id} item={item} blobSource={blobSource} onClick={() => onOpen(i)} />
      ))}
    </div>
  );
}
