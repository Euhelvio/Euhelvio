import Link from "next/link";
import type { Imovel } from "@/lib/types";
import { formatarPreco } from "@/lib/format";

export default function ImovelCard({ imovel }: { imovel: Imovel }) {
  return (
    <Link
      href={`/imoveis/${imovel.id}`}
      className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <p className="font-semibold">{imovel.titulo}</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {imovel.bairro}, {imovel.municipio}
      </p>
      <p className="mt-2 text-lg font-bold">{formatarPreco(imovel.preco)} / mês</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {imovel.quartos} quarto{imovel.quartos !== 1 ? "s" : ""} · {imovel.banheiros} banheiro
        {imovel.banheiros !== 1 ? "s" : ""} · {imovel.areaM2} m²
        {imovel.aceitaPet ? " · aceita pet" : ""}
        {imovel.mobiliado ? " · mobiliado" : ""}
      </p>
      <p className="mt-1 text-xs text-zinc-500">Anunciado por {imovel.fonteNome}</p>
    </Link>
  );
}
