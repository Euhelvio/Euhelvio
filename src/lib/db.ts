import { Pool } from "pg";
import type { Alerta, FiltrosBusca, Imovel, Lead } from "./types";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL não configurada. Defina a connection string do Postgres (Supabase/Neon/local) em .env.local — veja README.md."
  );
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
});

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS fontes (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo_integracao TEXT NOT NULL DEFAULT 'manual',
    contato TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS imoveis (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    tipo_operacao TEXT NOT NULL,
    municipio TEXT NOT NULL,
    bairro TEXT NOT NULL,
    endereco TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    preco DOUBLE PRECISION NOT NULL,
    quartos INTEGER NOT NULL DEFAULT 0,
    banheiros INTEGER NOT NULL DEFAULT 0,
    area_m2 DOUBLE PRECISION NOT NULL DEFAULT 0,
    aceita_pet BOOLEAN NOT NULL DEFAULT FALSE,
    mobiliado BOOLEAN NOT NULL DEFAULT FALSE,
    descricao TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'disponivel',
    fonte_id INTEGER NOT NULL REFERENCES fontes(id),
    external_ref TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_imoveis_fonte_external
    ON imoveis(fonte_id, external_ref)
    WHERE external_ref IS NOT NULL;

  CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    imovel_id INTEGER NOT NULL REFERENCES imoveis(id),
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL DEFAULT '',
    mensagem TEXT NOT NULL DEFAULT '',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS alertas (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    filtros JSONB NOT NULL DEFAULT '{}',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ultimo_envio TIMESTAMPTZ
  );
`;

let schemaPronto: Promise<void> | null = null;

function garantirSchema(): Promise<void> {
  if (!schemaPronto) {
    schemaPronto = pool
      .query(SCHEMA_SQL)
      .then(() => semearSeVazio());
  }
  return schemaPronto;
}

type ImovelRow = {
  id: number;
  titulo: string;
  tipo_operacao: string;
  municipio: string;
  bairro: string;
  endereco: string;
  lat: number;
  lng: number;
  preco: number;
  quartos: number;
  banheiros: number;
  area_m2: number;
  aceita_pet: boolean;
  mobiliado: boolean;
  descricao: string;
  status: string;
  fonte_id: number;
  fonte_nome: string;
  external_ref: string | null;
  criado_em: Date;
  atualizado_em: Date;
};

function rowToImovel(row: ImovelRow): Imovel {
  return {
    id: row.id,
    titulo: row.titulo,
    tipoOperacao: row.tipo_operacao as Imovel["tipoOperacao"],
    municipio: row.municipio,
    bairro: row.bairro,
    endereco: row.endereco,
    lat: row.lat,
    lng: row.lng,
    preco: row.preco,
    quartos: row.quartos,
    banheiros: row.banheiros,
    areaM2: row.area_m2,
    aceitaPet: row.aceita_pet,
    mobiliado: row.mobiliado,
    descricao: row.descricao,
    status: row.status as Imovel["status"],
    fonteId: row.fonte_id,
    fonteNome: row.fonte_nome,
    criadoEm: row.criado_em.toISOString(),
    atualizadoEm: row.atualizado_em.toISOString(),
  };
}

async function semearSeVazio(): Promise<void> {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS c FROM imoveis");
  if (rows[0].c > 0) return;

  const fontes = [
    { nome: "Imobiliária Ilha Sul", contato: "(48) 99100-1010" },
    { nome: "Corretora Ana Beatriz", contato: "(48) 99200-2020" },
    { nome: "Imobiliária Continente", contato: "(48) 99300-3030" },
  ];
  const fonteIds: number[] = [];
  for (const f of fontes) {
    const { rows } = await pool.query<{ id: number }>(
      "INSERT INTO fontes (nome, tipo_integracao, contato) VALUES ($1, 'manual', $2) RETURNING id",
      [f.nome, f.contato]
    );
    fonteIds.push(rows[0].id);
  }

  const seed = [
    { titulo: "Apto 2 quartos próximo à UFSC", tipoOperacao: "aluguel", municipio: "Florianópolis", bairro: "Trindade", endereco: "Rua Lauro Linhares, 500", lat: -27.5847, lng: -48.5223, preco: 2400, quartos: 2, banheiros: 1, areaM2: 62, aceitaPet: true, mobiliado: false, descricao: "Apartamento reformado a 10 minutos a pé da UFSC, ótimo para estudantes." },
    { titulo: "Kitnet mobiliada no Centro", tipoOperacao: "aluguel", municipio: "Florianópolis", bairro: "Centro", endereco: "Rua Felipe Schmidt, 200", lat: -27.5954, lng: -48.548, preco: 1600, quartos: 1, banheiros: 1, areaM2: 28, aceitaPet: false, mobiliado: true, descricao: "Kitnet mobiliada, pronta para morar, próxima ao terminal urbano." },
    { titulo: "Casa 3 quartos na Lagoa da Conceição", tipoOperacao: "aluguel", municipio: "Florianópolis", bairro: "Lagoa da Conceição", endereco: "Servidão dos Pescadores, 45", lat: -27.6068, lng: -48.459, preco: 4800, quartos: 3, banheiros: 2, areaM2: 140, aceitaPet: true, mobiliado: false, descricao: "Casa térrea com quintal, a 5 minutos da Lagoa." },
    { titulo: "Apto 1 quarto em Coqueiros", tipoOperacao: "aluguel", municipio: "Florianópolis", bairro: "Coqueiros", endereco: "Av. Governador Ivo Silveira, 800", lat: -27.589, lng: -48.572, preco: 1950, quartos: 1, banheiros: 1, areaM2: 45, aceitaPet: false, mobiliado: false, descricao: "Vista parcial para o mar, prédio com portaria 24h." },
    { titulo: "Apto 2 quartos no Campeche", tipoOperacao: "aluguel", municipio: "Florianópolis", bairro: "Campeche", endereco: "Rua Pequeno Príncipe, 120", lat: -27.6767, lng: -48.489, preco: 2200, quartos: 2, banheiros: 1, areaM2: 58, aceitaPet: true, mobiliado: false, descricao: "A 8 quadras da praia do Campeche, condomínio com piscina." },
    { titulo: "Casa 4 quartos em Canasvieiras", tipoOperacao: "temporada", municipio: "Florianópolis", bairro: "Canasvieiras", endereco: "Rua das Gaivotas, 300", lat: -27.431, lng: -48.466, preco: 3600, quartos: 4, banheiros: 3, areaM2: 180, aceitaPet: true, mobiliado: true, descricao: "Ideal para temporada em família, a 200m da praia. Diária ou semana." },
    { titulo: "Apto 3 quartos nos Ingleses", tipoOperacao: "temporada", municipio: "Florianópolis", bairro: "Ingleses", endereco: "Rua das Bromélias, 90", lat: -27.433, lng: -48.395, preco: 2900, quartos: 3, banheiros: 2, areaM2: 90, aceitaPet: false, mobiliado: true, descricao: "Mobiliado para temporada, a 3 quadras da praia dos Ingleses." },
    { titulo: "Apto 2 quartos no Centro de São José", tipoOperacao: "aluguel", municipio: "São José", bairro: "Centro", endereco: "Rua Almirante Barroso, 400", lat: -27.5969, lng: -48.6339, preco: 1800, quartos: 2, banheiros: 1, areaM2: 55, aceitaPet: true, mobiliado: false, descricao: "Próximo ao terminal integrado, fácil acesso à BR-101." },
    { titulo: "Casa 3 quartos em Kobrasol", tipoOperacao: "venda", municipio: "São José", bairro: "Kobrasol", endereco: "Rua João Pereira, 250", lat: -27.5936, lng: -48.6142, preco: 690000, quartos: 3, banheiros: 2, areaM2: 110, aceitaPet: true, mobiliado: false, descricao: "Bairro comercial, próximo a shoppings e escolas. Escritura em dia." },
    { titulo: "Apto 2 quartos no Centro de Palhoça", tipoOperacao: "aluguel", municipio: "Palhoça", bairro: "Centro", endereco: "Av. Pedra Branca, 600", lat: -27.6386, lng: -48.6706, preco: 1500, quartos: 2, banheiros: 1, areaM2: 50, aceitaPet: false, mobiliado: false, descricao: "Próximo à Via Expressa, ótimo custo-benefício." },
    { titulo: "Apto 1 quarto em Pedra Branca", tipoOperacao: "venda", municipio: "Palhoça", bairro: "Pedra Branca", endereco: "Av. Marieta D'Ávila, 1200", lat: -27.6289, lng: -48.6572, preco: 420000, quartos: 1, banheiros: 1, areaM2: 42, aceitaPet: true, mobiliado: true, descricao: "Bairro planejado, mobiliado, prédio com academia. Pronto para morar." },
    { titulo: "Casa 3 quartos no Centro de Biguaçu", tipoOperacao: "aluguel", municipio: "Biguaçu", bairro: "Centro", endereco: "Rua Getúlio Vargas, 150", lat: -27.4941, lng: -48.655, preco: 1900, quartos: 3, banheiros: 1, areaM2: 100, aceitaPet: true, mobiliado: false, descricao: "Quintal amplo, próxima à BR-101 e ao centro histórico." },
    { titulo: "Casa 2 quartos em Santo Amaro da Imperatriz", tipoOperacao: "aluguel", municipio: "Santo Amaro da Imperatriz", bairro: "Centro", endereco: "Rua Leoberto Leal, 80", lat: -27.6892, lng: -48.7789, preco: 1400, quartos: 2, banheiros: 1, areaM2: 70, aceitaPet: true, mobiliado: false, descricao: "Perto das Termas, cidade tranquila a 30 min de Floripa." },
    { titulo: "Casa 2 quartos em Governador Celso Ramos", tipoOperacao: "aluguel", municipio: "Governador Celso Ramos", bairro: "Centro", endereco: "Rua Beira Mar, 220", lat: -27.3167, lng: -48.55, preco: 1600, quartos: 2, banheiros: 1, areaM2: 65, aceitaPet: true, mobiliado: false, descricao: "A poucos metros da praia, cidade de pescadores." },
    { titulo: "Casa 3 quartos em Águas Mornas", tipoOperacao: "aluguel", municipio: "Águas Mornas", bairro: "Centro", endereco: "Rua Principal, 55", lat: -27.7275, lng: -48.8064, preco: 1300, quartos: 3, banheiros: 1, areaM2: 95, aceitaPet: true, mobiliado: false, descricao: "Área verde, ideal para quem busca sossego perto da capital." },
    { titulo: "Sala comercial no Centro de Florianópolis", tipoOperacao: "comercial", municipio: "Florianópolis", bairro: "Centro", endereco: "Rua Tenente Silveira, 300", lat: -27.596, lng: -48.5495, preco: 2800, quartos: 0, banheiros: 1, areaM2: 45, aceitaPet: false, mobiliado: false, descricao: "Sala comercial no coração do Centro, prédio com portaria e elevador." },
    { titulo: "Loja em Kobrasol, São José", tipoOperacao: "comercial", municipio: "São José", bairro: "Kobrasol", endereco: "Av. Presidente Kennedy, 900", lat: -27.5931, lng: -48.6127, preco: 3500, quartos: 0, banheiros: 1, areaM2: 80, aceitaPet: false, mobiliado: false, descricao: "Loja de esquina, alto fluxo de pedestres, próxima a bancos e comércio." },
    { titulo: "Galpão industrial em Biguaçu", tipoOperacao: "comercial", municipio: "Biguaçu", bairro: "Centro", endereco: "Rodovia BR-101, km 195", lat: -27.4955, lng: -48.6535, preco: 8500, quartos: 0, banheiros: 2, areaM2: 600, aceitaPet: false, mobiliado: false, descricao: "Galpão com acesso direto à BR-101, pé-direito alto, ideal para logística." },
    { titulo: "Casa 4 quartos na Lagoa da Conceição", tipoOperacao: "venda", municipio: "Florianópolis", bairro: "Lagoa da Conceição", endereco: "Servidão dos Pescadores, 120", lat: -27.607, lng: -48.4605, preco: 1850000, quartos: 4, banheiros: 3, areaM2: 210, aceitaPet: true, mobiliado: false, descricao: "Casa alto padrão a 5 minutos da Lagoa, piscina e churrasqueira." },
  ];

  for (let i = 0; i < seed.length; i++) {
    const imovel = seed[i];
    await pool.query(
      `INSERT INTO imoveis
        (titulo, tipo_operacao, municipio, bairro, endereco, lat, lng, preco, quartos, banheiros, area_m2, aceita_pet, mobiliado, descricao, fonte_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        imovel.titulo,
        imovel.tipoOperacao,
        imovel.municipio,
        imovel.bairro,
        imovel.endereco,
        imovel.lat,
        imovel.lng,
        imovel.preco,
        imovel.quartos,
        imovel.banheiros,
        imovel.areaM2,
        imovel.aceitaPet,
        imovel.mobiliado,
        imovel.descricao,
        fonteIds[i % fonteIds.length],
      ]
    );
  }
}

