"use client";

import {
  Check,
  ChevronDown,
  Search,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";


export type ComarcaAtual = {
  id: number;
  nome: string;
  circunscricao: string;
  raj: string;
};


type ComarcaAtualSelectorProps = {
  comarcas: ComarcaAtual[];
  comarcaAtualId: string;
  valorBusca: string;
  onChangeBusca: (valor: string) => void;
  onSelecionar: (comarca: ComarcaAtual) => void;
};


function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}


export function ComarcaAtualSelector({
  comarcas,
  comarcaAtualId,
  valorBusca,
  onChangeBusca,
  onSelecionar,
}: ComarcaAtualSelectorProps) {

  const containerRef =
    useRef<HTMLDivElement>(null);

  const [
    listaAberta,
    setListaAberta,
  ] = useState(false);


  useEffect(() => {

    function fecharAoClicarFora(
      event: MouseEvent
    ) {

      const alvo =
        event.target as Node;

      if (
        containerRef.current &&
        !containerRef.current.contains(alvo)
      ) {
        setListaAberta(false);
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


  const comarcasFiltradas =
    useMemo(() => {

      const buscaNormalizada =
        normalizarTexto(valorBusca);

      return comarcas
        .filter((comarca) => {

          if (!buscaNormalizada) {
            return true;
          }

          return normalizarTexto(
            comarca.nome
          ).includes(buscaNormalizada);

        })
        .slice(0, 8);

    }, [
      comarcas,
      valorBusca,
    ]);


  function alterarBusca(
    valor: string
  ) {

    onChangeBusca(valor);
    setListaAberta(true);

  }


  function selecionar(
    comarca: ComarcaAtual
  ) {

    onSelecionar(comarca);
    setListaAberta(false);

  }


  return (

    <div ref={containerRef}>

      <label
        htmlFor="comarca-atual"
        className="
          mb-2
          block
          text-sm
          font-semibold
          text-slate-300
        "
      >
        Comarca atual
      </label>


      <div className="relative">

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
          strokeWidth={1.8}
        />


        <input
          id="comarca-atual"
          type="text"
          value={valorBusca}

          onChange={(event) =>
            alterarBusca(
              event.target.value
            )
          }

          onFocus={() =>
            setListaAberta(true)
          }

          className="
            w-full
            rounded-xl
            border
            border-teal-300/15
            bg-[#081b29]
            py-3
            pl-10
            pr-10
            text-white
            outline-none
            transition
            placeholder:text-slate-600
            hover:border-teal-300/25
            focus:border-teal-400
            focus:ring-4
            focus:ring-teal-400/10
          "

          placeholder="Digite para localizar sua comarca"
          autoComplete="off"
        />


        <ChevronDown
          aria-hidden="true"
          className={[
            `
              pointer-events-none
              absolute
              right-3
              top-1/2
              h-5
              w-5
              -translate-y-1/2
              text-slate-500
              transition-transform
              duration-200
            `,
            listaAberta
              ? "rotate-180"
              : "",
          ].join(" ")}
          strokeWidth={1.8}
        />


        {
          listaAberta && (

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
                comarcasFiltradas.length > 0

                  ? comarcasFiltradas.map(
                      (comarca) => {

                        const selecionada =
                          comarca.id ===
                          Number(comarcaAtualId);

                        return (

                          <button
                            key={comarca.id}
                            type="button"
                            onClick={() =>
                              selecionar(comarca)
                            }
                            className={[
                              `
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
                              `,
                              selecionada
                                ? "bg-teal-400/[0.06]"
                                : "",
                            ].join(" ")}
                          >

                            <div className="min-w-0">

                              <p
                                className={[
                                  "truncate text-sm font-semibold",
                                  selecionada
                                    ? "text-teal-200"
                                    : "text-slate-200",
                                ].join(" ")}
                              >
                                {comarca.nome}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Circunscrição: {comarca.circunscricao}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                RAJ: {comarca.raj}
                              </p>

                            </div>


                            {
                              selecionada && (

                                <Check
                                  aria-hidden="true"
                                  className="
                                    mt-1
                                    h-4
                                    w-4
                                    shrink-0
                                    text-teal-300
                                  "
                                  strokeWidth={2}
                                />

                              )
                            }

                          </button>

                        );

                      }
                    )

                  : (

                    <p className="
                      px-4
                      py-4
                      text-sm
                      text-slate-500
                    ">
                      Nenhuma comarca encontrada.
                    </p>

                  )
              }

            </div>

          )
        }

      </div>

    </div>

  );

}