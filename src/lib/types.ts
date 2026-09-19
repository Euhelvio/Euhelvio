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
  municipio?: string;
  precoMin?: number;
  precoMax?: number;
  quartos?: number;
  aceitaPet?: boolean;
}

export const TIPOS_OPERACAO: { valor: TipoOperacao; rotulo: string }[] = [
  { valor: "aluguel", rotulo: "Aluguel residencial" },
  { valor: "venda", rotulo: "Compra e venda" },
  { valor: "comercial", rotulo: "Comercial" },
  { valor: "temporada", rotulo: "Temporada" },
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