export async function listarImoveis(filtros: FiltrosBusca): Promise<Imovel[]> {
  await garantirSchema();

  const condicoes: string[] = ["i.status = 'disponivel'"];
  const params: unknown[] = [];

  if (filtros.tipoOperacao) {
    params.push(filtros.tipoOperacao);
    condicoes.push(`i.tipo_operacao = $${params.length}`);
  }
  if (filtros.municipio) {
    params.push(filtros.municipio);
    condicoes.push(`i.municipio = $${params.length}`);
  }
  if (filtros.precoMin !== undefined) {
    params.push(filtros.precoMin);
    condicoes.push(`i.preco >= $${params.length}`);
  }
  if (filtros.precoMax !== undefined) {
    params.push(filtros.precoMax);
    condicoes.push(`i.preco <= $${params.length}`);
  }
  if (filtros.quartos !== undefined) {
    params.push(filtros.quartos);
    condicoes.push(`i.quartos >= $${params.length}`);
  }
  if (filtros.aceitaPet) {
    condicoes.push("i.aceita_pet = TRUE");
  }

  const { rows } = await pool.query<ImovelRow>(
    `SELECT i.*, f.nome as fonte_nome FROM imoveis i
     JOIN fontes f ON f.id = i.fonte_id
     WHERE ${condicoes.join(" AND ")}
     ORDER BY i.criado_em DESC`,
    params
  );

  return rows.map(rowToImovel);
}

