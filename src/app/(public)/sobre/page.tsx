export default function SobrePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">

      <section className="rounded-3xl bg-white p-8 shadow-sm md:p-12">


        <h1 className="text-4xl font-bold text-slate-900">
          Sobre o Permuta TJSP
        </h1>


        <p className="mt-5 text-lg leading-relaxed text-slate-600">
          O Permuta TJSP nasceu com uma proposta simples:
          facilitar a conexão entre servidores interessados em encontrar
          oportunidades de permuta dentro do Tribunal de Justiça de São Paulo.
        </p>



        <div className="mt-12 space-y-10">


          <section>

            <h2 className="text-2xl font-semibold text-blue-900">
              Como surgiu o projeto
            </h2>

            <p className="mt-4 leading-relaxed text-slate-700">

              A busca por uma permuta compatível muitas vezes depende de
              informações espalhadas em grupos de mensagens, planilhas e
              contatos individuais entre servidores.

            </p>


            <p className="mt-4 leading-relaxed text-slate-700">

              Esse modelo funciona, mas pode tornar a busca mais demorada,
              principalmente quando existem milhares de servidores distribuídos
              em diferentes comarcas e regiões do Estado.

            </p>


            <p className="mt-4 leading-relaxed text-slate-700">

              A partir dessa necessidade surgiu a ideia de criar uma plataforma
              capaz de organizar essas informações e aproximar servidores com
              interesses compatíveis.

            </p>

          </section>





          <section>

            <h2 className="text-2xl font-semibold text-blue-900">
              Objetivo do projeto
            </h2>


            <p className="mt-4 leading-relaxed text-slate-700">

              O objetivo do Permuta TJSP é tornar a busca por oportunidades de
              permuta mais organizada, transparente e eficiente.

            </p>


            <p className="mt-4 leading-relaxed text-slate-700">

              A plataforma permite que cada servidor informe sua situação
              atual, seus destinos desejados e encontre possibilidades de
              conexão com outros servidores.

            </p>


          </section>





          <section>

            <h2 className="text-2xl font-semibold text-blue-900">
              Como funciona
            </h2>


            <div className="mt-6 grid gap-4 md:grid-cols-5">


              <div className="rounded-xl bg-blue-50 p-5 text-center">

                <span className="text-2xl font-bold text-blue-900">
                  1
                </span>

                <p className="mt-2 text-sm text-slate-700">
                  Servidor realiza o cadastro
                </p>

              </div>



              <div className="hidden items-center justify-center text-2xl text-blue-900 md:flex">
                →
              </div>



              <div className="rounded-xl bg-blue-50 p-5 text-center">

                <span className="text-2xl font-bold text-blue-900">
                  2
                </span>

                <p className="mt-2 text-sm text-slate-700">
                  Informa comarca atual e destinos desejados
                </p>

              </div>



              <div className="hidden items-center justify-center text-2xl text-blue-900 md:flex">
                →
              </div>



              <div className="rounded-xl bg-blue-50 p-5 text-center">

                <span className="text-2xl font-bold text-blue-900">
                  3
                </span>

                <p className="mt-2 text-sm text-slate-700">
                  Sistema apresenta oportunidades compatíveis
                </p>

              </div>


            </div>


          </section>





          <section>

            <h2 className="text-2xl font-semibold text-blue-900">
              Transparência
            </h2>


            <p className="mt-4 leading-relaxed text-slate-700">

              O Permuta TJSP é uma ferramenta independente criada para auxiliar
              servidores na organização e busca por oportunidades de permuta.

            </p>


            <div className="mt-5 rounded-xl bg-blue-50 p-5 text-sm text-blue-900">

              O projeto não possui vínculo institucional com o Tribunal de
              Justiça de São Paulo.

            </div>


          </section>





          <section>

            <h2 className="text-2xl font-semibold text-blue-900">
              Desenvolvimento
            </h2>


            <p className="mt-4 text-slate-700">
              Projeto idealizado e desenvolvido por:
            </p>


            <p className="mt-2 text-lg font-semibold text-slate-900">
              Raphael Catão Martinez
            </p>


          </section>



        </div>


      </section>


    </main>
  );
}