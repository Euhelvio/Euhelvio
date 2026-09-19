import Link from "next/link";
import type { Imovel } from "@/lib/types";
import { TIPOS_OPERACAO } from "@/lib/types";
import { formatarPrecoImovel } from "@/lib/format";

function rotuloTipo(tipoOperacao: Imovel["tipoOperacao"]): string {
  return TIPOS_OPERACAO.find((t) => t.valor === tipoOperacao)?.rotulo ?? tipoOperacao;
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
  return (
    <div className="rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
      <Link href={`/imoveis/${imovel.id}`} className="block">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {rotuloTipo(imovel.tipoOperacao)}
        </p>
        <p className="font-semibold">{imovel.titulo}</p>
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