export async function buscarImovelPorId(id: number): Promise<Imovel | null> {
  await garantirSchema();
  const { rows } = await pool.query<ImovelRow>(
    `SELECT i.*, f.nome as fonte_nome FROM imoveis i
     JOIN fontes f ON f.id = i.fonte_id
     WHERE i.id = $1`,
    [id]
  );
  return rows[0] ? rowToImovel(rows[0]) : null;
}

export async function criarFonteOuReutilizar(nome: string, contato: string): Promise<number> {
  await garantirSchema();
  const existente = await pool.query<{ id: number }>(
    "SELECT id FROM fontes WHERE nome = $1 AND contato = $2",
    [nome, contato]
  );
  if (existente.rows[0]) return existente.rows[0].id;

  const info = await pool.query<{ id: number }>(
    "INSERT INTO fontes (nome, tipo_integracao, contato) VALUES ($1, 'manual', $2) RETURNING id",
    [nome, contato]
  );
  return info.rows[0].id;
}

export async function criarImovel(dados: {
  titulo: string;
  tipoOperacao: string;
  municipio: string;
  bairro: string;
  endereco: string;
  lat: number;
  lng: number;
  preco: number;
  quartos: number;
  banheiros: number;
  areaM2: number;
  aceitaPet: boolean;
  mobiliado: boolean;
  descricao: string;
  fonteId: number;
}): Promise<number> {
  await garantirSchema();
  const info = await pool.query<{ id: number }>(
    `INSERT INTO imoveis
      (titulo, tipo_operacao, municipio, bairro, endereco, lat, lng, preco, quartos, banheiros, area_m2, aceita_pet, mobiliado, descricao, fonte_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING id`,
    [
      dados.titulo,
      dados.tipoOperacao,
      dados.municipio,
      dados.bairro,
      dados.endereco,
      dados.lat,
      dados.lng,
      dados.preco,
      dados.quartos,
      dados.banheiros,
      dados.areaM2,
      dados.aceitaPet,
      dados.mobiliado,
      dados.descricao,
      dados.fonteId,
    ]
  );
  return info.rows[0].id;
}

