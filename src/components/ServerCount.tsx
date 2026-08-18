"use client";

import {
  useEffect,
  useState
} from "react";

import {
  Users
} from "lucide-react";

import {
  supabase
} from "@/lib/supabase";


export default function ServerCount() {

  const [total, setTotal] =
    useState<number | null>(null);


  useEffect(() => {

    let ativo = true;


    async function buscarTotal() {

      const {
        data,
        error
      } = await supabase.rpc(
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
        mt-8
        flex
        w-fit
        items-center
        gap-5
        rounded-2xl
        border
        border-blue-200
        bg-gradient-to-r
        from-blue-50
        to-white
        px-6
        py-5
        shadow-sm
      "
    >

      <div
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-xl
          bg-blue-900
          text-white
          shadow-sm
        "
      >

        <Users
          size={30}
          strokeWidth={2}
        />

      </div>


      <div>

        <p
          className="
            text-3xl
            font-bold
            leading-none
            text-blue-900
          "
        >

          {total === null
            ? "..."
            : total.toLocaleString(
                "pt-BR"
              )}

        </p>


        <p
          className="
            mt-1
            text-sm
            font-semibold
            text-slate-700
          "
        >

          {total === 1
            ? "servidor cadastrado"
            : "servidores cadastrados"}

        </p>


        <p
          className="
            mt-1
            text-xs
            text-slate-500
          "
        >
          Faça parte da comunidade Permuta TJSP
        </p>

      </div>

    </div>

  );

}