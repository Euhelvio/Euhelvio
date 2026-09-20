import Link from "next/link";
import type { Imovel } from "@/lib/types";
import { TIPOS_OPERACAO } from "@/lib/types";
import { formatarPrecoImovel } from "@/lib/format";

function infoTipo(tipoOperacao: Imovel["tipoOperacao"]) {
  return TIPOS_OPERACAO.find((t) => t.valor === tipoOperacao);
}

export default function ImovelCard({
  imovel,
  comparando = false,
  onToggleComparar,
}: {
  imovel: Imovel;
  comparando?: boolean;
  onToggleComparar?: (id: number) => void;
}) {
  const tipo = infoTipo(imovel.tipoOperacao);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/imoveis/${imovel.id}`} className="block">
        <span
          className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{
            color: tipo?.cor,
            backgroundColor: tipo ? `color-mix(in srgb, ${tipo.cor} 16%, transparent)` : undefined,
          }}
        >
          {tipo?.rotulo ?? imovel.tipoOperacao}
        </span>
        <p className="mt-2 font-semibold">{imovel.titulo}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {imovel.bairro}, {imovel.municipio}
        </p>
        <p className="mt-2 text-lg font-bold">
          {formatarPrecoImovel(imovel.preco, imovel.tipoOperacao)}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {imovel.quartos} quarto{imovel.quartos !== 1 ? "s" : ""} · {imovel.banheiros} banheiro
          {imovel.banheiros !== 1 ? "s" : ""} · {imovel.areaM2} m²
          {imovel.aceitaPet ? " · aceita pet" : ""}
          {imovel.mobiliado ? " · mobiliado" : ""}
        </p>
        <p className="mt-1 text-xs text-zinc-500">Anunciado por {imovel.fonteNome}</p>
      </Link>
      {onToggleComparar && (
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={comparando}
            onChange={() => onToggleComparar(imovel.id)}
          />
          Comparar
        </label>
      )}
    </div>
  );
}
