"use client";

import {
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowRight,
  MapPin,
  Menu,
  X,
} from "lucide-react";


export function PublicHeader() {

  const [
    menuAberto,
    setMenuAberto,
  ] = useState(false);


  return (

    <header
      className="
        sticky
        top-0
        z-50
        border-b
        border-teal-300/10
        bg-[#04111d]/88
        backdrop-blur-xl
      "
    >

      <div
        className="
          mx-auto
          flex
          h-[76px]
          max-w-7xl
          items-center
          justify-between
          px-5
          sm:px-6
          lg:px-8
        "
      >


        {/* =====================================================
            LOGO
        ===================================================== */}

        <Link
          href="/"
          onClick={() =>
            setMenuAberto(false)
          }
          className="
            group
            flex
            items-center
            gap-3
          "
        >

          <div
            className="
              relative
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              transition
              duration-200
              group-hover:-translate-y-0.5
              group-hover:scale-105
            "
          >

            <MapPin
              className="
                h-12
                w-12
                text-teal-400
                drop-shadow-[0_0_10px_rgba(45,212,191,0.28)]
              "
              strokeWidth={1.8}
            />

            <span
              className="
                absolute
                top-[11px]
                text-[17px]
                font-black
                leading-none
                text-white
              "
            >
              P
            </span>

          </div>


          <div
            className="
              leading-tight
            "
          >

            <div
              className="
                text-[17px]
                font-extrabold
                tracking-tight
                text-white
              "
            >
              Permuta TJSP
            </div>

            <div
              className="
                mt-0.5
                text-[11px]
                font-medium
                tracking-wide
                text-slate-400
              "
            >
              Conectando servidores
            </div>

          </div>

        </Link>



        {/* =====================================================
            MENU DESKTOP
        ===================================================== */}

        <nav
          className="
            hidden
            items-center
            gap-8
            lg:flex
          "
        >

          <Link
            href="/#como-funciona"
            className="
              text-sm
              font-medium
              text-slate-300
              transition
              hover:-translate-y-0.5
              hover:!text-teal-300
            "
          >
            Como funciona
          </Link>


          <Link
            href="/sobre"
            className="
              text-sm
              font-medium
              text-slate-300
              transition
              hover:-translate-y-0.5
              hover:!text-teal-300
            "
          >
            Sobre o projeto
          </Link>


          <Link
            href="/duvidas"
            className="
              text-sm
              font-medium
              text-slate-300
              transition
              hover:-translate-y-0.5
              hover:!text-teal-300
            "
          >
            Dúvidas frequentes
          </Link>

        </nav>



        {/* =====================================================
            AÇÕES DESKTOP
        ===================================================== */}

        <div
          className="
            hidden
            items-center
            gap-4
            lg:flex
          "
        >

          <Link
            href="/login"
            className="
              rounded-full
              px-4
              py-2.5
              text-sm
              font-semibold
              text-slate-200
              transition
              hover:-translate-y-0.5
              hover:bg-white/5
              hover:!text-white
              active:translate-y-[1px]
              active:scale-[0.97]
            "
          >
            Entrar
          </Link>


          <Link
            href="/cadastro"
            className="
              group
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-full
              border
              border-teal-300/25
              bg-gradient-to-r
              from-teal-700
              to-teal-500
              px-5
              py-2.5
              text-sm
              font-bold
              text-white
              shadow-[0_10px_28px_rgba(20,184,166,0.18)]
              transition
              duration-200
              hover:-translate-y-0.5
              hover:brightness-110
              hover:shadow-[0_14px_34px_rgba(20,184,166,0.28)]
              active:translate-y-[1px]
              active:scale-[0.97]
            "
          >

            Criar conta

            <ArrowRight
              size={17}
              className="
                transition
                duration-200
                group-hover:translate-x-1
              "
            />

          </Link>

        </div>



        {/* =====================================================
            BOTÃO MENU MOBILE
        ===================================================== */}

        <button
          type="button"
          aria-label={
            menuAberto
              ? "Fechar menu"
              : "Abrir menu"
          }
          onClick={() =>
            setMenuAberto(
              atual => !atual
            )
          }
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            border
            border-teal-300/15
            bg-white/[0.04]
            text-slate-200
            lg:hidden
          "
        >

          {
            menuAberto
              ? (
                <X size={22} />
              )
              : (
                <Menu size={22} />
              )
          }

        </button>

      </div>



      {/* =====================================================
          MENU MOBILE
      ===================================================== */}

      <div
        className={`
          overflow-hidden
          border-t
          border-teal-300/10
          bg-[#061521]/96
          backdrop-blur-xl
          transition-all
          duration-300
          lg:hidden

          ${
            menuAberto
              ? "max-h-[430px] opacity-100"
              : "max-h-0 border-transparent opacity-0"
          }
        `}
      >

        <nav
          className="
            mx-auto
            flex
            max-w-7xl
            flex-col
            gap-2
            px-5
            py-5
          "
        >

          <Link
            href="/#como-funciona"
            onClick={() =>
              setMenuAberto(false)
            }
            className="
              rounded-xl
              px-4
              py-3
              text-sm
              font-medium
              text-slate-200
              transition
              hover:bg-teal-400/10
              hover:!text-teal-300
            "
          >
            Como funciona
          </Link>


          <Link
            href="/sobre"
            onClick={() =>
              setMenuAberto(false)
            }
            className="
              rounded-xl
              px-4
              py-3
              text-sm
              font-medium
              text-slate-200
              transition
              hover:bg-teal-400/10
              hover:!text-teal-300
            "
          >
            Sobre o projeto
          </Link>


          <Link
            href="/duvidas"
            onClick={() =>
              setMenuAberto(false)
            }
            className="
              rounded-xl
              px-4
              py-3
              text-sm
              font-medium
              text-slate-200
              transition
              hover:bg-teal-400/10
              hover:!text-teal-300
            "
          >
            Perguntas
          </Link>


          <div
            className="
              my-2
              h-px
              bg-teal-300/10
            "
          />


          <Link
            href="/login"
            onClick={() =>
              setMenuAberto(false)
            }
            className="
              btn-secondary
              w-full
            "
          >
            Entrar
          </Link>


          <Link
            href="/cadastro"
            onClick={() =>
              setMenuAberto(false)
            }
            className="
              btn-primary
              group
              mt-1
              w-full
            "
          >

            Criar conta

            <ArrowRight
              size={17}
              className="
                transition
                group-hover:translate-x-1
              "
            />

          </Link>

        </nav>

      </div>

    </header>

  );

}