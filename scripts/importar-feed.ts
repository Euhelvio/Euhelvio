/**
 * Ingestão via feed de parceiro (Onda 2 da estratégia de dados do planejamento).
 *
 * Lê um arquivo JSON no formato descrito em `exemplos/feed-parceiro-exemplo.json`
 * e faz upsert dos imóveis do parceiro (por externalRef), sem duplicar a cada
 * reimportação. Pensado para rodar periodicamente via cron/worker agendado.
 *
 * Uso: npm run importar-feed -- --file exemplos/feed-parceiro-exemplo.json
 */
import fs from "fs";
import { z } from "zod";
import { criarFonteOuReutilizar, criarOuAtualizarImovelViaFeed } from "../src/lib/db";
import { MUNICIPIOS_MVP } from "../src/lib/types";

const imovelFeedSchema = z.object({
  externalRef: z.string().min(1),
  titulo: z.string().min(5),
  tipoOperacao: z.enum(["aluguel", "venda", "comercial", "temporada"]),
  municipio: z.enum(MUNICIPIOS_MVP),
  bairro: z.string().min(1),
  endereco: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  preco: z.number().positive(),
  quartos: z.number().int().min(0),
  banheiros: z.number().int().min(0),
  areaM2: z.number().positive(),
  aceitaPet: z.boolean().default(false),
  mobiliado: z.boolean().default(false),
  descricao: z.string().default(""),
});

const feedSchema = z.object({
  parceiro: z.object({
    nome: z.string().min(1),
    contato: z.string().min(1),
  }),
  imoveis: z.array(imovelFeedSchema),
});

function lerArgumentoArquivo(): string {
  const idx = process.argv.indexOf("--file");
  if (idx === -1 || !process.argv[idx + 1]) {
    console.error("Uso: npm run importar-feed -- --file <caminho-do-feed.json>");
    process.exit(1);
  }
  return process.argv[idx + 1];
}

function main() {
  const caminho = lerArgumentoArquivo();
  const conteudo = JSON.parse(fs.readFileSync(caminho, "utf-8"));
  const feed = feedSchema.parse(conteudo);

  const fonteId = criarFonteOuReutilizar(feed.parceiro.nome, feed.parceiro.contato);

  let criados = 0;
  let atualizados = 0;

  for (const item of feed.imoveis) {
    const { criado } = criarOuAtualizarImovelViaFeed({ ...item, fonteId });
    if (criado) criados++;
    else atualizados++;
  }

  console.log(
    `Feed de "${feed.parceiro.nome}" importado: ${criados} imóvel(is) novo(s), ${atualizados} atualizado(s).`
  );
}

main();
