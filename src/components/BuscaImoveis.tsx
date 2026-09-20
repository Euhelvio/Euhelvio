"use client";

import { useEffect, useState } from "react";
import type { ComponentType, CSSProperties, SVGProps } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ImovelCard from "./ImovelCard";
import AlertaForm from "./AlertaForm";
import GlowTile from "./ui/GlowTile";
import { IconeChave, IconeEtiqueta, IconePredio, IconeGuardaSol } from "./ui/icones";
import type { FiltrosBusca, Imovel, TipoOperacao } from "@/lib/types";
import { MUNICIPIOS_MVP, TIPOS_OPERACAO } from "@/lib/types";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-surface text-sm text-zinc-500 dark:text-zinc-400">
      Carregando mapa…
    </div>
  ),
});

const MAX_COMPARACAO = 4;

const ICONE_TIPO: Record<TipoOperacao, ComponentType<SVGProps<SVGSVGElement>>> = {
  aluguel: IconeChave,
  venda: IconeEtiqueta,
  comercial: IconePredio,
  temporada: IconeGuardaSol,
};

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

  const filtrosAtuais: FiltrosBusca = {
    tipoOperacao: tipoOperacao || undefined,
    municipio: municipio || undefined,
    precoMax: precoMax ? Number(precoMax) : undefined,
    quartos: quartos ? Number(quartos) : undefined,
    aceitaPet: aceitaPet || undefined,
  };

  function alternarComparacao(id: number) {
    setSelecionados((atual) => {
      if (atual.includes(id)) return atual.filter((i) => i !== id);
      if (atual.length >= MAX_COMPARACAO) return atual;
      return [...atual, id];
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-gradient-to-br from-brand/10 via-surface to-surface px-5 py-8 text-center md:px-10">
        <h1 className="text-2xl font-bold md:text-3xl">
          Encontre seu imóvel na <span className="text-brand">Grande Florianópolis</span>
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Aluguel, compra e venda, comercial e temporada — anúncios de várias imobiliárias
          reunidos num só lugar.
        </p>
        <div className="mx-auto flex w-full max-w-2xl flex-wrap gap-3 pt-2">
          {TIPOS_OPERACAO.map((t) => {
            const Icone = ICONE_TIPO[t.valor];
            return (
              <GlowTile
                key={t.valor}
                cor={t.cor}
                ativo={tipoOperacao === t.valor}
                icone={<Icone />}
                rotulo={t.rotulo}
                onClick={() => setTipoOperacao(tipoOperacao === t.valor ? "" : t.valor)}
              />
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border-subtle bg-surface p-4">
        <label className="flex flex-col text-sm">
          Tipo de operação
          <select
            className="mt-1 rounded border border-border-subtle bg-transparent px-2 py-1"
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
            className="mt-1 rounded border border-border-subtle bg-transparent px-2 py-1"
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
            className="mt-1 w-36 rounded border border-border-subtle bg-transparent px-2 py-1"
            value={precoMax}
            onChange={(e) => setPrecoMax(e.target.value)}
            placeholder="Sem limite"
          />
        </label>

        <label className="flex flex-col text-sm">
          Mínimo de quartos
          <select
            className="mt-1 rounded border border-border-subtle bg-transparent px-2 py-1"
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

      <AlertaForm filtros={filtrosAtuais} />

      {selecionados.length > 0 && (
        <div
          style={{ "--glow-color": "var(--brand)" } as CSSProperties}
          className="glow-card is-active flex items-center justify-between px-4 py-3 text-sm"
        >
          <span>
            {selecionados.length} imóvel(is) selecionado(s) para comparar (máx. {MAX_COMPARACAO})
          </span>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelecionados([])} className="underline underline-offset-2">
              Limpar
            </button>
            <Link
              href={`/comparar?ids=${selecionados.join(",")}`}
              style={{ "--glow-color": "var(--brand)" } as CSSProperties}
              className="glow-btn px-3 py-1.5"
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
