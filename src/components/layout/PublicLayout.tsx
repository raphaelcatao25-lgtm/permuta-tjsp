"use client";

type PublicLayoutProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  maxWidth?: "sm" | "md" | "lg" | string;
};

export function PublicLayout({
  children,
  title,
  description,
  maxWidth = "md",
}: PublicLayoutProps) {

  const widths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };


  return (
    <main className="min-h-[calc(100vh-180px)] px-6 py-12">

      <div
        className={`
          mx-auto
          w-full
          ${widths[maxWidth as keyof typeof widths] ?? maxWidth}
        `}
      >

        {title && (
          <h1 className="mb-3 text-3xl font-bold text-slate-900">
            {title}
          </h1>
        )}


        {description && (
          <p className="mb-8 text-slate-600">
            {description}
          </p>
        )}


        {children}

      </div>

    </main>
  );
}