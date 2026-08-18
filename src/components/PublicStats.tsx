"use client";

import { useEffect, useState } from "react";

import {
  CheckCircle2,
  Quote,
  Star,
} from "lucide-react";

import { supabase } from "@/lib/supabase";


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

  const [indicadores, setIndicadores] =
    useState<IndicadoresPublicos | null>(null);

  const [depoimentos, setDepoimentos] =
    useState<DepoimentoPublico[]>([]);

  const [carregando, setCarregando] =
    useState(true);


  useEffect(() => {

    let ativo = true;


    async function carregarDados() {

      try {

        const [
          resultadoIndicadores,
          resultadoDepoimentos
        ] = await Promise.all([

          supabase.rpc(
            "indicadores_publicos"
          ),

          supabase.rpc(
            "depoimentos_publicos",
            {
              p_limite: 6
            }
          )

        ]);


        if (!ativo) {
          return;
        }


        if (resultadoIndicadores.error) {

          console.error(
            "Erro ao carregar indicadores:",
            resultadoIndicadores.error
          );

        } else {

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


if (resultadoDepoimentos.error) {
  console.warn(
    "Não foi possível carregar os depoimentos públicos:",
    resultadoDepoimentos.error.message
  );
} else {

          const dados =
            Array.isArray(
              resultadoDepoimentos.data
            )
              ? resultadoDepoimentos.data
              : [];


          setDepoimentos(

            dados.map((item) => ({

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

            }))

          );

        }

      } catch (error) {

        console.error(
          "Erro inesperado ao carregar dados públicos:",
          error
        );

      } finally {

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


  /*
   * A seção de indicadores somente aparece
   * quando existir algum resultado real da
   * utilização da plataforma.
   *
   * O número de servidores já é mostrado
   * no Hero.
   */

  const mostrarIndicadores =
    mostrarPermutas ||
    mostrarTaxa ||
    mostrarAvaliacoes;


  return (

    <>

      {/* =========================================
          INDICADORES
      ========================================= */}

      {mostrarIndicadores && (

        <section
          className="
            border-y
            border-slate-200
            bg-slate-50
          "
        >

          <div
            className="
              mx-auto
              max-w-7xl
              px-6
              py-14
              lg:py-16
            "
          >

            <div className="text-center">

              <p
                className="
                  text-sm
                  font-semibold
                  uppercase
                  tracking-wider
                  text-blue-900
                "
              >
                Números da plataforma
              </p>


              <h2
                className="
                  mt-2
                  text-3xl
                  font-bold
                  text-slate-900
                "
              >
                Resultados da comunidade
              </h2>


              <p
                className="
                  mx-auto
                  mt-3
                  max-w-2xl
                  text-slate-600
                "
              >
                Indicadores calculados a partir da
                utilização real da plataforma.
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

              {/* PERMUTAS CONCLUÍDAS */}

              {mostrarPermutas && (

                <div
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    shadow-sm
                    sm:w-[280px]
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
                      bg-green-50
                      text-green-700
                    "
                  >

                    <CheckCircle2 size={22} />

                  </div>


                  <p
                    className="
                      mt-5
                      text-3xl
                      font-bold
                      text-slate-900
                    "
                  >

                    {indicadores.permutas_concluidas.toLocaleString(
                      "pt-BR"
                    )}

                  </p>


                  <p
                    className="
                      mt-1
                      text-sm
                      font-semibold
                      text-slate-600
                    "
                  >

                    {indicadores.permutas_concluidas === 1
                      ? "permuta concluída"
                      : "permutas concluídas"}

                  </p>

                </div>

              )}


              {/* TAXA DE SUCESSO */}

              {mostrarTaxa && (

                <div
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    shadow-sm
                    sm:w-[280px]
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
                      bg-blue-50
                      text-blue-900
                    "
                  >

                    <CheckCircle2 size={22} />

                  </div>


                  <p
                    className="
                      mt-5
                      text-3xl
                      font-bold
                      text-slate-900
                    "
                  >

                    {indicadores.taxa_sucesso.toLocaleString(
                      "pt-BR",
                      {
                        maximumFractionDigits: 1
                      }
                    )}
                    %

                  </p>


                  <p
                    className="
                      mt-1
                      text-sm
                      font-semibold
                      text-slate-600
                    "
                  >
                    taxa de sucesso
                  </p>

                </div>

              )}


              {/* AVALIAÇÕES */}

              {mostrarAvaliacoes && (

                <div
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    shadow-sm
                    sm:w-[280px]
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
                      bg-amber-50
                      text-amber-700
                    "
                  >

                    <Star size={22} />

                  </div>


                  <p
                    className="
                      mt-5
                      text-3xl
                      font-bold
                      text-slate-900
                    "
                  >

                    {indicadores.nota_media.toLocaleString(
                      "pt-BR",
                      {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1
                      }
                    )}

                  </p>


                  <p
                    className="
                      mt-1
                      text-sm
                      font-semibold
                      text-slate-600
                    "
                  >
                    nota média da plataforma
                  </p>


                  <p
                    className="
                      mt-2
                      text-xs
                      text-slate-500
                    "
                  >

                    {indicadores.percentual_recomenda.toLocaleString(
                      "pt-BR",
                      {
                        maximumFractionDigits: 1
                      }
                    )}
                    % recomendariam

                  </p>

                </div>

              )}

            </div>

          </div>

        </section>

      )}


      {/* =========================================
          DEPOIMENTOS
      ========================================= */}

      {depoimentos.length > 0 && (

        <section className="bg-white">

          <div
            className="
              mx-auto
              max-w-7xl
              px-6
              py-16
            "
          >

            <div className="text-center">

              <p
                className="
                  text-sm
                  font-semibold
                  uppercase
                  tracking-wider
                  text-blue-900
                "
              >
                Experiências reais
              </p>


              <h2
                className="
                  mt-2
                  text-3xl
                  font-bold
                  text-slate-900
                "
              >
                O que os servidores dizem
              </h2>


              <p
                className="
                  mx-auto
                  mt-3
                  max-w-2xl
                  text-slate-600
                "
              >
                Depoimentos publicados somente com
                autorização do usuário e sem
                identificação pessoal.
              </p>

            </div>


            <div
              className="
                mt-10
                grid
                gap-5
                md:grid-cols-2
                xl:grid-cols-3
              "
            >

              {depoimentos.map(
                (depoimento, index) => (

                  <article
                    key={`${depoimento.created_at}-${index}`}
                    className="
                      rounded-2xl
                      border
                      border-slate-200
                      bg-slate-50
                      p-6
                    "
                  >

                    <Quote
                      size={26}
                      className="text-blue-900"
                    />


                    <div
                      className="
                        mt-4
                        flex
                        gap-1
                      "
                    >

                      {Array.from({
                        length: Math.max(
                          0,
                          Math.min(
                            5,
                            depoimento.nota
                          )
                        )
                      }).map(
                        (_, estrela) => (

                          <Star
                            key={estrela}
                            size={17}
                            className="
                              fill-amber-400
                              text-amber-500
                            "
                          />

                        )
                      )}

                    </div>


                    <p
                      className="
                        mt-4
                        text-sm
                        leading-7
                        text-slate-700
                      "
                    >
                      “{depoimento.comentario}”
                    </p>


                    <p
                      className="
                        mt-5
                        text-xs
                        font-semibold
                        text-slate-400
                      "
                    >
                      Depoimento anônimo
                    </p>

                  </article>

                )
              )}

            </div>

          </div>

        </section>

      )}

    </>

  );

}