/**
 * Upsert usado pela ingestão via feed de parceiro (Onda 2 da estratégia de dados):
 * casa por (fonteId, externalRef) — mesmo imóvel reenviado no feed atualiza em vez de duplicar.
 */
export async function criarOuAtualizarImovelViaFeed(dados: {
  externalRef: string;
  titulo: string;
  tipoOperacao: string;
  municipio: string;
  bairro: string;
  endereco: string;
  lat: number;
  lng: number;
  preco: number;
  quartos: number;
  banheiros: number;
  areaM2: number;
  aceitaPet: boolean;
  mobiliado: boolean;
  descricao: string;
  fonteId: number;
}): Promise<{ id: number; criado: boolean }> {
  await garantirSchema();
  const info = await pool.query<{ id: number; criado: boolean }>(
    `INSERT INTO imoveis
      (titulo, tipo_operacao, municipio, bairro, endereco, lat, lng, preco, quartos, banheiros, area_m2, aceita_pet, mobiliado, descricao, fonte_id, external_ref)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     ON CONFLICT (fonte_id, external_ref) WHERE external_ref IS NOT NULL
     DO UPDATE SET
       titulo = EXCLUDED.titulo, tipo_operacao = EXCLUDED.tipo_operacao, municipio = EXCLUDED.municipio,
       bairro = EXCLUDED.bairro, endereco = EXCLUDED.endereco, lat = EXCLUDED.lat, lng = EXCLUDED.lng,
       preco = EXCLUDED.preco, quartos = EXCLUDED.quartos, banheiros = EXCLUDED.banheiros,
       area_m2 = EXCLUDED.area_m2, aceita_pet = EXCLUDED.aceita_pet, mobiliado = EXCLUDED.mobiliado,
       descricao = EXCLUDED.descricao, status = 'disponivel', atualizado_em = NOW()
     RETURNING id, (xmax = 0) AS criado`,
    [
      dados.titulo,
      dados.tipoOperacao,
      dados.municipio,
      dados.bairro,
      dados.endereco,
      dados.lat,
      dados.lng,
      dados.preco,
      dados.quartos,
      dados.banheiros,
      dados.areaM2,
      dados.aceitaPet,
      dados.mobiliado,
      dados.descricao,
      dados.fonteId,
      dados.externalRef,
    ]
  );
  return info.rows[0];
}

