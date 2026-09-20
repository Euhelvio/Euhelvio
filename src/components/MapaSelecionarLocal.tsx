"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { LeafletEvent, LatLng, Marker as LeafletMarker } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

function CliquesNoMapa({ onSelecionar }: { onSelecionar: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelecionar(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapaSelecionarLocal({
  lat,
  lng,
  onSelecionar,
}: {
  lat: number | null;
  lng: number | null;
  onSelecionar: (lat: number, lng: number) => void;
}) {
  const temPosicao = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng);
  const centro: [number, number] = temPosicao ? [lat, lng] : CENTRO_GRANDE_FLORIPA;

  return (
    <MapContainer
      center={centro}
      zoom={temPosicao ? 15 : 10}
      scrollWheelZoom
      className="h-full w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CliquesNoMapa onSelecionar={onSelecionar} />
      {temPosicao && (
        <Marker
          position={[lat, lng]}
          icon={icon}
          draggable
          eventHandlers={{
            dragend: (e: LeafletEvent) => {
              const posicao: LatLng = (e.target as LeafletMarker).getLatLng();
              onSelecionar(posicao.lat, posicao.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
