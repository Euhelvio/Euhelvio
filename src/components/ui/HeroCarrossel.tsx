"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const FOTOS = [
  "/hero/foto-1.webp",
  "/hero/foto-3.webp",
  "/hero/foto-5.webp",
  "/hero/foto-4.webp",
  "/hero/foto-2.webp",
];
const INTERVALO_MS = 6000;

export default function HeroCarrossel() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndice((i) => (i + 1) % FOTOS.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {FOTOS.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          className={`object-cover transition-opacity duration-1000 ease-in-out ${
            i === indice ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-amber-900/15 via-transparent to-transparent" />
    </div>
  );
}
