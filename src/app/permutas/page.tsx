"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  LoaderCircle,
  RefreshCw,
  Trophy,
} from "lucide-react";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";


type Ciclo = {
  id: string;

  participante_1: string;
  participante_2: string;
  participante_3: string;

  origem_1: number;
  destino_1: number;

  origem_2: number;
  destino_2: number;

  origem_3: number;
  destino_3: number;

  score_total: number;
};


type Perfil = {
  id: string;
  nome: string;
  cargo?: string | null;
};


type Comarca = {
  id: number;
  nome: string;
};


type ParticipanteCard = {
  nome: string;
  cargo: string;
  origem: string;
  destino: string;
};


export default function PermutasPage() {

  const [nomeUsuario, setNomeUsuario] =
    useState("Servidor");


  const [ciclos, setCiclos] =
    useState<Ciclo[]>([]);


  const [participantes, setParticipantes] =
    useState<Record<string, ParticipanteCard>>({});


  const [carregando, setCarregando] =
    useState(true);


  const [atualizando, setAtualizando] =
    useState(false);


  const [erro, setErro] =
    useState("");



  const carregarPermutas = useCallback(
    async (primeira = false) => {


      primeira
        ? setCarregando(true)
        : setAtualizando(true);


      setErro("");



      try {


        const {
          data:{
            user
          },
          error:userError

        } =
        await supabase.auth.getUser();



        if(userError || !user){

          throw new Error(
            "Usuário não identificado."
          );

        }



        const {data:perfilUsuario}
        =
        await supabase
          .from("perfis")
          .select("nome")
          .eq(
            "id",
            user.id
          )
          .maybeSingle();



        if(perfilUsuario?.nome){

          setNomeUsuario(
            perfilUsuario.nome
              .split(" ")[0]
          );

        }




        const {
  data: ciclosData,
  error: ciclosError
} = await supabase
  .from("teste_candidatos_ciclo3_202")
  .select("*")
  .or(
    `participante_1.eq.${user.id},participante_2.eq.${user.id},participante_3.eq.${user.id}`
  )
  .order("score_total", {
    ascending: false
  })
  .limit(3);



        if(ciclosError){

          throw new Error(
            ciclosError.message
          );

        }



        const ciclosEncontrados =
          (ciclos ?? []) as Ciclo[];



        setCiclos(
          ciclosEncontrados
        );



        if(
          ciclosEncontrados.length === 0
        ){

          setParticipantes({});

          return;

        }



        const ids = Array.from(
          new Set(
            ciclosEncontrados.flatMap(
              ciclo=>[
                ciclo.participante_1,
                ciclo.participante_2,
                ciclo.participante_3
              ]
            )
          )
        );



        const {data:perfisData}
        =
        await supabase
          .from("perfis")
          .select(
            `
            id,
            nome,
            cargo
            `
          )
          .in(
            "id",
            ids
          );



        const perfis =
          (perfisData ?? []) as Perfil[];





        const comarcaIds =
        Array.from(
          new Set(
            ciclosEncontrados.flatMap(
              ciclo=>[
                ciclo.origem_1,
                ciclo.destino_1,
                ciclo.origem_2,
                ciclo.destino_2,
                ciclo.origem_3,
                ciclo.destino_3
              ]
            )
          )
        );



        const {
          data:comarcasData

        } =
        await supabase
          .from("comarcas")
          .select(
            "id,nome"
          )
          .in(
            "id",
            comarcaIds
          );



        const mapaComarcas =
          new Map<number,string>();



        (comarcasData ?? [])
          .forEach(
            (comarca:Comarca)=>{

              mapaComarcas.set(
                comarca.id,
                comarca.nome
              );

            }
          );



        const mapaParticipantes:
        Record<string,ParticipanteCard>
        = {};



        perfis.forEach(
          perfil=>{

            mapaParticipantes[
              perfil.id
            ] = {

              nome:
                perfil.nome,

              cargo:
                perfil.cargo ??
                "Servidor TJSP",

              origem:"",
              destino:""

            };

          }
        );



        setParticipantes(
          mapaParticipantes
        );



      }
      catch(error){


        setErro(
          error instanceof Error
          ? error.message
          : "Erro inesperado"
        );


      }
      finally{

        setCarregando(false);

        setAtualizando(false);

      }


    },
    []
  );



  useEffect(()=>{

    carregarPermutas(true);

  },[carregarPermutas]);
    function nomeParticipante(id:string){

    return participantes[id]?.nome ??
      "Servidor TJSP";

  }



  function dadosParticipante(
    id:string,
    origem:number,
    destino:number
  ){

    const participante =
      participantes[id];


    return {

      nome:
        participante?.nome ??
        "Servidor TJSP",


      cargo:
        participante?.cargo ??
        "Servidor TJSP",


      origem:
        participante?.origem ||
        String(origem),


      destino:
        participante?.destino ||
        String(destino)

    };

  }




  return (

    <AuthGuard>

      <DashboardLayout
        nomeUsuario={nomeUsuario}
      >


      {
        carregando ? (

          <div className="
          flex min-h-[60vh]
          items-center
          justify-center
          ">

            <LoaderCircle
              className="
              h-10 w-10
              animate-spin
              text-blue-900
              "
            />

          </div>


        ) : (


        <div className="
        space-y-6
        ">


          <header className="
          flex flex-col
          gap-4
          lg:flex-row
          lg:items-center
          lg:justify-between
          ">


            <div>

              <p className="
              text-sm
              font-semibold
              text-blue-900
              ">

                Motor de permutas

              </p>


              <h1 className="
              text-3xl
              font-bold
              text-slate-900
              ">

                Minhas melhores oportunidades

              </h1>


              <p className="
              mt-2
              text-slate-600
              ">

                As 3 melhores combinações
                encontradas pelo sistema.

              </p>


            </div>




            <button

              onClick={()=>
                carregarPermutas(false)
              }

              disabled={atualizando}

              className="
              flex items-center
              gap-2
              rounded-xl
              bg-blue-900
              px-5 py-3
              font-semibold
              text-white
              hover:bg-blue-800
              "

            >

              <RefreshCw

                className={
                  atualizando
                  ?
                  "animate-spin"
                  :
                  ""
                }

              />

              {
                atualizando
                ?
                "Atualizando..."
                :
                "Atualizar"
              }


            </button>


          </header>




          {
            erro && (

              <div className="
              flex gap-3
              rounded-xl
              border
              border-red-200
              bg-red-50
              p-4
              text-red-800
              ">

                <AlertCircle/>

                <p>
                  {erro}
                </p>


              </div>


            )
          }




          {
            ciclos.length === 0 ? (

              <div className="
              flex
              min-h-[400px]
              flex-col
              items-center
              justify-center
              rounded-2xl
              border
              bg-white
              ">


                <Trophy
                  className="
                  h-12 w-12
                  text-blue-900
                  "
                />


                <h2 className="
                mt-5
                text-xl
                font-bold
                ">

                  Nenhuma permuta encontrada

                </h2>


                <p className="
                mt-2
                text-slate-500
                ">

                  O motor ainda não encontrou
                  uma combinação para você.

                </p>


              </div>


            ) : (


              <div className="
              grid
              gap-6
              ">


              {
                ciclos.map(
                  (ciclo,index)=>{


                    const lista = [

                      dadosParticipante(
                        ciclo.participante_1,
                        ciclo.origem_1,
                        ciclo.destino_1
                      ),


                      dadosParticipante(
                        ciclo.participante_2,
                        ciclo.origem_2,
                        ciclo.destino_2
                      ),


                      dadosParticipante(
                        ciclo.participante_3,
                        ciclo.origem_3,
                        ciclo.destino_3
                      )

                    ];



                    return (

                    <div

                      key={ciclo.id}

                      className="
                      rounded-2xl
                      border
                      bg-white
                      shadow-sm
                      "

                    >



                      <div className="
                      flex
                      items-center
                      justify-between
                      border-b
                      p-5
                      ">


                        <div>

                          <h2 className="
                          text-xl
                          font-bold
                          text-slate-900
                          ">

                            Permuta tripla #{index+1}

                          </h2>


                          <p className="
                          text-sm
                          text-slate-500
                          ">

                            Melhor combinação encontrada

                          </p>


                        </div>



                        <div className="
                        rounded-xl
                        bg-green-100
                        px-4
                        py-2
                        font-bold
                        text-green-800
                        ">


                          {ciclo.score_total}
                          pts


                        </div>


                      </div>





                      <div className="
                      space-y-4
                      p-5
                      ">


                      {
                        lista.map(
                          (p,i)=>(

                          <div

                          key={i}

                          className="
                          rounded-xl
                          bg-slate-50
                          p-4
                          "

                          >


                            <p className="
                            font-bold
                            text-slate-900
                            ">

                              {p.nome}

                            </p>


                            <p className="
                            text-sm
                            text-slate-500
                            ">

                              {p.cargo}

                            </p>



                            <div className="
                            mt-3
                            flex
                            items-center
                            gap-3
                            font-semibold
                            ">


                              <span>

                                {p.origem}

                              </span>


                              <ArrowRight
                              className="
                              h-4
                              text-blue-900
                              "
                              />


                              <span
                              className="
                              text-blue-900
                              ">

                                {p.destino}

                              </span>


                            </div>


                          </div>


                          )
                        )
                      }


                      </div>


                    </div>


                    )

                  }
                )

              }


              </div>


            )
          }



        </div>


        )

      }


      </DashboardLayout>

    </AuthGuard>

  );


}