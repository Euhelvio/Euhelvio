import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { Alerta, FiltrosBusca, Imovel, Lead } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS fontes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    tipo_integracao TEXT NOT NULL DEFAULT 'manual',
    contato TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS imoveis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    tipo_operacao TEXT NOT NULL,
    municipio TEXT NOT NULL,
    bairro TEXT NOT NULL,
    endereco TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    preco REAL NOT NULL,
    quartos INTEGER NOT NULL DEFAULT 0,
    banheiros INTEGER NOT NULL DEFAULT 0,
    area_m2 REAL NOT NULL DEFAULT 0,
    aceita_pet INTEGER NOT NULL DEFAULT 0,
    mobiliado INTEGER NOT NULL DEFAULT 0,
    descricao TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'disponivel',
    fonte_id INTEGER NOT NULL REFERENCES fontes(id),
    external_ref TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_imoveis_fonte_external
    ON imoveis(fonte_id, external_ref)
    WHERE external_ref IS NOT NULL;

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imovel_id INTEGER NOT NULL REFERENCES imoveis(id),
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL DEFAULT '',
    mensagem TEXT NOT NULL DEFAULT '',
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS alertas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    filtros TEXT NOT NULL DEFAULT '{}',
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    ultimo_envio TEXT
  );
`);

seedIfEmpty();

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
  aceita_pet: number;
  mobiliado: number;
  descricao: string;
  status: string;
  fonte_id: number;
  fonte_nome: string;
  external_ref: string | null;
  criado_em: string;
  atualizado_em: string;
};

export function rowToImovel(row: ImovelRow): Imovel {
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
    aceitaPet: Boolean(row.aceita_pet),
    mobiliado: Boolean(row.mobiliado),
    descricao: row.descricao,
    status: row.status as Imovel["status"],
    fonteId: row.fonte_id,
    fonteNome: row.fonte_nome,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

function seedIfEmpty() {
  const { c } = db.prepare("SELECT COUNT(*) as c FROM imoveis").get() as { c: number };
  if (c > 0) return;

  const insertFonte = db.prepare(
    "INSERT INTO fontes (nome, tipo_integracao, contato) VALUES (?, 'manual', ?)"
  );
  const insertImovel = db.prepare(`
    INSERT INTO imoveis
      (titulo, tipo_operacao, municipio, bairro, endereco, lat, lng, preco, quartos, banheiros, area_m2, aceita_pet, mobiliado, descricao, fonte_id)
    VALUES (@titulo, @tipoOperacao, @municipio, @bairro, @endereco, @lat, @lng, @preco, @quartos, @banheiros, @areaM2, @aceitaPet, @mobiliado, @descricao, @fonteId)
  `);

  const fontes = [
    { nome: "Imobiliária Ilha Sul", contato: "(48) 99100-1010" },
    { nome: "Corretora Ana Beatriz", contato: "(48) 99200-2020" },
    { nome: "Imobiliária Continente", contato: "(48) 99300-3030" },
  ];
  const fonteIds = fontes.map((f) => insertFonte.run(f.nome, f.contato).lastInsertRowid as number);

  const seed = [
    { titulo: "Apto 2 quartos próximo à UFSC", tipoOperacao: "aluguel", municipio: "Florianópolis", bairro: "Trindade", endereco: "Rua Lauro Linhares, 500", lat: -27.5847, lng: -48.5223, preco: 2400, quartos: 2, banheiros: 1, areaM2: 62, aceitaPet: 1, mobiliado: 0, descricao: "Apartamento reformado a 10 minutos a pé da UFSC, ótimo para estudantes." },
    { titulo: "Kitnet mobiliada no Centro", tipoOperacao: "aluguel", municipio: "Florianópolis", bairro: "Centro", endereco: "Rua Felipe Schmidt, 200", lat: -27.5954, lng: -48.548, preco: 1600, quartos: 1, banheiros: 1, areaM2: 28, aceitaPet: 0, mobiliado: 1, descricao: "Kitnet mobiliada, pronta para morar, próxima ao terminal urbano." },
    { titulo: "Casa 3 quartos na Lagoa da Conceição", tipoOperacao: "aluguel", municipio: "Florianópolis", bairro: "Lagoa da Conceição", endereco: "Servidão dos Pescadores, 45", lat: -27.6068, lng: -48.459, preco: 4800, quartos: 3, banheiros: 2, areaM2: 140, aceitaPet: 1, mobiliado: 0, descricao: "Casa térrea com quintal, a 5 minutos da Lagoa." },
    { titulo: "Apto 1 quarto em Coqueiros", tipoOperacao: "aluguel", municipio: "Florianópolis", bairro: "Coqueiros", endereco: "Av. Governador Ivo Silveira, 800", lat: -27.589, lng: -48.572, preco: 1950, quartos: 1, banheiros: 1, areaM2: 45, aceitaPet: 0, mobiliado: 0, descricao: "Vista parcial para o mar, prédio com portaria 24h." },
    { titulo: "Apto 2 quartos no Campeche", tipoOperacao: "aluguel", municipio: "Florianópolis", bairro: "Campeche", endereco: "Rua Pequeno Príncipe, 120", lat: -27.6767, lng: -48.489, preco: 2200, quartos: 2, banheiros: 1, areaM2: 58, aceitaPet: 1, mobiliado: 0, descricao: "A 8 quadras da praia do Campeche, condomínio com piscina." },
    { titulo: "Casa 4 quartos em Canasvieiras", tipoOperacao: "temporada", municipio: "Florianópolis", bairro: "Canasvieiras", endereco: "Rua das Gaivotas, 300", lat: -27.431, lng: -48.466, preco: 3600, quartos: 4, banheiros: 3, areaM2: 180, aceitaPet: 1, mobiliado: 1, descricao: "Ideal para temporada em família, a 200m da praia. Diária ou semana." },
    { titulo: "Apto 3 quartos nos Ingleses", tipoOperacao: "temporada", municipio: "Florianópolis", bairro: "Ingleses", endereco: "Rua das Bromélias, 90", lat: -27.433, lng: -48.395, preco: 2900, quartos: 3, banheiros: 2, areaM2: 90, aceitaPet: 0, mobiliado: 1, descricao: "Mobiliado para temporada, a 3 quadras da praia dos Ingleses." },
    { titulo: "Apto 2 quartos no Centro de São José", tipoOperacao: "aluguel", municipio: "São José", bairro: "Centro", endereco: "Rua Almirante Barroso, 400", lat: -27.5969, lng: -48.6339, preco: 1800, quartos: 2, banheiros: 1, areaM2: 55, aceitaPet: 1, mobiliado: 0, descricao: "Próximo ao terminal integrado, fácil acesso à BR-101." },
    { titulo: "Casa 3 quartos em Kobrasol", tipoOperacao: "venda", municipio: "São José", bairro: "Kobrasol", endereco: "Rua João Pereira, 250", lat: -27.5936, lng: -48.6142, preco: 690000, quartos: 3, banheiros: 2, areaM2: 110, aceitaPet: 1, mobiliado: 0, descricao: "Bairro comercial, próximo a shoppings e escolas. Escritura em dia." },
    { titulo: "Apto 2 quartos no Centro de Palhoça", tipoOperacao: "aluguel", municipio: "Palhoça", bairro: "Centro", endereco: "Av. Pedra Branca, 600", lat: -27.6386, lng: -48.6706, preco: 1500, quartos: 2, banheiros: 1, areaM2: 50, aceitaPet: 0, mobiliado: 0, descricao: "Próximo à Via Expressa, ótimo custo-benefício." },
    { titulo: "Apto 1 quarto em Pedra Branca", tipoOperacao: "venda", municipio: "Palhoça", bairro: "Pedra Branca", endereco: "Av. Marieta D'Ávila, 1200", lat: -27.6289, lng: -48.6572, preco: 420000, quartos: 1, banheiros: 1, areaM2: 42, aceitaPet: 1, mobiliado: 1, descricao: "Bairro planejado, mobiliado, prédio com academia. Pronto para morar." },
    { titulo: "Casa 3 quartos no Centro de Biguaçu", tipoOperacao: "aluguel", municipio: "Biguaçu", bairro: "Centro", endereco: "Rua Getúlio Vargas, 150", lat: -27.4941, lng: -48.655, preco: 1900, quartos: 3, banheiros: 1, areaM2: 100, aceitaPet: 1, mobiliado: 0, descricao: "Quintal amplo, próxima à BR-101 e ao centro histórico." },
    { titulo: "Casa 2 quartos em Santo Amaro da Imperatriz", tipoOperacao: "aluguel", municipio: "Santo Amaro da Imperatriz", bairro: "Centro", endereco: "Rua Leoberto Leal, 80", lat: -27.6892, lng: -48.7789, preco: 1400, quartos: 2, banheiros: 1, areaM2: 70, aceitaPet: 1, mobiliado: 0, descricao: "Perto das Termas, cidade tranquila a 30 min de Floripa." },
    { titulo: "Casa 2 quartos em Governador Celso Ramos", tipoOperacao: "aluguel", municipio: "Governador Celso Ramos", bairro: "Centro", endereco: "Rua Beira Mar, 220", lat: -27.3167, lng: -48.55, preco: 1600, quartos: 2, banheiros: 1, areaM2: 65, aceitaPet: 1, mobiliado: 0, descricao: "A poucos metros da praia, cidade de pescadores." },
    { titulo: "Casa 3 quartos em Águas Mornas", tipoOperacao: "aluguel", municipio: "Águas Mornas", bairro: "Centro", endereco: "Rua Principal, 55", lat: -27.7275, lng: -48.8064, preco: 1300, quartos: 3, banheiros: 1, areaM2: 95, aceitaPet: 1, mobiliado: 0, descricao: "Área verde, ideal para quem busca sossego perto da capital." },
    { titulo: "Sala comercial no Centro de Florianópolis", tipoOperacao: "comercial", municipio: "Florianópolis", bairro: "Centro", endereco: "Rua Tenente Silveira, 300", lat: -27.596, lng: -48.5495, preco: 2800, quartos: 0, banheiros: 1, areaM2: 45, aceitaPet: 0, mobiliado: 0, descricao: "Sala comercial no coração do Centro, prédio com portaria e elevador." },
    { titulo: "Loja em Kobrasol, São José", tipoOperacao: "comercial", municipio: "São José", bairro: "Kobrasol", endereco: "Av. Presidente Kennedy, 900", lat: -27.5931, lng: -48.6127, preco: 3500, quartos: 0, banheiros: 1, areaM2: 80, aceitaPet: 0, mobiliado: 0, descricao: "Loja de esquina, alto fluxo de pedestres, próxima a bancos e comércio." },
    { titulo: "Galpão industrial em Biguaçu", tipoOperacao: "comercial", municipio: "Biguaçu", bairro: "Centro", endereco: "Rodovia BR-101, km 195", lat: -27.4955, lng: -48.6535, preco: 8500, quartos: 0, banheiros: 2, areaM2: 600, aceitaPet: 0, mobiliado: 0, descricao: "Galpão com acesso direto à BR-101, pé-direito alto, ideal para logística." },
    { titulo: "Casa 4 quartos na Lagoa da Conceição", tipoOperacao: "venda", municipio: "Florianópolis", bairro: "Lagoa da Conceição", endereco: "Servidão dos Pescadores, 120", lat: -27.607, lng: -48.4605, preco: 1850000, quartos: 4, banheiros: 3, areaM2: 210, aceitaPet: 1, mobiliado: 0, descricao: "Casa alto padrão a 5 minutos da Lagoa, piscina e churrasqueira." },
  ];

  const insertMany = db.transaction((rows: typeof seed) => {
    rows.forEach((imovel, i) => {
      insertImovel.run({
        ...imovel,
        aceitaPet: imovel.aceitaPet,
        mobiliado: imovel.mobiliado,
        fonteId: fonteIds[i % fonteIds.length],
      });
    });
  });
  insertMany(seed);
}

export function listarImoveis(filtros: FiltrosBusca): Imovel[] {
  const condicoes: string[] = ["i.status = 'disponivel'"];
  const params: Record<string, unknown> = {};

  if (filtros.tipoOperacao) {
    condicoes.push("i.tipo_operacao = @tipoOperacao");
    params.tipoOperacao = filtros.tipoOperacao;
  }
  if (filtros.municipio) {
    condicoes.push("i.municipio = @municipio");
    params.municipio = filtros.municipio;
  }
  if (filtros.precoMin !== undefined) {
    condicoes.push("i.preco >= @precoMin");
    params.precoMin = filtros.precoMin;
  }
  if (filtros.precoMax !== undefined) {
    condicoes.push("i.preco <= @precoMax");
    params.precoMax = filtros.precoMax;
  }
  if (filtros.quartos !== undefined) {
    condicoes.push("i.quartos >= @quartos");
    params.quartos = filtros.quartos;
  }
  if (filtros.aceitaPet) {
    condicoes.push("i.aceita_pet = 1");
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT i.*, f.nome as fonte_nome FROM imoveis i
       JOIN fontes f ON f.id = i.fonte_id
       ${where}
       ORDER BY i.criado_em DESC`
    )
    .all(params) as ImovelRow[];

  return rows.map(rowToImovel);
}

