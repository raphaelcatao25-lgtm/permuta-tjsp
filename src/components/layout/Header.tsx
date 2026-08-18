"use client";

import {
  LogOut,
  Menu,
  UserRound
} from "lucide-react";

import {
  supabase
} from "@/lib/supabase";


type HeaderProps = {
  nomeUsuario?: string;
  onOpenSidebar: () => void;
};


export function Header({
  nomeUsuario = "Servidor",
  onOpenSidebar
}: HeaderProps) {


  async function fazerLogout() {

    try {

      const {
        error
      } = await supabase.auth.signOut();


      if (error) {

        console.error(
          "Erro ao sair da conta:",
          error.message
        );

      }

    }

    catch(error) {

      console.error(
        "Erro inesperado ao sair da conta:",
        error
      );

    }

    finally {

      /*
      ========================================
      REDIRECIONAMENTO COMPLETO
      ========================================

      Força a saída da área autenticada e
      desmonta Header, Sidebar, notificações,
      listeners e demais estados da sessão.
      */

      window.location.href = "/";

    }

  }


  return (

    <header className="
      sticky
      top-0
      z-30
      flex
      min-h-16
      items-center
      justify-between
      border-b
      border-slate-200
      bg-white
      px-4
      sm:px-6
      lg:px-8
    ">


      {/* MENU MOBILE */}

      <button
        type="button"

        onClick={
          onOpenSidebar
        }

        aria-label="Abrir menu"

        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          text-slate-600
          transition
          hover:bg-slate-100
          hover:text-blue-900
          lg:hidden
        "
      >

        <Menu
          className="
            h-5
            w-5
          "
          strokeWidth={1.8}
        />

      </button>


      {/* USUÁRIO */}

      <div className="
        ml-auto
        flex
        items-center
      ">


        <div className="
          flex
          items-center
          gap-3
        ">


          <div className="
            hidden
            text-right
            sm:block
          ">

            <p className="
              text-xs
              font-medium
              text-slate-500
            ">

              Usuário conectado

            </p>


            <p className="
              mt-0.5
              max-w-40
              truncate
              text-sm
              font-bold
              text-slate-900
            ">

              {nomeUsuario}

            </p>

          </div>


          <div className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            border
            border-blue-100
            bg-blue-50
            text-blue-900
          ">

            <UserRound
              className="
                h-5
                w-5
              "
              strokeWidth={1.8}
            />

          </div>

        </div>


        <div className="
          mx-3
          hidden
          h-7
          w-px
          bg-slate-200
          sm:block
        " />


        {/* SAIR DA CONTA */}

        <button
          type="button"

          onClick={
            fazerLogout
          }

          className="
            flex
            h-8
            items-center
            gap-1.5
            rounded-lg
            px-2
            text-xs
            font-semibold
            text-red-600
            transition
            hover:bg-red-50
          "
        >

          <LogOut
            className="
              h-4
              w-4
            "
            strokeWidth={1.8}
          />


          <span className="
            hidden
            sm:inline
          ">

            Sair da conta

          </span>

        </button>


      </div>

    </header>

  );

}