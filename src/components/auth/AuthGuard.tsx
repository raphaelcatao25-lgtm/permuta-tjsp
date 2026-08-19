"use client";

import type {
  ReactNode
} from "react";

import {
  useEffect,
  useState
} from "react";

import {
  useRouter
} from "next/navigation";

import {
  LoaderCircle
} from "lucide-react";

import {
  supabase
} from "@/lib/supabase";


type AuthGuardProps = {
  children: ReactNode;
};


/* ======================================================
   OBTÉM A ROTA ATUAL
====================================================== */

function obterRotaAtual() {

  if (
    typeof window ===
    "undefined"
  ) {

    return "/dashboard";

  }


  const pathname =
    window.location.pathname;


  const search =
    window.location.search;


  if (
    !pathname ||
    pathname === "/login"
  ) {

    return "/dashboard";

  }


  return `${pathname}${search}`;

}


/* ======================================================
   AUTH GUARD
====================================================== */

function AuthGuardComponent({
  children
}: AuthGuardProps) {

  const router =
    useRouter();


  const [
    verificandoSessao,
    setVerificandoSessao
  ] = useState(true);


  const [
    autenticado,
    setAutenticado
  ] = useState(false);


  useEffect(() => {

    let componenteAtivo =
      true;


    /* ==================================================
       REDIRECIONA PARA LOGIN PRESERVANDO O DESTINO
    ================================================== */

    function enviarParaLogin() {

      const destino =
        obterRotaAtual();


      router.replace(
        `/login?redirect=${encodeURIComponent(
          destino
        )}`
      );

    }


    /* ==================================================
       VERIFICA SESSÃO
    ================================================== */

    async function verificarSessao() {

      const {
        data: {
          session
        },
        error
      } =
        await supabase.auth.getSession();


      if (!componenteAtivo) {

        return;

      }


      if (
        error ||
        !session
      ) {

        setAutenticado(
          false
        );


        setVerificandoSessao(
          false
        );


        enviarParaLogin();

        return;

      }


      setAutenticado(
        true
      );


      setVerificandoSessao(
        false
      );

    }


    verificarSessao();


    /* ==================================================
       ACOMPANHA ALTERAÇÕES NA SESSÃO
    ================================================== */

    const {
      data: {
        subscription
      }
    } =
      supabase.auth.onAuthStateChange(
        (
          _evento,
          session
        ) => {

          if (!componenteAtivo) {

            return;

          }


          if (!session) {

            setAutenticado(
              false
            );


            enviarParaLogin();

            return;

          }


          setAutenticado(
            true
          );


          setVerificandoSessao(
            false
          );

        }
      );


    /* ==================================================
       LIMPEZA
    ================================================== */

    return () => {

      componenteAtivo =
        false;


      subscription.unsubscribe();

    };

  }, [
    router
  ]);


  /* ======================================================
     VERIFICANDO SESSÃO
  ====================================================== */

  if (
    verificandoSessao
  ) {

    return (

      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-slate-50
          px-4
        "
      >

        <div
          className="
            flex
            flex-col
            items-center
            text-center
          "
        >

          <LoaderCircle
            aria-hidden="true"
            className="
              h-9
              w-9
              animate-spin
              text-blue-900
            "
            strokeWidth={1.8}
          />


          <p
            className="
              mt-4
              text-sm
              font-medium
              text-slate-700
            "
          >

            Verificando sua sessão...

          </p>


          <p
            className="
              mt-1
              text-xs
              text-slate-500
            "
          >

            Aguarde enquanto preparamos sua área.

          </p>

        </div>

      </div>

    );

  }


  /* ======================================================
     NÃO AUTENTICADO
  ====================================================== */

  if (!autenticado) {

    return null;

  }


  /* ======================================================
     AUTENTICADO
  ====================================================== */

  return (
    <>
      {children}
    </>
  );

}


/* ======================================================
   EXPORTS

   Mantemos os dois formatos para compatibilidade com
   arquivos antigos do projeto:

   import { AuthGuard } ...
   import AuthGuard ...
====================================================== */

export const AuthGuard =
  AuthGuardComponent;


export default AuthGuardComponent;