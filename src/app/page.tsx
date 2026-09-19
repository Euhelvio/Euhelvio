import BuscaImoveis from "@/components/BuscaImoveis";
import { listarImoveis } from "@/lib/db";

export default function Home() {
  const imoveisIniciais = listarImoveis({});
  return <BuscaImoveis imoveisIniciais={imoveisIniciais} />;
}
