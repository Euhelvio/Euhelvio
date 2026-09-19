"use client";

import { useState } from "react";

export default function ConfirmarImovelButton({
  imovelId,
  fonteContato,
}: {
  imovelId: number;
  fonteContato: string;
}) {
  const [confirmado, setConfirmado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (confirmado) {
    return <span className="text-xs text-green-700 dark:text-green-400">Confirmado ✓</span>;
  }

  async function confirmar() {
    setEnviando(true);
    try {
      const res = await fetch(`/api/imoveis/${imovelId}/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fonteContato }),
      });
      if (res.ok) setConfirmado(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <button
      onClick={confirmar}
      disabled={enviando}
      className="rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
    >
      {enviando ? "Confirmando…" : "Confirmar que ainda está disponível"}
    </button>
  );
}
