"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  AlertCircle,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  FileText,
  LoaderCircle,
  MapPinned,
  Search,
  Star,
  UserRound,
  X
} from "lucide-react";

import {
  AuthGuard
} from "@/components/auth/AuthGuard";

import {
  DashboardLayout
} from "@/components/layout/DashboardLayout";

import {
  Card
} from "@/components/ui/Card";

import {
  supabase
} from "@/lib/supabase";


/* ======================================================
   TIPOS
====================================================== */

type Perfil = {
  id: string;
  nome: string | null;
  email: string | null;
  cargo: string | null;
  comarca_atual_id: number | null;
  telefone: string | null;
  mostrar_telefone: boolean | null;
  updated_at: string | null;
  em_match: boolean | null;
  busca_pausada: boolean | null;
};


type Comarca = {
  id: number;
  nome: string;
};


type PreferenciaComarca = {
  comarca_destino_id: number;
  prioridade: number;
};


type ItemProgresso = {
  id: string;
  rotulo: string;
  concluido: boolean;
  peso: number;
};


type SolicitacaoResumo = {
  id: string;
  status: string;
};


type AvaliacaoPendente = {
  historico_id: string;
  solicitacao_id: string;
  tipo: string;
  concluida_em: string;
};


/* ======================================================
   FORMATAR DATA
====================================================== */

function formatarData(
  data: string | null
) {

  if (!data) {
    return "Ainda não informada";
  }


  const dataConvertida =
    new Date(data);


  if (
    Number.isNaN(
      dataConvertida.getTime()
    )
  ) {

    return "Ainda não informada";

  }


  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "long",
      timeStyle: "short"
    }
  ).format(
    dataConvertida
  );

}


/* ======================================================
   DASHBOARD
====================================================== */

