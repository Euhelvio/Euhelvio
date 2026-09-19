import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { criarAlerta } from "@/lib/db";

const alertaSchema = z.object({
  email: z.string().email(),
  filtros: z.object({
    tipoOperacao: z.string().optional(),
    municipio: z.string().optional(),
    precoMax: z.number().optional(),
    quartos: z.number().optional(),
    aceitaPet: z.boolean().optional(),
  }),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = alertaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.flatten() }, { status: 400 });
  }

  const id = await criarAlerta(parsed.data.email, parsed.data.filtros);
  return NextResponse.json({ id }, { status: 201 });
}
