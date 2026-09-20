export type TipoOperacao = "aluguel" | "venda" | "comercial" | "temporada";

export interface Imovel {
  id: number;
  titulo: string;
  tipoOperacao: TipoOperacao;
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
  status: "disponivel" | "verificar" | "removido";
  fonteId: number;
  fonteNome: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Lead {
  id: number;
  imovelId: number;
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
  criadoEm: string;
}

export interface FiltrosBusca {
  tipoOperacao?: string;
  municipio?: string;
  precoMin?: number;
  precoMax?: number;
  quartos?: number;
  aceitaPet?: boolean;
}

export interface Alerta {
  id: number;
  email: string;
  filtros: FiltrosBusca;
  criadoEm: string;
  ultimoEnvio: string | null;
}

export const TIPOS_OPERACAO: { valor: TipoOperacao; rotulo: string; cor: string }[] = [
  { valor: "aluguel", rotulo: "Aluguel residencial", cor: "var(--accent-aluguel)" },
  { valor: "venda", rotulo: "Compra e venda", cor: "var(--accent-venda)" },
  { valor: "comercial", rotulo: "Comercial", cor: "var(--accent-comercial)" },
  { valor: "temporada", rotulo: "Temporada", cor: "var(--accent-temporada)" },
];

export const MUNICIPIOS_MVP = [
  "Florianópolis",
  "São José",
  "Palhoça",
  "Biguaçu",
  "Santo Amaro da Imperatriz",
  "Governador Celso Ramos",
  "Águas Mornas",
] as const;
