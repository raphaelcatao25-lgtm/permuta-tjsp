export default function Header() {
  return (
    <header className="bg-[#0D1B2A] text-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C9A227] flex items-center justify-center text-[#0D1B2A] font-bold">
            ↔
          </div>

          <div>
            <h1 className="text-xl font-bold">Permuta TJSP</h1>
            <p className="text-xs text-gray-300">
              Plataforma Independente
            </p>
          </div>
        </div>

        <nav className="hidden md:flex gap-8 text-sm">
          <a href="#como-funciona" className="hover:text-[#C9A227]">
            Como funciona
          </a>

          <a href="#vantagens" className="hover:text-[#C9A227]">
            Vantagens
          </a>

          <a href="#faq" className="hover:text-[#C9A227]">
            FAQ
          </a>
        </nav>

        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg border border-white hover:bg-white hover:text-[#0D1B2A] transition">
            Entrar
          </button>

          <button className="px-4 py-2 rounded-lg bg-[#C9A227] text-[#0D1B2A] font-semibold hover:opacity-90 transition">
            Criar Conta
          </button>
        </div>

      </div>
    </header>
  );
}