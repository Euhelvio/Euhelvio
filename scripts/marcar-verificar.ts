/**
 * Marca como "verificar" os imóveis disponíveis que não são atualizados/confirmados
 * pelo parceiro há mais de N dias (mitigação de dado desatardo do planejamento).
 * Pensado para rodar diariamente via cron/worker agendado.
 *
 * Uso: npm run marcar-verificar -- --dias 30
 */
import "./_env";
import { marcarInativosParaVerificar } from "../src/lib/db";

function lerDias(): number {
  const idx = process.argv.indexOf("--dias");
  const valor = idx !== -1 ? Number(process.argv[idx + 1]) : 30;
  return Number.isFinite(valor) && valor > 0 ? valor : 30;
}

async function main() {
  const dias = lerDias();
  const alterados = await marcarInativosParaVerificar(dias);
  console.log(
    `${alterados} imóvel(is) sem atualização há mais de ${dias} dias marcado(s) como "verificar".`
  );
}

main().then(() => process.exit(0));
