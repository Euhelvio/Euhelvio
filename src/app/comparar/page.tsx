import Link from "next/link";
import { buscarImovelPorId } from "@/lib/db";
import { formatarPrecoImovel } from "@/lib/format";
import { TIPOS_OPERACAO } from "@/lib/types";
import type { Imovel } from "@/lib/types";

function rotuloTipo(tipoOperacao: Imovel["tipoOperacao"]): string {
  return TIPOS_OPERACAO.find((t) => t.valor === tipoOperacao)?.rotulo ?? tipoOperacao;
}

const LINHAS: {
  rotulo: string;
  valor: (imovel: Imovel) => string;
}[] = [
  { rotulo: "Tipo", valor: (i) => rotuloTipo(i.tipoOperacao) },
  { rotulo: "Preço", valor: (i) => formatarPrecoImovel(i.preco, i.tipoOperacao) },
  { rotulo: "Localização", valor: (i) => `${i.bairro}, ${i.municipio}` },
  { rotulo: "Quartos", valor: (i) => String(i.quartos) },
  { rotulo: "Banheiros", valor: (i) => String(i.banheiros) },
  { rotulo: "Área", valor: (i) => `${i.areaM2} m²` },
  { rotulo: "Aceita pet", valor: (i) => (i.aceitaPet ? "Sim" : "Não") },
  { rotulo: "Mobiliado", valor: (i) => (i.mobiliado ? "Sim" : "Não") },
  { rotulo: "Anunciante", valor: (i) => i.fonteNome },
];

export default async function ComparadorImoveis({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const idsNumericos = (ids ?? "")
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v) && v > 0)
    .slice(0, 4);

  const encontrados = await Promise.all(idsNumericos.map((id) => buscarImovelPorId(id)));
  const imoveis = encontrados.filter((i): i is Imovel => i !== null);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Comparar imóveis</h1>
        <Link href="/" className="text-sm text-blue-600 underline">
          ← Voltar para a busca
        </Link>
      </div>

      {imoveis.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nenhum imóvel selecionado. Volte para a busca e marque &quot;Comparar&quot; em até 4
          imóveis.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-40 border-b border-zinc-200 p-2 text-left dark:border-zinc-800" />
                {imoveis.map((imovel) => (
                  <th
                    key={imovel.id}
                    className="border-b border-zinc-200 p-2 text-left align-top dark:border-zinc-800"
                  >
                    <Link href={`/imoveis/${imovel.id}`} className="font-semibold underline">
                      {imovel.titulo}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LINHAS.map((linha) => (
                <tr key={linha.rotulo}>
                  <td className="border-b border-zinc-200 p-2 font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                    {linha.rotulo}
                  </td>
                  {imoveis.map((imovel) => (
                    <td
                      key={imovel.id}
                      className="border-b border-zinc-200 p-2 dark:border-zinc-800"
                    >
                      {linha.valor(imovel)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
