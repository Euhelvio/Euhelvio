"use client";

import dynamic from "next/dynamic";
import type { Imovel } from "@/lib/types";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapaUnico({ imovel }: { imovel: Imovel }) {
  return <MapView imoveis={[imovel]} />;
}