export async function marcarInativosParaVerificar(diasLimite: number): Promise<number> {
  await garantirSchema();
  const info = await pool.query(
    `UPDATE imoveis SET status = 'verificar'
     WHERE status = 'disponivel' AND atualizado_em < NOW() - make_interval(days => $1::integer)`,
    [diasLimite]
  );
  return info.rowCount ?? 0;
}

export async function denunciarDesatualizado(imovelId: number): Promise<boolean> {
  await garantirSchema();
  const info = await pool.query(
    "UPDATE imoveis SET status = 'verificar' WHERE id = $1 AND status = 'disponivel'",
    [imovelId]
  );
  return (info.rowCount ?? 0) > 0;
}

export async function confirmarImovel(imovelId: number, fonteContato: string): Promise<boolean> {
  await garantirSchema();
  const info = await pool.query(
    `UPDATE imoveis SET status = 'disponivel', atualizado_em = NOW()
     WHERE id = $1 AND fonte_id IN (SELECT id FROM fontes WHERE contato = $2)`,
    [imovelId, fonteContato]
  );
  return (info.rowCount ?? 0) > 0;
}

export async function listarImoveisPorFonteContato(contato: string): Promise<Imovel[]> {
  await garantirSchema();
  const { rows } = await pool.query<ImovelRow>(
    `SELECT i.*, f.nome as fonte_nome FROM imoveis i
     JOIN fontes f ON f.id = i.fonte_id
     WHERE f.contato = $1
     ORDER BY i.criado_em DESC`,
    [contato]
  );
  return rows.map(rowToImovel);
}

