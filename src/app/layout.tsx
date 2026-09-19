import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black">
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Link href="/" className="font-bold">
            Floripa Imóveis
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/" className="hover:underline">
              Buscar imóveis
            </Link>
            <Link href="/parceiros/cadastrar" className="hover:underline">
              Cadastrar imóvel
            </Link>
            <Link href="/parceiros/painel" className="hover:underline">
              Painel do parceiro
            </Link>
          </nav>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
