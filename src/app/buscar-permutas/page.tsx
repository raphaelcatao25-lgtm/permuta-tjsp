"use client";

import {
  useEffect,
  useState
} from "react";

import {
  ArrowRightLeft,
  RefreshCw,
  UsersRound
} from "lucide-react";

import {
  supabase
} from "@/lib/supabase";

import {
  AuthGuard
} from "@/components/auth/AuthGuard";

import {
  DashboardLayout
} from "@/components/layout/DashboardLayout";

import PermutasDiretas from "@/components/PermutasDiretas";
import CiclosPermuta from "@/components/CiclosPermuta";


export default function BuscarPermutasPage() {

  const [
    usuarioId,
    setUsuarioId
  ] = useState("");

  const [
    nomeUsuario,
    setNomeUsuario
  ] = useState("");

  const [
    atualizando,
    setAtualizando
  ] = useState(false);

  const [
    erro,
    setErro
  ] = useState("");


  /*
  ======================================================
  CARREGA USUÁRIO
  ======================================================
  */

  useEffect(() => {

    let ativo = true;


    async function carregarUsuario() {

      setErro("");


      try {

        const {
          data,
          error
        } =
          await supabase.auth.getUser();


        if (error) {
          throw error;
        }


        if (
          !data.user ||
          !ativo
        ) {
          return;
        }


        setUsuarioId(
          data.user.id
        );


        const {
          data: perfil,
          error: erroPerfil
        } =
          await supabase
            .from("perfis")
            .select("nome")
            .eq(
              "id",
              data.user.id
            )
            .single();


        if (
          erroPerfil
        ) {

          console.error(
            "Erro ao carregar nome do usuário:",
            erroPerfil
          );

        }


        if (
          ativo &&
          perfil?.nome
        ) {

          setNomeUsuario(
            perfil.nome
          );

        }

      }

      catch(error) {

        console.error(
          "Erro ao carregar usuário:",
          error
        );


        if (ativo) {

          setErro(
            "Não foi possível carregar suas oportunidades de permuta."
          );

        }

      }

    }


    void carregarUsuario();


    return () => {

      ativo = false;

    };

  }, []);


  /*
  ======================================================
  ATUALIZA AS DUAS BUSCAS
  ======================================================
  */

  function atualizarOportunidades() {

    if (atualizando) {
      return;
    }


    setAtualizando(true);
    setErro("");


    /*
    O componente PermutasDiretas e o componente
    CiclosPermuta escutam este evento.
    */

    window.dispatchEvent(
      new Event(
        "atualizar-ciclos"
      )
    );


    window.setTimeout(
      () => {

        setAtualizando(false);

      },
      900
    );

  }


  return (

    <AuthGuard>

      <DashboardLayout
        nomeUsuario={
          nomeUsuario
            .trim()
            .split(/\s+/)[0]
          ||
          "Servidor"
        }
      >

        <div
          className="
            mx-auto
            max-w-6xl
            space-y-6
            px-6
            py-8
          "
        >

          {/* =========================================
              CABEÇALHO
          ========================================= */}

          <section
            className="
              overflow-hidden
              rounded-2xl
              border
              border-teal-300/10
              bg-[#0d2232]
              shadow-[0_16px_40px_rgba(0,0,0,0.16)]
            "
          >

            <div
              className="
                flex
                flex-col
                gap-5
                border-b
                border-teal-300/10
                bg-[#0a1f2f]
                px-6
                py-6
                sm:flex-row
                sm:items-center
                sm:justify-between
                sm:px-8
              "
            >

              <div
                className="
                  flex
                  items-start
                  gap-4
                "
              >

                <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-teal-300/15
                    bg-teal-400/[0.08]
                    text-teal-300
                  "
                >

                  <ArrowRightLeft
                    size={23}
                  />

                </div>


                <div>

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-teal-300
                    "
                  >
                    Busca automática
                  </p>


                  <h1
                    className="
                      mt-1
                      text-3xl
                      font-bold
                      text-white
                    "
                  >
                    Buscar Permutas
                  </h1>


                  <p
                    className="
                      mt-2
                      max-w-3xl
                      text-sm
                      leading-6
                      text-slate-400
                    "
                  >
                    O sistema compara sua comarca atual e suas preferências
                    com os demais servidores cadastrados e mostra
                    automaticamente as combinações compatíveis.
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={
                  atualizarOportunidades
                }
                disabled={
                  atualizando ||
                  !usuarioId
                }
                className="
                  inline-flex
                  shrink-0
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-teal-300/15
                  bg-[#081b29]
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-300
                  transition
                  hover:-translate-y-[1px]
                  hover:border-teal-300/25
                  hover:bg-teal-400/[0.07]
                  hover:text-teal-200
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >

                <RefreshCw
                  size={17}
                  className={
                    atualizando
                      ? "animate-spin"
                      : ""
                  }
                />

                {
                  atualizando
                    ? "Atualizando..."
                    : "Atualizar oportunidades"
                }

              </button>

            </div>


            <div
              className="
                grid
                gap-3
                p-6
                sm:grid-cols-2
                sm:px-8
              "
            >

              <div
                className="
                  rounded-xl
                  border
                  border-emerald-300/15
                  bg-emerald-400/[0.05]
                  p-4
                "
              >

                <p
                  className="
                    text-sm
                    font-bold
                    text-emerald-300
                  "
                >
                  1 × 1 — Permuta direta
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  Você quer a comarca do outro servidor e ele quer
                  uma das suas possibilidades de origem/destino.
                </p>

              </div>


              <div
                className="
                  rounded-xl
                  border
                  border-cyan-300/15
                  bg-cyan-400/[0.05]
                  p-4
                "
              >

                <p
                  className="
                    text-sm
                    font-bold
                    text-cyan-300
                  "
                >
                  3 pessoas — Ciclo de permuta
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  Quando a troca direta não fecha, o sistema procura
                  automaticamente uma terceira pessoa para completar
                  o círculo.
                </p>

              </div>

            </div>

          </section>


          {
            erro && (

              <div
                className="
                  rounded-xl
                  border
                  border-red-400/20
                  bg-red-400/10
                  p-4
                  text-sm
                  text-red-300
                "
              >
                {erro}
              </div>

            )
          }


          {/* =========================================
              PERMUTA DIRETA
          ========================================= */}

          <section
            className="
              overflow-hidden
              rounded-2xl
              border
              border-teal-300/10
              bg-[#0d2232]
              shadow-[0_16px_40px_rgba(0,0,0,0.16)]
            "
          >

            <div
              className="
                flex
                items-center
                gap-4
                border-b
                border-teal-300/10
                bg-[#0a1f2f]
                px-6
                py-5
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-emerald-300/15
                  bg-emerald-400/[0.07]
                  text-emerald-300
                "
              >

                <ArrowRightLeft
                  size={20}
                />

              </div>


              <div>

                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-emerald-300
                  "
                >
                  Primeira opção
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-bold
                    text-white
                  "
                >
                  Permutas diretas
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-400
                  "
                >
                  Pessoas com quem a troca pode acontecer diretamente.
                </p>

              </div>

            </div>


            <div className="p-6">

              {
                usuarioId
                  ? (
                    <PermutasDiretas
                      usuarioId={
                        usuarioId
                      }
                    />
                  )
                  : (
                    <Carregando />
                  )
              }

            </div>

          </section>


          {/* =========================================
              CICLO DE 3
          ========================================= */}

          <section
            className="
              overflow-hidden
              rounded-2xl
              border
              border-teal-300/10
              bg-[#0d2232]
              shadow-[0_16px_40px_rgba(0,0,0,0.16)]
            "
          >

            <div
              className="
                flex
                items-center
                gap-4
                border-b
                border-teal-300/10
                bg-[#0a1f2f]
                px-6
                py-5
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-cyan-300/15
                  bg-cyan-400/[0.07]
                  text-cyan-300
                "
              >

                <UsersRound
                  size={20}
                />

              </div>


              <div>

                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-cyan-300
                  "
                >
                  Segunda opção
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-bold
                    text-white
                  "
                >
                  Ciclos de 3 servidores
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    leading-6
                    text-slate-400
                  "
                >
                  O sistema combina três servidores em uma troca circular:
                  cada pessoa vai para uma comarca desejada e o ciclo
                  retorna ao ponto inicial.
                </p>

              </div>

            </div>


            <div className="p-6">

              {
                usuarioId
                  ? (
                    <CiclosPermuta
                      usuarioId={
                        usuarioId
                      }
                    />
                  )
                  : (
                    <Carregando />
                  )
              }

            </div>

          </section>


          {/* =========================================
              EXPLICAÇÃO FINAL
          ========================================= */}

          <div
            className="
              rounded-xl
              border
              border-teal-300/10
              bg-[#081b29]
              p-4
              text-xs
              leading-5
              text-slate-500
            "
          >

            <strong
              className="
                text-slate-300
              "
            >
              Não encontrou uma combinação?
            </strong>

            {" "}

            Esta página mostra apenas as oportunidades que o sistema
            encontrou automaticamente com base nas preferências
            cadastradas. A ferramenta

            {" "}

            <strong
              className="
                text-teal-300
              "
            >
              Buscar Servidores
            </strong>

            {" "}

            continua disponível separadamente para procurar pessoas e
            montar uma combinação manual.

          </div>

        </div>

      </DashboardLayout>

    </AuthGuard>

  );

}


/*
======================================================
CARREGANDO
======================================================
*/

function Carregando() {

  return (

    <div
      className="
        flex
        min-h-[120px]
        items-center
        justify-center
        gap-3
        text-sm
        text-slate-400
      "
    >

      <RefreshCw
        size={18}
        className="
          animate-spin
          text-teal-300
        "
      />

      Carregando oportunidades...

    </div>

  );

}