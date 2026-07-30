export default function Hero() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">

        <h1 className="text-5xl font-bold text-[#0D1B2A] mb-6">
          Encontre a permuta ideal de forma simples e inteligente.
        </h1>

        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          O Permuta TJSP é uma plataforma independente criada para aproximar
          servidores interessados em permutas entre comarcas de forma segura,
          organizada e totalmente gratuita.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <button className="bg-[#C9A227] px-8 py-4 rounded-xl font-semibold text-[#0D1B2A] hover:opacity-90">
            Criar Conta
          </button>

          <button className="border border-[#0D1B2A] px-8 py-4 rounded-xl text-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white">
            Saiba Mais
          </button>
        </div>

      </div>
    </section>
  );
}