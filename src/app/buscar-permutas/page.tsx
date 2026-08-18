"use client";

import {
  useEffect,
  useState
} from "react";

import {
  RefreshCw
} from "lucide-react";

import {
  supabase
} from "@/lib/supabase";

import CiclosPermuta from "@/components/CiclosPermuta";

import {
  AuthGuard
} from "@/components/auth/AuthGuard";

import {
  DashboardLayout
} from "@/components/layout/DashboardLayout";

import PermutasDiretas from "@/components/PermutasDiretas";


export default function BuscarPermutasPage() {

  const [usuarioId, setUsuarioId] =
    useState("");

  const [atualizando, setAtualizando] =
    useState(false);


  useEffect(() => {

    async function carregarUsuario() {

      const {
        data,
        error
      } = await supabase.auth.getUser();


      if (error) {

        console.error(error);

        return;

      }


      if (data.user) {

        setUsuarioId(
          data.user.id
        );

      }

    }


    carregarUsuario();

  }, []);


  function atualizarCiclos() {

    setAtualizando(true);

    window.dispatchEvent(
      new Event("atualizar-ciclos")
    );

    setTimeout(() => {

      setAtualizando(false);

    }, 800);

  }


  return (

    <AuthGuard>

      <DashboardLayout>

        <div
          className="
            mx-auto
            max-w-5xl
            space-y-8
            px-6
            py-8
          "
        >

          {/* TÍTULO */}

          <div>

            <h1
              className="
                text-3xl
                font-bold
                text-white
              "
            >
              Encontrar permutas
            </h1>


            <p
              className="
                mt-2
                text-slate-400
              "
            >
              Encontre oportunidades de permuta direta ou em cadeia.
            </p>

          </div>



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
                justify-between
                gap-4
                border-b
                border-teal-300/10
                bg-[#0a1f2f]
                px-6
                py-5
              "
            >

              <div>

                <h2
                  className="
                    text-2xl
                    font-bold
                    text-white
                  "
                >
                  Permuta direta
                </h2>


                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-400
                  "
                >
                  Encontre servidores que desejam trocar diretamente com você.
                </p>

              </div>


              <button
                type="button"
                onClick={() => {

                  window.dispatchEvent(
                    new Event("atualizar-ciclos")
                  );

                }}
                className="
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-teal-300/15
                  bg-[#081b29]
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-slate-300
                  transition-all
                  duration-200
                  hover:-translate-y-[1px]
                  hover:border-teal-300/25
                  hover:bg-teal-400/[0.07]
                  hover:text-teal-200
                "
              >

                <RefreshCw size={17} />

                Atualizar

              </button>

            </div>


            <div className="p-6">

              {
                usuarioId && (

                  <PermutasDiretas
                    usuarioId={usuarioId}
                  />

                )
              }

            </div>

          </section>



          {/* =========================================
              PERMUTA EM CADEIA
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
                justify-between
                gap-4
                border-b
                border-teal-300/10
                bg-[#0a1f2f]
                px-6
                py-5
              "
            >

              <div>

                <h2
                  className="
                    text-2xl
                    font-bold
                    text-white
                  "
                >
                  Permuta em cadeia
                </h2>


                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-400
                  "
                >
                  Combinações em que três servidores realizam uma troca circular.
                </p>

              </div>


              <button
                type="button"
                onClick={atualizarCiclos}
                disabled={atualizando}
                className="
                  flex
                  shrink-0
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-teal-300/15
                  bg-[#081b29]
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-slate-300
                  transition-all
                  duration-200
                  hover:-translate-y-[1px]
                  hover:border-teal-300/25
                  hover:bg-teal-400/[0.07]
                  hover:text-teal-200
                  disabled:cursor-not-allowed
                  disabled:opacity-60
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
                    : "Atualizar"
                }

              </button>

            </div>


            <div className="p-6">

              {
                usuarioId && (

                  <CiclosPermuta
                    usuarioId={usuarioId}
                  />

                )
              }

            </div>

          </section>

        </div>

      </DashboardLayout>

    </AuthGuard>

  );

}