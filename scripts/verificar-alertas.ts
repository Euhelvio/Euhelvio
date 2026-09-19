/**
 * Verifica alertas de busca salva e "envia" (por enquanto, imprime no console)
 * os novos imóveis compatíveis desde o último envio. Pensado para rodar
 * periodicamente via cron/worker agendado (ex.: a cada hora).
 *
 * Este MVP não integra um provedor de e-mail real (exigiria uma chave de API
 * externa — Resend, Postmark etc., ver README). Quando essa chave existir,
 * troque a função `notificar()` abaixo pela chamada real ao provedor; o
 * restante da lógica (o que mudou, para quem, quando foi o último envio)
 * já está pronto.
 *
 * Uso: npm run verificar-alertas
 */
import "./_env";
import {
  buscarNovosImoveisParaAlerta,
  listarAlertas,
  marcarEnvioAlerta,
} from "../src/lib/db";
import { formatarPrecoImovel } from "../src/lib/format";
import type { Imovel } from "../src/lib/types";

function notificar(email: string, imoveis: Imovel[]) {
  console.log(`\n--- Alerta para ${email} (${imoveis.length} novo(s) imóvel(is)) ---`);
  for (const imovel of imoveis) {
    console.log(
      `  • ${imovel.titulo} — ${formatarPrecoImovel(imovel.preco, imovel.tipoOperacao)} — ${imovel.bairro}, ${imovel.municipio} — http://localhost:3000/imoveis/${imovel.id}`
    );
  }
}

async function main() {
  const alertas = await listarAlertas();
  let notificacoesEnviadas = 0;

  for (const alerta of alertas) {
    const novos = await buscarNovosImoveisParaAlerta(alerta);
    if (novos.length > 0) {
      notificar(alerta.email, novos);
      notificacoesEnviadas++;
    }
    await marcarEnvioAlerta(alerta.id);
  }

  console.log(
    `\n${alertas.length} alerta(s) verificado(s), ${notificacoesEnviadas} com novidades.`
  );
}

main().then(() => process.exit(0));
