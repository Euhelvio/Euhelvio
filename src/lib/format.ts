import type { TipoOperacao } from "./types";

export function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function formatarPrecoImovel(preco: number, tipoOperacao: TipoOperacao): string {
  const valor = formatarPreco(preco);
  return tipoOperacao === "venda" ? valor : `${valor} / mês`;
}