export function buscarImovelPorId(id: number): Imovel | null {
  const row = db
    .prepare(
      `SELECT i.*, f.nome as fonte_nome FROM imoveis i
       JOIN fontes f ON f.id = i.fonte_id
       WHERE i.id = ?`
    )
    .get(id) as ImovelRow | undefined;
  return row ? rowToImovel(row) : null;
}

export function criarFonteOuReutilizar(nome: string, contato: string): number {
  const existente = db
    .prepare("SELECT id FROM fontes WHERE nome = ? AND contato = ?")
    .get(nome, contato) as { id: number } | undefined;
  if (existente) return existente.id;
  const info = db
    .prepare("INSERT INTO fontes (nome, tipo_integracao, contato) VALUES (?, 'manual', ?)")
    .run(nome, contato);
  return info.lastInsertRowid as number;
}

export function criarImovel(dados: {
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
}): number {
  const info = db
    .prepare(
      `INSERT INTO imoveis
        (titulo, tipo_operacao, municipio, bairro, endereco, lat, lng, preco, quartos, banheiros, area_m2, aceita_pet, mobiliado, descricao, fonte_id)
       VALUES (@titulo, @tipoOperacao, @municipio, @bairro, @endereco, @lat, @lng, @preco, @quartos, @banheiros, @areaM2, @aceitaPet, @mobiliado, @descricao, @fonteId)`
    )
    .run({
      ...dados,
      aceitaPet: dados.aceitaPet ? 1 : 0,
      mobiliado: dados.mobiliado ? 1 : 0,
    });
  return info.lastInsertRowid as number;
}

