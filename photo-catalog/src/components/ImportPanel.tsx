"use client";

import { useRef, useState } from "react";
import { importTakeoutZip, type ImportProgress } from "@/lib/takeout";

export default function ImportPanel() {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setSummary(null);

    let totalImported = 0;
    let totalSkipped = 0;

    try {
      for (const file of Array.from(files)) {
        const result = await importTakeoutZip(file, (p) => setProgress(p));
        totalImported += result.imported;
        totalSkipped += result.skipped;
      }
      setSummary(
        `Importação concluída: ${totalImported} fotos adicionadas, ${totalSkipped} ignoradas.`
      );
    } catch (err) {
      console.error("Falha ao importar Takeout:", err);
      const detail = err instanceof Error ? err.message : String(err);
      setError(
        `Não foi possível ler o arquivo (${detail}). Confirme que é um .zip exportado pelo Google Takeout.`
      );
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isRunning = progress != null && !progress.done;

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/15 bg-white/85 dark:bg-black/55 backdrop-blur-sm shadow-sm p-4 flex flex-col gap-3">
      <div>
        <h2 className="font-medium">Importar do Google Takeout</h2>
        <p className="text-sm opacity-70">
          Exporte suas fotos em{" "}
          <span className="font-mono">takeout.google.com</span> (selecione
          apenas &quot;Google Fotos&quot;) e envie aqui o(s) arquivo(s) .zip
          gerados.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        multiple
        disabled={isRunning}
        onChange={(e) => handleFiles(e.target.files)}
        className="text-sm"
      />

      {isRunning && progress && (
        <div className="text-sm">
          <div className="w-full h-2 rounded bg-black/10 dark:bg-white/15 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{
                width: progress.total
                  ? `${Math.min(100, (progress.processed / progress.total) * 100)}%`
                  : "0%",
              }}
            />
          </div>
          <p className="mt-1 opacity-70">
            {progress.processed}/{progress.total} — {progress.currentFile ?? "processando…"}
          </p>
        </div>
      )}

      {summary && <p className="text-sm text-green-700 dark:text-green-400">{summary}</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
