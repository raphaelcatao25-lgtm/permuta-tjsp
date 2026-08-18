"use client";

import {
  useEffect,
  useState
} from "react";

import {
  useRouter
} from "next/navigation";

import {
  supabase
} from "@/lib/supabase";

import {
  ArrowDown,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Eye,
  MapPin,
  Users,
} from "lucide-react";


interface Props {
  usuarioId: string;
}


interface Ciclo {

  id: string;

  participante_1: string;
  nome_1?: string | null;

  origem_1: number;
  origem_nome_1?: string | null;
  origem_circunscricao_1?: string | null;
  origem_raj_1?: string | null;

  destino_1: number;
  destino_nome_1?: string | null;
  destino_circunscricao_1?: string | null;
  destino_raj_1?: string | null;


  participante_2: string;
  nome_2?: string | null;

  origem_2: number;
  origem_nome_2?: string | null;
  origem_circunscricao_2?: string | null;
  origem_raj_2?: string | null;

  destino_2: number;
  destino_nome_2?: string | null;
  destino_circunscricao_2?: string | null;
  destino_raj_2?: string | null;


  participante_3: string;
  nome_3?: string | null;

  origem_3: number;
  origem_nome_3?: string | null;
  origem_circunscricao_3?: string | null;
  origem_raj_3?: string | null;

  destino_3: number;
  destino_nome_3?: string | null;
  destino_circunscricao_3?: string | null;
  destino_raj_3?: string | null;

  score: number;
}


interface PerfilNome {
  id: string;
  nome: string;
}


interface Participante {

  numero: number;

  participanteId: string;

  nome: string;

  origem: string;

  origemCircunscricao: string;

  origemRaj: string;

  destino: string;

  destinoCircunscricao: string;

  destinoRaj: string;

}


/* ======================================================
   COMPONENTE PRINCIPAL
====================================================== */

