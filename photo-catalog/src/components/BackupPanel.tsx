"use client";

import { useRef, useState } from "react";
import { exportBackup, importBackup, type BackupProgress } from "@/lib/backup";
import { downloadBlob } from "@/lib/download";

export default function BackupPanel({ photoCount }: { photoCount: number }) {
  const [progress, setProgress] = useState<BackupProgress | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setError(null);
    setMessage(null);
    setProgress({ total: photoCount, processed: 0, phase: "reading" });
    try {
      const blob = await exportBackup((p) => setProgress(p));
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `catalogo-fotos-backup-${date}.zip`);
      setMessage(`Backup gerado com ${photoCount} foto(s).`);
    } catch {
      setError("Não foi possível gerar o backup.");
    } finally {
      setProgress(null);
    }
  }

  async function handleImport(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setMessage(null);
    try {
      const result = await importBackup(files[0], (p) => setProgress(p));
      setMessage(
        `Backup restaurado: ${result.imported} foto(s) adicionadas/atualizadas, ${result.skipped} ignoradas.`
      );
    } catch {
      setError("Não foi possível ler esse arquivo. Confirme que é um backup gerado por este app.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isRunning = progress != null;

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 flex flex-col gap-3">
      <div>
        <h2 className="font-medium">Backup do catálogo</h2>
        <p className="text-sm opacity-70">
          O catálogo fica salvo só neste navegador. Exporte um backup para
          guardar em outro lugar ou levar para outro dispositivo/navegador.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExport}
          disabled={isRunning || photoCount === 0}
          className="text-sm px-3 py-1.5 rounded border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
        >
          Exportar backup ({photoCount} foto{photoCount === 1 ? "" : "s"})
        </button>

        <label className="text-sm px-3 py-1.5 rounded border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer disabled:opacity-50">
          Restaurar backup
          <input
            ref={inputRef}
            type="file"
            accept=".zip"
            disabled={isRunning}
            onChange={(e) => handleImport(e.target.files)}
            className="hidden"
          />
        </label>
      </div>

      {isRunning && progress && (
        <p className="text-xs opacity-60">
          {progress.phase === "reading" ? "Processando" : "Compactando"}
          {progress.phase === "reading"
            ? ` ${progress.processed}/${progress.total}…`
            : ` ${progress.processed}%…`}
        </p>
      )}

      {message && <p className="text-sm text-green-700 dark:text-green-400">{message}</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
