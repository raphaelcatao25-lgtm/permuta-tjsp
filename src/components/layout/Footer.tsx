"use client";

import Link from "next/link";


export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6">

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-6 text-center text-sm text-slate-500">


        {/* LINKS */}

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">

          <Link
            href="/sobre"
            className="transition hover:text-blue-900"
          >
            Sobre o projeto
          </Link>


          <span className="hidden text-slate-300 sm:inline">
            |
          </span>


          <Link
            href="/duvidas"
            className="transition hover:text-blue-900"
          >
            Dúvidas frequentes
          </Link>


          <span className="hidden text-slate-300 sm:inline">
            |
          </span>


          <Link
            href="/termos"
            className="transition hover:text-blue-900"
          >
            Termos de Uso
          </Link>


          <span className="hidden text-slate-300 sm:inline">
            |
          </span>


          <Link
            href="/privacidade"
            className="transition hover:text-blue-900"
          >
            Política de Privacidade
          </Link>

        </div>


        {/* AUTORIA */}

        <Link
          href="/sobre"
          className="font-medium text-blue-900 transition hover:underline"
        >
          Desenvolvido por Raphael Catão Martinez
        </Link>


        {/* AVISO */}

        <p className="text-xs text-slate-400">
          Permuta TJSP - Ferramenta independente para auxiliar servidores na busca por permutas.
        </p>

      </div>

    </footer>
  );
}