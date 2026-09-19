"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MUNICIPIOS_MVP } from "@/lib/types";

const estadoInicial = {
  titulo: "",
  tipoOperacao: "aluguel" as const,
  municipio: MUNICIPIOS_MVP[0] as string,
  bairro: "",
  endereco: "",
  lat: "",
  lng: "",
  preco: "",
  quartos: "1",
  banheiros: "1",
  areaM2: "",
  aceitaPet: false,
  mobiliado: false,
  descricao: "",
  fonteNome: "",
  fonteContato: "",
};

export default function CadastrarImovel() {
  const router = useRouter();
  const [form, setForm] = useState(estadoInicial);
  const [status, setStatus] = useState<"idle" | "enviando" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);

  function atualizar<K extends keyof typeof estadoInicial>(campo: K, valor: (typeof estadoInicial)[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setStatus("enviando");
    setErro(null);

    const res = await fetch("/api/imoveis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        lat: Number(form.lat),
        lng: Number(form.lng),
        preco: Number(form.preco),
        quartos: Number(form.quartos),
        banheiros: Number(form.banheiros),
        areaM2: Number(form.areaM2),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/imoveis/${data.id}`);
      return;
    }

    setStatus("erro");
    setErro("Confira os campos obrigatórios e tente novamente.");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Cadastrar imóvel (parceiros)</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Onboarding manual da Fase 1: cadastre seus imóveis para aparecerem na busca da
          Grande Florianópolis. Nenhuma integração técnica é necessária.
        </p>
      </div>

      <form onSubmit={enviar} className="flex flex-col gap-3">
        <fieldset className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <legend className="px-1 text-sm font-semibold">Dados do imóvel</legend>

          <label className="flex flex-col text-sm">
            Título do anúncio
            <input
              required
              className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={form.titulo}
              onChange={(e) => atualizar("titulo", e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col text-sm">
              Tipo de operação
              <select
                className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.tipoOperacao}
                onChange={(e) => atualizar("tipoOperacao", e.target.value as typeof form.tipoOperacao)}
              >
                <option value="aluguel">Aluguel residencial</option>
                <option value="venda">Compra e venda</option>
                <option value="comercial">Comercial</option>
                <option value="temporada">Temporada</option>
              </select>
            </label>
            <label className="flex flex-col text-sm">
              Município
              <select
                className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.municipio}
                onChange={(e) => atualizar("municipio", e.target.value)}
              >
                {MUNICIPIOS_MVP.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col text-sm">
              Bairro
              <input
                required
                className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.bairro}
                onChange={(e) => atualizar("bairro", e.target.value)}
              />
            </label>
            <label className="flex flex-col text-sm">
              Endereço
              <input
                required
                className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.endereco}
                onChange={(e) => atualizar("endereco", e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col text-sm">
              Latitude
              <input
                required
                type="number"
                step="any"
                placeholder="ex: -27.5954"
                className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.lat}
                onChange={(e) => atualizar("lat", e.target.value)}
              />
            </label>
            <label className="flex flex-col text-sm">
              Longitude
              <input
                required
                type="number"
                step="any"
                placeholder="ex: -48.5480"
                className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.lng}
                onChange={(e) => atualizar("lng", e.target.value)}
              />
            </label>
          </div>
          <p className="-mt-2 text-xs text-zinc-500">
            Dica: clique com o botão direito no local no Google Maps para copiar as coordenadas.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col text-sm">
              Preço (R$/mês)
              <input
                required
                type="number"
                min={0}
                className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.preco}
                onChange={(e) => atualizar("preco", e.target.value)}
              />
            </label>
            <label className="flex flex-col text-sm">
              Área (m²)
              <input
                required
                type="number"
                min={0}
                className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.areaM2}
                onChange={(e) => atualizar("areaM2", e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col text-sm">
              Quartos
              <input
                required
                type="number"
                min={0}
                className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.quartos}
                onChange={(e) => atualizar("quartos", e.target.value)}
              />
            </label>
            <label className="flex flex-col text-sm">
              Banheiros
              <input
                required
                type="number"
                min={0}
                className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.banheiros}
                onChange={(e) => atualizar("banheiros", e.target.value)}
              />
            </label>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.aceitaPet}
                onChange={(e) => atualizar("aceitaPet", e.target.checked)}
              />
              Aceita pet
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.mobiliado}
                onChange={(e) => atualizar("mobiliado", e.target.checked)}
              />
              Mobiliado
            </label>
          </div>

          <label className="flex flex-col text-sm">
            Descrição
            <textarea
              rows={3}
              className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={form.descricao}
              onChange={(e) => atualizar("descricao", e.target.value)}
            />
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <legend className="px-1 text-sm font-semibold">Dados do anunciante</legend>
          <label className="flex flex-col text-sm">
            Nome da imobiliária/corretor
            <input
              required
              className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={form.fonteNome}
              onChange={(e) => atualizar("fonteNome", e.target.value)}
            />
          </label>
          <label className="flex flex-col text-sm">
            Contato (telefone/WhatsApp)
            <input
              required
              className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={form.fonteContato}
              onChange={(e) => atualizar("fonteContato", e.target.value)}
            />
          </label>
        </fieldset>

        <button
          type="submit"
          disabled={status === "enviando"}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {status === "enviando" ? "Publicando…" : "Publicar imóvel"}
        </button>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </form>
    </div>
  );
}
