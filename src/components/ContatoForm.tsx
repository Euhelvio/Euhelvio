"use client";

import { useState } from "react";

export default function ContatoForm({ imovelId }: { imovelId: number }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState(
    "Olá, tenho interesse neste imóvel. Podem me passar mais informações?"
  );
  const [status, setStatus] = useState<"idle" | "enviando" | "enviado" | "erro">("idle");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setStatus("enviando");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imovelId, nome, email, telefone, mensagem }),
      });
      setStatus(res.ok ? "enviado" : "erro");
    } catch {
      setStatus("erro");
    }
  }

  if (status === "enviado") {
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
        Contato enviado! O anunciante vai receber sua mensagem e retornar em breve.
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">Falar com o anunciante</h2>
      <label className="flex flex-col text-sm">
        Nome
        <input
          required
          className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </label>
      <label className="flex flex-col text-sm">
        E-mail
        <input
          required
          type="email"
          className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="flex flex-col text-sm">
        Telefone/WhatsApp
        <input
          required
          className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
      </label>
      <label className="flex flex-col text-sm">
        Mensagem
        <textarea
          rows={3}
          className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={status === "enviando"}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
      >
        {status === "enviando" ? "Enviando…" : "Enviar contato"}
      </button>
      {status === "erro" && (
        <p className="text-sm text-red-600">Não foi possível enviar. Tente novamente.</p>
      )}
    </form>
  );
}
