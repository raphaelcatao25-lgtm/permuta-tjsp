"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const perguntas = [
  {
    pergunta: "Como o sistema encontra uma permuta?",
    resposta:
      "O sistema analisa as informações cadastradas pelos servidores, considerando a comarca atual, as comarcas desejadas e a ordem de prioridade informada. A partir desses dados, são identificadas oportunidades reais de permuta entre servidores com interesses compatíveis.",
  },

  {
    pergunta: "Quais tipos de permuta são considerados?",
    resposta:
      "A plataforma considera inicialmente dois formatos: permutas diretas entre dois servidores e ciclos de três participantes, quando um servidor deseja a comarca de outro e a sequência fecha uma combinação válida.",
  },

  {
    pergunta: "O sistema informa por que uma oportunidade foi encontrada?",
    resposta:
      "Sim. Quando uma oportunidade for identificada, a plataforma poderá apresentar os critérios que geraram a combinação, como a comarca desejada, a ordem de prioridade cadastrada e a disponibilidade dos servidores envolvidos.",
  },

  {
    pergunta: "Como funciona a prioridade das comarcas desejadas?",
    resposta:
      "Cada servidor pode cadastrar até 10 comarcas desejadas e organizar suas preferências em ordem de prioridade. Essa informação ajuda a identificar quais destinos possuem maior interesse para cada servidor.",
  },

  {
    pergunta: "O sistema considera distância entre as cidades?",
    resposta:
      "Não. O sistema não utiliza cálculo de distância, quilômetros ou mapas. A análise é realizada exclusivamente com base nas comarcas selecionadas pelos próprios servidores.",
  },

  {
    pergunta: "O sistema considera cidades próximas ou vizinhas?",
    resposta:
      "Não. O sistema considera apenas as comarcas cadastradas pelo servidor. Não são feitas sugestões automáticas baseadas em proximidade geográfica.",
  },

  {
    pergunta: "Quantas comarcas posso cadastrar como destino?",
    resposta:
      "Cada servidor pode cadastrar até 10 comarcas desejadas, organizadas em ordem de prioridade.",
  },

  {
    pergunta: "Posso alterar minhas informações depois do cadastro?",
    resposta:
      "Sim. O servidor poderá atualizar suas informações de perfil, comarca atual e comarcas desejadas sempre que necessário.",
  },

  {
    pergunta: "Como funciona o contato entre servidores?",
    resposta:
      "Os dados de contato seguem as permissões definidas pelo servidor. Quando uma oportunidade de permuta for identificada, a plataforma permitirá a comunicação entre os envolvidos conforme as regras de privacidade cadastradas.",
  },

  {
    pergunta: "O sistema realiza a permuta automaticamente?",
    resposta:
      "Não. O sistema apenas identifica possíveis oportunidades e aproxima servidores com interesses compatíveis. A decisão entre os envolvidos e os procedimentos administrativos seguem as regras aplicáveis.",
  },

  {
    pergunta:
      "Uma oportunidade encontrada garante que a permuta será realizada?",
    resposta:
      "Não. O sistema apresenta uma possibilidade de conexão entre servidores. A realização da permuta depende do interesse dos envolvidos e dos procedimentos necessários.",
  },
];

export default function DuvidasPage() {
  const [aberta, setAberta] = useState<number | null>(null);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="rounded-3xl bg-white p-8 shadow-sm md:p-12">

        <h1 className="text-4xl font-bold text-slate-900">
          Dúvidas frequentes
        </h1>

        <p className="mt-4 text-lg text-slate-600">
          Encontre respostas sobre o funcionamento do Permuta TJSP,
          critérios de combinação e utilização da plataforma.
        </p>


        <div className="mt-10 space-y-3">

          {perguntas.map((item, index) => (

            <div
              key={index}
              className="rounded-xl border border-slate-200"
            >

              <button
                type="button"
                onClick={() =>
                  setAberta(
                    aberta === index ? null : index
                  )
                }
                className="
                  flex
                  w-full
                  items-center
                  justify-between
                  gap-4
                  px-5
                  py-4
                  text-left
                  font-semibold
                  text-slate-900
                  transition
                  hover:bg-blue-50
                "
              >

                <span>
                  {item.pergunta}
                </span>


                <ChevronDown
                  className={[
                    "h-5 w-5 shrink-0 text-blue-900 transition-transform",
                    aberta === index
                      ? "rotate-180"
                      : "",
                  ].join(" ")}
                />

              </button>


              {aberta === index && (

                <div
                  className="
                    border-t
                    border-slate-200
                    px-5
                    py-4
                    leading-relaxed
                    text-slate-600
                  "
                >
                  {item.resposta}
                </div>

              )}

            </div>

          ))}

        </div>

      </section>
    </main>
  );
}