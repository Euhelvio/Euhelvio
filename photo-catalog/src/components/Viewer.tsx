"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/lib/db";
import { renderFilteredBlob } from "@/lib/filters";
import { createThumbnail } from "@/lib/thumbnail";
import { useBlobImage } from "@/lib/useObjectUrl";
import {
  adjustmentsToCssFilter,
  CATEGORY_LABELS,
  DEFAULT_ADJUSTMENTS,
  hasActiveAdjustments,
  PHOTO_CATEGORIES,
  type ImageAdjustments,
  type PhotoCategory,
  type PhotoRecord,
} from "@/lib/types";

const SWIPE_THRESHOLD = 60;
const ZOOM_SCALE = 2.5;

export default function Viewer({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: PhotoRecord[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const photo = photos[index];
  const imgRef = useBlobImage(photo?.blob);

  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [editOpen, setEditOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [shownIndex, setShownIndex] = useState(index);

  const dragState = useRef<{ startX: number; startY: number; panning: boolean } | null>(null);

  // Reset per-photo UI state when navigating, without an effect (React's
  // recommended "adjust state during render" pattern for resetting state in
  // response to a prop change — see https://react.dev/learn/you-might-not-need-an-effect).
  if (shownIndex !== index) {
    setShownIndex(index);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setEditOpen(false);
    setScale(1);
    setMessage(null);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goTo(index - 1);
      else if (e.key === "ArrowRight") goTo(index + 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, photos.length]);

  function goTo(next: number) {
    if (next < 0 || next >= photos.length) return;
    onIndexChange(next);
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragState.current = { startX: e.clientX, startY: e.clientY, panning: scale > 1 };
  }

  function handlePointerUp(e: React.PointerEvent) {
    const start = dragState.current;
    dragState.current = null;
    if (!start || scale > 1) return;
    const dx = e.clientX - start.startX;
    const dy = e.clientY - start.startY;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      goTo(dx < 0 ? index + 1 : index - 1);
    }
  }

  function handleDoubleClick() {
    setScale((s) => (s > 1 ? 1 : ZOOM_SCALE));
  }

  const cssFilter = useMemo(() => adjustmentsToCssFilter(adjustments), [adjustments]);
  const dirty = hasActiveAdjustments(adjustments);

  async function getOutputBlob(): Promise<Blob> {
    if (!photo) throw new Error("Nenhuma foto selecionada");
    return dirty ? renderFilteredBlob(photo.blob, adjustments) : photo.blob;
  }

  async function handleSaveCopy() {
    if (!photo) return;
    setBusy(true);
    setMessage(null);
    try {
      const blob = await getOutputBlob();
      const thumb = await createThumbnail(blob);
      const copy: PhotoRecord = {
        ...photo,
        id: `${photo.id}::edit-${Date.now()}`,
        fileName: `editada-${photo.fileName}`,
        mimeType: "image/jpeg",
        blob,
        thumbBlob: thumb?.thumbBlob ?? photo.thumbBlob,
        width: thumb?.width ?? photo.width,
        height: thumb?.height ?? photo.height,
        importedAt: Date.now(),
      };
      await db.photos.put(copy);
      setMessage("Cópia salva no catálogo.");
    } catch {
      setMessage("Não foi possível salvar a cópia.");
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (!photo) return;
    setBusy(true);
    setMessage(null);
    try {
      const blob = await getOutputBlob();
      const file = new File([blob], photo.fileName.replace(/\.\w+$/, ".jpg"), {
        type: blob.type || "image/jpeg",
      });

      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: photo.fileName });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        setMessage("Compartilhamento direto não suportado; baixamos o arquivo.");
      }
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") {
        setMessage("Não foi possível compartilhar a imagem.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCategoryChange(category: PhotoCategory) {
    if (!photo) return;
    await db.photos.update(photo.id, { category });
  }

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 text-white/90 bg-black/60">
        <button onClick={onClose} className="text-sm px-2 py-1 hover:bg-white/10 rounded">
          ✕ Fechar
        </button>
        <span className="text-xs opacity-70">
          {index + 1} / {photos.length}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setInfoOpen((v) => !v)}
            className="text-sm px-2 py-1 hover:bg-white/10 rounded"
          >
            Info
          </button>
          <button
            onClick={() => setEditOpen((v) => !v)}
            className="text-sm px-2 py-1 hover:bg-white/10 rounded"
          >
            Filtros
          </button>
        </div>
      </div>

      <div
        className="relative flex-1 overflow-hidden flex items-center justify-center touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      >
        {index > 0 && (
          <button
            onClick={() => goTo(index - 1)}
            className="absolute left-2 z-10 text-white/70 hover:text-white text-3xl px-2"
            aria-label="Foto anterior"
          >
            ‹
          </button>
        )}
        {index < photos.length - 1 && (
          <button
            onClick={() => goTo(index + 1)}
            className="absolute right-2 z-10 text-white/70 hover:text-white text-3xl px-2"
            aria-label="Próxima foto"
          >
            ›
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          alt={photo.fileName}
          className="max-w-full max-h-full object-contain transition-transform"
          style={{ filter: cssFilter, transform: `scale(${scale})` }}
          draggable={false}
        />
      </div>

      {infoOpen && (
        <div className="px-4 py-3 bg-black/80 text-white/90 text-sm flex flex-wrap gap-x-6 gap-y-2">
          <span>{new Date(photo.takenAt).toLocaleString("pt-BR")}</span>
          <span>{photo.locationName ?? "Local não resolvido"}</span>
          <label className="flex items-center gap-2">
            Tipo:
            <select
              value={photo.category}
              onChange={(e) => handleCategoryChange(e.target.value as PhotoCategory)}
              className="bg-black/40 border border-white/20 rounded px-1 py-0.5"
            >
              {PHOTO_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {editOpen && (
        <div className="px-4 py-3 bg-black/85 text-white/90 text-sm flex flex-col gap-3">
          <div className="flex flex-wrap gap-4">
            <Slider
              label="Desfoque"
              value={adjustments.blur}
              min={0}
              max={10}
              step={0.5}
              onChange={(v) => setAdjustments((a) => ({ ...a, blur: v }))}
            />
            <Slider
              label="Brilho"
              value={adjustments.brightness}
              min={50}
              max={150}
              step={1}
              unit="%"
              onChange={(v) => setAdjustments((a) => ({ ...a, brightness: v }))}
            />
            <Slider
              label="Contraste"
              value={adjustments.contrast}
              min={50}
              max={150}
              step={1}
              unit="%"
              onChange={(v) => setAdjustments((a) => ({ ...a, contrast: v }))}
            />
            <Slider
              label="Saturação"
              value={adjustments.saturation}
              min={0}
              max={200}
              step={1}
              unit="%"
              onChange={(v) => setAdjustments((a) => ({ ...a, saturation: v }))}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ToggleButton
              active={adjustments.sepia}
              onClick={() => setAdjustments((a) => ({ ...a, sepia: !a.sepia, grayscale: false }))}
            >
              Sépia
            </ToggleButton>
            <ToggleButton
              active={adjustments.grayscale}
              onClick={() => setAdjustments((a) => ({ ...a, grayscale: !a.grayscale, sepia: false }))}
            >
              Monocromático
            </ToggleButton>
            <button
              onClick={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
              className="text-xs px-2.5 py-1 rounded border border-white/25 hover:bg-white/10"
            >
              Resetar
            </button>

            <div className="flex-1" />

            <button
              onClick={handleSaveCopy}
              disabled={busy || !dirty}
              className="text-xs px-3 py-1.5 rounded bg-white/15 hover:bg-white/25 disabled:opacity-40"
            >
              Salvar cópia no catálogo
            </button>
            <button
              onClick={handleShare}
              disabled={busy}
              className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40"
            >
              Compartilhar
            </button>
          </div>

          {message && <p className="text-xs opacity-80">{message}</p>}
        </div>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs w-32">
      <span className="opacity-70">
        {label}: {value}
        {unit}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function ToggleButton({
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
      className={`text-xs px-2.5 py-1 rounded-full border ${
        active ? "bg-white text-black border-white" : "border-white/25 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