type LeadRow = {
  id: number;
  imovel_id: number;
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
  criado_em: Date;
  imovel_titulo: string;
};

export async function listarLeadsPorFonteContato(
  contato: string
): Promise<(Lead & { imovelTitulo: string })[]> {
  await garantirSchema();
  const { rows } = await pool.query<LeadRow>(
    `SELECT l.*, i.titulo as imovel_titulo FROM leads l
     JOIN imoveis i ON i.id = l.imovel_id
     JOIN fontes f ON f.id = i.fonte_id
     WHERE f.contato = $1
     ORDER BY l.criado_em DESC`,
    [contato]
  );

  return rows.map((row) => ({
    id: row.id,
    imovelId: row.imovel_id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    mensagem: row.mensagem,
    criadoEm: row.criado_em.toISOString(),
    imovelTitulo: row.imovel_titulo,
  }));
}

export async function criarLead(dados: {
  imovelId: number;
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
}): Promise<number> {
  await garantirSchema();
  const info = await pool.query<{ id: number }>(
    `INSERT INTO leads (imovel_id, nome, email, telefone, mensagem)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [dados.imovelId, dados.nome, dados.email, dados.telefone, dados.mensagem]
  );
  return info.rows[0].id;
}

type AlertaRow = {
  id: number;
  email: string;
  filtros: FiltrosBusca;
  criado_em: Date;
  ultimo_envio: Date | null;
};

function rowToAlerta(row: AlertaRow): Alerta {
  return {
    id: row.id,
    email: row.email,
    filtros: row.filtros,
    criadoEm: row.criado_em.toISOString(),
    ultimoEnvio: row.ultimo_envio ? row.ultimo_envio.toISOString() : null,
  };
}

export async function criarAlerta(email: string, filtros: FiltrosBusca): Promise<number> {
  await garantirSchema();
  const info = await pool.query<{ id: number }>(
    "INSERT INTO alertas (email, filtros) VALUES ($1, $2) RETURNING id",
    [email, JSON.stringify(filtros)]
  );
  return info.rows[0].id;
}

export async function listarAlertas(): Promise<Alerta[]> {
  await garantirSchema();
  const { rows } = await pool.query<AlertaRow>("SELECT * FROM alertas ORDER BY criado_em DESC");
  return rows.map(rowToAlerta);
}

/** Imóveis que casam com o filtro do alerta e foram criados desde o último envio (ou desde a criação do alerta). */
export async function buscarNovosImoveisParaAlerta(alerta: Alerta): Promise<Imovel[]> {
  await garantirSchema();
  const desde = alerta.ultimoEnvio ?? alerta.criadoEm;
  const condicoes: string[] = ["i.status = 'disponivel'"];
  const params: unknown[] = [desde];
  condicoes.push(`i.criado_em > $${params.length}`);

  if (alerta.filtros.tipoOperacao) {
    params.push(alerta.filtros.tipoOperacao);
    condicoes.push(`i.tipo_operacao = $${params.length}`);
  }
  if (alerta.filtros.municipio) {
    params.push(alerta.filtros.municipio);
    condicoes.push(`i.municipio = $${params.length}`);
  }
  if (alerta.filtros.precoMax !== undefined) {
    params.push(alerta.filtros.precoMax);
    condicoes.push(`i.preco <= $${params.length}`);
  }
  if (alerta.filtros.quartos !== undefined) {
    params.push(alerta.filtros.quartos);
    condicoes.push(`i.quartos >= $${params.length}`);
  }
  if (alerta.filtros.aceitaPet) {
    condicoes.push("i.aceita_pet = TRUE");
  }

  const { rows } = await pool.query<ImovelRow>(
    `SELECT i.*, f.nome as fonte_nome FROM imoveis i
     JOIN fontes f ON f.id = i.fonte_id
     WHERE ${condicoes.join(" AND ")}
     ORDER BY i.criado_em DESC`,
    params
  );

  return rows.map(rowToImovel);
}

export async function marcarEnvioAlerta(id: number): Promise<void> {
  await garantirSchema();
  await pool.query("UPDATE alertas SET ultimo_envio = NOW() WHERE id = $1", [id]);
}

export default pool;
