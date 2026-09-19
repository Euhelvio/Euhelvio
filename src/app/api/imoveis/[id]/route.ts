import { NextResponse } from "next/server";
import { buscarImovelPorId } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const imovel = buscarImovelPorId(Number(id));

  if (!imovel) {
    return NextResponse.json({ erro: "Imóvel não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ imovel });
}
