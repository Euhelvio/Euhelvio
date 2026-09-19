import { NextResponse } from "next/server";
import { denunciarDesatualizado } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const alterado = denunciarDesatualizado(Number(id));

  if (!alterado) {
    return NextResponse.json(
      { erro: "Imóvel não encontrado ou já sinalizado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
