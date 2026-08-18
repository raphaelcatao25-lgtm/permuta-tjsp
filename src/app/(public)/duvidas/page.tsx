"use client";

import {
  useState,
} from "react";

import {
  ChevronDown,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";


const perguntas = [

  {
    pergunta:
      "Como o sistema encontra uma permuta?",

    resposta:
      "O sistema compara a comarca atual e as comarcas desejadas cadastradas pelos servidores. A partir dessas informações, procura combinações compatíveis para permutas diretas e, quando possível, ciclos de três participantes.",
  },

  {
    pergunta:
      "Quais tipos de permuta são considerados?",

    resposta:
      "A plataforma trabalha atualmente com permuta direta entre dois servidores e com ciclos de três participantes. Na permuta direta, os dois servidores desejam trocar entre si. No ciclo de três, cada participante deseja se movimentar para a comarca de outro participante, formando uma sequência completa.",
  },

  {
    pergunta:
      "Como funciona uma permuta em ciclo de três?",

    resposta:
      "Em um ciclo de três, cada servidor se movimenta para uma comarca desejada e a sequência precisa fechar corretamente entre os três participantes. A proposta só é confirmada quando todos os envolvidos aceitarem.",
  },

  {
    pergunta:
      "A permuta direta tem preferência sobre o ciclo de três?",

    resposta:
      "Sim. Quando existe uma oportunidade direta compatível, ela é priorizada em relação às combinações em ciclo de três.",
  },

  {
    pergunta:
      "O sistema informa por que uma oportunidade foi encontrada?",

    resposta:
      "Sim. As oportunidades exibem as comarcas atuais e os destinos envolvidos, permitindo visualizar como a combinação foi formada e qual movimentação está sendo considerada para cada participante.",
  },

  {
    pergunta:
      "Como funciona a prioridade das comarcas desejadas?",

    resposta:
      "O servidor pode cadastrar até 10 comarcas desejadas e organizá-las por prioridade. Essa ordem representa suas preferências e é considerada pelo sistema na apresentação das oportunidades.",
  },

  {
    pergunta:
      "Quantas comarcas posso cadastrar como destino?",

    resposta:
      "É possível cadastrar até 10 comarcas desejadas, organizadas em ordem de prioridade.",
  },

  {
    pergunta:
      "O sistema considera distância entre as cidades?",

    resposta:
      "Não. A plataforma não utiliza distância em quilômetros, mapas ou tempo de deslocamento para encontrar oportunidades. O matching é feito com base nas comarcas selecionadas pelos próprios servidores.",
  },

  {
    pergunta:
      "O sistema considera cidades próximas ou vizinhas?",

    resposta:
      "Não. Apenas as comarcas cadastradas pelo servidor são consideradas. A plataforma não inclui automaticamente cidades próximas ou vizinhas.",
  },

  {
    pergunta:
      "Posso alterar minhas informações depois do cadastro?",

    resposta:
      "Sim. Você pode atualizar sua comarca atual, suas preferências de destino e outras informações do perfil. Quando informações relevantes para o matching são alteradas, as oportunidades podem ser recalculadas.",
  },

  {
    pergunta:
      "Como funciona o envio de uma proposta?",

    resposta:
      "Ao encontrar uma oportunidade compatível, você pode enviar uma proposta pela própria plataforma. O sistema registra seu aceite e aguarda a resposta dos demais participantes.",
  },

  {
    pergunta:
      "O que acontece enquanto uma proposta aguarda aceite?",

    resposta:
      "A proposta permanece com o status de aguardando aceite até que todos os participantes necessários respondam. É possível acompanhar a situação dos aceites na página de propostas.",
  },

  {
    pergunta:
      "Quando os dados de contato dos participantes aparecem?",

    resposta:
      "Os dados de contato dos demais participantes somente são liberados após a confirmação da permuta, quando todos os participantes necessários tiverem aceitado a proposta.",
  },

  {
    pergunta:
      "Meus dados de contato ficam visíveis para qualquer usuário?",

    resposta:
      "Não. Os dados de contato não ficam expostos publicamente. O acesso é limitado aos participantes de uma permuta confirmada, de acordo com as informações disponibilizadas no perfil.",
  },

  {
    pergunta:
      "Receberei notificações sobre minhas propostas?",

    resposta:
      "Sim. A plataforma possui notificações internas para informar eventos importantes, como envio de proposta, nova proposta recebida, confirmação e outras atualizações relacionadas às suas permutas.",
  },

  {
    pergunta:
      "Posso cancelar ou recusar uma proposta?",

    resposta:
      "Sim. Enquanto a proposta ainda não estiver concluída, as opções disponíveis na página de propostas permitem cancelar ou recusar conforme sua participação e o estado atual da negociação.",
  },

  {
    pergunta:
      "O que acontece quando todos aceitam a proposta?",

    resposta:
      "A permuta passa para o status de confirmada e os dados de contato dos demais participantes são liberados para que os envolvidos possam conversar e dar continuidade aos procedimentos necessários.",
  },

  {
    pergunta:
      "O sistema realiza a permuta automaticamente?",

    resposta:
      "Não. A plataforma apenas identifica oportunidades, organiza propostas e aproxima servidores com interesses compatíveis. A efetivação da permuta depende dos participantes e dos procedimentos administrativos aplicáveis.",
  },

  {
    pergunta:
      "Uma oportunidade encontrada garante que a permuta será realizada?",

    resposta:
      "Não. Uma oportunidade indica apenas uma combinação compatível entre os interesses cadastrados. A realização efetiva depende do aceite dos envolvidos e das providências administrativas necessárias.",
  },

  {
    pergunta:
      "O que significa encerrar uma permuta?",

    resposta:
      "Depois que os participantes chegarem a uma definição, a permuta pode ser encerrada na plataforma. Isso registra o resultado e libera os perfis para novas oportunidades quando aplicável.",
  },

  {
    pergunta:
      "Posso pausar minha busca sem excluir minha conta?",

    resposta:
      "Sim. Você pode pausar temporariamente sua participação na busca por permutas e reativá-la posteriormente sem perder os dados do perfil.",
  },

  {
    pergunta:
      "Posso excluir minha conta?",

    resposta:
      "Sim. A plataforma possui uma opção de exclusão de conta. Antes da exclusão, algumas situações em andamento podem precisar ser tratadas para preservar a consistência dos registros da plataforma.",
  },

  {
    pergunta:
      "A plataforma é oficial do TJSP?",

    resposta:
      "Não. O Permuta TJSP é uma ferramenta independente criada para auxiliar servidores na localização e organização de oportunidades de permuta. A plataforma não representa nem substitui os canais oficiais do Tribunal de Justiça de São Paulo.",
  },

  {
    pergunta:
      "O uso da plataforma é gratuito?",

    resposta:
      "Sim. O Permuta TJSP é disponibilizado gratuitamente para auxiliar servidores na busca e organização de oportunidades de permuta.",
  },

  {
    pergunta:
      "Como funciona a privacidade das minhas informações?",

    resposta:
      "As informações são utilizadas para permitir o funcionamento da plataforma e o matching entre servidores. Dados sensíveis de contato não são exibidos publicamente e ficam sujeitos às regras de acesso e privacidade da plataforma.",
  },

];


export default function DuvidasPage() {

  const [
    aberta,
    setAberta,
  ] =
    useState<number | null>(
      null
    );


  return (

    <main
      className="
        mx-auto
        max-w-5xl
        px-5
        py-12
        sm:px-6
        lg:py-16
      "
    >

      <section
        className="
          relative
          overflow-hidden
          rounded-3xl
          border
          border-teal-300/10
          bg-gradient-to-br
          from-[#0d2637]/95
          to-[#081b29]/95
          p-6
          shadow-[0_24px_60px_rgba(0,0,0,0.25)]
          backdrop-blur-xl
          sm:p-8
          md:p-12
        "
      >

        {/* efeito decorativo */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-72
            w-72
            rounded-full
            bg-teal-400/[0.05]
            blur-3xl
          "
        />


        {/* cabeçalho */}

        <div
          className="
            relative
            max-w-3xl
          "
        >

          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              border
              border-teal-300/15
              bg-teal-400/10
              text-teal-300
            "
          >
            <HelpCircle
              size={25}
              strokeWidth={1.8}
            />
          </div>


          <h1
            className="
              mt-5
              text-3xl
              font-black
              tracking-tight
              text-white
              sm:text-4xl
            "
          >
            Dúvidas frequentes
          </h1>


          <p
            className="
              mt-4
              text-base
              leading-7
              text-slate-400
              sm:text-lg
            "
          >
            Encontre respostas sobre cadastro, matching,
            propostas, contatos, privacidade e utilização
            do Permuta TJSP.
          </p>

        </div>


        {/* FAQs */}

        <div
          className="
            relative
            mt-10
            space-y-3
          "
        >

          {
            perguntas.map(
              (
                item,
                index
              ) => {

                const estaAberta =
                  aberta === index;


                return (

                  <div
                    key={index}
                    className={`
                      overflow-hidden
                      rounded-2xl
                      border
                      transition-all
                      duration-200

                      ${
                        estaAberta
                          ? `
                            border-teal-300/25
                            bg-teal-400/[0.055]
                          `
                          : `
                            border-teal-300/10
                            bg-[#071725]/45
                          `
                      }
                    `}
                  >

                    <button
                      type="button"

                      onClick={() =>
                        setAberta(
                          estaAberta
                            ? null
                            : index
                        )
                      }

                      className="
                        group
                        flex
                        w-full
                        items-center
                        justify-between
                        gap-5
                        px-5
                        py-4
                        text-left
                        font-semibold
                        text-white
                        transition-all
                        duration-200
                        hover:!bg-teal-400/[0.07]
                        hover:!text-teal-100
                        active:scale-[0.995]
                      "
                    >

                      <span
                        className="
                          pr-2
                          leading-6
                        "
                      >
                        {item.pergunta}
                      </span>


                      <ChevronDown
                        className={`
                          h-5
                          w-5
                          shrink-0
                          text-teal-400
                          transition-transform
                          duration-200

                          ${
                            estaAberta
                              ? "rotate-180"
                              : ""
                          }
                        `}
                      />

                    </button>


                    {
                      estaAberta && (

                        <div
                          className="
                            border-t
                            border-teal-300/10
                            px-5
                            py-5
                            leading-7
                            text-slate-300
                          "
                        >
                          {item.resposta}
                        </div>

                      )
                    }

                  </div>

                );

              }
            )
          }

        </div>


        {/* aviso final */}

        <div
          className="
            relative
            mt-8
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-teal-300/10
            bg-teal-400/[0.04]
            p-5
          "
        >

          <ShieldCheck
            size={21}
            className="
              mt-0.5
              shrink-0
              text-teal-300
            "
          />


          <p
            className="
              text-sm
              leading-6
              text-slate-400
            "
          >
            O Permuta TJSP é uma plataforma independente.
            As oportunidades apresentadas não representam
            autorização ou aprovação administrativa da permuta.
          </p>

        </div>

      </section>

    </main>

  );

}