/**
 * Upsert usado pela ingestão via feed de parceiro (Onda 2 da estratégia de dados):
 * casa por (fonteId, externalRef) — mesmo imóvel reenviado no feed atualiza em vez de duplicar.
 */
export function criarOuAtualizarImovelViaFeed(dados: {
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
}): { id: number; criado: boolean } {
  const existente = db
    .prepare("SELECT id FROM imoveis WHERE fonte_id = ? AND external_ref = ?")
    .get(dados.fonteId, dados.externalRef) as { id: number } | undefined;

  const valores = {
    ...dados,
    aceitaPet: dados.aceitaPet ? 1 : 0,
    mobiliado: dados.mobiliado ? 1 : 0,
  };

  if (existente) {
    db.prepare(
      `UPDATE imoveis SET
        titulo = @titulo, tipo_operacao = @tipoOperacao, municipio = @municipio, bairro = @bairro,
        endereco = @endereco, lat = @lat, lng = @lng, preco = @preco, quartos = @quartos,
        banheiros = @banheiros, area_m2 = @areaM2, aceita_pet = @aceitaPet, mobiliado = @mobiliado,
        descricao = @descricao, status = 'disponivel', atualizado_em = datetime('now')
       WHERE id = @id`
    ).run({ ...valores, id: existente.id });
    return { id: existente.id, criado: false };
  }

  const info = db
    .prepare(
      `INSERT INTO imoveis
        (titulo, tipo_operacao, municipio, bairro, endereco, lat, lng, preco, quartos, banheiros, area_m2, aceita_pet, mobiliado, descricao, fonte_id, external_ref)
       VALUES (@titulo, @tipoOperacao, @municipio, @bairro, @endereco, @lat, @lng, @preco, @quartos, @banheiros, @areaM2, @aceitaPet, @mobiliado, @descricao, @fonteId, @externalRef)`
    )
    .run(valores);
  return { id: info.lastInsertRowid as number, criado: true };
}

