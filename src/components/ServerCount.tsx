"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Users,
} from "lucide-react";

import {
  supabase,
} from "@/lib/supabase";


export default function ServerCount() {

  const [
    total,
    setTotal,
  ] =
    useState<number | null>(null);


  useEffect(() => {

    let ativo = true;


    async function buscarTotal() {

      const {
        data,
        error,
      } =
        await supabase.rpc(
          "contar_servidores"
        );


      if (!ativo) {
        return;
      }


      if (error) {

        console.error(
          "Erro ao buscar servidores:",
          error.message
        );

        return;

      }


      setTotal(
        Number(data ?? 0)
      );

    }


    buscarTotal();


    return () => {
      ativo = false;
    };

  }, []);


  return (

    <div
      className="
        group
        flex
        w-fit
        min-w-[315px]
        items-center
        gap-5
        rounded-2xl
        border
        border-teal-300/15
        bg-gradient-to-r
        from-[#0d2637]/95
        to-[#081b29]/95
        px-6
        py-5
        shadow-[0_18px_45px_rgba(0,0,0,0.22)]
        backdrop-blur-xl
        transition
        duration-300
        hover:-translate-y-1
        hover:border-teal-300/30
        hover:shadow-[0_24px_55px_rgba(0,0,0,0.32)]
      "
    >

      <div
        className="
          flex
          h-14
          w-14
          shrink-0
          items-center
          justify-center
          rounded-2xl
          border
          border-teal-300/20
          bg-teal-400/10
          text-teal-300
          shadow-[0_0_28px_rgba(20,184,166,0.12)]
          transition
          duration-300
          group-hover:scale-105
          group-hover:bg-teal-400/15
        "
      >

        <Users
          size={29}
          strokeWidth={1.9}
        />

      </div>


      <div>

        <p
          className="
            text-3xl
            font-black
            leading-none
            tracking-tight
            text-teal-300
          "
        >

          {
            total === null
              ? "..."
              : total.toLocaleString(
                  "pt-BR"
                )
          }

        </p>


        <p
          className="
            mt-1.5
            text-sm
            font-bold
            text-white
          "
        >

          {
            total === 1
              ? "servidor cadastrado"
              : "servidores cadastrados"
          }

        </p>


        <p
          className="
            mt-1
            text-xs
            leading-5
            text-slate-500
          "
        >
          Faça parte da comunidade Permuta TJSP
        </p>

      </div>

    </div>

  );

}