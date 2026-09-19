import BuscaImoveis from "@/components/BuscaImoveis";
import { listarImoveis } from "@/lib/db";

export default async function Home() {
  const imoveisIniciais = await listarImoveis({});
  return <BuscaImoveis imoveisIniciais={imoveisIniciais} />;
}
