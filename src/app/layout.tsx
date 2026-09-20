import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Floripa Imóveis — busca agregada na Grande Florianópolis",
  description:
    "Portal que agrega anúncios de aluguel, compra e venda, comercial e temporada de imobiliárias parceiras da Grande Florianópolis.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border-subtle bg-surface/85 px-4 py-3 backdrop-blur">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-sm ring-1 ring-border-subtle">
              <Image src="/marca/logo.webp" alt="" width={40} height={40} className="h-full w-full object-contain" />
            </span>
            <span>
              Floripa <span className="text-brand">Imóveis</span>
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/" className="hover:text-brand">
              Buscar imóveis
            </Link>
            <Link href="/parceiros/painel" className="hover:text-brand">
              Painel do parceiro
            </Link>
            <Link
              href="/parceiros/cadastrar"
              style={{ "--glow-color": "var(--brand)" } as CSSProperties}
              className="glow-btn px-3 py-1.5"
            >
              Cadastrar imóvel
            </Link>
          </nav>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
