import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <PublicHeader />

      <main className="flex-1">
        {children}
      </main>

      <Footer />

    </div>
  );
}