export default function CiclosPermuta({
  usuarioId
}: Props) {

  const [ciclos, setCiclos] =
    useState<Ciclo[]>([]);

  const [carregando, setCarregando] =
    useState(true);


  useEffect(() => {

    if (!usuarioId) {

      setCarregando(false);

      return;

    }


    let ativo = true;


    /* =========================================
       BUSCAR CICLOS
    ========================================= */

    async function buscarCiclos() {

      setCarregando(true);


      const {
        data,
        error
      } = await supabase.rpc(
        "buscar_melhores_ciclos_usuario_v2",
        {
          p_perfil_id: usuarioId,
        }
      );


      if (!ativo) {
        return;
      }


      if (error) {

        console.error(
          "Erro ao buscar ciclos:",
          error
        );

        setCarregando(false);

        return;

      }


      const ciclosRecebidos =
        (data ?? []) as Ciclo[];


      if (
        ciclosRecebidos.length === 0
      ) {

        setCiclos([]);

        setCarregando(false);

        return;

      }


      /* =========================================
         BUSCA NOMES DOS PARTICIPANTES
      ========================================= */

      const participantesIds = [

        ...new Set(

          ciclosRecebidos.flatMap(
            (ciclo) => [

              ciclo.participante_1,

              ciclo.participante_2,

              ciclo.participante_3,

            ]
          )

        ),

      ];


      const {
        data: perfis,
        error: erroPerfis
      } = await supabase

        .from("perfis")

        .select("id, nome")

        .in(
          "id",
          participantesIds
        );


      if (!ativo) {
        return;
      }


      if (erroPerfis) {

        console.error(
          "Erro ao buscar nomes:",
          erroPerfis
        );

      }


      const mapaNomes =
        new Map<string, string>();


      (
        (perfis ?? []) as PerfilNome[]
      ).forEach(

        (perfil) => {

          mapaNomes.set(
            perfil.id,
            perfil.nome
          );

        }

      );


      const ciclosComNomes =
        ciclosRecebidos.map(

          (ciclo) => ({

            ...ciclo,


            nome_1:

              mapaNomes.get(
                ciclo.participante_1
              )

              ||

              ciclo.nome_1

              ||

              "Servidor TJSP",


            nome_2:

              mapaNomes.get(
                ciclo.participante_2
              )

              ||

              ciclo.nome_2

              ||

              "Servidor TJSP",


            nome_3:

              mapaNomes.get(
                ciclo.participante_3
              )

              ||

              ciclo.nome_3

              ||

              "Servidor TJSP",

          })

        );


      setCiclos(
        ciclosComNomes
      );


      setCarregando(false);

    }


    /* =========================================
       ATUALIZAÇÃO MANUAL
    ========================================= */

    function atualizarManualmente() {

      buscarCiclos();

    }


    /* =========================================
       AO VOLTAR PARA A PÁGINA
    ========================================= */

    function aoVoltarParaPagina() {

      buscarCiclos();

    }


    /* =========================================
       QUANDO A ABA VOLTA A FICAR VISÍVEL
    ========================================= */

    function aoMudarVisibilidade() {

      if (
        document.visibilityState ===
        "visible"
      ) {

        buscarCiclos();

      }

    }


    /* =========================================
       PRIMEIRA BUSCA
    ========================================= */

    buscarCiclos();


    /* =========================================
       EVENTOS
    ========================================= */

    window.addEventListener(
      "atualizar-ciclos",
      atualizarManualmente
    );


    window.addEventListener(
      "focus",
      aoVoltarParaPagina
    );


    window.addEventListener(
      "pageshow",
      aoVoltarParaPagina
    );


    document.addEventListener(
      "visibilitychange",
      aoMudarVisibilidade
    );


    /* =========================================
       LIMPEZA DOS EVENTOS
    ========================================= */

    return () => {

      ativo = false;


      window.removeEventListener(
        "atualizar-ciclos",
        atualizarManualmente
      );


      window.removeEventListener(
        "focus",
        aoVoltarParaPagina
      );


      window.removeEventListener(
        "pageshow",
        aoVoltarParaPagina
      );


      document.removeEventListener(
        "visibilitychange",
        aoMudarVisibilidade
      );

    };


  }, [usuarioId]);


  /* ======================================================
     CARREGANDO
  ====================================================== */

  if (carregando) {

    return (

      <div className="
        rounded-2xl
        border
        bg-[#081b29]
        p-8
        text-center
      ">

        <div className="
          font-medium
          text-slate-300
        ">

          Buscando melhores combinações...

        </div>

      </div>

    );

  }


  /* ======================================================
     NENHUM CICLO
  ====================================================== */

  if (
    ciclos.length === 0
  ) {

    return (

      <div className="
        rounded-2xl
        border
        bg-[#081b29]
        p-8
        text-center
      ">

        <Users
          className="
            mx-auto
            mb-3
            text-slate-500
          "
          size={40}
        />


        <h3 className="
          font-semibold
          text-white
        ">

          Nenhuma permuta encontrada

        </h3>


        <p className="
          mt-2
          text-sm
          text-slate-500
        ">

          O sistema ainda não encontrou uma combinação compatível.

        </p>

      </div>

    );

  }


  /* ======================================================
     CICLOS
  ====================================================== */

  return (

    <div className="space-y-6">

      {
        ciclos
          .slice(0, 3)
          .map(
            (ciclo, index) => (

              <CicloCard
                key={ciclo.id}
                ciclo={ciclo}
                index={index}
                usuarioId={usuarioId}
              />

            )
          )
      }

    </div>

  );

}


/* ======================================================
   CARD DO CICLO
====================================================== */

function CicloCard({
  ciclo,
  index,
  usuarioId,
}: {
  ciclo: Ciclo;
  index: number;
  usuarioId: string;
}) {

  const router =
    useRouter();


  const [
    mostrarDetalhes,
    setMostrarDetalhes
  ] = useState(false);

const [
  propondo,
  setPropondo
] = useState(false);

  const medalha =

    index === 0

      ? "🥇"

      : index === 1

      ? "🥈"

      : "🥉";


  const titulo =

    index === 0

      ? "Melhor escolha"

      : index === 1

      ? "2ª melhor escolha"

      : "3ª melhor escolha";


  const participantes: Participante[] = [

    {

      numero: 1,

      participanteId:
        ciclo.participante_1,

      nome:
        ciclo.nome_1
        ||
        "Servidor TJSP",

      origem:
        ciclo.origem_nome_1
        ||
        "Não informado",

      origemCircunscricao:
        ciclo.origem_circunscricao_1
        ||
        "",

      origemRaj:
        ciclo.origem_raj_1
        ||
        "",

      destino:
        ciclo.destino_nome_1
        ||
        "Não informado",

      destinoCircunscricao:
        ciclo.destino_circunscricao_1
        ||
        "",

      destinoRaj:
        ciclo.destino_raj_1
        ||
        "",

    },


    {

      numero: 2,

      participanteId:
        ciclo.participante_2,

      nome:
        ciclo.nome_2
        ||
        "Servidor TJSP",

      origem:
        ciclo.origem_nome_2
        ||
        "Não informado",

      origemCircunscricao:
        ciclo.origem_circunscricao_2
        ||
        "",

      origemRaj:
        ciclo.origem_raj_2
        ||
        "",

      destino:
        ciclo.destino_nome_2
        ||
        "Não informado",

      destinoCircunscricao:
        ciclo.destino_circunscricao_2
        ||
        "",

      destinoRaj:
        ciclo.destino_raj_2
        ||
        "",

    },


    {

      numero: 3,

      participanteId:
        ciclo.participante_3,

      nome:
        ciclo.nome_3
        ||
        "Servidor TJSP",

      origem:
        ciclo.origem_nome_3
        ||
        "Não informado",

      origemCircunscricao:
        ciclo.origem_circunscricao_3
        ||
        "",

      origemRaj:
        ciclo.origem_raj_3
        ||
        "",

      destino:
        ciclo.destino_nome_3
        ||
        "Não informado",

      destinoCircunscricao:
        ciclo.destino_circunscricao_3
        ||
        "",

      destinoRaj:
        ciclo.destino_raj_3
        ||
        "",

    },

  ];


  /* =========================================
     COLOCA O USUÁRIO ATUAL PRIMEIRO
  ========================================= */

  const participantesOrdenados = [

    ...participantes.filter(

      (participante) =>

        participante.participanteId
        ===
        usuarioId

    ),


    ...participantes.filter(

      (participante) =>

        participante.participanteId
        !==
        usuarioId

    ),

  ].map(

    (
      participante,
      indexParticipante
    ) => ({

      ...participante,

      numero:
        indexParticipante + 1,

    })

  );

async function proporPermuta() {

  if (propondo) {
    return;
  }

  try {

    setPropondo(true);

    const {
      error
    } = await supabase.rpc(
      "solicitar_permuta_ciclo_3",
      {
        p_match_ciclo_id: ciclo.id,
        p_usuario_id: usuarioId
      }
    );

    if (error) {

      console.error(
        "Erro ao propor permuta em cadeia:",
        error
      );

      return;

    }

    window.dispatchEvent(
      new Event(
        "atualizar-notificacoes"
      )
    );

    router.push(
      "/propostas"
    );

  }

  catch(error) {

    console.error(
      "Erro inesperado ao propor permuta:",
      error
    );

  }

  finally {

    setPropondo(false);

  }

}

  return (

    <div className="
      overflow-hidden
      rounded-2xl
      border
      border-gray-200
      bg-[#081b29]
      shadow-sm
    ">


      {/* CABEÇALHO */}

      <div className="
        flex
        flex-wrap
        items-center
        justify-between
        gap-4
        border-b
        border-teal-300/10
        p-5
      ">


        <div className="
          flex
          items-center
          gap-3
        ">


          <div className="text-3xl">

            {medalha}

          </div>


          <div>

            <h3 className="
              text-xl
              font-bold
              text-white
            ">

              {titulo}

            </h3>


            <p className="
              mt-1
              text-sm
              text-slate-500
            ">

              Permuta em cadeia com 3 servidores

            </p>

          </div>

        </div>


        {/* PROPOR PERMUTA */}

<button
  type="button"

  disabled={
    propondo
  }

  onClick={
    proporPermuta
  }

  className="
    rounded-xl
    border
    border-teal-300/20
    bg-teal-600
    px-4
    py-2
    text-sm
    font-semibold
    text-white
    transition-all
    duration-200
    hover:-translate-y-[1px]
    hover:bg-teal-500
    disabled:cursor-not-allowed
    disabled:opacity-50
  "
>

  {
    propondo
      ? "Enviando..."
      : "Propor permuta"
  }

</button>

      </div>


      {/* CONTEÚDO */}

      <div className="
        grid
        gap-5
        p-5
        xl:grid-cols-[1.35fr_0.65fr]
      ">


        {/* SERVIDORES */}

        <div className="space-y-3">


          {
            participantesOrdenados.map(

              (
                participante,
                participanteIndex
              ) => (

                <div
                  key={
                    participante.participanteId
                  }
                >


                  <ServidorCard

                    numero={
                      participante.numero
                    }

                    nome={
                      participante.nome
                    }

                    voce={
                      participante.participanteId
                      ===
                      usuarioId
                    }

                    origem={
                      participante.origem
                    }

                    origemCircunscricao={
                      participante.origemCircunscricao
                    }

                    origemRaj={
                      participante.origemRaj
                    }

                    destino={
                      participante.destino
                    }

                    destinoCircunscricao={
                      participante.destinoCircunscricao
                    }

                    destinoRaj={
                      participante.destinoRaj
                    }

                  />


                  {
                    participanteIndex
                    <
                    participantesOrdenados.length - 1

                    && (

                      <ArrowDown
                        className="
                          mx-auto
                          my-3
                          text-teal-400
                        "
                        size={22}
                      />

                    )
                  }

                </div>

              )

            )
          }

        </div>


        {/* DIAGRAMA */}

        <FluxoCircular

          participantes={
            participantesOrdenados
          }

        />

      </div>


      {/* DETALHES */}

      <div className="
        border-t
        border-teal-300/10
        p-5
      ">


        <button
          type="button"
          onClick={() =>
            setMostrarDetalhes(
              !mostrarDetalhes
            )
          }
          className="
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-teal-300/15
            bg-[#081b29]
            px-4
            py-3
            font-semibold
            text-slate-300
            transition-all
            duration-200
            hover:-translate-y-[1px]
            hover:border-teal-300/25
            hover:bg-teal-400/[0.07]
            hover:text-teal-200
          "
        >


          <Eye size={19} />


          {
            mostrarDetalhes

              ? "Ocultar detalhes da permuta"

              : "Ver detalhes da permuta"
          }


          {
            mostrarDetalhes

              ? <ChevronUp size={18} />

              : <ChevronDown size={18} />
          }


        </button>


        {
          mostrarDetalhes && (

            <DetalhesPermuta

              participantes={
                participantesOrdenados
              }

            />

          )
        }


      </div>

    </div>

  );

}


/* ======================================================
   CARD SERVIDOR
====================================================== */

function ServidorCard({
  numero,
  nome,
  voce,
  origem,
  origemCircunscricao,
  origemRaj,
  destino,
  destinoCircunscricao,
  destinoRaj,
}: {
  numero: number;
  nome: string;
  voce: boolean;
  origem: string;
  origemCircunscricao: string;
  origemRaj: string;
  destino: string;
  destinoCircunscricao: string;
  destinoRaj: string;
}) {

  return (

    <div
      className={`
        rounded-2xl
        border
        p-5

        ${
          voce

            ? "border-teal-300/25 bg-teal-400/[0.08]"

            : "border-teal-300/10 bg-[#081b29]"
        }
      `}
    >


      <div className="
        mb-5
        flex
        items-center
        gap-3
      ">


        <Numero
          numero={numero}
        />


        <div className="
          flex
          flex-wrap
          items-center
          gap-2
        ">


          <div className="
            font-bold
            text-white
          ">

            {nome}

          </div>


          {
            voce && (

              <span className="
                rounded-full
                bg-blue-600
                px-2
                py-0.5
                text-xs
                font-bold
                text-white
              ">

                Você

              </span>

            )
          }


        </div>

      </div>


      <div className="
        grid
        items-center
        gap-4
        md:grid-cols-[1fr_auto_1fr]
      ">


        <Local

          titulo="Local atual"

          nome={origem}

          circunscricao={
            origemCircunscricao
          }

          raj={
            origemRaj
          }

        />


        <div className="hidden md:block">

          <ArrowRight
            size={24}
            className="text-teal-400"
          />

        </div>


        <div className="md:hidden">

          <ArrowDown
            size={20}
            className="
              mx-auto
              text-teal-400
            "
          />

        </div>


        <Local

          titulo="Deseja ir para"

          nome={destino}

          circunscricao={
            destinoCircunscricao
          }

          raj={
            destinoRaj
          }

          destino

        />


      </div>

    </div>

  );

}


/* ======================================================
   LOCAL
====================================================== */

function Local({
  titulo,
  nome,
  circunscricao,
  raj,
  destino = false,
}: {
  titulo: string;
  nome: string;
  circunscricao: string;
  raj: string;
  destino?: boolean;
}) {

  return (

    <div>


      <div
        className={`
          mb-2
          flex
          items-center
          gap-1.5
          text-xs
          font-bold
          uppercase
          tracking-wide

          ${
            destino

              ? "text-teal-300"

              : "text-slate-500"
          }
        `}
      >

        <MapPin size={14} />

        {titulo}

      </div>


      <div className="
        font-semibold
        leading-snug
        text-white
      ">

        {nome}

      </div>


      {
        circunscricao && (

          <div className="
            mt-2
            text-xs
            text-slate-500
          ">

            Circunscrição:{" "}
            {circunscricao}

          </div>

        )
      }


      {
        raj && (

          <div className="
            mt-1
            text-xs
            text-slate-500
          ">

            RAJ: {raj}

          </div>

        )
      }


    </div>

  );

}


/* ======================================================
   FLUXO CIRCULAR
====================================================== */

function FluxoCircular({
  participantes,
}: {
  participantes: Participante[];
}) {

  return (

    <div className="
      rounded-2xl
      border
      border-gray-200
      bg-[#081b29]
      p-5
    ">


      <div className="text-center">


        <h4 className="
          text-lg
          font-bold
          text-white
        ">

          Como fica a permuta

        </h4>


        <p className="
          mt-1
          text-sm
          text-slate-500
        ">

          Fluxo entre os 3 servidores

        </p>


      </div>


      {/* CÍRCULO */}

      <div className="
        relative
        mx-auto
        mt-7
        h-[260px]
        max-w-[320px]
      ">


        <svg
          className="
            absolute
            inset-0
            h-full
            w-full
          "
          viewBox="0 0 320 260"
        >


          <defs>

            <marker
              id="arrowCircle"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >

              <path
                d="M0,0 L0,6 L7,3 z"
                fill="#2dd4bf"
              />

            </marker>

          </defs>


          <path
            d="M175 45 C255 55 285 105 260 160"
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="2"
            markerEnd="url(#arrowCircle)"
          />


          <path
            d="M235 195 C190 240 125 240 80 195"
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="2"
            markerEnd="url(#arrowCircle)"
          />


          <path
            d="M60 160 C35 100 70 55 145 45"
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="2"
            markerEnd="url(#arrowCircle)"
          />


        </svg>


        <div className="
          absolute
          left-1/2
          top-3
          -translate-x-1/2
        ">

          <NumeroGrande
            numero={1}
          />

        </div>


        <div className="
          absolute
          bottom-7
          right-6
        ">

          <NumeroGrande
            numero={2}
          />

        </div>


        <div className="
          absolute
          bottom-7
          left-6
        ">

          <NumeroGrande
            numero={3}
          />

        </div>


      </div>


      {/* LEGENDA */}

      <div className="
        space-y-4
        rounded-xl
        border
        border-gray-200
        bg-[#081b29]
        p-4
      ">


        <LegendaFluxo
          numero={1}
          participante={
            participantes[0]
          }
        />


        <LegendaFluxo
          numero={2}
          participante={
            participantes[1]
          }
        />


        <LegendaFluxo
          numero={3}
          participante={
            participantes[2]
          }
        />


      </div>


    </div>

  );

}


/* ======================================================
   LEGENDA
====================================================== */

function LegendaFluxo({
  numero,
  participante,
}: {
  numero: number;
  participante: Participante;
}) {

  return (

    <div className="
      flex
      items-start
      gap-3
    ">


      <Numero
        numero={numero}
      />


      <div className="min-w-0">


        <div className="
          font-semibold
          text-white
        ">

          {participante.nome}

        </div>


        <div className="
          mt-1
          text-sm
          text-slate-500
        ">

          {participante.origem}

        </div>


        <div className="
          my-1
          flex
          items-center
          gap-1
          text-sm
          text-teal-300
        ">

          <ArrowRight size={14} />

          <span>
            {participante.destino}
          </span>

        </div>


      </div>


    </div>

  );

}


/* ======================================================
   DETALHES
====================================================== */

function DetalhesPermuta({
  participantes,
}: {
  participantes: Participante[];
}) {

  return (

    <div className="
      mt-4
      rounded-xl
      border
      border-teal-300/10
      bg-teal-400/[0.05]
      p-5
    ">


      <h4 className="
        font-bold
        text-white
      ">

        Como os servidores devem proceder

      </h4>


      <p className="
        mt-1
        text-sm
        text-slate-500
      ">

        A permuta em cadeia funciona quando cada participante
        solicita transferência para o destino indicado abaixo.

      </p>


      <div className="
        mt-5
        space-y-4
      ">


        {
          participantes.map(

            (participante) => (

              <div
                key={
                  participante.participanteId
                }
                className="
                  flex
                  items-start
                  gap-3
                  rounded-xl
                  border
                  border-gray-200
                  bg-[#081b29]
                  p-4
                "
              >


                <Numero
                  numero={
                    participante.numero
                  }
                />


                <div className="min-w-0">


                  <div className="
                    font-semibold
                    text-white
                  ">

                    {participante.nome}

                  </div>


                  <p className="
                    mt-2
                    text-sm
                    leading-relaxed
                    text-slate-300
                  ">


                    <span className="
                      font-medium
                      text-white
                    ">

                      {participante.nome}

                    </span>


                    {" "}deverá solicitar transferência de{" "}


                    <span className="
                      font-medium
                    ">

                      {participante.origem}

                    </span>


                    {" "}para{" "}


                    <span className="
                      font-semibold
                      text-teal-300
                    ">

                      {participante.destino}

                    </span>.


                  </p>


                  <div className="
                    mt-3
                    flex
                    flex-wrap
                    items-center
                    gap-2
                    text-sm
                  ">


                    <span className="
                      rounded-lg
                      bg-[#081b29]/[0.05]
                      px-3
                      py-1.5
                      text-slate-300
                    ">

                      {participante.origem}

                    </span>


                    <ArrowRight
                      size={16}
                      className="text-teal-400"
                    />


                    <span className="
                      rounded-lg
                      bg-teal-400/[0.07]
                      px-3
                      py-1.5
                      font-medium
                      text-teal-300
                    ">

                      {participante.destino}

                    </span>


                  </div>


                </div>


              </div>

            )

          )
        }


      </div>


      <div className="
        mt-5
        rounded-xl
        border
        border-teal-300/10
        bg-[#081b29]
        p-4
      ">


        <div className="
          font-semibold
          text-white
        ">

          Exemplo do funcionamento

        </div>


        <p className="
          mt-2
          text-sm
          leading-relaxed
          text-slate-300
        ">

          Cada servidor solicita sua transferência para o local
          indicado pelo sistema. Quando os três movimentos são
          realizados, o ciclo é fechado e todos conseguem chegar
          a um dos destinos desejados.

        </p>


      </div>


    </div>

  );

}


/* ======================================================
   NÚMERO PEQUENO
====================================================== */

function Numero({
  numero
}: {
  numero: number;
}) {

  return (

    <div
      className={`
        flex
        h-8
        w-8
        shrink-0
        items-center
        justify-center
        rounded-full
        text-sm
        font-bold
        text-white

        ${
          numero === 1

            ? "bg-blue-600"

            : numero === 2

            ? "bg-green-600"

            : "bg-purple-600"
        }
      `}
    >

      {numero}

    </div>

  );

}


/* ======================================================
   NÚMERO GRANDE
====================================================== */

function NumeroGrande({
  numero
}: {
  numero: number;
}) {

  return (

    <div
      className={`
        flex
        h-14
        w-14
        items-center
        justify-center
        rounded-full
        border-4
        border-[#0a1f2f]
        text-xl
        font-bold
        text-white
        shadow-md

        ${
          numero === 1

            ? "bg-blue-600"

            : numero === 2

            ? "bg-green-600"

            : "bg-purple-600"
        }
      `}
    >

      {numero}

    </div>

  );

}