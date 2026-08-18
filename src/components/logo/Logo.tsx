import Link from "next/link";

type LogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

export function Logo({
  href = "/",
  compact = false,
  className = "",
}: LogoProps) {
  const logoContent = (
    <div
      className={`inline-flex items-center gap-3 ${className}`}
      aria-label="Permuta TJSP"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md">
        <svg
          aria-hidden="true"
          viewBox="0 0 48 48"
          className="h-7 w-7 text-white"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 16H34"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />

          <path
            d="M29 10L35 16L29 22"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M35 32H14"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />

          <path
            d="M19 26L13 32L19 38"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {!compact && (
        <div className="leading-tight">
          <p className="text-lg font-bold tracking-tight text-text-primary">
            Permuta TJSP
          </p>

          <p className="text-xs font-medium text-text-muted">
            Conectando servidores
          </p>
        </div>
      )}
    </div>
  );

  if (!href) {
    return logoContent;
  }

  return (
    <Link
      href={href}
      className="inline-flex rounded-xl focus-visible:outline-none"
      aria-label="Ir para a página inicial do Permuta TJSP"
    >
      {logoContent}
    </Link>
  );
}