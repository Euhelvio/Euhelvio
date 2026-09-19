import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { confirmarImovel } from "@/lib/db";

const schema = z.object({ fonteContato: z.string().min(5) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.flatten() }, { status: 400 });
  }

  const alterado = await confirmarImovel(Number(id), parsed.data.fonteContato);

  if (!alterado) {
    return NextResponse.json(
      { erro: "Imóvel não encontrado para este contato" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
