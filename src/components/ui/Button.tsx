import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "ghost";

type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-blue-900 bg-blue-900 text-white shadow-sm hover:border-blue-800 hover:bg-blue-800 focus-visible:ring-blue-900/30",

  secondary:
    "border-slate-700 bg-slate-700 text-white shadow-sm hover:border-slate-800 hover:bg-slate-800 focus-visible:ring-slate-500/30",

  outline:
    "border-slate-300 bg-white text-slate-900 hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900 focus-visible:ring-blue-900/20",

  danger:
    "border-red-600 bg-red-600 text-white shadow-sm hover:border-red-700 hover:bg-red-700 focus-visible:ring-red-600/30",

  ghost:
    "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-sm",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-5 py-3 text-base",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  loadingText = "Carregando...",
  disabled = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const buttonClasses = [
    "inline-flex items-center justify-center gap-2",
    "rounded-xl border font-semibold",
    "transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-4",
    "disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={buttonClasses}
      {...props}
    >
      {loading && (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4 animate-spin"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="3"
            className="opacity-25"
          />

          <path
            d="M21 12A9 9 0 0 0 12 3"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="opacity-90"
          />
        </svg>
      )}

      <span>{loading ? loadingText : children}</span>
    </button>
  );
}