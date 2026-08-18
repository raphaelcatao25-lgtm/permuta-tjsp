import { UserPlus, MapPin, Handshake } from "lucide-react";

export default function HowItWorks() {
  return (
    <section className="bg-[#F8F9FA] py-24">
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-4xl font-bold text-center text-[#0D1B2A] mb-4">
          Como funciona
        </h2>

        <p className="text-center text-gray-600 mb-16">
          Em apenas três passos você encontra oportunidades de permuta.
        </p>

        <div className="grid md:grid-cols-3 gap-8">

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">

            <UserPlus 
 size={48}
 className="mx-auto text-blue-900 mb-6"
/>

            <h3 className="text-2xl font-bold mb-4">
              Cadastre-se
            </h3>

            <p className="text-gray-600">
              Crie sua conta gratuitamente e informe seus dados.
            </p>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">

            <MapPin 
 size={48} 
 className="mx-auto text-blue-900 mb-6"
/>

            <h3 className="text-2xl font-bold mb-4">
              Escolha sua comarca
            </h3>

            <p className="text-gray-600">
              Informe onde trabalha atualmente e para onde deseja ir.
            </p>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">

            <Handshake 
 size={48} 
 className="mx-auto text-blue-900 mb-6"
/>

            <h3 className="text-2xl font-bold mb-4">
              Encontre sua permuta
            </h3>

            <p className="text-gray-600">
              O sistema encontra automaticamente pessoas compatíveis.
            </p>

          </div>

        </div>

      </div>
    </section>
  );
}