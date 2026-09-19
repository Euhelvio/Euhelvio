import { notFound } from "next/navigation";
import { buscarImovelPorId } from "@/lib/db";
import { formatarPreco } from "@/lib/format";
import ContatoForm from "@/components/ContatoForm";
import MapaUnico from "@/components/MapaUnico";

export default async function ImovelDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const imovel = buscarImovelPorId(Number(id));

  if (!imovel) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">{imovel.titulo}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {imovel.endereco}, {imovel.bairro} — {imovel.municipio}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <p className="text-3xl font-bold">{formatarPreco(imovel.preco)} / mês</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <li>{imovel.quartos} quarto(s)</li>
            <li>{imovel.banheiros} banheiro(s)</li>
            <li>{imovel.areaM2} m²</li>
            <li>{imovel.aceitaPet ? "Aceita pet" : "Não aceita pet"}</li>
            <li>{imovel.mobiliado ? "Mobiliado" : "Não mobiliado"}</li>
          </ul>
          <p className="text-sm leading-relaxed">{imovel.descricao}</p>
          <p className="text-xs text-zinc-500">Anunciado por {imovel.fonteNome}</p>
        </div>
        <div className="h-[300px]">
          <MapaUnico imovel={imovel} />
        </div>
      </div>

      <ContatoForm imovelId={imovel.id} />
    </div>
  );
}
