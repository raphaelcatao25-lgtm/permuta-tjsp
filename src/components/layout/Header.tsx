"use client";

import {
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";

import {
  supabase,
} from "@/lib/supabase";


type HeaderProps = {
  nomeUsuario?: string;
  onOpenSidebar: () => void;
};


export function Header({
  nomeUsuario = "Servidor",
  onOpenSidebar,
}: HeaderProps) {


  async function fazerLogout() {

    try {

      const {
        error,
      } =
        await supabase.auth.signOut();


      if (error) {

        console.error(
          "Erro ao sair da conta:",
          error.message
        );

      }

    }

    catch (error) {

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
      */

      window.location.href = "/";

    }

  }


  return (

    <header
      className="
        sticky
        top-0
        z-30
        flex
        min-h-[70px]
        items-center
        justify-between
        border-b
        border-teal-300/10
        bg-[#061521]/88
        px-4
        backdrop-blur-xl
        sm:px-6
        lg:px-8
      "
    >


      {/* =====================================================
          MENU MOBILE
      ===================================================== */}

      <button
        type="button"

        onClick={
          onOpenSidebar
        }

        aria-label="Abrir menu"

        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          border
          border-teal-300/10
          bg-white/[0.035]
          text-slate-300
          transition
          hover:border-teal-300/25
          hover:bg-teal-400/10
          hover:!text-teal-300
          active:scale-[0.95]
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



      {/* =====================================================
          USUÁRIO
      ===================================================== */}

      <div
        className="
          ml-auto
          flex
          items-center
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          <div
            className="
              hidden
              text-right
              sm:block
            "
          >

            <p
              className="
                text-[11px]
                font-medium
                uppercase
                tracking-[0.08em]
                text-slate-500
              "
            >
              Usuário conectado
            </p>


            <p
              className="
                mt-1
                max-w-40
                truncate
                text-sm
                font-bold
                text-white
              "
            >
              {nomeUsuario}
            </p>

          </div>


          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              border
              border-teal-300/20
              bg-teal-400/10
              text-teal-300
              shadow-[0_0_25px_rgba(20,184,166,0.12)]
            "
          >

            <UserRound
              className="
                h-5
                w-5
              "
              strokeWidth={1.8}
            />

          </div>

        </div>


        <div
          className="
            mx-3
            hidden
            h-8
            w-px
            bg-teal-300/10
            sm:block
          "
        />


        {/* =====================================================
            SAIR
        ===================================================== */}

        <button
          type="button"

          onClick={
            fazerLogout
          }

          className="
            flex
            h-9
            items-center
            gap-1.5
            rounded-xl
            border
            border-transparent
            px-2.5
            text-xs
            font-semibold
            text-red-400
            transition
            hover:border-red-400/15
            hover:bg-red-400/10
            hover:!text-red-300
            active:scale-[0.96]
          "
        >

          <LogOut
            className="
              h-4
              w-4
            "
            strokeWidth={1.8}
          />


          <span
            className="
              hidden
              sm:inline
            "
          >
            Sair da conta
          </span>

        </button>

      </div>

    </header>

  );

}