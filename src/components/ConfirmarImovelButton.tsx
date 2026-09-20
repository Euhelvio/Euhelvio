"use client";

import { useState } from "react";
import GlowButton from "./ui/GlowButton";

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
    <GlowButton onClick={confirmar} disabled={enviando} className="px-2 py-1 text-xs">
      {enviando ? "Confirmando…" : "Confirmar que ainda está disponível"}
    </GlowButton>
  );
}
