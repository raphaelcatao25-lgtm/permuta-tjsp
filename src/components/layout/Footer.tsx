"use client";

import Link from "next/link";

import {
  MapPin,
} from "lucide-react";


export function Footer() {

  return (

    <footer
      className="
        relative
        border-t
        border-teal-300/10
        bg-[#04111d]/82
        py-8
        backdrop-blur-xl
      "
    >

      <div
        className="
          mx-auto
          flex
          max-w-7xl
          flex-col
          items-center
          justify-center
          gap-4
          px-5
          text-center
          sm:px-6
        "
      >

        {/* LOGO SIMPLES */}

        <Link
          href="/"
          className="
            group
            flex
            items-center
            gap-2
          "
        >

          <div
            className="
              relative
              flex
              h-9
              w-9
              items-center
              justify-center
              text-teal-400
              transition
              group-hover:-translate-y-0.5
            "
          >

            <MapPin
              size={32}
              strokeWidth={1.8}
            />

            <span
              className="
                absolute
                top-[8px]
                text-[11px]
                font-black
                text-white
              "
            >
              P
            </span>

          </div>


          <span
            className="
              font-bold
              text-white
            "
          >
            Permuta TJSP
          </span>

        </Link>


        {/* LINKS */}

        <div
          className="
            flex
            flex-wrap
            items-center
            justify-center
            gap-x-5
            gap-y-2
            text-sm
            text-slate-400
          "
        >

          <Link
            href="/sobre"
            className="
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
              transition
              hover:-translate-y-0.5
              hover:!text-teal-300
            "
          >
            Dúvidas frequentes
          </Link>


          <Link
            href="/termos"
            className="
              transition
              hover:-translate-y-0.5
              hover:!text-teal-300
            "
          >
            Termos de Uso
          </Link>


          <Link
            href="/privacidade"
            className="
              transition
              hover:-translate-y-0.5
              hover:!text-teal-300
            "
          >
            Política de Privacidade
          </Link>

        </div>


        {/* AUTORIA */}

        <Link
          href="/sobre"
          className="
            text-sm
            font-semibold
            text-teal-400
            transition
            hover:!text-teal-300
          "
        >
          Desenvolvido por Raphael Catão Martinez
        </Link>


        {/* AVISO */}

        <p
          className="
            max-w-3xl
            text-xs
            leading-5
            text-slate-600
          "
        >
          Permuta TJSP — ferramenta independente para auxiliar
          servidores na localização e organização de oportunidades
          de permuta.
        </p>

      </div>

    </footer>

  );

}