export default function DashboardPage() {

  const [
    perfil,
    setPerfil
  ] = useState<Perfil | null>(
    null
  );


  const [
    comarcaAtual,
    setComarcaAtual
  ] = useState<Comarca | null>(
    null
  );


  const [
    destinos,
    setDestinos
  ] = useState<Comarca[]>([]);


  const [
    oportunidadesDiretas,
    setOportunidadesDiretas
  ] = useState(0);


  const [
    oportunidadesCiclos,
    setOportunidadesCiclos
  ] = useState(0);


  const [
    propostasAguardando,
    setPropostasAguardando
  ] = useState(0);


  const [
    propostasConfirmadas,
    setPropostasConfirmadas
  ] = useState(0);


  const [
    carregandoDados,
    setCarregandoDados
  ] = useState(true);


  const [
    erro,
    setErro
  ] = useState("");


  const [
    avaliacoesPendentes,
    setAvaliacoesPendentes
  ] = useState<AvaliacaoPendente[]>([]);


  const [
    modalAvaliacaoAberto,
    setModalAvaliacaoAberto
  ] = useState(false);


  const [
    notaAvaliacao,
    setNotaAvaliacao
  ] = useState(0);


  const [
    recomendaria,
    setRecomendaria
  ] = useState<boolean | null>(
    null
  );


  const [
    comentarioAvaliacao,
    setComentarioAvaliacao
  ] = useState("");


  const [
    autorizaDepoimento,
    setAutorizaDepoimento
  ] = useState(false);


  const [
    enviandoAvaliacao,
    setEnviandoAvaliacao
  ] = useState(false);


  const [
    erroAvaliacao,
    setErroAvaliacao
  ] = useState("");


  const [
    mensagemAvaliacao,
    setMensagemAvaliacao
  ] = useState("");


  /* ======================================================
     CARREGAMENTO DOS DADOS
  ====================================================== */

  useEffect(() => {

    let componenteAtivo = true;


    async function carregarDados() {

      setCarregandoDados(true);

      setErro("");


      try {

        /*
        ========================================
        SESSÃO
        ========================================
        */

        const {
          data: dadosSessao
        } = await supabase.auth.getSession();


        const usuario =
          dadosSessao.session?.user;


        if (!usuario) {

          if (componenteAtivo) {
            setCarregandoDados(false);
          }

          return;

        }


        const usuarioId =
          usuario.id;


        /*
        ========================================
        PERFIL
        ========================================
        */

        const {
          data: dadosPerfil,
          error: erroPerfil
        } = await supabase
          .from("perfis")
          .select(`
            id,
            nome,
            email,
            cargo,
            comarca_atual_id,
            telefone,
            mostrar_telefone,
            updated_at,
            em_match,
            busca_pausada
          `)
          .eq(
            "id",
            usuarioId
          )
          .maybeSingle();


        if (erroPerfil) {

          throw new Error(
            `Não foi possível carregar seu perfil: ${erroPerfil.message}`
          );

        }


        if (!dadosPerfil) {

          throw new Error(
            "Seu perfil ainda não foi encontrado. Complete ou revise seu cadastro."
          );

        }


        const perfilEncontrado =
          dadosPerfil as Perfil;


        /*
        ========================================
        PREFERÊNCIAS
        ========================================
        */

        const {
          data: preferencias,
          error: erroPreferencias
        } = await supabase
          .from(
            "preferencias_movimentacao"
          )
          .select(`
            comarca_destino_id,
            prioridade
          `)
          .eq(
            "perfil_id",
            usuarioId
          )
          .eq(
            "ativo",
            true
          )
          .order(
            "prioridade",
            {
              ascending: true
            }
          );


        if (erroPreferencias) {

          throw new Error(
            `Erro ao carregar preferências: ${erroPreferencias.message}`
          );

        }


        /*
        ========================================
        COMARCA ATUAL
        ========================================
        */

        let comarcaEncontrada:
          Comarca | null = null;


        if (
          perfilEncontrado.comarca_atual_id
        ) {

          const {
            data: dadosComarca,
            error: erroComarca
          } = await supabase
            .from("comarcas_tjsp")
            .select(
              "id, nome"
            )
            .eq(
              "id",
              perfilEncontrado.comarca_atual_id
            )
            .maybeSingle();


          if (erroComarca) {

            throw new Error(
              `Não foi possível carregar sua comarca atual: ${erroComarca.message}`
            );

          }


          comarcaEncontrada =
            dadosComarca
              ? dadosComarca as Comarca
              : null;

        }


        /*
        ========================================
        DESTINOS
        ========================================
        */

        const listaPreferencias =
          (
            preferencias ?? []
          ) as PreferenciaComarca[];


        const idsDestinos =
          listaPreferencias.map(
            pref =>
              pref.comarca_destino_id
          );


        let destinosEncontrados:
          Comarca[] = [];


        if (
          idsDestinos.length > 0
        ) {

          const {
            data: dadosDestinos,
            error: erroDestinos
          } = await supabase
            .from("comarcas_tjsp")
            .select(
              "id, nome"
            )
            .in(
              "id",
              idsDestinos
            );


          if (erroDestinos) {

            throw new Error(
              `Não foi possível carregar suas comarcas desejadas: ${erroDestinos.message}`
            );

          }


          const mapaDestinos =
            new Map<number, Comarca>();


          (
            (
              dadosDestinos ?? []
            ) as Comarca[]
          ).forEach(
            comarca => {

              mapaDestinos.set(
                comarca.id,
                comarca
              );

            }
          );


          destinosEncontrados =
            idsDestinos
              .map(
                id =>
                  mapaDestinos.get(id)
              )
              .filter(
                (
                  comarca
                ): comarca is Comarca =>
                  Boolean(comarca)
              );

        }


        /*
        ========================================
        OPORTUNIDADES DIRETAS
        ========================================
        */

        const {
          data: diretas,
          error: erroDiretas
        } = await supabase.rpc(
          "buscar_candidatos_permuta",
          {
            p_perfil_id:
              usuarioId
          }
        );


        if (erroDiretas) {

          console.error(
            "Erro ao carregar oportunidades diretas:",
            erroDiretas
          );

        }


        /*
        ========================================
        CICLOS
        ========================================
        */

        const {
          data: ciclos,
          error: erroCiclos
        } = await supabase.rpc(
          "buscar_melhores_ciclos_usuario_v2",
          {
            p_perfil_id:
              usuarioId
          }
        );


        if (erroCiclos) {

          console.error(
            "Erro ao carregar ciclos:",
            erroCiclos
          );

        }


        /*
        ========================================
        PROPOSTAS
        ========================================
        */

        const {
          data: solicitacoes,
          error: erroSolicitacoes
        } = await supabase
          .from(
            "solicitacoes_permuta"
          )
          .select(
            "id, status"
          )
          .or(
            `participante_1.eq.${usuarioId},participante_2.eq.${usuarioId},participante_3.eq.${usuarioId}`
          )
          .in(
            "status",
            [
              "aguardando_aceite",
              "confirmado"
            ]
          );


        if (erroSolicitacoes) {

          console.error(
            "Erro ao carregar propostas:",
            erroSolicitacoes
          );

        }


        /*
        ========================================
        AVALIAÇÕES PENDENTES
        ========================================
        */

        const {
          data: avaliacoesPendentesBanco,
          error: erroAvaliacoesPendentes
        } = await supabase.rpc(
          "buscar_avaliacoes_pendentes",
          {
            p_usuario_id:
              usuarioId
          }
        );


        if (
          erroAvaliacoesPendentes
        ) {

          console.error(
            "Erro ao carregar avaliações pendentes:",
            erroAvaliacoesPendentes
          );

        }


        /*
        ========================================
        SALVAR ESTADOS
        ========================================
        */

        if (
          !componenteAtivo
        ) {

          return;

        }


        setPerfil(
          perfilEncontrado
        );


        setComarcaAtual(
          comarcaEncontrada
        );


        setDestinos(
          destinosEncontrados
        );


        /*
        ========================================
        NO MÁXIMO 3 DIRETAS
        ========================================
        */

        setOportunidadesDiretas(

          Boolean(
            perfilEncontrado.busca_pausada
          )

            ? 0

            : Array.isArray(
                diretas
              )

              ? Math.min(
                  diretas.length,
                  3
                )

              : 0

        );


        /*
        ========================================
        NO MÁXIMO 3 CICLOS
        ========================================
        */

        setOportunidadesCiclos(

          Boolean(
            perfilEncontrado.busca_pausada
          )

            ? 0

            : Array.isArray(
                ciclos
              )

              ? Math.min(
                  ciclos.length,
                  3
                )

              : 0

        );


        /*
        ========================================
        SEPARA PROPOSTAS
        ========================================
        */

        const listaSolicitacoes =
          (
            Array.isArray(
              solicitacoes
            )

              ? solicitacoes

              : []
          ) as SolicitacaoResumo[];


        setPropostasAguardando(

          listaSolicitacoes.filter(
            proposta =>
              proposta.status ===
              "aguardando_aceite"
          ).length

        );


        setPropostasConfirmadas(

          listaSolicitacoes.filter(
            proposta =>
              proposta.status ===
              "confirmado"
          ).length

        );


      setAvaliacoesPendentes(
  Array.isArray(avaliacoesPendentesBanco)
    ? (avaliacoesPendentesBanco as AvaliacaoPendente[])
    : []
);

      }

      catch (
        erroCarregamento
      ) {

        if (
          !componenteAtivo
        ) {

          return;

        }


        const mensagemErro =

          erroCarregamento
            instanceof Error

            ? erroCarregamento.message

            : "Ocorreu um erro inesperado ao carregar o Dashboard.";


        setErro(
          mensagemErro
        );

      }

      finally {

        if (
          componenteAtivo
        ) {

          setCarregandoDados(
            false
          );

        }

      }

    }


    carregarDados();


    return () => {

      componenteAtivo =
        false;

    };

  }, []);


  /* ======================================================
     ABRIR AVALIAÇÃO
  ====================================================== */

  function abrirAvaliacao() {

    setNotaAvaliacao(0);

    setRecomendaria(null);

    setComentarioAvaliacao("");

    setAutorizaDepoimento(false);

    setErroAvaliacao("");

    setModalAvaliacaoAberto(true);

  }


  /* ======================================================
     ENVIAR AVALIAÇÃO
  ====================================================== */

  async function enviarAvaliacao() {

    const avaliacaoAtual =
      avaliacoesPendentes[0];


    if (
      !perfil ||
      !avaliacaoAtual
    ) {

      return;

    }


    if (
      enviandoAvaliacao
    ) {

      return;

    }


    if (
      notaAvaliacao < 1 ||
      notaAvaliacao > 5
    ) {

      setErroAvaliacao(
        "Selecione uma nota de 1 a 5 estrelas."
      );

      return;

    }


    if (
      recomendaria === null
    ) {

      setErroAvaliacao(
        "Informe se você recomendaria a plataforma."
      );

      return;

    }


    setErroAvaliacao("");

    setEnviandoAvaliacao(true);


    try {

      const {
        error
      } = await supabase.rpc(
        "avaliar_permuta",
        {
          p_historico_id:
            avaliacaoAtual.historico_id,

          p_usuario_id:
            perfil.id,

          p_nota:
            notaAvaliacao,

          p_recomendaria:
            recomendaria,

          p_comentario:
            comentarioAvaliacao.trim()
              ? comentarioAvaliacao.trim()
              : null,

          p_autoriza_depoimento:
            autorizaDepoimento
        }
      );


      if (error) {
        throw error;
      }


      setAvaliacoesPendentes(
        atuais =>
          atuais.filter(
            item =>
              item.historico_id !==
              avaliacaoAtual.historico_id
          )
      );


      setModalAvaliacaoAberto(false);

      setMensagemAvaliacao(
        avaliacoesPendentes.length > 1
          ? "Obrigado pela avaliação! Você ainda possui outra permuta concluída aguardando avaliação."
          : "Obrigado pela avaliação! Sua opinião ajuda a melhorar a Permuta TJSP."
      );


      setNotaAvaliacao(0);

      setRecomendaria(null);

      setComentarioAvaliacao("");

      setAutorizaDepoimento(false);

    }

    catch (
      erroEnvio
    ) {

      const mensagem =
        erroEnvio instanceof Error
          ? erroEnvio.message
          : "Não foi possível enviar sua avaliação.";


      setErroAvaliacao(
        mensagem
      );

    }

    finally {

      setEnviandoAvaliacao(
        false
      );

    }

  }


  /* ======================================================
     DADOS DERIVADOS
  ====================================================== */

  const primeiroNome =

    perfil
      ?.nome
      ?.trim()
      .split(/\s+/)[0]

    || "Servidor";


  const itensProgresso =
    useMemo<ItemProgresso[]>(
      () => [

        {
          id: "nome",
          rotulo: "Nome completo",
          concluido:
            Boolean(
              perfil?.nome?.trim()
            ),
          peso: 15
        },

        {
          id: "email",
          rotulo:
            "E-mail de contato",
          concluido:
            Boolean(
              perfil?.email?.trim()
            ),
          peso: 15
        },

        {
          id: "cargo",
          rotulo: "Cargo",
          concluido:
            Boolean(
              perfil?.cargo?.trim()
            ),
          peso: 20
        },

        {
          id: "comarca-atual",
          rotulo:
            "Comarca atual",
          concluido:
            Boolean(
              perfil?.comarca_atual_id
            ),
          peso: 25
        },

        {
          id:
            "comarcas-desejadas",
          rotulo:
            "Ao menos uma comarca desejada",
          concluido:
            destinos.length > 0,
          peso: 20
        },

        {
          id: "telefone",
          rotulo:
            "Telefone ou WhatsApp",
          concluido:
            Boolean(
              perfil?.telefone?.trim()
            ),
          peso: 5
        }

      ],

      [
        perfil,
        destinos
      ]
    );


  const percentualPerfil =
    useMemo(
      () =>

        itensProgresso.reduce(
          (
            total,
            item
          ) =>

            item.concluido
              ? total + item.peso
              : total,

          0
        ),

      [
        itensProgresso
      ]
    );


  const itensPendentes =
    useMemo(
      () =>

        itensProgresso.filter(
          item =>
            !item.concluido
        ),

      [
        itensProgresso
      ]
    );


  const perfilCompleto =
    percentualPerfil === 100;


  const totalOportunidades =
    oportunidadesDiretas
    +
    oportunidadesCiclos;


  const emPermuta =
    Boolean(
      perfil?.em_match
    );


  const buscaPausada =
    !emPermuta &&
    Boolean(
      perfil?.busca_pausada
    );


  /* ======================================================
     RENDER
  ====================================================== */

  return (

    <AuthGuard>

      <DashboardLayout
        nomeUsuario={
          primeiroNome
        }
      >

        {
          carregandoDados

          ? (

            <div className="
              flex
              min-h-[60vh]
              items-center
              justify-center
            ">

              <div className="
                flex
                flex-col
                items-center
                text-center
              ">

                <LoaderCircle
                  aria-hidden="true"
                  className="
                    h-9
                    w-9
                    animate-spin
                    text-blue-900
                  "
                  strokeWidth={1.8}
                />


                <p className="
                  mt-4
                  text-sm
                  font-semibold
                  text-slate-700
                ">

                  Carregando seu painel...

                </p>


                <p className="
                  mt-1
                  text-xs
                  text-slate-500
                ">

                  Estamos buscando os dados da sua conta.

                </p>

              </div>

            </div>

          )

          : erro

          ? (

            <div className="
              mx-auto
              max-w-2xl
            ">

              <div
                role="alert"
                className="
                  rounded-2xl
                  border
                  border-red-200
                  bg-red-50
                  p-6
                "
              >

                <div className="
                  flex
                  items-start
                  gap-4
                ">

                  <div className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-red-100
                    text-red-700
                  ">

                    <AlertCircle
                      aria-hidden="true"
                      className="
                        h-6
                        w-6
                      "
                      strokeWidth={1.8}
                    />

                  </div>


                  <div>

                    <h1 className="
                      text-lg
                      font-bold
                      text-red-950
                    ">

                      Não foi possível carregar o painel

                    </h1>


                    <p className="
                      mt-2
                      text-sm
                      leading-6
                      text-red-800
                    ">

                      {erro}

                    </p>

                  </div>

                </div>

              </div>

            </div>

          )

          : (

            <div className="
              space-y-6
            ">


              {/* =================================================
                  VISÃO GERAL
              ================================================= */}

              <section className="
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-sm
              ">

                <div className="
                  grid
                  gap-6
                  p-6
                  sm:p-8
                  lg:grid-cols-[1fr_auto]
                  lg:items-center
                ">


                  <div>

                    <p className="
                      text-sm
                      font-semibold
                      text-blue-900
                    ">

                      Visão geral

                    </p>


                    <h1 className="
                      mt-1
                      text-3xl
                      font-bold
                      tracking-tight
                      text-slate-900
                    ">

                      Olá, {primeiroNome} 👋

                    </h1>


                    <p className="
                      mt-2
                      max-w-2xl
                      text-slate-600
                    ">

                      Acompanhe seu perfil, suas preferências, propostas e oportunidades de permuta.

                    </p>


                    {
                      emPermuta

                      ? (

                        <div className="
                          mt-5
                          inline-flex
                          items-center
                          gap-3
                          rounded-xl
                          border
                          border-blue-200
                          bg-blue-50
                          px-4
                          py-3
                        ">

                          <div className="
                            h-3
                            w-3
                            rounded-full
                            bg-blue-700
                          " />


                          <div>

                            <p className="
                              text-sm
                              font-bold
                              text-blue-900
                            ">

                              Em permuta

                            </p>


                            <p className="
                              text-xs
                              text-blue-800
                            ">

                              Você está participando de uma permuta confirmada.

                            </p>

                          </div>

                        </div>

                      )

                      : buscaPausada

                      ? (

                        <div className="
                          mt-5
                          inline-flex
                          items-center
                          gap-3
                          rounded-xl
                          border
                          border-amber-200
                          bg-amber-50
                          px-4
                          py-3
                        ">

                          <div className="
                            h-3
                            w-3
                            rounded-full
                            bg-amber-600
                          " />


                          <div>

                            <p className="
                              text-sm
                              font-bold
                              text-amber-900
                            ">

                              Busca pausada

                            </p>


                            <p className="
                              text-xs
                              text-amber-800
                            ">

                              Seu perfil está temporariamente fora das novas oportunidades de permuta.

                            </p>

                          </div>

                        </div>

                      )

                      : (

                        <div className="
                          mt-5
                          inline-flex
                          items-center
                          gap-3
                          rounded-xl
                          border
                          border-green-200
                          bg-green-50
                          px-4
                          py-3
                        ">

                          <div className="
                            h-3
                            w-3
                            rounded-full
                            bg-green-600
                          " />


                          <div>

                            <p className="
                              text-sm
                              font-bold
                              text-green-800
                            ">

                              Perfil disponível

                            </p>


                            <p className="
                              text-xs
                              text-green-700
                            ">

                              Você está participando das buscas por permuta.

                            </p>

                          </div>

                        </div>

                      )
                    }


                    <div className="
                      mt-4
                      flex
                      flex-wrap
                      gap-2
                    ">

                      <span className="
                        rounded-full
                        bg-slate-100
                        px-3
                        py-1.5
                        text-xs
                        font-semibold
                        text-slate-700
                      ">

                        {
                          perfil?.cargo
                          ||
                          "Cargo não informado"
                        }

                      </span>


                      <span className="
                        rounded-full
                        bg-blue-50
                        px-3
                        py-1.5
                        text-xs
                        font-semibold
                        text-blue-900
                      ">

                        {
                          comarcaAtual?.nome
                          ||
                          "Comarca não informada"
                        }

                      </span>

                    </div>

                  </div>


                  <Link
                    href="/perfil"
                    className="
                      inline-flex
                      min-h-11
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-blue-900
                      px-5
                      py-3
                      text-sm
                      font-semibold
                      !text-white
                      transition
                      hover:bg-blue-800
                      hover:!text-white
                    "
                  >

                    Editar perfil

                    <ArrowRight
                      aria-hidden="true"
                      className="
                        h-4
                        w-4
                      "
                      strokeWidth={2}
                    />

                  </Link>

                </div>

              </section>


              {/* =================================================
                  AVALIAÇÃO PENDENTE
              ================================================= */}

              {
                mensagemAvaliacao && (

                  <div className="
                    rounded-2xl
                    border
                    border-green-200
                    bg-green-50
                    p-5
                    text-sm
                    font-medium
                    text-green-800
                  ">

                    {mensagemAvaliacao}

                  </div>

                )
              }


              {
                avaliacoesPendentes.length > 0 && (

                  <section className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-amber-200
                    bg-white
                    shadow-sm
                  ">

                    <div className="
                      flex
                      flex-col
                      gap-5
                      bg-amber-50/70
                      p-6
                      sm:flex-row
                      sm:items-center
                      sm:justify-between
                    ">

                      <div className="
                        flex
                        items-start
                        gap-4
                      ">

                        <div className="
                          flex
                          h-12
                          w-12
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-amber-100
                          text-amber-700
                        ">

                          <Star
                            className="
                              h-6
                              w-6
                            "
                            strokeWidth={1.8}
                          />

                        </div>


                        <div>

                          <p className="
                            text-sm
                            font-semibold
                            text-amber-800
                          ">

                            Permuta concluída

                          </p>


                          <h2 className="
                            mt-1
                            text-xl
                            font-bold
                            text-slate-900
                          ">

                            Como foi sua experiência?

                          </h2>


                          <p className="
                            mt-2
                            max-w-2xl
                            text-sm
                            leading-6
                            text-slate-600
                          ">

                            {
                              avaliacoesPendentes.length === 1
                                ? "Você possui uma permuta concluída aguardando avaliação."
                                : `Você possui ${avaliacoesPendentes.length} permutas concluídas aguardando avaliação.`
                            }

                          </p>

                        </div>

                      </div>


                      <button
                        type="button"
                        onClick={
                          abrirAvaliacao
                        }
                        className="
                          inline-flex
                          min-h-11
                          shrink-0
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-amber-600
                          px-5
                          py-3
                          text-sm
                          font-semibold
                          text-white
                          transition
                          hover:bg-amber-700
                        "
                      >

                        <Star
                          className="
                            h-4
                            w-4
                          "
                          strokeWidth={2}
                        />

                        Avaliar agora

                      </button>

                    </div>

                  </section>

                )
              }


              {/* =================================================
                  CARDS
              ================================================= */}

              <div className="
                grid
                gap-5
                md:grid-cols-2
                xl:grid-cols-4
              ">


                {/* PERFIL */}

                <Card>

                  <div className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  ">

                    <div>

                      <p className="
                        text-sm
                        font-semibold
                        text-slate-600
                      ">

                        Perfil

                      </p>


                      <p className="
                        mt-4
                        text-3xl
                        font-bold
                        text-blue-900
                      ">

                        {percentualPerfil}%

                      </p>

                    </div>


                    <div className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-blue-50
                      text-blue-900
                    ">

                      <UserRound
                        className="
                          h-5
                          w-5
                        "
                      />

                    </div>

                  </div>


                  <div className="
                    mt-4
                    h-2
                    overflow-hidden
                    rounded-full
                    bg-slate-200
                  ">

                    <div
                      className="
                        h-full
                        rounded-full
                        bg-blue-900
                      "
                      style={{
                        width:
                          `${percentualPerfil}%`
                      }}
                    />

                  </div>


                  <p className="
                    mt-3
                    text-sm
                    text-slate-500
                  ">

                    {
                      perfilCompleto

                      ? "Seu perfil está completo."

                      : `${itensPendentes.length} ${
                          itensPendentes.length === 1
                            ? "item pendente"
                            : "itens pendentes"
                        }.`
                    }

                  </p>

                </Card>


                {/* COMARCAS */}

                <Card>

                  <div className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  ">

                    <div>

                      <p className="
                        text-sm
                        font-semibold
                        text-slate-600
                      ">

                        Comarcas desejadas

                      </p>


                      <p className="
                        mt-4
                        text-3xl
                        font-bold
                        text-blue-900
                      ">

                        {destinos.length}

                      </p>

                    </div>


                    <div className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-blue-50
                      text-blue-900
                    ">

                      <MapPinned
                        className="
                          h-5
                          w-5
                        "
                      />

                    </div>

                  </div>


                  <p className="
                    mt-3
                    text-sm
                    text-slate-500
                  ">

                    Destinos cadastrados em ordem de prioridade.

                  </p>

                </Card>


                {/* OPORTUNIDADES */}

                <Card>

                  <div className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  ">

                    <div className="
                      w-full
                    ">

                      <p className="
                        text-sm
                        font-semibold
                        text-slate-600
                      ">

                        Oportunidades

                      </p>


                      <div className="
                        mt-4
                        space-y-2
                      ">


                        <div className="
                          flex
                          items-center
                          justify-between
                          gap-4
                        ">

                          <span className="
                            text-sm
                            text-slate-600
                          ">

                            Diretas

                          </span>


                          <span className="
                            text-xl
                            font-bold
                            text-blue-900
                          ">

                            {
                              oportunidadesDiretas
                            }

                          </span>

                        </div>


                        <div className="
                          flex
                          items-center
                          justify-between
                          gap-4
                        ">

                          <span className="
                            text-sm
                            text-slate-600
                          ">

                            Ciclos

                          </span>


                          <span className="
                            text-xl
                            font-bold
                            text-blue-900
                          ">

                            {
                              oportunidadesCiclos
                            }

                          </span>

                        </div>


                      </div>

                    </div>


                    <div className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-blue-50
                      text-blue-900
                    ">

                      <Search
                        className="
                          h-5
                          w-5
                        "
                      />

                    </div>

                  </div>


                  <p className="
                    mt-3
                    text-sm
                    text-slate-500
                  ">

                    {
                      totalOportunidades > 0

                      ? `${totalOportunidades} ${
                          totalOportunidades === 1
                            ? "oportunidade em destaque"
                            : "oportunidades em destaque"
                        }.`

                      : "Nenhuma oportunidade encontrada no momento."
                    }

                  </p>

                </Card>


                {/* PROPOSTAS */}

                <Card>

                  <div className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  ">

                    <div className="
                      w-full
                    ">

                      <p className="
                        text-sm
                        font-semibold
                        text-slate-600
                      ">

                        Propostas

                      </p>


                      <div className="
                        mt-4
                        space-y-2
                      ">


                        <div className="
                          flex
                          items-center
                          justify-between
                          gap-4
                        ">

                          <span className="
                            text-sm
                            text-slate-600
                          ">

                            Confirmadas

                          </span>


                          <span className="
                            text-xl
                            font-bold
                            text-green-700
                          ">

                            {
                              propostasConfirmadas
                            }

                          </span>

                        </div>


                        <div className="
                          flex
                          items-center
                          justify-between
                          gap-4
                        ">

                          <span className="
                            text-sm
                            text-slate-600
                          ">

                            Aguardando aceite

                          </span>


                          <span className="
                            text-xl
                            font-bold
                            text-amber-700
                          ">

                            {
                              propostasAguardando
                            }

                          </span>

                        </div>


                      </div>

                    </div>


                    <div className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-blue-50
                      text-blue-900
                    ">

                      <FileText
                        className="
                          h-5
                          w-5
                        "
                      />

                    </div>

                  </div>


                  <p className="
                    mt-3
                    text-sm
                    text-slate-500
                  ">

                    {
                      propostasConfirmadas > 0

                      ? "Você possui uma permuta confirmada."

                      : propostasAguardando > 0

                      ? `${propostasAguardando} ${
                          propostasAguardando === 1
                            ? "proposta aguardando resposta."
                            : "propostas aguardando resposta."
                        }`

                      : "Nenhuma proposta ativa no momento."
                    }

                  </p>

                </Card>


              </div>


              {/* =================================================
                  PROGRESSO + PRÓXIMOS PASSOS
              ================================================= */}

              <div className="
                grid
                gap-6
                xl:grid-cols-[1.35fr_0.65fr]
              ">


                <Card>

                  <div>

                    <h2 className="
                      text-xl
                      font-bold
                      text-slate-900
                    ">

                      Progresso do perfil

                    </h2>


                    <p className="
                      mt-1
                      text-sm
                      text-slate-500
                    ">

                      Complete as informações usadas para encontrar oportunidades compatíveis.

                    </p>

                  </div>


                  <div className="
                    mt-6
                    space-y-3
                  ">

                    {
                      itensProgresso.map(
                        item => (

                          <div
                            key={
                              item.id
                            }
                            className="
                              flex
                              items-center
                              justify-between
                              gap-4
                              rounded-xl
                              border
                              border-slate-200
                              bg-slate-50
                              p-4
                            "
                          >

                            <div className="
                              flex
                              items-center
                              gap-3
                            ">

                              <div
                                className={`
                                  flex
                                  h-8
                                  w-8
                                  items-center
                                  justify-center
                                  rounded-full

                                  ${
                                    item.concluido

                                      ? "bg-green-100 text-green-700"

                                      : "bg-slate-200 text-slate-500"
                                  }
                                `}
                              >

                                <CheckCircle2
                                  className="
                                    h-4
                                    w-4
                                  "
                                />

                              </div>


                              <p className="
                                text-sm
                                font-semibold
                                text-slate-800
                              ">

                                {item.rotulo}

                              </p>

                            </div>


                            <span className="
                              text-xs
                              font-bold
                              text-slate-500
                            ">

                              {item.peso}%

                            </span>

                          </div>

                        )
                      )
                    }

                  </div>

                </Card>


                <div className="
                  space-y-6
                ">


                  {/* PRÓXIMOS PASSOS */}

                  <Card>

                    <div className="
                      flex
                      items-start
                      justify-between
                      gap-4
                    ">

                      <div>

                        <h2 className="
                          text-xl
                          font-bold
                          text-slate-900
                        ">

                          Próximos passos

                        </h2>


                        <p className="
                          mt-1
                          text-sm
                          text-slate-500
                        ">

                          Acompanhe sua movimentação na plataforma.

                        </p>

                      </div>


                      <Bell
                        className="
                          h-5
                          w-5
                          text-slate-400
                        "
                      />

                    </div>


                    <div className="
                      mt-5
                      space-y-4
                    ">


                      <div className="
                        flex
                        gap-3
                      ">

                        <CheckCircle2
                          className="
                            mt-0.5
                            h-5
                            w-5
                            shrink-0
                            text-green-600
                          "
                        />


                        <div>

                          <p className="
                            text-sm
                            font-semibold
                            text-slate-800
                          ">

                            Cadastro concluído

                          </p>


                          <p className="
                            mt-1
                            text-xs
                            leading-5
                            text-slate-500
                          ">

                            Seus dados básicos já estão registrados.

                          </p>

                        </div>

                      </div>


                      {
                        emPermuta

                        ? (

                          <div className="
                            flex
                            gap-3
                          ">

                            <CheckCircle2
                              className="
                                mt-0.5
                                h-5
                                w-5
                                shrink-0
                                text-blue-700
                              "
                            />


                            <div>

                              <p className="
                                text-sm
                                font-semibold
                                text-slate-800
                              ">

                                Permuta confirmada

                              </p>


                              <p className="
                                mt-1
                                text-xs
                                leading-5
                                text-slate-500
                              ">

                                Consulte a página de propostas e notificações para acompanhar sua permuta.

                              </p>

                            </div>

                          </div>

                        )

                        : buscaPausada

                        ? (

                          <div className="
                            flex
                            gap-3
                          ">

                            <div className="
                              mt-1
                              h-3
                              w-3
                              shrink-0
                              rounded-full
                              border-2
                              border-amber-600
                              bg-white
                            " />


                            <div>

                              <p className="
                                text-sm
                                font-semibold
                                text-slate-800
                              ">

                                Busca pausada

                              </p>


                              <p className="
                                mt-1
                                text-xs
                                leading-5
                                text-slate-500
                              ">

                                Reative sua busca em Meu Perfil quando quiser voltar a receber novas oportunidades.

                              </p>

                            </div>

                          </div>

                        )

                        : (

                          <div className="
                            flex
                            gap-3
                          ">

                            <div className="
                              mt-1
                              h-3
                              w-3
                              shrink-0
                              rounded-full
                              border-2
                              border-blue-700
                              bg-white
                            " />


                            <div>

                              <p className="
                                text-sm
                                font-semibold
                                text-slate-800
                              ">

                                Consulte suas oportunidades

                              </p>


                              <p className="
                                mt-1
                                text-xs
                                leading-5
                                text-slate-500
                              ">

                                O motor já está buscando permutas diretas e em cadeia para você.

                              </p>

                            </div>

                          </div>

                        )
                      }


                      <div className="
                        flex
                        gap-3
                      ">

                        <div className="
                          mt-1
                          h-3
                          w-3
                          shrink-0
                          rounded-full
                          border-2
                          border-slate-300
                          bg-white
                        " />


                        <div>

                          <p className="
                            text-sm
                            font-semibold
                            text-slate-800
                          ">

                            Mantenha suas preferências atualizadas

                          </p>


                          <p className="
                            mt-1
                            text-xs
                            leading-5
                            text-slate-500
                          ">

                            A ordem das comarcas define suas prioridades.

                          </p>

                        </div>

                      </div>


                    </div>

                  </Card>


                  {/* RESUMO */}

                  <Card>

                    <h2 className="
                      text-xl
                      font-bold
                      text-slate-900
                    ">

                      Resumo

                    </h2>


                    <div className="
                      mt-5
                      space-y-4
                    ">


                      <div className="
                        flex
                        items-center
                        justify-between
                        gap-4
                      ">

                        <div className="
                          flex
                          items-center
                          gap-3
                        ">

                          <Building2
                            className="
                              h-5
                              w-5
                              text-slate-400
                            "
                          />


                          <span className="
                            text-sm
                            text-slate-600
                          ">

                            Comarca atual

                          </span>

                        </div>


                        <span className="
                          max-w-[55%]
                          truncate
                          text-right
                          text-sm
                          font-semibold
                          text-slate-900
                        ">

                          {
                            comarcaAtual?.nome
                            ||
                            "Não informada"
                          }

                        </span>

                      </div>


                      <div className="
                        flex
                        items-center
                        justify-between
                        gap-4
                      ">

                        <div className="
                          flex
                          items-center
                          gap-3
                        ">

                          <MapPinned
                            className="
                              h-5
                              w-5
                              text-slate-400
                            "
                          />


                          <span className="
                            text-sm
                            text-slate-600
                          ">

                            Destinos

                          </span>

                        </div>


                        <span className="
                          text-sm
                          font-semibold
                          text-slate-900
                        ">

                          {destinos.length}

                        </span>

                      </div>


                      <div className="
                        flex
                        items-center
                        justify-between
                        gap-4
                      ">

                        <div className="
                          flex
                          items-center
                          gap-3
                        ">

                          <UserRound
                            className="
                              h-5
                              w-5
                              text-slate-400
                            "
                          />


                          <span className="
                            text-sm
                            text-slate-600
                          ">

                            Contato

                          </span>

                        </div>


                        <span className="
                          text-sm
                          font-semibold
                          text-slate-900
                        ">

                          {
                            perfil
                              ?.telefone
                              ?.trim()

                            ? "Informado"

                            : "Pendente"
                          }

                        </span>

                      </div>


                    </div>

                  </Card>


                </div>

              </div>


              {/* =================================================
                  ATIVIDADE RECENTE
              ================================================= */}

              <Card>

                <div className="
                  flex
                  flex-col
                  gap-5
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                ">

                  <div>

                    <h2 className="
                      text-xl
                      font-bold
                      text-slate-900
                    ">

                      Atividade recente

                    </h2>


                    <p className="
                      mt-1
                      text-sm
                      text-slate-500
                    ">

                      Última atualização registrada no seu perfil.

                    </p>

                  </div>


                  <p className="
                    text-sm
                    font-semibold
                    text-slate-700
                  ">

                    {
                      formatarData(
                        perfil
                          ?.updated_at
                        ?? null
                      )
                    }

                  </p>

                </div>

              </Card>


            </div>

          )
        }

        {
          modalAvaliacaoAberto &&
          avaliacoesPendentes.length > 0 && (

            <div className="
              fixed
              inset-0
              z-[120]
              flex
              items-center
              justify-center
              overflow-y-auto
              bg-slate-950/60
              px-4
              py-8
              backdrop-blur-sm
            ">

              <div className="
                w-full
                max-w-xl
                overflow-hidden
                rounded-2xl
                bg-white
                shadow-2xl
              ">

                <div className="
                  flex
                  items-start
                  justify-between
                  gap-4
                  border-b
                  border-slate-200
                  px-6
                  py-5
                ">

                  <div>

                    <p className="
                      text-sm
                      font-semibold
                      text-amber-700
                    ">

                      Avaliação da plataforma

                    </p>


                    <h2 className="
                      mt-1
                      text-xl
                      font-bold
                      text-slate-900
                    ">

                      Como foi sua experiência?

                    </h2>


                    <p className="
                      mt-1
                      text-sm
                      text-slate-500
                    ">

                      Sua avaliação é sobre a experiência com a Permuta TJSP, não sobre outro servidor.

                    </p>

                  </div>


                  <button
                    type="button"
                    aria-label="Fechar"
                    disabled={
                      enviandoAvaliacao
                    }
                    onClick={() =>
                      setModalAvaliacaoAberto(
                        false
                      )
                    }
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      text-slate-400
                      transition
                      hover:bg-slate-100
                      hover:text-slate-700
                      disabled:opacity-50
                    "
                  >

                    <X
                      className="
                        h-5
                        w-5
                      "
                    />

                  </button>

                </div>


                <div className="
                  space-y-6
                  px-6
                  py-6
                ">

                  {/* NOTA */}

                  <div>

                    <label className="
                      block
                      text-sm
                      font-semibold
                      text-slate-800
                    ">

                      Como você avalia sua experiência?

                    </label>


                    <div className="
                      mt-3
                      flex
                      flex-wrap
                      gap-2
                    ">

                      {
                        [1, 2, 3, 4, 5].map(
                          estrela => (

                            <button
                              key={
                                estrela
                              }
                              type="button"
                              disabled={
                                enviandoAvaliacao
                              }
                              onClick={() => {
                                setNotaAvaliacao(
                                  estrela
                                );
                                setErroAvaliacao("");
                              }}
                              aria-label={
                                `${estrela} ${
                                  estrela === 1
                                    ? "estrela"
                                    : "estrelas"
                                }`
                              }
                              className="
                                rounded-lg
                                p-1
                                transition
                                hover:scale-110
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                              "
                            >

                              <Star
                                className={[
                                  "h-9 w-9 transition",

                                  estrela <=
                                  notaAvaliacao
                                    ? "fill-amber-400 text-amber-500"
                                    : "text-slate-300"

                                ].join(" ")}
                                strokeWidth={1.7}
                              />

                            </button>

                          )
                        )
                      }

                    </div>


                    <p className="
                      mt-2
                      text-xs
                      text-slate-500
                    ">

                      {
                        notaAvaliacao > 0
                          ? `${notaAvaliacao} ${
                              notaAvaliacao === 1
                                ? "estrela selecionada"
                                : "estrelas selecionadas"
                            }.`
                          : "Selecione de 1 a 5 estrelas."
                      }

                    </p>

                  </div>


                  {/* RECOMENDARIA */}

                  <div>

                    <p className="
                      text-sm
                      font-semibold
                      text-slate-800
                    ">

                      Você recomendaria a plataforma a outros servidores?

                    </p>


                    <div className="
                      mt-3
                      grid
                      grid-cols-2
                      gap-3
                    ">

                      <button
                        type="button"
                        disabled={
                          enviandoAvaliacao
                        }
                        onClick={() => {
                          setRecomendaria(
                            true
                          );
                          setErroAvaliacao("");
                        }}
                        className={[
                          "rounded-xl border px-4 py-3 text-sm font-semibold transition",

                          recomendaria === true
                            ? "border-green-600 bg-green-50 text-green-800"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"

                        ].join(" ")}
                      >

                        Sim

                      </button>


                      <button
                        type="button"
                        disabled={
                          enviandoAvaliacao
                        }
                        onClick={() => {
                          setRecomendaria(
                            false
                          );
                          setErroAvaliacao("");
                        }}
                        className={[
                          "rounded-xl border px-4 py-3 text-sm font-semibold transition",

                          recomendaria === false
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"

                        ].join(" ")}
                      >

                        Não

                      </button>

                    </div>

                  </div>


                  {/* COMENTÁRIO */}

                  <div>

                    <label className="
                      block
                      text-sm
                      font-semibold
                      text-slate-800
                    ">

                      Comentário

                      <span className="
                        ml-1
                        font-normal
                        text-slate-500
                      ">

                        (opcional)

                      </span>

                    </label>


                    <textarea
                      value={
                        comentarioAvaliacao
                      }
                      disabled={
                        enviandoAvaliacao
                      }
                      onChange={
                        event =>
                          setComentarioAvaliacao(
                            event.target.value
                          )
                      }
                      maxLength={1000}
                      rows={4}
                      placeholder="Conte brevemente como foi sua experiência com a plataforma."
                      className="
                        mt-2
                        w-full
                        resize-y
                        rounded-xl
                        border
                        border-slate-300
                        px-4
                        py-3
                        text-sm
                        text-slate-900
                        outline-none
                        transition
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-100
                        disabled:bg-slate-100
                      "
                    />


                    <p className="
                      mt-1
                      text-right
                      text-xs
                      text-slate-400
                    ">

                      {comentarioAvaliacao.length}/1000

                    </p>

                  </div>


                  {/* DEPOIMENTO */}

                  <label className="
                    flex
                    items-start
                    gap-3
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-4
                    text-sm
                    leading-6
                    text-slate-600
                  ">

                    <input
                      type="checkbox"
                      checked={
                        autorizaDepoimento
                      }
                      disabled={
                        enviandoAvaliacao
                      }
                      onChange={
                        event =>
                          setAutorizaDepoimento(
                            event.target.checked
                          )
                      }
                      className="
                        mt-1
                        h-4
                        w-4
                        shrink-0
                        accent-blue-900
                      "
                    />

                    <span>

                      Autorizo que meu comentário seja utilizado como depoimento público sobre a plataforma, sem exposição dos meus dados pessoais.

                    </span>

                  </label>


                  {
                    erroAvaliacao && (

                      <div
                        role="alert"
                        className="
                          rounded-xl
                          border
                          border-red-200
                          bg-red-50
                          p-4
                          text-sm
                          text-red-700
                        "
                      >

                        {erroAvaliacao}

                      </div>

                    )
                  }

                </div>


                <div className="
                  flex
                  flex-col-reverse
                  gap-3
                  border-t
                  border-slate-200
                  bg-slate-50/70
                  px-6
                  py-4
                  sm:flex-row
                  sm:justify-end
                ">

                  <button
                    type="button"
                    disabled={
                      enviandoAvaliacao
                    }
                    onClick={() =>
                      setModalAvaliacaoAberto(
                        false
                      )
                    }
                    className="
                      rounded-xl
                      border
                      border-slate-300
                      bg-white
                      px-5
                      py-3
                      text-sm
                      font-semibold
                      text-slate-700
                      transition
                      hover:bg-slate-100
                      disabled:opacity-50
                    "
                  >

                    Agora não

                  </button>


                  <button
                    type="button"
                    onClick={
                      enviarAvaliacao
                    }
                    disabled={
                      enviandoAvaliacao ||
                      notaAvaliacao === 0 ||
                      recomendaria === null
                    }
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-blue-900
                      px-5
                      py-3
                      text-sm
                      font-semibold
                      text-white
                      transition
                      hover:bg-blue-800
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >

                    {
                      enviandoAvaliacao
                        ? "Enviando..."
                        : "Enviar avaliação"
                    }

                  </button>

                </div>

              </div>

            </div>

          )
        }


      </DashboardLayout>

    </AuthGuard>

  );

}