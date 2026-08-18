"use client";

import ServerCount from "@/components/ServerCount";

import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Search,
  Users,
} from "lucide-react";


export default function Hero() {

  return (

    <section className="bg-white">


      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">


        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">


          {/* TEXTO PRINCIPAL */}

          <div>


            <span
              className="
              inline-flex
              rounded-full
              bg-blue-50
              px-4
              py-2
              text-sm
              font-semibold
              text-blue-900
              "
            >
              Plataforma independente
            </span>



            <h1
              className="
              mt-6
              text-4xl
              font-bold
              leading-tight
              text-slate-900
              md:text-5xl
              "
            >
              Encontre oportunidades de permuta
              entre servidores do TJSP.
            </h1>



            <p
              className="
              mt-6
              text-lg
              leading-relaxed
              text-slate-600
              "
            >
              Uma plataforma criada para aproximar servidores,
              organizar interesses de movimentação e facilitar
              conexões de forma simples e transparente.
            </p>



            {/* CONTADOR DE SERVIDORES */}

            <div className="mt-8">

              <ServerCount />

            </div>



            {/* BOTÕES */}

            <div
              className="
              mt-8
              flex
              flex-wrap
              items-center
              gap-4
              "
            >


              <Link
                href="/cadastro"
                className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-blue-900
                px-6
                py-3
                font-semibold
                !text-white
                transition
                hover:bg-blue-800
                "
              >
                Criar cadastro

                <ArrowRight size={20}/>
              </Link>



              <Link
                href="/login"
                className="
                flex
                items-center
                justify-center
                rounded-xl
                border-2
                border-blue-900
                px-6
                py-3
                font-semibold
                !text-blue-900
                transition
                hover:bg-blue-900
                hover:!text-white
                "
              >
                Entrar
              </Link>


            </div>


          </div>




          {/* CARDS LATERAIS */}


          <div className="grid gap-4">


            <div
              className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              "
            >

              <Search
                size={34}
                className="text-blue-900"
              />


              <h3
                className="
                mt-3
                text-lg
                font-bold
                text-slate-900
                "
              >
                Busca organizada
              </h3>


              <p
                className="
                mt-2
                text-sm
                text-slate-600
                "
              >
                Centralize informações que antes ficavam
                espalhadas em grupos e planilhas.
              </p>


            </div>



            <div
              className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              "
            >

              <Users
                size={34}
                className="text-blue-900"
              />


              <h3
                className="
                mt-3
                text-lg
                font-bold
                text-slate-900
                "
              >
                Permutas inteligentes
              </h3>


              <p
                className="
                mt-2
                text-sm
                text-slate-600
                "
              >
                Encontre servidores com interesses
                compatíveis de movimentação.
              </p>


            </div>



            <div
              className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              "
            >

              <ShieldCheck
                size={34}
                className="text-blue-900"
              />


              <h3
                className="
                mt-3
                text-lg
                font-bold
                text-slate-900
                "
              >
                Privacidade
              </h3>


              <p
                className="
                mt-2
                text-sm
                text-slate-600
                "
              >
                Você controla suas informações e como
                seus contatos serão utilizados.
              </p>


            </div>


          </div>


        </div>


      </div>


    </section>

  );
}