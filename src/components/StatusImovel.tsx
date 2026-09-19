"use client";

import { useState } from "react";
import type { Imovel } from "@/lib/types";

function formatarData(iso: string): string {
  return new Date(iso.replace(" ", "T") + "Z").toLocaleDateString("pt-BR");
}

export default function StatusImovel({
  imovelId,
  status,
  atualizadoEm,
}: {
  imovelId: number;
  status: Imovel["status"];
  atualizadoEm: string;
}) {
  const [statusAtual, setStatusAtual] = useState(status);
  const [enviando, setEnviando] = useState(false);

  if (statusAtual !== "disponivel") {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        Este anúncio pode estar desatualizado (última confirmação em {formatarData(atualizadoEm)}).
        Fale com o anunciante antes de se deslocar até o imóvel.
      </div>
    );
  }

  async function denunciar() {
    setEnviando(true);
    try {
      const res = await fetch(`/api/imoveis/${imovelId}/denunciar`, { method: "POST" });
      if (res.ok) setStatusAtual("verificar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <button
      onClick={denunciar}
      disabled={enviando}
      className="text-left text-xs text-zinc-500 underline underline-offset-2 disabled:opacity-50"
    >
      {enviando ? "Enviando…" : "Notou algo errado? Denunciar anúncio desatualizado"}
    </button>
  );
}
