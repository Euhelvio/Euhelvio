import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { criarFonteOuReutilizar, criarImovel, listarImoveis } from "@/lib/db";
import { MUNICIPIOS_MVP } from "@/lib/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const tipoOperacao = params.get("tipoOperacao") ?? undefined;
  const municipio = params.get("municipio") ?? undefined;
  const precoMin = params.get("precoMin") ? Number(params.get("precoMin")) : undefined;
  const precoMax = params.get("precoMax") ? Number(params.get("precoMax")) : undefined;
  const quartos = params.get("quartos") ? Number(params.get("quartos")) : undefined;
  const aceitaPet = params.get("aceitaPet") === "1";

  const imoveis = listarImoveis({ tipoOperacao, municipio, precoMin, precoMax, quartos, aceitaPet });
  return NextResponse.json({ imoveis });
}

const cadastroSchema = z.object({
  titulo: z.string().min(5).max(120),
  tipoOperacao: z.enum(["aluguel", "venda", "comercial", "temporada"]),
  municipio: z.enum(MUNICIPIOS_MVP),
  bairro: z.string().min(2).max(80),
  endereco: z.string().min(5).max(160),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  preco: z.number().positive(),
  quartos: z.number().int().min(0).max(20),
  banheiros: z.number().int().min(0).max(20),
  areaM2: z.number().positive(),
  aceitaPet: z.boolean(),
  mobiliado: z.boolean(),
  descricao: z.string().max(2000).default(""),
  fonteNome: z.string().min(2).max(120),
  fonteContato: z.string().min(5).max(120),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = cadastroSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.flatten() }, { status: 400 });
  }

  const { fonteNome, fonteContato, ...dadosImovel } = parsed.data;
  const fonteId = criarFonteOuReutilizar(fonteNome, fonteContato);
  const id = criarImovel({ ...dadosImovel, fonteId });

  return NextResponse.json({ id }, { status: 201 });
}
