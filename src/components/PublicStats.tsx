"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  Heart,
  Quote,
  Star,
} from "lucide-react";

import {
  supabase,
} from "@/lib/supabase";


type IndicadoresPublicos = {
  servidores_cadastrados: number;
  permutas_concluidas: number;
  permutas_sem_sucesso: number;
  taxa_sucesso: number;
  avaliacoes_recebidas: number;
  nota_media: number;
  percentual_recomenda: number;
};


type DepoimentoPublico = {
  comentario: string;
  nota: number;
  created_at: string;
};


export default function PublicStats() {

  const [
    indicadores,
    setIndicadores,
  ] =
    useState<IndicadoresPublicos | null>(
      null
    );


  const [
    depoimentos,
    setDepoimentos,
  ] =
    useState<DepoimentoPublico[]>(
      []
    );


  const [
    carregando,
    setCarregando,
  ] =
    useState(true);



  /* ============================================================
     CARREGAR DADOS
  ============================================================ */

  useEffect(() => {

    let ativo = true;


    async function carregarDados() {

      try {

        const [
          resultadoIndicadores,
          resultadoDepoimentos,
        ] =
          await Promise.all([

            supabase.rpc(
              "indicadores_publicos"
            ),

            supabase.rpc(
              "depoimentos_publicos",
              {
                p_limite: 6,
              }
            ),

          ]);


        if (!ativo) {
          return;
        }


        if (
          resultadoIndicadores.error
        ) {

          console.error(
            "Erro ao carregar indicadores:",
            resultadoIndicadores.error
          );

        }

        else {

          const dados =
            Array.isArray(
              resultadoIndicadores.data
            )
              ? resultadoIndicadores.data[0]
              : null;


          if (dados) {

            setIndicadores({

              servidores_cadastrados:
                Number(
                  dados.servidores_cadastrados ?? 0
                ),

              permutas_concluidas:
                Number(
                  dados.permutas_concluidas ?? 0
                ),

              permutas_sem_sucesso:
                Number(
                  dados.permutas_sem_sucesso ?? 0
                ),

              taxa_sucesso:
                Number(
                  dados.taxa_sucesso ?? 0
                ),

              avaliacoes_recebidas:
                Number(
                  dados.avaliacoes_recebidas ?? 0
                ),

              nota_media:
                Number(
                  dados.nota_media ?? 0
                ),

              percentual_recomenda:
                Number(
                  dados.percentual_recomenda ?? 0
                ),

            });

          }

        }


        if (
          resultadoDepoimentos.error
        ) {

          console.warn(
            "Não foi possível carregar os depoimentos públicos:",
            resultadoDepoimentos.error.message
          );

        }

        else {

          const dados =
            Array.isArray(
              resultadoDepoimentos.data
            )
              ? resultadoDepoimentos.data
              : [];


          setDepoimentos(

            dados.map(
              item => ({

                comentario:
                  String(
                    item.comentario ?? ""
                  ),

                nota:
                  Number(
                    item.nota ?? 0
                  ),

                created_at:
                  String(
                    item.created_at ?? ""
                  ),

              })
            )

          );

        }

      }

      catch (error) {

        console.error(
          "Erro inesperado ao carregar dados públicos:",
          error
        );

      }

      finally {

        if (ativo) {
          setCarregando(false);
        }

      }

    }


    carregarDados();


    return () => {
      ativo = false;
    };

  }, []);



  /* ============================================================
     ESTADOS
  ============================================================ */

  if (carregando) {
    return null;
  }


  if (!indicadores) {
    return null;
  }


  const totalHistorico =
    indicadores.permutas_concluidas +
    indicadores.permutas_sem_sucesso;


  const mostrarPermutas =
    indicadores.permutas_concluidas > 0;


  const mostrarTaxa =
    totalHistorico > 0;


  const mostrarAvaliacoes =
    indicadores.avaliacoes_recebidas > 0;


  const mostrarIndicadores =
    mostrarPermutas ||
    mostrarTaxa ||
    mostrarAvaliacoes;



  return (

    <>

      {/* ========================================================
          INDICADORES REAIS
      ======================================================== */}

      {
        mostrarIndicadores && (

          <section
            className="
              relative
              border-y
              border-teal-300/10
              bg-[#061725]/45
            "
          >

            <div
              className="
                mx-auto
                max-w-7xl
                px-5
                py-16
                sm:px-6
                lg:px-8
              "
            >

              <div
                className="
                  text-center
                "
              >

                <p
                  className="
                    text-sm
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-teal-400
                  "
                >
                  Números da plataforma
                </p>


                <h2
                  className="
                    mt-3
                    text-3xl
                    font-black
                    tracking-tight
                    text-white
                    sm:text-4xl
                  "
                >
                  Resultados da comunidade
                </h2>


                <p
                  className="
                    mx-auto
                    mt-4
                    max-w-2xl
                    text-slate-400
                  "
                >
                  Indicadores calculados exclusivamente
                  a partir da utilização real da plataforma.
                </p>

              </div>


              <div
                className="
                  mt-10
                  flex
                  flex-wrap
                  justify-center
                  gap-4
                "
              >

                {
                  mostrarPermutas && (

                    <StatsCard
                      icon={
                        <CheckCircle2
                          size={22}
                        />
                      }
                      valor={
                        indicadores
                          .permutas_concluidas
                          .toLocaleString(
                            "pt-BR"
                          )
                      }
                      titulo={
                        indicadores.permutas_concluidas === 1
                          ? "permuta concluída"
                          : "permutas concluídas"
                      }
                    />

                  )
                }


                {
                  mostrarTaxa && (

                    <StatsCard
                      icon={
                        <CheckCircle2
                          size={22}
                        />
                      }
                      valor={
                        `${
                          indicadores
                            .taxa_sucesso
                            .toLocaleString(
                              "pt-BR",
                              {
                                maximumFractionDigits: 1,
                              }
                            )
                        }%`
                      }
                      titulo="taxa de sucesso"
                    />

                  )
                }


                {
                  mostrarAvaliacoes && (

                    <StatsCard
                      icon={
                        <Star
                          size={22}
                        />
                      }
                      valor={
                        indicadores
                          .nota_media
                          .toLocaleString(
                            "pt-BR",
                            {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            }
                          )
                      }
                      titulo="nota média da plataforma"
                      detalhe={
                        `${
                          indicadores
                            .percentual_recomenda
                            .toLocaleString(
                              "pt-BR",
                              {
                                maximumFractionDigits: 1,
                              }
                            )
                        }% recomendariam`
                      }
                    />

                  )
                }

              </div>

            </div>

          </section>

        )
      }



      {/* ========================================================
          DEPOIMENTOS
      ======================================================== */}

      {
        depoimentos.length > 0 && (

          <section
            className="
              relative
              py-20
            "
          >

            <div
              className="
                mx-auto
                max-w-7xl
                px-5
                sm:px-6
                lg:px-8
              "
            >

              <div
                className="
                  text-center
                "
              >

                <div
                  className="
                    mx-auto
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-teal-300/15
                    bg-teal-400/10
                    text-teal-300
                  "
                >
                  <Heart size={21} />
                </div>


                <p
                  className="
                    mt-5
                    text-sm
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-teal-400
                  "
                >
                  Experiências reais
                </p>


                <h2
                  className="
                    mt-3
                    text-3xl
                    font-black
                    tracking-tight
                    text-white
                    sm:text-4xl
                  "
                >
                  O que os servidores dizem
                </h2>


                <p
                  className="
                    mx-auto
                    mt-4
                    max-w-2xl
                    text-slate-400
                  "
                >
                  Depoimentos publicados somente mediante
                  autorização e sem identificação pessoal.
                </p>

              </div>


              <div
                className="
                  mt-11
                  grid
                  gap-5
                  md:grid-cols-2
                  xl:grid-cols-3
                "
              >

                {
                  depoimentos.map(
                    (
                      depoimento,
                      index
                    ) => (

                      <article
                        key={
                          `${depoimento.created_at}-${index}`
                        }
                        className="
                          group
                          relative
                          overflow-hidden
                          rounded-2xl
                          border
                          border-teal-300/10
                          bg-gradient-to-br
                          from-[#0d2637]/90
                          to-[#081b29]/90
                          p-6
                          shadow-[0_18px_45px_rgba(0,0,0,0.22)]
                          transition
                          duration-300
                          hover:-translate-y-1
                          hover:border-teal-300/25
                        "
                      >

                        <div
                          className="
                            absolute
                            -right-12
                            -top-12
                            h-36
                            w-36
                            rounded-full
                            bg-teal-400/[0.05]
                            blur-2xl
                          "
                        />


                        <Quote
                          size={27}
                          className="
                            relative
                            text-teal-400
                          "
                        />


                        <div
                          className="
                            relative
                            mt-4
                            flex
                            gap-1
                          "
                        >

                          {
                            Array.from({
                              length:
                                Math.max(
                                  0,
                                  Math.min(
                                    5,
                                    depoimento.nota
                                  )
                                ),
                            }).map(
                              (
                                _,
                                estrela
                              ) => (

                                <Star
                                  key={estrela}
                                  size={17}
                                  className="
                                    fill-amber-400
                                    text-amber-400
                                  "
                                />

                              )
                            )
                          }

                        </div>


                        <p
                          className="
                            relative
                            mt-5
                            text-sm
                            leading-7
                            text-slate-300
                          "
                        >
                          “{depoimento.comentario}”
                        </p>


                        <p
                          className="
                            relative
                            mt-6
                            text-xs
                            font-semibold
                            uppercase
                            tracking-wider
                            text-slate-500
                          "
                        >
                          Depoimento anônimo
                        </p>

                      </article>

                    )
                  )
                }

              </div>

            </div>

          </section>

        )
      }

    </>

  );

}



/* ============================================================
   CARD DOS INDICADORES
============================================================ */

function StatsCard({
  icon,
  valor,
  titulo,
  detalhe,
}: {
  icon: React.ReactNode;
  valor: string;
  titulo: string;
  detalhe?: string;
}) {

  return (

    <div
      className="
        group
        w-full
        rounded-2xl
        border
        border-teal-300/10
        bg-gradient-to-br
        from-[#0d2637]/95
        to-[#081b29]/95
        p-6
        shadow-[0_18px_45px_rgba(0,0,0,0.2)]
        transition
        duration-300
        hover:-translate-y-1
        hover:border-teal-300/25
        sm:w-[285px]
      "
    >

      <div
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          border
          border-teal-300/15
          bg-teal-400/10
          text-teal-300
          transition
          group-hover:bg-teal-400/15
        "
      >
        {icon}
      </div>


      <p
        className="
          mt-5
          text-3xl
          font-black
          tracking-tight
          text-white
        "
      >
        {valor}
      </p>


      <p
        className="
          mt-1
          text-sm
          font-semibold
          text-slate-300
        "
      >
        {titulo}
      </p>


      {
        detalhe && (

          <p
            className="
              mt-2
              text-xs
              text-slate-500
            "
          >
            {detalhe}
          </p>

        )
      }

    </div>

  );

}