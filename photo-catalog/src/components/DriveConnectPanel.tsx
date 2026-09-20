"use client";

interface DriveConnectPanelProps {
  connected: boolean;
  connecting: boolean;
  syncing: boolean;
  syncedCount: number;
  folderName: string | null;
  error: string | null;
  onChooseFolder: () => void;
  onSync: () => void;
  onDisconnect: () => void;
}

export default function DriveConnectPanel({
  connected,
  connecting,
  syncing,
  syncedCount,
  folderName,
  error,
  onChooseFolder,
  onSync,
  onDisconnect,
}: DriveConnectPanelProps) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 flex flex-col gap-3">
      <div>
        <h2 className="font-medium">Google Drive</h2>
        <p className="text-sm opacity-70">
          Navegue pelas fotos direto de uma pasta do seu Drive — nada é
          baixado por completo, só a miniatura ao rolar a lista e a foto
          inteira quando você abre em tela cheia.
        </p>
      </div>

      {!connected && (
        <button
          onClick={onChooseFolder}
          disabled={connecting}
          className="self-start text-sm px-3 py-1.5 rounded border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
        >
          {connecting ? "Conectando…" : "Conectar ao Google Drive"}
        </button>
      )}

      {connected && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="opacity-70">
            Pasta conectada: <span className="font-medium opacity-100">{folderName}</span>
          </span>
          <button
            onClick={onSync}
            disabled={syncing}
            className="text-xs px-2.5 py-1 rounded border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
          >
            {syncing ? `Atualizando… (${syncedCount})` : "Atualizar lista"}
          </button>
          <button
            onClick={onChooseFolder}
            className="text-xs px-2.5 py-1 rounded border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
          >
            Trocar pasta
          </button>
          <button
            onClick={onDisconnect}
            className="text-xs px-2.5 py-1 rounded border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
          >
            Desconectar
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
