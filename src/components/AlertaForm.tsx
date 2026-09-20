"use client";

import { useState } from "react";
import type { FiltrosBusca } from "@/lib/types";
import GlowButton from "./ui/GlowButton";

export default function AlertaForm({ filtros }: { filtros: FiltrosBusca }) {
  const [aberto, setAberto] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "enviando" | "enviado" | "erro">("idle");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setStatus("enviando");
    try {
      const res = await fetch("/api/alertas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, filtros }),
      });
      setStatus(res.ok ? "enviado" : "erro");
    } catch {
      setStatus("erro");
    }
  }

  if (status === "enviado") {
    return (
      <p className="text-sm text-green-700 dark:text-green-400">
        Alerta criado! Você será avisado quando surgirem novos imóveis com esses filtros.
      </p>
    );
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="text-sm text-brand underline underline-offset-2"
      >
        Salvar esta busca e receber alertas
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-wrap items-center gap-2 text-sm">
      <input
        required
        type="email"
        placeholder="seu@email.com"
        className="rounded border border-border-subtle bg-surface px-2 py-1"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <GlowButton type="submit" disabled={status === "enviando"}>
        {status === "enviando" ? "Salvando…" : "Avisar quando surgir novidade"}
      </GlowButton>
      {status === "erro" && <span className="text-red-600">Não foi possível salvar.</span>}
    </form>
  );
}
