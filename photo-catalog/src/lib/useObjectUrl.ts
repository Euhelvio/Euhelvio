"use client";

import { useEffect, useRef } from "react";

/**
 * Binds a Blob to an <img> element via an object URL, revoking it on
 * cleanup. The URL is created *inside* the effect (not memoized) so each
 * effect run owns its own URL — under React Strict Mode's dev-only double
 * effect invocation, memoizing the URL and revoking it from a separate
 * effect would revoke the one live URL after its first (simulated) cleanup,
 * leaving the <img> pointing at a dead blob: URL.
 */
export function useBlobImage(blob: Blob | undefined | null) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!blob || !el) return;
    const url = URL.createObjectURL(blob);
    el.src = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return ref;
}
