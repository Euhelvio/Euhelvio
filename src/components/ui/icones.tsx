export function IconeChave(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={28} height={28} {...props}>
      <circle cx="8" cy="15" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 12l8-8M17 6l2 2M14 9l1.5 1.5" />
    </svg>
  );
}

export function IconeEtiqueta(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={28} height={28} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 11.5V5a1 1 0 0 1 1-1h6.5a1 1 0 0 1 .7.3l9 9a1 1 0 0 1 0 1.4l-6.5 6.5a1 1 0 0 1-1.4 0l-9-9a1 1 0 0 1-.3-.7Z"
      />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconePredio(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={28} height={28} {...props}>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path strokeLinecap="round" d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
      <path strokeLinecap="round" d="M10 21v-3h4v3" />
    </svg>
  );
}

export function IconeGuardaSol(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={28} height={28} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2M3 13a9 9 0 0 1 18 0Z" />
      <path strokeLinecap="round" d="M12 13v7a2 2 0 1 1-4 0" />
    </svg>
  );
}

export function IconeCasa(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={26} height={26} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 11.5 12 4l8 7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 10v9a1 1 0 0 0 1 1h4v-5h2v5h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}
