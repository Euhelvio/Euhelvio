import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buscarImovelPorId, criarLead } from "@/lib/db";

const leadSchema = z.object({
  imovelId: z.number().int().positive(),
  nome: z.string().min(2).max(120),
  email: z.string().email(),
  telefone: z.string().min(8).max(30),
  mensagem: z.string().max(2000).default(""),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.flatten() }, { status: 400 });
  }

  const imovel = buscarImovelPorId(parsed.data.imovelId);
  if (!imovel) {
    return NextResponse.json({ erro: "Imóvel não encontrado" }, { status: 404 });
  }

  const id = criarLead(parsed.data);
  return NextResponse.json({ id }, { status: 201 });
}
