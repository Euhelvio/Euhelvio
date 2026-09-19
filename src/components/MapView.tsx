"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import type { Imovel } from "@/lib/types";
import { formatarPreco } from "@/lib/format";

const icon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const CENTRO_GRANDE_FLORIPA: [number, number] = [-27.62, -48.58];

export default function MapView({ imoveis }: { imoveis: Imovel[] }) {
  return (
    <MapContainer
      center={CENTRO_GRANDE_FLORIPA}
      zoom={10}
      scrollWheelZoom
      className="h-full w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {imoveis.map((imovel) => (
        <Marker key={imovel.id} position={[imovel.lat, imovel.lng]} icon={icon}>
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{imovel.titulo}</p>
              <p>
                {formatarPreco(imovel.preco)} / mês · {imovel.bairro}
              </p>
              <Link href={`/imoveis/${imovel.id}`} className="text-blue-600 underline">
                Ver detalhes
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
