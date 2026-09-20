import type { ButtonHTMLAttributes, CSSProperties } from "react";

export default function GlowButton({
  cor = "var(--brand)",
  className = "",
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { cor?: string }) {
  return (
    <button
      {...props}
      style={{ "--glow-color": cor, ...style } as CSSProperties}
      className={`glow-btn px-4 py-2 text-sm font-semibold ${className}`}
    />
  );
}
