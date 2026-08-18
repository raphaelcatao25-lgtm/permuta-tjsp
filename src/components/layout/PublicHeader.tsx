"use client";

import Link from "next/link";
import { ArrowRightLeft } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">


        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3"
        >

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-900 text-white shadow-sm">

            <ArrowRightLeft
              className="h-6 w-6"
              strokeWidth={2}
            />

          </div>


          <div>

            <h1 className="text-lg font-bold text-slate-900">
              Permuta TJSP
            </h1>

            <p className="text-xs text-slate-500">
              Conectando servidores
            </p>

          </div>


        </Link>



        {/* Menu */}
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">


          <Link
            href="/sobre"
            className="transition hover:text-blue-900"
          >
            Sobre o projeto
          </Link>


          <Link
            href="/duvidas"
            className="transition hover:text-blue-900"
          >
            Dúvidas frequentes
          </Link>


          <Link
            href="/login"
            className="transition hover:text-blue-900"
          >
            Entrar
          </Link>


<Link
  href="/cadastro"
  className="
    rounded-xl
    border-2
    border-blue-900
    bg-white
    px-5
    py-2
    font-semibold
    text-blue-900
    transition
    hover:bg-blue-900
    hover:!text-white
    focus:bg-blue-900
    focus:!text-white
  "
>
  Criar cadastro
</Link>


        </nav>


      </div>


    </header>
  );
}