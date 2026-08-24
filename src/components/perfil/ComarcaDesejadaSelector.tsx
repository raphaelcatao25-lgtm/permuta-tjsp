"use client";

import {
  Plus,
  Search,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";


export type ComarcaDesejadaOpcao = {
  id: number;
  nome: string;
  circunscricao: string;
  raj: string;
};


type ComarcaDesejadaSelectorProps = {
  comarcas: ComarcaDesejadaOpcao[];
  comarcaAtualId: string;
  comarcasSelecionadasIds: number[];
  limite?: number;
  onAdicionar: (
    comarca: ComarcaDesejadaOpcao
  ) => void;
};


function normalizarTexto(
  texto: string
) {

  return texto
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();

}


/*
======================================================
CONVERTER NÚMERO ROMANO
======================================================
*/

function converterRomanoParaNumero(
  romano: string
) {

  const valores:
    Record<string, number> = {

      I: 1,
      V: 5,
      X: 10,
      L: 50,
      C: 100,
      D: 500,
      M: 1000,

    };


  let total = 0;
  let anterior = 0;


  for (
    let indice =
      romano.length - 1;

    indice >= 0;

    indice--
  ) {

    const atual =
      valores[
        romano[indice]
          .toUpperCase()
      ] ?? 0;


    if (
      atual < anterior
    ) {

      total -= atual;

    }

    else {

      total += atual;

      anterior =
        atual;

    }

  }


  return total;

}


/*
======================================================
ORDENAR COMARCAS
======================================================
*/

function ordenarComarcas(
  a: ComarcaDesejadaOpcao,
  b: ComarcaDesejadaOpcao
) {

  const nomeA =
    a.nome.trim();

  const nomeB =
    b.nome.trim();


  const saoPauloA =
    normalizarTexto(
      nomeA
    ).startsWith(
      "sao paulo - foro"
    );

  const saoPauloB =
    normalizarTexto(
      nomeB
    ).startsWith(
      "sao paulo - foro"
    );


  if (
    saoPauloA &&
    saoPauloB
  ) {

    const centralA =
      normalizarTexto(
        nomeA
      ).includes(
        "foro central"
      );

    const centralB =
      normalizarTexto(
        nomeB
      ).includes(
        "foro central"
      );


    if (
      centralA &&
      !centralB
    ) {

      return -1;

    }


    if (
      !centralA &&
      centralB
    ) {

      return 1;

    }


    const regexRegional =
      /Foro Regional\s+([IVXLCDM]+)/i;


    const romanoA =
      nomeA.match(
        regexRegional
      )?.[1];

    const romanoB =
      nomeB.match(
        regexRegional
      )?.[1];


    if (
      romanoA &&
      romanoB
    ) {

      const numeroA =
        converterRomanoParaNumero(
          romanoA
        );

      const numeroB =
        converterRomanoParaNumero(
          romanoB
        );


      if (
        numeroA !==
        numeroB
      ) {

        return (
          numeroA -
          numeroB
        );

      }

    }

  }


  return nomeA.localeCompare(
    nomeB,
    "pt-BR",
    {
      sensitivity:
        "base",
    }
  );

}


export function ComarcaDesejadaSelector({
  comarcas,
  comarcaAtualId,
  comarcasSelecionadasIds,
  limite = 10,
  onAdicionar,
}: ComarcaDesejadaSelectorProps) {

  const containerRef =
    useRef<HTMLDivElement>(
      null
    );


  const [
    busca,
    setBusca,
  ] =
    useState("");


  const [
    listaAberta,
    setListaAberta,
  ] =
    useState(false);


  const atingiuLimite =
    comarcasSelecionadasIds
      .length >=
    limite;


  /*
  ======================================================
  FECHAR AO CLICAR FORA
  ======================================================
  */

  useEffect(() => {

    function fecharAoClicarFora(
      event: MouseEvent
    ) {

      const alvo =
        event.target as Node;


      if (
        containerRef.current &&
        !containerRef.current.contains(
          alvo
        )
      ) {

        setListaAberta(
          false
        );

      }

    }


    document.addEventListener(
      "mousedown",
      fecharAoClicarFora
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        fecharAoClicarFora
      );

    };

  }, []);


  /*
  ======================================================
  FILTRAR E ORDENAR COMARCAS
  ======================================================
  */

  const opcoesFiltradas =
    useMemo(() => {

      const buscaNormalizada =
        normalizarTexto(
          busca
        );


      return comarcas
        .filter(
          (comarca) => {

            const jaSelecionada =
              comarcasSelecionadasIds
                .includes(
                  comarca.id
                );


            const eComarcaAtual =
              comarca.id ===
              Number(
                comarcaAtualId
              );


            if (
              jaSelecionada ||
              eComarcaAtual
            ) {

              return false;

            }


            if (
              !buscaNormalizada
            ) {

              return true;

            }


            return normalizarTexto(
              comarca.nome
            ).includes(
              buscaNormalizada
            );

          }
        )
        .sort(
          ordenarComarcas
        );

    }, [
      busca,
      comarcaAtualId,
      comarcas,
      comarcasSelecionadasIds,
    ]);


  /*
  ======================================================
  ADICIONAR COMARCA
  ======================================================
  */

  function adicionarComarca(
    comarca: ComarcaDesejadaOpcao
  ) {

    if (
      atingiuLimite
    ) {

      return;

    }


    onAdicionar(
      comarca
    );


    setBusca("");


    setListaAberta(
      false
    );

  }


  return (

    <div
      ref={
        containerRef
      }
    >

      <div
        className="
          mb-2
          flex
          items-center
          justify-between
          gap-3
        "
      >

        <label
          htmlFor="comarca-desejada"
          className="
            block
            text-sm
            font-semibold
            text-slate-300
          "
        >
          Comarcas desejadas
        </label>


        <span
          className="
            rounded-full
            border
            border-teal-300/15
            bg-teal-400/[0.06]
            px-2.5
            py-1
            text-xs
            font-semibold
            text-teal-300
          "
        >
          {
            comarcasSelecionadasIds
              .length
          }
          /
          {
            limite
          }
        </span>

      </div>


      <div
        className="
          relative
        "
      >

        <Search
          aria-hidden="true"

          className="
            pointer-events-none
            absolute
            left-3
            top-1/2
            z-10
            h-5
            w-5
            -translate-y-1/2
            text-slate-500
          "

          strokeWidth={
            1.8
          }
        />


        <input
          id="comarca-desejada"
          type="text"

          value={
            busca
          }

          onChange={
            (event) => {

              setBusca(
                event.target.value
              );

              setListaAberta(
                true
              );

            }
          }

          onFocus={
            () =>
              setListaAberta(
                true
              )
          }

          disabled={
            atingiuLimite
          }

          className="
            w-full
            rounded-xl
            border
            border-teal-300/15
            bg-[#081b29]
            py-3
            pl-10
            pr-4
            text-white
            outline-none
            transition
            placeholder:text-slate-600
            hover:border-teal-300/25
            focus:border-teal-400
            focus:ring-4
            focus:ring-teal-400/10
            disabled:cursor-not-allowed
            disabled:border-slate-700
            disabled:bg-[#071620]
            disabled:text-slate-600
          "

          placeholder={
            atingiuLimite

              ? `Limite de ${limite} comarcas atingido`

              : "Digite para adicionar uma comarca"
          }

          autoComplete="off"
        />


        {
          listaAberta &&
          !atingiuLimite && (

            <div
              className="
                absolute
                z-30
                mt-2
                max-h-72
                w-full
                overflow-y-auto
                rounded-xl
                border
                border-teal-300/15
                bg-[#0a1f2f]
                py-1
                shadow-[0_20px_50px_rgba(0,0,0,0.35)]
              "
            >

              {
                opcoesFiltradas
                  .length > 0

                  ? (

                    opcoesFiltradas.map(
                      (comarca) => (

                        <button
                          key={
                            comarca.id
                          }

                          type="button"

                          onClick={
                            () =>
                              adicionarComarca(
                                comarca
                              )
                          }

                          className="
                            group
                            flex
                            w-full
                            items-start
                            justify-between
                            gap-4
                            border-b
                            border-teal-300/[0.06]
                            px-4
                            py-3
                            text-left
                            transition-colors
                            duration-200
                            last:border-b-0
                            hover:bg-teal-400/[0.08]
                          "
                        >

                          <div
                            className="
                              min-w-0
                            "
                          >

                            <p
                              className="
                                truncate
                                text-sm
                                font-semibold
                                text-slate-200
                                transition-colors
                                group-hover:text-teal-200
                              "
                            >
                              {
                                comarca.nome
                              }
                            </p>


                            <p
                              className="
                                mt-1
                                text-xs
                                text-slate-500
                              "
                            >
                              Circunscrição:{" "}
                              {
                                comarca.circunscricao
                              }
                            </p>


                            <p
                              className="
                                mt-0.5
                                text-xs
                                text-slate-500
                              "
                            >
                              RAJ:{" "}
                              {
                                comarca.raj
                              }
                            </p>

                          </div>


                          <div
                            className="
                              mt-0.5
                              flex
                              h-8
                              w-8
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg
                              border
                              border-teal-300/15
                              bg-teal-400/[0.06]
                              text-teal-300
                              transition
                              group-hover:bg-teal-400/10
                            "
                          >

                            <Plus
                              aria-hidden="true"

                              className="
                                h-4
                                w-4
                              "

                              strokeWidth={
                                2
                              }
                            />

                          </div>

                        </button>

                      )
                    )

                  )

                  : (

                    <p
                      className="
                        px-4
                        py-4
                        text-sm
                        text-slate-500
                      "
                    >
                      Nenhuma comarca disponível foi encontrada.
                    </p>

                  )
              }

            </div>

          )
        }

      </div>


      <p
        className="
          mt-2
          text-xs
          leading-relaxed
          text-slate-500
        "
      >
        Você pode adicionar até {limite} comarcas e organizar a prioridade depois.
      </p>

    </div>

  );

}