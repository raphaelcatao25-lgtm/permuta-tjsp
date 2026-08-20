"use client";

import {
  useEffect,
  useState
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  Bell,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  Mail,
  Phone,
  Trash2,
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
  supabase
} from "@/lib/supabase";


/* ======================================================
   TIPOS
====================================================== */

interface Notificacao {
  id: string;
  usuario_id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  solicitacao_id: string | null;
  ciclo_manual_id: string | null;
  lida: boolean;
  created_at: string;
}


interface ContatoPermuta {
  perfil_id: string;
  nome: string;
  email: string;
  telefone: string | null;
}


interface StatusSolicitacao {
  id: string;
  status: string;
}


/* ======================================================
   PÁGINA
====================================================== */

export default function NotificacoesPage() {

  const [
    usuarioId,
    setUsuarioId
  ] = useState("");


  const [
    notificacoes,
    setNotificacoes
  ] = useState<Notificacao[]>([]);


  const [
    contatos,
    setContatos
  ] = useState<
    Record<string, ContatoPermuta[]>
  >({});


  const [
    carregando,
    setCarregando
  ] = useState(true);


  const [
    processando,
    setProcessando
  ] = useState<string | null>(
    null
  );


  const [
    notificacaoExcluir,
    setNotificacaoExcluir
  ] = useState<Notificacao | null>(
    null
  );


  const [
    excluindo,
    setExcluindo
  ] = useState(false);


  const [
    marcandoTodas,
    setMarcandoTodas
  ] = useState(false);


  const [
    excluindoTodas,
    setExcluindoTodas
  ] = useState(false);


  const [
    confirmarExcluirTodas,
    setConfirmarExcluirTodas
  ] = useState(false);


  const [
    mensagemErro,
    setMensagemErro
  ] = useState("");


  /* ======================================================
     USUÁRIO
  ====================================================== */

  useEffect(() => {

    let ativo = true;


    async function carregarUsuario() {

      const {
        data
      } = await supabase.auth.getSession();


      if (!ativo) {
        return;
      }


      if (!data.session?.user) {

        setUsuarioId("");

        setCarregando(false);

        return;

      }


      setUsuarioId(
        data.session.user.id
      );

    }


    carregarUsuario();


    const {
      data: listener
    } = supabase.auth.onAuthStateChange(
      (_evento, sessao) => {

        if (!ativo) {
          return;
        }


        if (sessao?.user) {

          setUsuarioId(
            sessao.user.id
          );

        }

        else {

          setUsuarioId("");

          setNotificacoes([]);

          setContatos({});

          setCarregando(false);

        }

      }
    );


    return () => {

      ativo = false;

      listener.subscription.unsubscribe();

    };

  }, []);


  /* ======================================================
     CARREGAR NOTIFICAÇÕES
  ====================================================== */

  useEffect(() => {

    if (!usuarioId) {
      return;
    }


    carregarNotificacoes();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId]);


  async function carregarNotificacoes() {

    setCarregando(true);

    setMensagemErro("");


    try {

      /*
      ========================================
      BUSCA NOTIFICAÇÕES
      ========================================
      */

      const {
        data,
        error
      } = await supabase
        .from("notificacoes")
        .select(`
          id,
          usuario_id,
          tipo,
          titulo,
          mensagem,
          solicitacao_id,
          ciclo_manual_id,
          lida,
          created_at
        `)
        .eq(
          "usuario_id",
          usuarioId
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


      if (error) {
        throw error;
      }


      const lista =
        (data ?? []) as Notificacao[];


      setNotificacoes(
        lista
      );


      /*
      ========================================
      IDENTIFICA SOLICITAÇÕES QUE POSSUEM
      NOTIFICAÇÃO DE PERMUTA CONFIRMADA
      ========================================

      Importante:

      Uma notificação "permuta_confirmada"
      pode continuar existindo mesmo depois
      que a permuta virou:

      concluido
      encerrado_sem_sucesso

      Nesses casos NÃO devemos mais chamar
      buscar_contatos_permuta_confirmada.
      */

      const idsSolicitacoesConfirmadas = [

        ...new Set(

          lista
            .filter(
              notificacao =>
                notificacao.tipo ===
                  "permuta_confirmada"
                &&
                Boolean(
                  notificacao.solicitacao_id
                )
            )
            .map(
              notificacao =>
                notificacao.solicitacao_id
            )

        )

      ].filter(Boolean) as string[];


      /*
      ========================================
      BUSCA STATUS ATUAL DAS SOLICITAÇÕES
      ========================================
      */

      const statusPorSolicitacao =
        new Map<string, string>();


      if (
        idsSolicitacoesConfirmadas.length > 0
      ) {

        const {
          data: dadosStatus,
          error: erroStatus
        } = await supabase
          .from(
            "solicitacoes_permuta"
          )
          .select(
            "id, status"
          )
          .in(
            "id",
            idsSolicitacoesConfirmadas
          );


        if (erroStatus) {

          console.error(
            "Erro ao verificar status das permutas:",
            erroStatus
          );

        }

        else {

          (
            (dadosStatus ?? []) as StatusSolicitacao[]
          ).forEach(
            solicitacao => {

              statusPorSolicitacao.set(
                solicitacao.id,
                solicitacao.status
              );

            }
          );

        }

      }


      /*
      ========================================
      CARREGA CONTATOS APENAS QUANDO
      A PERMUTA CONTINUA CONFIRMADA
      ========================================
      */

      const novosContatos:
        Record<
          string,
          ContatoPermuta[]
        > = {};


      for (
        const notificacao
        of lista
      ) {

        /*
        Somente notificação de confirmação.
        */

        if (
          notificacao.tipo !==
          "permuta_confirmada"
        ) {

          continue;

        }


        if (
          !notificacao.solicitacao_id
        ) {

          continue;

        }


        /*
        Só consulta os contatos se a solicitação
        AINDA estiver com status confirmado.
        */

        const statusAtual =
          statusPorSolicitacao.get(
            notificacao.solicitacao_id
          );


        if (
          statusAtual !== "confirmado"
        ) {

          continue;

        }


        const {
          data: dadosContatos,
          error: erroContatos
        } = await supabase.rpc(
          "buscar_contatos_permuta_confirmada",
          {
            p_solicitacao_id:
              notificacao.solicitacao_id,

            p_usuario_id:
              usuarioId
          }
        );


        /*
        Não derruba a página se uma permuta
        deixar de estar confirmada enquanto
        a tela estiver carregando.
        */

        if (erroContatos) {

          console.warn(
            "Contatos não disponíveis para esta permuta."
          );

          continue;

        }


        novosContatos[
          notificacao.id
        ] =
          (
            dadosContatos ?? []
          ) as ContatoPermuta[];

      }


      setContatos(
        novosContatos
      );

    }

    catch(error) {

      console.error(
        "Erro ao carregar notificações:",
        error
      );


      setMensagemErro(
        extrairMensagemErro(
          error
        )
      );

    }

    finally {

      setCarregando(false);

    }

  }


  /* ======================================================
     MARCAR COMO LIDA
  ====================================================== */

  async function marcarComoLida(
    notificacaoId: string
  ) {

    try {

      setProcessando(
        notificacaoId
      );


      setMensagemErro("");


      const {
        error
      } = await supabase
        .from("notificacoes")
        .update({
          lida: true,
          updated_at:
            new Date()
              .toISOString()
        })
        .eq(
          "id",
          notificacaoId
        )
        .eq(
          "usuario_id",
          usuarioId
        );


      if (error) {
        throw error;
      }


      /*
      Atualiza a lista local sem F5.
      */

      setNotificacoes(
        anteriores =>
          anteriores.map(
            notificacao =>

              notificacao.id ===
              notificacaoId

                ? {
                    ...notificacao,
                    lida: true
                  }

                : notificacao

          )
      );


      /*
      Atualiza o badge vermelho da Sidebar.
      */

      window.dispatchEvent(
        new Event(
          "atualizar-notificacoes"
        )
      );

    }

    catch(error) {

      console.error(
        "Erro ao marcar notificação como lida:",
        error
      );


      setMensagemErro(
        extrairMensagemErro(
          error
        )
      );

    }

    finally {

      setProcessando(
        null
      );

    }

  }


  /* ======================================================
     MARCAR TODAS COMO LIDAS
  ====================================================== */

  async function marcarTodasComoLidas() {

    if (!usuarioId || naoLidas === 0) {
      return;
    }


    setMarcandoTodas(true);
    setMensagemErro("");


    try {

      const {
        error
      } = await supabase
        .from("notificacoes")
        .update({
          lida: true,
          updated_at:
            new Date().toISOString()
        })
        .eq(
          "usuario_id",
          usuarioId
        )
        .eq(
          "lida",
          false
        );


      if (error) {
        throw error;
      }


      setNotificacoes(
        anteriores =>
          anteriores.map(
            notificacao => ({
              ...notificacao,
              lida: true
            })
          )
      );


      window.dispatchEvent(
        new Event(
          "atualizar-notificacoes"
        )
      );

    }

    catch(error) {

      console.error(
        "Erro ao marcar todas as notificações como lidas:",
        error
      );


      setMensagemErro(
        extrairMensagemErro(
          error
        )
      );

    }

    finally {

      setMarcandoTodas(false);

    }

  }


  /* ======================================================
     EXCLUIR TODAS AS NOTIFICAÇÕES
  ====================================================== */

  async function excluirTodasNotificacoes() {

    if (!usuarioId || notificacoes.length === 0) {
      return;
    }


    setExcluindoTodas(true);
    setMensagemErro("");


    try {

      const {
        error
      } = await supabase
        .from("notificacoes")
        .delete()
        .eq(
          "usuario_id",
          usuarioId
        );


      if (error) {
        throw error;
      }


      setNotificacoes([]);
      setContatos({});
      setConfirmarExcluirTodas(false);


      window.dispatchEvent(
        new Event(
          "atualizar-notificacoes"
        )
      );

    }

    catch(error) {

      console.error(
        "Erro ao excluir todas as notificações:",
        error
      );


      setMensagemErro(
        extrairMensagemErro(
          error
        )
      );

    }

    finally {

      setExcluindoTodas(false);

    }

  }


  /* ======================================================
     ABRIR CONFIRMAÇÃO DE EXCLUSÃO
  ====================================================== */

  function solicitarExclusao(
    notificacao: Notificacao
  ) {

    setMensagemErro("");

    setNotificacaoExcluir(
      notificacao
    );

  }


  /* ======================================================
     EXCLUIR NOTIFICAÇÃO
  ====================================================== */

  async function excluirNotificacao() {

    if (
      !notificacaoExcluir
    ) {

      return;

    }


    setExcluindo(true);

    setMensagemErro("");


    try {

      const {
        error
      } = await supabase
        .from(
          "notificacoes"
        )
        .delete()
        .eq(
          "id",
          notificacaoExcluir.id
        )
        .eq(
          "usuario_id",
          usuarioId
        );


      if (error) {
        throw error;
      }


      /*
      Remove da tela imediatamente.
      */

      setNotificacoes(
        anteriores =>
          anteriores.filter(
            notificacao =>
              notificacao.id !==
              notificacaoExcluir.id
          )
      );


      /*
      Também remove possíveis contatos
      associados àquela notificação.
      */

      setContatos(
        anteriores => {

          const copia = {
            ...anteriores
          };


          delete copia[
            notificacaoExcluir.id
          ];


          return copia;

        }
      );


      setNotificacaoExcluir(
        null
      );


      /*
      Atualiza o badge da Sidebar.
      */

      window.dispatchEvent(
        new Event(
          "atualizar-notificacoes"
        )
      );

    }

    catch(error) {

      console.error(
        "Erro ao excluir notificação:",
        error
      );


      setMensagemErro(
        extrairMensagemErro(
          error
        )
      );

    }

    finally {

      setExcluindo(false);

    }

  }


  /* ======================================================
     CONTADOR
  ====================================================== */

  const naoLidas =
    notificacoes.filter(
      notificacao =>
        !notificacao.lida
    ).length;


  /* ======================================================
     RENDER
  ====================================================== */

  return (

    <AuthGuard>

      <DashboardLayout>

        <div className="
          mx-auto
          max-w-5xl
          space-y-8
          px-6
          py-8
        ">


          {/* CABEÇALHO */}

          <div>

            <div className="
              flex
              flex-wrap
              items-center
              justify-between
              gap-4
            ">

              <div>

                <h1 className="
                  text-3xl
                  font-bold
                  text-slate-900
                ">

                  Notificações

                </h1>


                <p className="
                  mt-2
                  text-slate-500
                ">

                  Acompanhe atualizações importantes sobre suas propostas e permutas.

                </p>

              </div>


              <div className="
                flex
                flex-wrap
                items-center
                justify-end
                gap-2
              ">

                {
                  naoLidas > 0 && (

                    <button
                      type="button"
                      onClick={marcarTodasComoLidas}
                      disabled={
                        marcandoTodas ||
                        excluindoTodas
                      }
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-blue-200
                        bg-white
                        px-4
                        py-2.5
                        text-sm
                        font-semibold
                        text-blue-800
                        transition
                        hover:bg-blue-50
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >

                      <CheckCheck size={17} />

                      {
                        marcandoTodas
                          ? "Marcando..."
                          : "Marcar todas como lidas"
                      }

                    </button>

                  )
                }


                {
                  notificacoes.length > 0 && (

                    <button
                      type="button"
                      onClick={() =>
                        setConfirmarExcluirTodas(
                          true
                        )
                      }
                      disabled={
                        excluindoTodas ||
                        marcandoTodas
                      }
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-red-200
                        bg-white
                        px-4
                        py-2.5
                        text-sm
                        font-semibold
                        text-red-600
                        transition
                        hover:bg-red-50
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >

                      <Trash2 size={17} />
                      Excluir todas

                    </button>

                  )
                }


                {
                  naoLidas > 0 && (

                    <div className="
                      rounded-full
                      bg-blue-100
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      text-blue-800
                    ">

                      {naoLidas}{" "}
                      {
                        naoLidas === 1
                          ? "não lida"
                          : "não lidas"
                      }

                    </div>

                  )
                }

              </div>

            </div>

          </div>


          {/* ERRO */}

          {
            mensagemErro && (

              <div className="
                flex
                items-start
                gap-3
                rounded-xl
                border
                border-red-200
                bg-red-50
                p-4
                text-sm
                text-red-800
              ">

                <AlertCircle
                  className="
                    mt-0.5
                    h-5
                    w-5
                    shrink-0
                  "
                />


                <div>

                  <p className="
                    font-semibold
                  ">

                    Não foi possível concluir a operação.

                  </p>


                  <p className="
                    mt-1
                  ">

                    {mensagemErro}

                  </p>

                </div>

              </div>

            )
          }


          {/* CONTEÚDO */}

          {
            carregando

              ? (

                <div className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-8
                  text-center
                  text-sm
                  text-slate-500
                ">

                  Carregando notificações...

                </div>

              )

              : notificacoes.length === 0

              ? (

                <div className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-10
                  text-center
                  shadow-sm
                ">

                  <Bell
                    size={42}
                    className="
                      mx-auto
                      mb-4
                      text-slate-400
                    "
                  />


                  <h2 className="
                    text-lg
                    font-bold
                    text-slate-900
                  ">

                    Nenhuma notificação

                  </h2>


                  <p className="
                    mt-2
                    text-sm
                    text-slate-500
                  ">

                    Quando houver novidades sobre suas propostas ou permutas, elas aparecerão aqui.

                  </p>

                </div>

              )

              : (

                <div className="
                  space-y-4
                ">

                  {
                    notificacoes.map(
                      notificacao => (

                        <NotificacaoCard
                          key={
                            notificacao.id
                          }

                          notificacao={
                            notificacao
                          }

                          contatos={
                            contatos[
                              notificacao.id
                            ] ?? []
                          }

                          processando={
                            processando ===
                            notificacao.id
                          }

                          onMarcarComoLida={() =>
                            marcarComoLida(
                              notificacao.id
                            )
                          }

                          onExcluir={() =>
                            solicitarExclusao(
                              notificacao
                            )
                          }
                        />

                      )
                    )
                  }

                </div>

              )
          }


        </div>


        {/* =================================================
            MODAL EXCLUIR NOTIFICAÇÃO
        ================================================= */}

        {
          notificacaoExcluir && (

            <ModalExcluirNotificacao
              notificacao={
                notificacaoExcluir
              }

              processando={
                excluindo
              }

              onFechar={() =>
                setNotificacaoExcluir(
                  null
                )
              }

              onConfirmar={
                excluirNotificacao
              }
            />

          )
        }


        {
          confirmarExcluirTodas && (

            <ModalExcluirTodasNotificacoes
              quantidade={
                notificacoes.length
              }

              processando={
                excluindoTodas
              }

              onFechar={() =>
                setConfirmarExcluirTodas(
                  false
                )
              }

              onConfirmar={
                excluirTodasNotificacoes
              }
            />

          )
        }


      </DashboardLayout>

    </AuthGuard>

  );

}


/* ======================================================
   CARD
====================================================== */

function NotificacaoCard({
  notificacao,
  contatos,
  processando,
  onMarcarComoLida,
  onExcluir
}: {
  notificacao: Notificacao;

  contatos: ContatoPermuta[];

  processando: boolean;

  onMarcarComoLida: () => void;

  onExcluir: () => void;
}) {

  const confirmada =
    notificacao.tipo ===
    "permuta_confirmada";


  const concluida =
    notificacao.tipo ===
    "permuta_concluida";


  const semSucesso =
    notificacao.tipo ===
    "permuta_encerrada_sem_sucesso";


  return (

    <article
      className={`
        overflow-hidden
        rounded-2xl
        border
        bg-white
        shadow-sm

        ${
          notificacao.lida
            ? "border-slate-200"
            : "border-blue-300"
        }
      `}
    >


      <div className="
        p-6
      ">


        {/* TOPO */}

        <div className="
          flex
          flex-wrap
          items-start
          justify-between
          gap-4
        ">


          <div className="
            flex
            min-w-0
            flex-1
            items-start
            gap-4
          ">


            {/* ÍCONE */}

            <div
              className={`
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl

                ${
                  confirmada ||
                  concluida

                    ? "bg-green-100 text-green-700"

                    : semSucesso

                    ? "bg-slate-100 text-slate-600"

                    : "bg-blue-100 text-blue-700"
                }
              `}
            >

              {
                confirmada ||
                concluida

                  ? (

                    <CheckCircle2
                      size={22}
                    />

                  )

                  : (

                    <Bell
                      size={22}
                    />

                  )
              }

            </div>


            <div className="
              min-w-0
              flex-1
            ">

              <div className="
                flex
                flex-wrap
                items-center
                gap-2
              ">

                <h2 className="
                  text-lg
                  font-bold
                  text-slate-900
                ">

                  {
                    notificacao.titulo
                  }

                </h2>


                {
                  !notificacao.lida && (

                    <span className="
                      rounded-full
                      bg-blue-100
                      px-2.5
                      py-1
                      text-xs
                      font-bold
                      text-blue-700
                    ">

                      Nova

                    </span>

                  )
                }

              </div>


              <p className="
                mt-2
                text-sm
                leading-6
                text-slate-600
              ">

                {
                  notificacao.mensagem
                }

              </p>

            </div>

          </div>


          <span className="
            shrink-0
            text-sm
            text-slate-500
          ">

            {
              new Date(
                notificacao.created_at
              ).toLocaleString(
                "pt-BR"
              )
            }

          </span>

        </div>


        {/* CONTATOS */}

        {
          confirmada &&
          contatos.length > 0 && (

            <div className="
              mt-6
              space-y-4
            ">

              <h3 className="
                text-sm
                font-bold
                uppercase
                tracking-wide
                text-slate-500
              ">

                Dados para contato

              </h3>


              {
                contatos.map(
                  contato => (

                    <ContatoCard
                      key={
                        contato.perfil_id
                      }

                      contato={
                        contato
                      }
                    />

                  )
                )
              }

            </div>

          )
        }


        {/* AÇÕES */}

        <div className="
          mt-6
          flex
          flex-wrap
          gap-3
        ">


          {
            (
              notificacao.solicitacao_id ||
              notificacao.ciclo_manual_id
            ) && (

              <Link
                href="/propostas"

                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-blue-900
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  !text-white
                  transition
                  hover:bg-blue-800
                "
              >

                Ver proposta

                <ExternalLink
                  size={16}
                />

              </Link>

            )
          }


          {
            !notificacao.lida && (

              <button
                type="button"

                disabled={
                  processando
                }

                onClick={
                  onMarcarComoLida
                }

                className="
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:bg-slate-100
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >

                {
                  processando
                    ? "Atualizando..."
                    : "Marcar como lida"
                }

              </button>

            )
          }


          {/* EXCLUIR */}

          <button
            type="button"

            disabled={
              processando
            }

            onClick={
              onExcluir
            }

            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-red-200
              bg-white
              px-4
              py-2
              text-sm
              font-semibold
              text-red-600
              transition
              hover:bg-red-50
              hover:text-red-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >

            <Trash2
              size={16}
            />

            Excluir

          </button>


        </div>


      </div>


    </article>

  );

}


/* ======================================================
   MODAL EXCLUIR
====================================================== */

function ModalExcluirNotificacao({
  notificacao,
  processando,
  onFechar,
  onConfirmar
}: {
  notificacao: Notificacao;

  processando: boolean;

  onFechar: () => void;

  onConfirmar: () => void;
}) {

  return (

    <div className="
      fixed
      inset-0
      z-[100]
      flex
      items-center
      justify-center
      bg-slate-950/50
      px-4
      py-8
      backdrop-blur-sm
    ">


      <div className="
        w-full
        max-w-md
        overflow-hidden
        rounded-2xl
        bg-white
        shadow-2xl
      ">


        {/* CABEÇALHO */}

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

            <h2 className="
              text-xl
              font-bold
              text-slate-900
            ">

              Excluir notificação

            </h2>


            <p className="
              mt-1
              text-sm
              text-slate-500
            ">

              Confirme antes de continuar.

            </p>

          </div>


          <button
            type="button"

            disabled={
              processando
            }

            onClick={
              onFechar
            }

            aria-label="Fechar"

            className="
              flex
              h-9
              w-9
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
              size={20}
            />

          </button>

        </div>


        {/* CONTEÚDO */}

        <div className="
          px-6
          py-6
        ">

          <div className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            bg-red-50
            text-red-600
          ">

            <Trash2
              size={23}
            />

          </div>


          <h3 className="
            mt-4
            text-lg
            font-bold
            text-slate-900
          ">

            Tem certeza de que deseja excluir esta notificação?

          </h3>


          <p className="
            mt-2
            text-sm
            leading-6
            text-slate-600
          ">

            A notificação será removida do seu histórico de mensagens.

          </p>


          {/* PREVIEW */}

          <div className="
            mt-5
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            p-4
          ">

            <p className="
              text-sm
              font-semibold
              text-slate-900
            ">

              {
                notificacao.titulo
              }

            </p>


            <p className="
              mt-1
              line-clamp-2
              text-xs
              leading-5
              text-slate-500
            ">

              {
                notificacao.mensagem
              }

            </p>

          </div>


          <p className="
            mt-4
            text-xs
            leading-5
            text-slate-500
          ">

            A exclusão desta notificação não cancela nem altera a proposta ou permuta relacionada.

          </p>


          {/* BOTÕES */}

          <div className="
            mt-6
            flex
            flex-col-reverse
            gap-3
            sm:flex-row
            sm:justify-end
          ">


            <button
              type="button"

              disabled={
                processando
              }

              onClick={
                onFechar
              }

              className="
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-2.5
                text-sm
                font-semibold
                text-slate-700
                transition
                hover:bg-slate-50
                disabled:opacity-50
              "
            >

              Cancelar

            </button>


            <button
              type="button"

              disabled={
                processando
              }

              onClick={
                onConfirmar
              }

              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-red-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-red-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <Trash2
                size={16}
              />

              {
                processando
                  ? "Excluindo..."
                  : "Excluir notificação"
              }

            </button>


          </div>


        </div>


      </div>


    </div>

  );

}


/* ======================================================
   MODAL EXCLUIR TODAS
====================================================== */

function ModalExcluirTodasNotificacoes({
  quantidade,
  processando,
  onFechar,
  onConfirmar
}: {
  quantidade: number;
  processando: boolean;
  onFechar: () => void;
  onConfirmar: () => void;
}) {

  return (

    <div className="
      fixed
      inset-0
      z-[110]
      flex
      items-center
      justify-center
      bg-slate-950/50
      px-4
      py-8
      backdrop-blur-sm
    ">

      <div className="
        w-full
        max-w-md
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

            <h2 className="
              text-xl
              font-bold
              text-slate-900
            ">
              Excluir todas as notificações
            </h2>

            <p className="
              mt-1
              text-sm
              text-slate-500
            ">
              Esta ação remove todo o seu histórico de notificações.
            </p>

          </div>


          <button
            type="button"
            disabled={processando}
            onClick={onFechar}
            aria-label="Fechar"
            className="
              flex
              h-9
              w-9
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
            <X size={20} />
          </button>

        </div>


        <div className="
          px-6
          py-6
        ">

          <div className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            bg-red-50
            text-red-600
          ">
            <Trash2 size={23} />
          </div>


          <h3 className="
            mt-4
            text-lg
            font-bold
            text-slate-900
          ">
            Excluir {quantidade}{" "}
            {quantidade === 1
              ? "notificação"
              : "notificações"}?
          </h3>


          <p className="
            mt-2
            text-sm
            leading-6
            text-slate-600
          ">
            As notificações serão removidas permanentemente da sua caixa de mensagens. Isso não cancela nem altera propostas ou permutas relacionadas.
          </p>


          <div className="
            mt-6
            flex
            flex-col-reverse
            gap-3
            sm:flex-row
            sm:justify-end
          ">

            <button
              type="button"
              disabled={processando}
              onClick={onFechar}
              className="
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-2.5
                text-sm
                font-semibold
                text-slate-700
                transition
                hover:bg-slate-50
                disabled:opacity-50
              "
            >
              Cancelar
            </button>


            <button
              type="button"
              disabled={processando}
              onClick={onConfirmar}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-red-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-red-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Trash2 size={16} />
              {
                processando
                  ? "Excluindo..."
                  : "Excluir todas"
              }
            </button>

          </div>

        </div>

      </div>

    </div>

  );

}


/* ======================================================
   CONTATO
====================================================== */

function ContatoCard({
  contato
}: {
  contato: ContatoPermuta;
}) {

  return (

    <div className="
      rounded-xl
      border
      border-slate-200
      bg-slate-50
      p-4
    ">


      <div className="
        flex
        items-center
        gap-2
      ">

        <UserRound
          size={18}
          className="
            text-blue-700
          "
        />


        <span className="
          font-bold
          text-slate-900
        ">

          {contato.nome}

        </span>

      </div>


      <div className="
        mt-4
        space-y-3
      ">


        {/* E-MAIL */}

        <div className="
          flex
          items-start
          gap-3
          text-sm
        ">

          <Mail
            size={17}
            className="
              mt-0.5
              shrink-0
              text-slate-400
            "
          />


          <div className="
            min-w-0
          ">

            <p className="
              text-xs
              text-slate-500
            ">

              E-mail

            </p>


            <p className="
              break-all
              font-semibold
              text-slate-900
            ">

              {contato.email}

            </p>

          </div>

        </div>


        {/* TELEFONE */}

        <div className="
          flex
          items-start
          gap-3
          text-sm
        ">

          <Phone
            size={17}
            className="
              mt-0.5
              shrink-0
              text-slate-400
            "
          />


          <div>

            <p className="
              text-xs
              text-slate-500
            ">

              Telefone

            </p>


            <p className="
              font-semibold
              text-slate-900
            ">

              {
                contato.telefone
                  ? contato.telefone
                  : "Não disponibilizado"
              }

            </p>

          </div>

        </div>


      </div>


    </div>

  );

}


/* ======================================================
   UTILITÁRIO
====================================================== */

function extrairMensagemErro(
  error: unknown
) {

  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {

    const mensagem =
      String(
        (
          error as {
            message?: unknown
          }
        ).message ?? ""
      );


    if (mensagem) {
      return mensagem;
    }

  }


  return "Ocorreu um erro inesperado. Tente novamente.";

}