"use client";

import { useEffect, useState } from "react";
import { useBlobImage } from "@/lib/useObjectUrl";
import type { BlobSource, GalleryItem } from "@/lib/types";

export default function PhotoThumb({
  item,
  blobSource,
  onClick,
}: {
  item: GalleryItem;
  blobSource: BlobSource;
  onClick: () => void;
}) {
  const [blob, setBlob] = useState<Blob | undefined>(undefined);
  const [loadedForId, setLoadedForId] = useState<string | null>(null);
  const imgRef = useBlobImage(blob);

  if (loadedForId !== item.id) {
    setLoadedForId(item.id);
    setBlob(undefined);
  }

  useEffect(() => {
    let cancelled = false;
    blobSource.getThumb(item).then((b) => {
      if (!cancelled) setBlob(b);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  return (
    <button
      onClick={onClick}
      className="relative aspect-square overflow-hidden rounded bg-black/5 dark:bg-white/5 group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        alt={item.fileName}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
      />
    </button>
  );
}
