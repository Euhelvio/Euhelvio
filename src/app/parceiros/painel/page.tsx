import Link from "next/link";
import { listarImoveisPorFonteContato, listarLeadsPorFonteContato } from "@/lib/db";
import { formatarPrecoImovel } from "@/lib/format";
import { TIPOS_OPERACAO } from "@/lib/types";
import ConfirmarImovelButton from "@/components/ConfirmarImovelButton";

const ROTULO_STATUS: Record<string, string> = {
  disponivel: "Disponível",
  verificar: "Verificar disponibilidade",
  removido: "Removido",
};

export default async function PainelParceiro({
  searchParams,
}: {
  searchParams: Promise<{ contato?: string }>;
}) {
  const { contato } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Painel do parceiro</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Consulte seus imóveis publicados e os leads recebidos usando o mesmo contato
          informado no cadastro. Nesta fase (MVP), o acesso é feito apenas pelo contato —
          sem senha — pensado para o piloto com poucos parceiros de confiança.
        </p>
      </div>

      <form method="get" className="flex gap-2">
        <input
          name="contato"
          defaultValue={contato ?? ""}
          placeholder="Telefone/WhatsApp cadastrado"
          required
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          Entrar
        </button>
      </form>

      {contato && <ConteudoPainel contato={contato} />}
    </div>
  );
}

async function ConteudoPainel({ contato }: { contato: string }) {
  const imoveis = listarImoveisPorFonteContato(contato);
  const leads = listarLeadsPorFonteContato(contato);

  if (imoveis.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Nenhum imóvel encontrado para esse contato. Verifique se digitou exatamente como no{" "}
        <Link href="/parceiros/cadastrar" className="underline">
          cadastro
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Seus imóveis ({imoveis.length})</h2>
        {imoveis.map((imovel) => (
          <div
            key={imovel.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
          >
            <div>
              <Link href={`/imoveis/${imovel.id}`} className="font-medium underline">
                {imovel.titulo}
              </Link>
              <p className="text-zinc-500">
                {TIPOS_OPERACAO.find((t) => t.valor === imovel.tipoOperacao)?.rotulo} ·{" "}
                {formatarPrecoImovel(imovel.preco, imovel.tipoOperacao)} ·{" "}
                {ROTULO_STATUS[imovel.status] ?? imovel.status}
              </p>
            </div>
            {imovel.status === "verificar" && (
              <ConfirmarImovelButton imovelId={imovel.id} fonteContato={contato} />
            )}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Leads recebidos ({leads.length})</h2>
        {leads.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum lead recebido ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="border-b border-zinc-200 p-2 dark:border-zinc-800">Imóvel</th>
                  <th className="border-b border-zinc-200 p-2 dark:border-zinc-800">Nome</th>
                  <th className="border-b border-zinc-200 p-2 dark:border-zinc-800">Contato</th>
                  <th className="border-b border-zinc-200 p-2 dark:border-zinc-800">Mensagem</th>
                  <th className="border-b border-zinc-200 p-2 dark:border-zinc-800">Data</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="border-b border-zinc-200 p-2 dark:border-zinc-800">
                      <Link href={`/imoveis/${lead.imovelId}`} className="underline">
                        {lead.imovelTitulo}
                      </Link>
                    </td>
                    <td className="border-b border-zinc-200 p-2 dark:border-zinc-800">
                      {lead.nome}
                    </td>
                    <td className="border-b border-zinc-200 p-2 dark:border-zinc-800">
                      {lead.email}
                      <br />
                      {lead.telefone}
                    </td>
                    <td className="border-b border-zinc-200 p-2 dark:border-zinc-800">
                      {lead.mensagem}
                    </td>
                    <td className="border-b border-zinc-200 p-2 dark:border-zinc-800">
                      {lead.criadoEm}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