export function marcarInativosParaVerificar(diasLimite: number): number {
  const info = db
    .prepare(
      `UPDATE imoveis SET status = 'verificar'
       WHERE status = 'disponivel' AND atualizado_em < datetime('now', @janela)`
    )
    .run({ janela: `-${diasLimite} days` });
  return info.changes;
}

export function denunciarDesatualizado(imovelId: number): boolean {
  const info = db
    .prepare("UPDATE imoveis SET status = 'verificar' WHERE id = ? AND status = 'disponivel'")
    .run(imovelId);
  return info.changes > 0;
}

export function confirmarImovel(imovelId: number, fonteContato: string): boolean {
  const info = db
    .prepare(
      `UPDATE imoveis SET status = 'disponivel', atualizado_em = datetime('now')
       WHERE id = @id AND fonte_id IN (SELECT id FROM fontes WHERE contato = @contato)`
    )
    .run({ id: imovelId, contato: fonteContato });
  return info.changes > 0;
}

export function listarImoveisPorFonteContato(contato: string): Imovel[] {
  const rows = db
    .prepare(
      `SELECT i.*, f.nome as fonte_nome FROM imoveis i
       JOIN fontes f ON f.id = i.fonte_id
       WHERE f.contato = ?
       ORDER BY i.criado_em DESC`
    )
    .all(contato) as ImovelRow[];
  return rows.map(rowToImovel);
}

