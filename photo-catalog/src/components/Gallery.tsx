"use client";

import type { PhotoRecord } from "@/lib/types";
import PhotoThumb from "./PhotoThumb";

export default function Gallery({
  photos,
  onOpen,
}: {
  photos: PhotoRecord[];
  onOpen: (index: number) => void;
}) {
  if (photos.length === 0) {
    return (
      <p className="text-sm opacity-60 py-12 text-center">
        Nenhuma foto para exibir. Importe um arquivo do Google Takeout ou
        ajuste os filtros.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
      {photos.map((photo, i) => (
        <PhotoThumb key={photo.id} photo={photo} onClick={() => onOpen(i)} />
      ))}
    </div>
  );
}
