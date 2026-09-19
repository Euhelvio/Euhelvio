"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ImovelCard from "./ImovelCard";
import type { Imovel } from "@/lib/types";
import { MUNICIPIOS_MVP, TIPOS_OPERACAO } from "@/lib/types";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900">
      Carregando mapa…
    </div>
  ),
});

const MAX_COMPARACAO = 4;

export default function BuscaImoveis({ imoveisIniciais }: { imoveisIniciais: Imovel[] }) {
  const [imoveis, setImoveis] = useState(imoveisIniciais);
  const [carregando, setCarregando] = useState(false);
  const [tipoOperacao, setTipoOperacao] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [quartos, setQuartos] = useState("");
  const [aceitaPet, setAceitaPet] = useState(false);
  const [selecionados, setSelecionados] = useState<number[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (tipoOperacao) params.set("tipoOperacao", tipoOperacao);
    if (municipio) params.set("municipio", municipio);
    if (precoMax) params.set("precoMax", precoMax);
    if (quartos) params.set("quartos", quartos);
    if (aceitaPet) params.set("aceitaPet", "1");

    async function buscar() {
      setCarregando(true);
      try {
        const res = await fetch(`/api/imoveis?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setImoveis(data.imoveis);
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.error(err);
      } finally {
        setCarregando(false);
      }
    }

    buscar();
    return () => controller.abort();
  }, [tipoOperacao, municipio, precoMax, quartos, aceitaPet]);

  function alternarComparacao(id: number) {
    setSelecionados((atual) => {
      if (atual.includes(id)) return atual.filter((i) => i !== id);
      if (atual.length >= MAX_COMPARACAO) return atual;
      return [...atual, id];
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <label className="flex flex-col text-sm">
          Tipo de operação
          <select
            className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={tipoOperacao}
            onChange={(e) => setTipoOperacao(e.target.value)}
          >
            <option value="">Todos</option>
            {TIPOS_OPERACAO.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm">
          Município
          <select
            className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
          >
            <option value="">Todos</option>
            {MUNICIPIOS_MVP.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm">
          Preço máximo (R$)
          <input
            type="number"
            min={0}
            className="mt-1 w-36 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={precoMax}
            onChange={(e) => setPrecoMax(e.target.value)}
            placeholder="Sem limite"
          />
        </label>

        <label className="flex flex-col text-sm">
          Mínimo de quartos
          <select
            className="mt-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={quartos}
            onChange={(e) => setQuartos(e.target.value)}
          >
            <option value="">Qualquer</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={aceitaPet}
            onChange={(e) => setAceitaPet(e.target.checked)}
          />
          Aceita pet
        </label>

        <p className="ml-auto text-sm text-zinc-500">
          {carregando ? "Buscando…" : `${imoveis.length} imóvel(is) encontrado(s)`}
        </p>
      </div>

      {selecionados.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm text-white dark:border-white dark:bg-white dark:text-zinc-900">
          <span>
            {selecionados.length} imóvel(is) selecionado(s) para comparar (máx. {MAX_COMPARACAO})
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelecionados([])}
              className="underline underline-offset-2"
            >
              Limpar
            </button>
            <Link
              href={`/comparar?ids=${selecionados.join(",")}`}
              className="rounded bg-white px-3 py-1 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-white"
            >
              Comparar
            </Link>
          </div>
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 overflow-y-auto lg:max-h-[70vh]">
          {imoveis.length === 0 && !carregando && (
            <p className="text-sm text-zinc-500">
              Nenhum imóvel encontrado com esses filtros. Tente ampliar a busca.
            </p>
          )}
          {imoveis.map((imovel) => (
            <ImovelCard
              key={imovel.id}
              imovel={imovel}
              comparando={selecionados.includes(imovel.id)}
              onToggleComparar={alternarComparacao}
            />
          ))}
        </div>
        <div className="min-h-[400px] lg:sticky lg:top-4 lg:h-[70vh]">
          <MapView imoveis={imoveis} />
        </div>
      </div>
    </div>
  );
}
