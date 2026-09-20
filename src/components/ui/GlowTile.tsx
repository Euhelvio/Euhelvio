import type { CSSProperties, ReactNode } from "react";

export default function GlowTile({
  cor = "var(--brand)",
  ativo = false,
  icone,
  rotulo,
  onClick,
}: {
  cor?: string;
  ativo?: boolean;
  icone: ReactNode;
  rotulo: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ "--glow-color": cor } as CSSProperties}
      className={`glow-card flex flex-1 flex-col items-center gap-2 px-4 py-4 text-center ${ativo ? "is-active" : ""}`}
    >
      <span style={{ color: cor }}>{icone}</span>
      <span className="text-sm font-semibold">{rotulo}</span>
    </button>
  );
}