type LeadRow = {
  id: number;
  imovel_id: number;
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
  criado_em: string;
  imovel_titulo: string;
};

export function listarLeadsPorFonteContato(
  contato: string
): (Lead & { imovelTitulo: string })[] {
  const rows = db
    .prepare(
      `SELECT l.*, i.titulo as imovel_titulo FROM leads l
       JOIN imoveis i ON i.id = l.imovel_id
       JOIN fontes f ON f.id = i.fonte_id
       WHERE f.contato = ?
       ORDER BY l.criado_em DESC`
    )
    .all(contato) as LeadRow[];

  return rows.map((row) => ({
    id: row.id,
    imovelId: row.imovel_id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    mensagem: row.mensagem,
    criadoEm: row.criado_em,
    imovelTitulo: row.imovel_titulo,
  }));
}

export function criarLead(dados: {
  imovelId: number;
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
}): number {
  const info = db
    .prepare(
      `INSERT INTO leads (imovel_id, nome, email, telefone, mensagem)
       VALUES (@imovelId, @nome, @email, @telefone, @mensagem)`
    )
    .run(dados);
  return info.lastInsertRowid as number;
}

type AlertaRow = {
  id: number;
  email: string;
  filtros: string;
  criado_em: string;
  ultimo_envio: string | null;
};

function rowToAlerta(row: AlertaRow): Alerta {
  return {
    id: row.id,
    email: row.email,
    filtros: JSON.parse(row.filtros) as FiltrosBusca,
    criadoEm: row.criado_em,
    ultimoEnvio: row.ultimo_envio,
  };
}

export function criarAlerta(email: string, filtros: FiltrosBusca): number {
  const info = db
    .prepare("INSERT INTO alertas (email, filtros) VALUES (?, ?)")
    .run(email, JSON.stringify(filtros));
  return info.lastInsertRowid as number;
}

export function listarAlertas(): Alerta[] {
  const rows = db.prepare("SELECT * FROM alertas ORDER BY criado_em DESC").all() as AlertaRow[];
  return rows.map(rowToAlerta);
}

/** Imóveis que casam com o filtro do alerta e foram criados desde o último envio (ou desde a criação do alerta). */
export function buscarNovosImoveisParaAlerta(alerta: Alerta): Imovel[] {
  const desde = alerta.ultimoEnvio ?? alerta.criadoEm;
  const condicoes: string[] = ["i.status = 'disponivel'", "i.criado_em > @desde"];
  const params: Record<string, unknown> = { desde };

  if (alerta.filtros.tipoOperacao) {
    condicoes.push("i.tipo_operacao = @tipoOperacao");
    params.tipoOperacao = alerta.filtros.tipoOperacao;
  }
  if (alerta.filtros.municipio) {
    condicoes.push("i.municipio = @municipio");
    params.municipio = alerta.filtros.municipio;
  }
  if (alerta.filtros.precoMax !== undefined) {
    condicoes.push("i.preco <= @precoMax");
    params.precoMax = alerta.filtros.precoMax;
  }
  if (alerta.filtros.quartos !== undefined) {
    condicoes.push("i.quartos >= @quartos");
    params.quartos = alerta.filtros.quartos;
  }
  if (alerta.filtros.aceitaPet) {
    condicoes.push("i.aceita_pet = 1");
  }

  const rows = db
    .prepare(
      `SELECT i.*, f.nome as fonte_nome FROM imoveis i
       JOIN fontes f ON f.id = i.fonte_id
       WHERE ${condicoes.join(" AND ")}
       ORDER BY i.criado_em DESC`
    )
    .all(params) as ImovelRow[];

  return rows.map(rowToImovel);
}

export function marcarEnvioAlerta(id: number): void {
  db.prepare("UPDATE alertas SET ultimo_envio = datetime('now') WHERE id = ?").run(id);
}

export default db;
