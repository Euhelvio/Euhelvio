"use client";

import { useBlobImage } from "@/lib/useObjectUrl";
import type { PhotoRecord } from "@/lib/types";

export default function PhotoThumb({
  photo,
  onClick,
}: {
  photo: PhotoRecord;
  onClick: () => void;
}) {
  const imgRef = useBlobImage(photo.thumbBlob);

  return (
    <button
      onClick={onClick}
      className="relative aspect-square overflow-hidden rounded bg-black/5 dark:bg-white/5 group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        alt={photo.fileName}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
      />
    </button>
  );
}
