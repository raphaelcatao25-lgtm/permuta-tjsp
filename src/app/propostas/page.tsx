"use client";

import {
  useEffect,
  useState
} from "react";

import {
  useRouter
} from "next/navigation";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  Trash2,
  UserRound,
  X,
  XCircle
} from "lucide-react";

import {
  supabase
} from "@/lib/supabase";

import {
  AuthGuard
} from "@/components/auth/AuthGuard";

import {
  DashboardLayout
} from "@/components/layout/DashboardLayout";


/* ======================================================
   TIPOS
====================================================== */

interface Solicitacao {
  id: string;

  tipo: string;

  solicitante_id: string;

  participante_1: string;
  participante_2: string;
  participante_3?: string | null;

  origem_1?: number | null;
  destino_1?: number | null;

  origem_2?: number | null;
  destino_2?: number | null;

  origem_3?: number | null;
  destino_3?: number | null;

  participante_1_aceite?: boolean | null;
  participante_2_aceite?: boolean | null;
  participante_3_aceite?: boolean | null;

  status: string;

  created_at: string;
}


interface Perfil {
  perfil_id: string;
  nome: string;
}


interface Comarca {
  id: number;
  nome: string;
}


interface ContatoPermuta {
  perfil_id: string;
  nome: string;
  email: string;
  telefone: string | null;
}


/* ======================================================
   PÁGINA
====================================================== */

export default function PropostasPage() {

  const router =
    useRouter();


  const [
    usuarioId,
    setUsuarioId
  ] = useState("");


  const [
    solicitacoes,
    setSolicitacoes
  ] = useState<Solicitacao[]>([]);


  const [
    nomes,
    setNomes
  ] = useState<Map<string, string>>(
    new Map()
  );


  const [
    comarcas,
    setComarcas
  ] = useState<Map<number, string>>(
    new Map()
  );


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
    mensagemErro,
    setMensagemErro
  ] = useState("");


  const [
    mensagemSucesso,
    setMensagemSucesso
  ] = useState("");


  /*
  ========================================
  MODAL DE ENCERRAMENTO
  ========================================
  */

  const [
    propostaEncerramento,
    setPropostaEncerramento
  ] = useState<Solicitacao | null>(
    null
  );


  const [
    processandoEncerramento,
    setProcessandoEncerramento
  ] = useState(false);


  /*
  ========================================
  MODAL DE CANCELAMENTO
  ========================================
  */

  const [
    propostaCancelamento,
    setPropostaCancelamento
  ] = useState<Solicitacao | null>(
    null
  );


  /*
  ========================================
  MODAL LIMPAR HISTÓRICO
  ========================================
  */

  const [
    mostrarLimparHistorico,
    setMostrarLimparHistorico
  ] = useState(false);


  const [
    processandoLimpeza,
    setProcessandoLimpeza
  ] = useState(false);


  /* ======================================================
     CARREGA USUÁRIO
  ====================================================== */

  useEffect(() => {

    let ativo = true;


    async function carregarUsuario() {

      const {
        data: sessao
      } = await supabase.auth.getSession();


      if (!ativo) {
        return;
      }


      if (!sessao.session?.user) {

        setUsuarioId("");
        setCarregando(false);

        return;

      }


      setUsuarioId(
        sessao.session.user.id
      );

    }


    carregarUsuario();


    const {
      data: authListener
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

          setSolicitacoes([]);

          setNomes(
            new Map()
          );

          setComarcas(
            new Map()
          );

          setContatos({});

          setCarregando(false);

        }

      }
    );


    return () => {

      ativo = false;

      authListener.subscription.unsubscribe();

    };

  }, []);


  /* ======================================================
     CARREGA PROPOSTAS
  ====================================================== */

  async function carregarPropostas(
    mostrarCarregamento = true
  ) {

    if (!usuarioId) {
      return;
    }


    if (mostrarCarregamento) {

      setCarregando(true);

    }


    setMensagemErro("");


    try {

      /*
      ========================================
      SOLICITAÇÕES
      ========================================
      */

      const {
        data,
        error
      } = await supabase
        .from(
          "solicitacoes_permuta"
        )
        .select("*")
        .or(
          `participante_1.eq.${usuarioId},participante_2.eq.${usuarioId},participante_3.eq.${usuarioId}`
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


      const listaCompleta =
        (data ?? []) as Solicitacao[];


      /*
      ========================================
      PROPOSTAS OCULTAS PELO USUÁRIO
      ========================================
      */

      const {
        data: ocultas,
        error: erroOcultas
      } = await supabase
        .from(
          "propostas_ocultas_usuario"
        )
        .select(
          "solicitacao_id"
        )
        .eq(
          "usuario_id",
          usuarioId
        );


      if (erroOcultas) {
        throw erroOcultas;
      }


      const idsOcultos =
        new Set(
          (ocultas ?? []).map(
            item =>
              item.solicitacao_id
          )
        );


      const lista =
        listaCompleta.filter(
          item =>
            !idsOcultos.has(
              item.id
            )
        );


      setSolicitacoes(
        lista
      );


      /*
      ========================================
      NOMES DOS PARTICIPANTES
      ========================================
      */

      const idsParticipantes = [

        ...new Set(

          lista.flatMap(
            item => [

              item.participante_1,

              item.participante_2,

              item.participante_3

            ].filter(Boolean)
          )

        )

      ] as string[];


      if (
        idsParticipantes.length > 0
      ) {

        const {
          data: perfis,
          error: erroPerfis
        } = await supabase.rpc(
          "buscar_nomes_participantes_propostas",
          {
            p_usuario_id:
              usuarioId
          }
        );


        if (erroPerfis) {

          console.error(
            "Erro ao buscar nomes dos participantes:",
            erroPerfis
          );

        }


        const mapa =
          new Map<string, string>();


        (
          (perfis ?? []) as Perfil[]
        ).forEach(
          perfil => {

            mapa.set(
              perfil.perfil_id,
              perfil.nome
            );

          }
        );


        setNomes(
          mapa
        );

      }

      else {

        setNomes(
          new Map()
        );

      }


      /*
      ========================================
      NOMES DAS COMARCAS
      ========================================
      */

      const idsComarcas = [

        ...new Set(

          lista.flatMap(
            item => [

              item.origem_1,
              item.destino_1,

              item.origem_2,
              item.destino_2,

              item.origem_3,
              item.destino_3

            ].filter(
              item =>
                typeof item ===
                "number"
            )
          )

        )

      ] as number[];


      if (
        idsComarcas.length > 0
      ) {

        const {
          data: dadosComarcas,
          error: erroComarcas
        } = await supabase
          .from(
            "comarcas_tjsp"
          )
          .select(
            "id, nome"
          )
          .in(
            "id",
            idsComarcas
          );


        if (erroComarcas) {

          console.error(
            "Erro ao buscar comarcas:",
            erroComarcas
          );

        }


        const mapaComarcas =
          new Map<number, string>();


        (
          (dadosComarcas ?? []) as Comarca[]
        ).forEach(
          comarca => {

            mapaComarcas.set(
              comarca.id,
              comarca.nome
            );

          }
        );


        setComarcas(
          mapaComarcas
        );

      }

      else {

        setComarcas(
          new Map()
        );

      }


      /*
      ========================================
      CONTATOS DAS PERMUTAS CONFIRMADAS
      ========================================
      */

      const confirmadas =
        lista.filter(
          item =>
            item.status ===
            "confirmado"
        );


      const contatosCarregados:
        Record<
          string,
          ContatoPermuta[]
        > = {};


      await Promise.all(

        confirmadas.map(
          async solicitacao => {

            const {
              data: dadosContatos,
              error: erroContatos
            } = await supabase.rpc(
              "buscar_contatos_permuta_confirmada",
              {
                p_solicitacao_id:
                  solicitacao.id,

                p_usuario_id:
                  usuarioId
              }
            );


            if (erroContatos) {

              console.error(
                "Erro ao buscar contatos da permuta:",
                erroContatos
              );

              return;

            }


            contatosCarregados[
              solicitacao.id
            ] =
              (
                dadosContatos ?? []
              ) as ContatoPermuta[];

          }
        )

      );


      setContatos(
        contatosCarregados
      );

    }

    catch(error) {

      console.error(
        "Erro ao carregar propostas:",
        error
      );


      setMensagemErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as propostas."
      );

    }

    finally {

      setCarregando(false);

    }

  }


  useEffect(() => {

    if (!usuarioId) {
      return;
    }


    carregarPropostas();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId]);


  /* ======================================================
     ACEITAR
  ====================================================== */

  async function aceitarProposta(
    solicitacao: Solicitacao
  ) {

    setProcessando(
      solicitacao.id
    );


    setMensagemErro("");
    setMensagemSucesso("");


    try {

      const funcao =

        solicitacao.tipo ===
        "direta"

          ? "aceitar_permuta_direta"

          : "aceitar_permuta_ciclo_3";


      const {
        error
      } = await supabase.rpc(
        funcao,
        {
          p_solicitacao_id:
            solicitacao.id,

          p_usuario_id:
            usuarioId
        }
      );


      if (error) {
        throw error;
      }


      await carregarPropostas(
        false
      );


      setMensagemSucesso(
        "Seu aceite foi registrado com sucesso."
      );


      window.dispatchEvent(
        new Event(
          "atualizar-notificacoes"
        )
      );

    }

    catch(error) {

      console.error(
        "Erro ao aceitar proposta:",
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
     CANCELAR / RECUSAR
  ====================================================== */

  function abrirCancelamento(
    solicitacao: Solicitacao
  ) {

    setMensagemErro("");
    setMensagemSucesso("");

    setPropostaCancelamento(
      solicitacao
    );

  }


  async function cancelarProposta(
    solicitacao: Solicitacao
  ) {

    setProcessando(
      solicitacao.id
    );


    setMensagemErro("");
    setMensagemSucesso("");


    try {

      const funcao =

        solicitacao.tipo ===
        "direta"

          ? "cancelar_permuta_direta"

          : "cancelar_permuta_ciclo_3";


      const {
        error
      } = await supabase.rpc(
        funcao,
        {
          p_solicitacao_id:
            solicitacao.id,

          p_usuario_id:
            usuarioId
        }
      );


      if (error) {
        throw error;
      }


      setPropostaCancelamento(
        null
      );


      await carregarPropostas(
        false
      );


      setMensagemSucesso(
        "A proposta foi cancelada."
      );


      window.dispatchEvent(
        new Event(
          "atualizar-notificacoes"
        )
      );

    }

    catch(error) {

      console.error(
        "Erro ao cancelar proposta:",
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
     ABRIR ENCERRAMENTO
  ====================================================== */

  function abrirEncerramento(
    solicitacao: Solicitacao
  ) {

    setMensagemErro("");
    setMensagemSucesso("");

    setPropostaEncerramento(
      solicitacao
    );

  }


  /* ======================================================
     ENCERRAR PERMUTA
  ====================================================== */

  async function encerrarPermuta(
    deuCerto: boolean
  ) {

    if (
      !propostaEncerramento
    ) {

      return;

    }


    setProcessandoEncerramento(
      true
    );


    setMensagemErro("");
    setMensagemSucesso("");


    try {

      const {
        error
      } = await supabase.rpc(
        "encerrar_permuta",
        {
          p_solicitacao_id:
            propostaEncerramento.id,

          p_usuario_id:
            usuarioId,

          p_deu_certo:
            deuCerto
        }
      );


      if (error) {
        throw error;
      }


      setPropostaEncerramento(
        null
      );


      await carregarPropostas(
        false
      );


      if (deuCerto) {

        setMensagemSucesso(
          "Permuta concluída com sucesso. Seu perfil está novamente disponível para novas oportunidades."
        );

      }

      else {

        setMensagemSucesso(
          "Permuta encerrada sem sucesso. Seu perfil está novamente disponível para novas oportunidades."
        );

      }


      window.dispatchEvent(
        new Event(
          "atualizar-notificacoes"
        )
      );


      /*
      ========================================
      AVALIAÇÃO APÓS PERMUTA COM SUCESSO
      ========================================

      A página Início já detecta avaliações
      pendentes e abre o modal automaticamente.

      Portanto, após encerrar uma permuta com
      sucesso, enviamos o usuário diretamente
      para o Início. Assim ele não precisa
      navegar manualmente para encontrar a
      avaliação.

      Se o usuário fechar a avaliação sem
      responder, ela continua pendente e poderá
      reaparecer posteriormente no Início.
      */

      if (deuCerto) {

        router.push(
          "/dashboard"
        );

        router.refresh();

      }

    }

    catch(error) {

      console.error(
        "Erro ao encerrar permuta:",
        error
      );


      setMensagemErro(
        extrairMensagemErro(
          error
        )
      );

    }

    finally {

      setProcessandoEncerramento(
        false
      );

    }

  }


  /* ======================================================
     LIMPAR HISTÓRICO VISUAL
  ====================================================== */

  async function limparHistorico() {

    const statusEncerrados =
      new Set([
        "concluido",
        "encerrado_sem_sucesso",
        "cancelado",
        "cancelado_indisponibilidade"
      ]);


    const encerradas =
      solicitacoes.filter(
        item =>
          statusEncerrados.has(
            item.status
          )
      );


    if (
      encerradas.length === 0
    ) {

      setMostrarLimparHistorico(
        false
      );

      setMensagemSucesso(
        "Não há propostas encerradas ou canceladas para limpar."
      );

      return;

    }


    setProcessandoLimpeza(
      true
    );

    setMensagemErro("");
    setMensagemSucesso("");


    try {

      const registros =
        encerradas.map(
          item => ({
            usuario_id:
              usuarioId,

            solicitacao_id:
              item.id
          })
        );


      const {
        error
      } = await supabase
        .from(
          "propostas_ocultas_usuario"
        )
        .upsert(
          registros,
          {
            onConflict:
              "usuario_id,solicitacao_id"
          }
        );


      if (error) {
        throw error;
      }


      setSolicitacoes(
        anteriores =>
          anteriores.filter(
            item =>
              !statusEncerrados.has(
                item.status
              )
          )
      );


      setMostrarLimparHistorico(
        false
      );


      setMensagemSucesso(
        "O histórico de propostas encerradas e canceladas foi limpo desta página."
      );

    }

    catch(error) {

      console.error(
        "Erro ao limpar histórico de propostas:",
        error
      );


      setMensagemErro(
        extrairMensagemErro(
          error
        )
      );

    }

    finally {

      setProcessandoLimpeza(
        false
      );

    }

  }


  /* ======================================================
     SEPARAÇÃO
  ====================================================== */

  const propostasRecebidas =
    solicitacoes.filter(
      item =>
        item.solicitante_id !==
        usuarioId
    );


  const propostasEnviadas =
    solicitacoes.filter(
      item =>
        item.solicitante_id ===
        usuarioId
    );


  const possuiHistorico =
    solicitacoes.some(
      item =>
        [
          "concluido",
          "encerrado_sem_sucesso",
          "cancelado",
          "cancelado_indisponibilidade"
        ].includes(
          item.status
        )
    );


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

          <div className="
            flex
            flex-wrap
            items-start
            justify-between
            gap-4
          ">

            <div>

              <h1 className="
                text-3xl
                font-bold
                text-slate-900
              ">

                Propostas

              </h1>


              <p className="
                mt-2
                text-slate-500
              ">

                Acompanhe as propostas de permuta enviadas e recebidas.

              </p>

            </div>


            {
              possuiHistorico && (

                <button
                  type="button"

                  onClick={() =>
                    setMostrarLimparHistorico(
                      true
                    )
                  }

                  className="
                    inline-flex
                    items-center
                    gap-2
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
                  "
                >

                  <Trash2
                    size={17}
                  />

                  Limpar histórico

                </button>

              )
            }

          </div>


          {/* SUCESSO */}

          {
            mensagemSucesso && (

              <div className="
                flex
                items-start
                gap-3
                rounded-xl
                border
                border-green-200
                bg-green-50
                p-4
                text-sm
                text-green-800
              ">

                <CheckCircle2
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

                    Operação realizada

                  </p>


                  <p className="
                    mt-1
                  ">

                    {mensagemSucesso}

                  </p>

                </div>

              </div>

            )
          }


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

                Carregando propostas...

              </div>

            )

            : (

              <>

                <SecaoPropostas
                  titulo="Propostas recebidas"

                  vazio="
                    Você ainda não recebeu nenhuma proposta.
                  "

                  propostas={
                    propostasRecebidas
                  }

                  usuarioId={
                    usuarioId
                  }

                  nomes={
                    nomes
                  }

                  comarcas={
                    comarcas
                  }

                  contatos={
                    contatos
                  }

                  processando={
                    processando
                  }

                  onAceitar={
                    aceitarProposta
                  }

                  onCancelar={
                    abrirCancelamento
                  }

                  onEncerrar={
                    abrirEncerramento
                  }
                />


                <SecaoPropostas
                  titulo="Propostas enviadas"

                  vazio="
                    Você ainda não enviou nenhuma proposta.
                  "

                  propostas={
                    propostasEnviadas
                  }

                  usuarioId={
                    usuarioId
                  }

                  nomes={
                    nomes
                  }

                  comarcas={
                    comarcas
                  }

                  contatos={
                    contatos
                  }

                  processando={
                    processando
                  }

                  onAceitar={
                    aceitarProposta
                  }

                  onCancelar={
                    abrirCancelamento
                  }

                  onEncerrar={
                    abrirEncerramento
                  }
                />

              </>

            )
          }


        </div>


        {/* =================================================
            MODAL CANCELAR / RECUSAR PROPOSTA
        ================================================= */}

        {
          propostaCancelamento && (

            <ModalCancelarProposta
              proposta={
                propostaCancelamento
              }

              processando={
                processando ===
                propostaCancelamento.id
              }

              onFechar={() =>
                setPropostaCancelamento(
                  null
                )
              }

              onConfirmar={() =>
                cancelarProposta(
                  propostaCancelamento
                )
              }
            />

          )
        }


        {/* =================================================
            MODAL LIMPAR HISTÓRICO
        ================================================= */}

        {
          mostrarLimparHistorico && (

            <ModalLimparHistorico
              processando={
                processandoLimpeza
              }

              onFechar={() =>
                setMostrarLimparHistorico(
                  false
                )
              }

              onConfirmar={
                limparHistorico
              }
            />

          )
        }


        {/* =================================================
            MODAL ENCERRAR PERMUTA
        ================================================= */}

        {
          propostaEncerramento && (

            <ModalEncerrarPermuta
              proposta={
                propostaEncerramento
              }

              processando={
                processandoEncerramento
              }

              onFechar={() =>
                setPropostaEncerramento(
                  null
                )
              }

              onSucesso={() =>
                encerrarPermuta(
                  true
                )
              }

              onSemSucesso={() =>
                encerrarPermuta(
                  false
                )
              }
            />

          )
        }


      </DashboardLayout>

    </AuthGuard>

  );

}


/* ======================================================
   SEÇÃO
====================================================== */

function SecaoPropostas({
  titulo,
  vazio,
  propostas,
  usuarioId,
  nomes,
  comarcas,
  contatos,
  processando,
  onAceitar,
  onCancelar,
  onEncerrar
}: {
  titulo: string;

  vazio: string;

  propostas: Solicitacao[];

  usuarioId: string;

  nomes: Map<string, string>;

  comarcas: Map<number, string>;

  contatos:
    Record<
      string,
      ContatoPermuta[]
    >;

  processando: string | null;

  onAceitar: (
    solicitacao: Solicitacao
  ) => void;

  onCancelar: (
    solicitacao: Solicitacao
  ) => void;

  onEncerrar: (
    solicitacao: Solicitacao
  ) => void;
}) {

  return (

    <section className="
      overflow-hidden
      rounded-2xl
      border
      border-slate-200
      bg-white
      shadow-sm
    ">


      <div className="
        border-b
        border-slate-100
        bg-slate-50/70
        px-6
        py-5
      ">

        <h2 className="
          text-2xl
          font-bold
          text-slate-900
        ">

          {titulo}

        </h2>

      </div>


      <div className="
        space-y-4
        p-6
      ">


        {
          propostas.length === 0

          ? (

            <div className="
              rounded-xl
              border
              border-dashed
              border-slate-300
              bg-slate-50
              p-7
              text-center
              text-sm
              text-slate-500
            ">

              {vazio}

            </div>

          )

          : (

            propostas.map(
              proposta => (

                <CardProposta
                  key={
                    proposta.id
                  }

                  proposta={
                    proposta
                  }

                  usuarioId={
                    usuarioId
                  }

                  nomes={
                    nomes
                  }

                  comarcas={
                    comarcas
                  }

                  contatos={
                    contatos[
                      proposta.id
                    ] ?? []
                  }

                  processando={
                    processando ===
                    proposta.id
                  }

                  onAceitar={() =>
                    onAceitar(
                      proposta
                    )
                  }

                  onCancelar={() =>
                    onCancelar(
                      proposta
                    )
                  }

                  onEncerrar={() =>
                    onEncerrar(
                      proposta
                    )
                  }
                />

              )
            )

          )
        }


      </div>

    </section>

  );

}


/* ======================================================
   CARD
====================================================== */

function CardProposta({
  proposta,
  usuarioId,
  nomes,
  comarcas,
  contatos,
  processando,
  onAceitar,
  onCancelar,
  onEncerrar
}: {
  proposta: Solicitacao;

  usuarioId: string;

  nomes: Map<string, string>;

  comarcas: Map<number, string>;

  contatos: ContatoPermuta[];

  processando: boolean;

  onAceitar: () => void;

  onCancelar: () => void;

  onEncerrar: () => void;
}) {

  const direta =
    proposta.tipo ===
    "direta";


  const ciclo3 =
    proposta.tipo ===
    "ciclo_3";


  const pendente =
    proposta.status ===
    "aguardando_aceite";


  const confirmado =
    proposta.status ===
    "confirmado";


  const concluido =
    proposta.status ===
    "concluido";


  const semSucesso =
    proposta.status ===
    "encerrado_sem_sucesso";


  const cancelado =
    proposta.status ===
    "cancelado";


  const indisponibilidade =
    proposta.status ===
    "cancelado_indisponibilidade";


  const enviadoPorMim =
    proposta.solicitante_id ===
    usuarioId;


  const usuarioJaAceitou =
    obterAceiteUsuario(
      proposta,
      usuarioId
    );


  const podeAceitar =
    pendente &&
    !usuarioJaAceitou;


  const podeCancelar =
    pendente;


  const participantes = [

    {
      id:
        proposta.participante_1,

      origem:
        proposta.origem_1,

      destino:
        proposta.destino_1,

      aceite:
        proposta.participante_1_aceite
    },

    {
      id:
        proposta.participante_2,

      origem:
        proposta.origem_2,

      destino:
        proposta.destino_2,

      aceite:
        proposta.participante_2_aceite
    },

    ...(ciclo3 && proposta.participante_3

      ? [

          {
            id:
              proposta.participante_3,

            origem:
              proposta.origem_3,

            destino:
              proposta.destino_3,

            aceite:
              proposta.participante_3_aceite
          }

        ]

      : [])

  ];


  return (

    <article className="
      rounded-2xl
      border
      border-slate-200
      bg-white
      p-5
    ">


      {/* TOPO */}

      <div className="
        flex
        flex-wrap
        items-start
        justify-between
        gap-4
      ">


        <div>

          <div className="
            text-lg
            font-bold
            text-slate-900
          ">

            {
              direta
                ? "Permuta direta"
                : "Permuta em cadeia"
            }

          </div>


          <Status
            status={
              proposta.status
            }
          />

        </div>


        <div className="
          text-sm
          text-slate-500
        ">

          {
            new Date(
              proposta.created_at
            ).toLocaleDateString(
              "pt-BR"
            )
          }

        </div>

      </div>


      {/* EXPLICAÇÃO CICLO */}

      {
        ciclo3 && (

          <div className="
            mt-5
            rounded-xl
            bg-blue-50
            px-4
            py-3
            text-sm
            leading-6
            text-blue-800
          ">

            Nesta permuta, cada servidor se movimenta para a comarca indicada abaixo. A permuta será confirmada somente quando os três participantes aceitarem.

          </div>

        )
      }


      {/* PARTICIPANTES */}

      <div
        className={[
          "mt-5 grid gap-4",

          direta
            ? "md:grid-cols-2"
            : "lg:grid-cols-3"

        ].join(" ")}
      >

        {
          participantes.map(
            participante => (

              <Movimento
                key={
                  participante.id
                }

                nome={
                  nomes.get(
                    participante.id
                  )
                  ||
                  "Servidor TJSP"
                }

                origem={
                  nomeComarca(
                    comarcas,
                    participante.origem
                  )
                }

                destino={
                  nomeComarca(
                    comarcas,
                    participante.destino
                  )
                }

                voce={
                  participante.id ===
                  usuarioId
                }

                aceite={
                  Boolean(
                    participante.aceite
                  )
                }

                mostrarAceite={
                  pendente ||
                  confirmado
                }
              />

            )
          )
        }

      </div>


      {/* SITUAÇÃO ACEITES */}

      {
        pendente && (

          <ResumoAceites
            proposta={
              proposta
            }

            nomes={
              nomes
            }

            usuarioId={
              usuarioId
            }
          />

        )
      }


      {/* AÇÕES PENDENTES */}

      {
        pendente && (

          <div className="
            mt-5
            flex
            flex-wrap
            gap-3
          ">


            {
              podeAceitar && (

                <button
                  type="button"

                  disabled={
                    processando
                  }

                  onClick={
                    onAceitar
                  }

                  className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-green-600
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-green-700
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >

                  <CheckCircle2
                    size={17}
                  />


                  {
                    processando
                      ? "Processando..."
                      : "Aceitar proposta"
                  }

                </button>

              )
            }


            {
              usuarioJaAceitou && (

                <div className="
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-green-50
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-green-700
                ">

                  <CheckCircle2
                    size={17}
                  />

                  Você já aceitou

                </div>

              )
            }


            {
              podeCancelar && (

                <button
                  type="button"

                  disabled={
                    processando
                  }

                  onClick={
                    onCancelar
                  }

                  className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-red-700
                    transition
                    hover:bg-red-100
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >

                  <XCircle
                    size={17}
                  />


                  {
                    enviadoPorMim

                      ? "Cancelar proposta"

                      : usuarioJaAceitou

                      ? "Cancelar participação"

                      : "Recusar proposta"
                  }

                </button>

              )
            }


          </div>

        )
      }


      {/* CONFIRMADA */}

      {
        confirmado && (

          <>

            <div className="
              mt-5
              rounded-xl
              border
              border-green-200
              bg-green-50
              p-4
            ">

              <div className="
                flex
                items-start
                gap-3
              ">

                <CheckCircle2
                  className="
                    mt-0.5
                    h-5
                    w-5
                    shrink-0
                    text-green-700
                  "
                />


                <div>

                  <p className="
                    text-sm
                    font-bold
                    text-green-800
                  ">

                    {
                      direta
                        ? "Permuta confirmada"
                        : "Permuta em cadeia confirmada"
                    }

                  </p>


                  <p className="
                    mt-1
                    text-sm
                    leading-6
                    text-green-700
                  ">

                    {
                      direta

                        ? "Os dois participantes aceitaram a proposta."

                        : "Os três participantes aceitaram a proposta."
                    }

                    {" "}

                    Os dados de contato dos demais participantes estão disponíveis abaixo.

                  </p>

                </div>

              </div>

            </div>


            <ContatosConfirmados
              contatos={
                contatos
              }
            />


            {/* ENCERRAR */}

            <div className="
              mt-5
              border-t
              border-slate-200
              pt-5
            ">

              <p className="
                text-sm
                font-semibold
                text-slate-800
              ">

                A permuta já foi resolvida?

              </p>


              <p className="
                mt-1
                text-sm
                text-slate-500
              ">

                Quando houver uma definição entre os participantes, encerre a permuta para liberar os perfis para novas oportunidades.

              </p>


              <button
                type="button"

                onClick={
                  onEncerrar
                }

                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
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
                  hover:border-blue-300
                  hover:bg-blue-50
                  hover:text-blue-900
                "
              >

                <CheckCircle2
                  size={17}
                />

                Encerrar permuta

              </button>

            </div>

          </>

        )
      }


      {/* CONCLUÍDA */}

      {
        concluido && (

          <div className="
            mt-5
            rounded-xl
            border
            border-blue-200
            bg-blue-50
            p-4
          ">

            <div className="
              flex
              items-start
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
                  font-bold
                  text-blue-900
                ">

                  Permuta concluída com sucesso

                </p>


                <p className="
                  mt-1
                  text-sm
                  leading-6
                  text-blue-800
                ">

                  Os participantes informaram que a permuta foi concluída. Este registro permanecerá no histórico e seu perfil está disponível para novas oportunidades.

                </p>

              </div>

            </div>

          </div>

        )
      }


      {/* SEM SUCESSO */}

      {
        semSucesso && (

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
              font-bold
              text-slate-800
            ">

              Permuta encerrada sem sucesso

            </p>


            <p className="
              mt-1
              text-sm
              leading-6
              text-slate-600
            ">

              Os participantes não concluíram esta permuta. O registro foi mantido no histórico e seu perfil voltou a ficar disponível para novas oportunidades.

            </p>

          </div>

        )
      }


      {/* CANCELADA */}

      {
        cancelado && (

          <div className="
            mt-5
            rounded-xl
            bg-slate-100
            p-4
            text-sm
            text-slate-600
          ">

            Esta proposta foi cancelada por um dos participantes.

          </div>

        )
      }


      {/* INDISPONIBILIDADE */}

      {
        indisponibilidade && (

          <div className="
            mt-5
            rounded-xl
            border
            border-amber-200
            bg-amber-50
            p-4
          ">

            <p className="
              text-sm
              font-semibold
              text-amber-800
            ">

              Esta proposta não está mais disponível.

            </p>


            <p className="
              mt-1
              text-sm
              leading-6
              text-amber-700
            ">

              Ela foi encerrada automaticamente porque um dos participantes confirmou outra permuta. Quando existem várias propostas, a primeira que for confirmada permanece ativa e as demais são encerradas automaticamente.

            </p>

          </div>

        )
      }


    </article>

  );

}


/* ======================================================
   MODAL ENCERRAR
====================================================== */

function ModalCancelarProposta({
  proposta,
  processando,
  onFechar,
  onConfirmar
}: {
  proposta: Solicitacao;

  processando: boolean;

  onFechar: () => void;

  onConfirmar: () => void;
}) {

  const tipoPermuta =
    proposta.tipo === "direta"
      ? "permuta direta"
      : "permuta em cadeia";


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

              Confirmar cancelamento

            </h2>


            <p className="
              mt-1
              text-sm
              text-slate-500
            ">

              Esta ação não poderá ser desfeita.

            </p>

          </div>


          <button
            type="button"

            aria-label="Fechar"

            disabled={
              processando
            }

            onClick={
              onFechar
            }

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

            <XCircle
              size={24}
            />

          </div>


          <h3 className="
            mt-4
            text-lg
            font-bold
            text-slate-900
          ">

            Tem certeza de que deseja cancelar esta proposta?

          </h3>


          <p className="
            mt-2
            text-sm
            leading-6
            text-slate-600
          ">

            Você está cancelando uma {tipoPermuta}. Os demais participantes serão avisados do cancelamento. A proposta deixará de ficar ativa.

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

              Voltar

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

              <XCircle
                size={17}
              />

              {
                processando
                  ? "Cancelando..."
                  : "Sim, cancelar proposta"
              }

            </button>

          </div>

        </div>

      </div>

    </div>

  );

}


/* ======================================================
   MODAL LIMPAR HISTÓRICO
====================================================== */

function ModalLimparHistorico({
  processando,
  onFechar,
  onConfirmar
}: {
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

              Limpar histórico

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

            aria-label="Fechar"

            disabled={
              processando
            }

            onClick={
              onFechar
            }

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
            bg-slate-100
            text-slate-700
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

            Limpar histórico de propostas?

          </h3>


          <p className="
            mt-2
            text-sm
            leading-6
            text-slate-600
          ">

            As propostas encerradas ou canceladas deixarão de aparecer nesta página. Propostas em andamento ou aguardando aceite não serão afetadas.

          </p>


          <p className="
            mt-3
            text-xs
            leading-5
            text-slate-500
          ">

            Esta ação apenas limpa a sua visualização. Os registros necessários para o funcionamento e as estatísticas da plataforma serão preservados.

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
                bg-slate-900
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-slate-800
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <Trash2
                size={16}
              />

              {
                processando
                  ? "Limpando..."
                  : "Limpar histórico"
              }

            </button>

          </div>

        </div>

      </div>

    </div>

  );

}


/* ======================================================
   MODAL ENCERRAR
====================================================== */

function ModalEncerrarPermuta({
  proposta,
  processando,
  onFechar,
  onSucesso,
  onSemSucesso
}: {
  proposta: Solicitacao;

  processando: boolean;

  onFechar: () => void;

  onSucesso: () => void;

  onSemSucesso: () => void;
}) {

  const direta =
    proposta.tipo ===
    "direta";


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
        max-w-lg
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

              Encerrar permuta

            </h2>


            <p className="
              mt-1
              text-sm
              text-slate-500
            ">

              {
                direta
                  ? "Permuta direta"
                  : "Permuta em cadeia"
              }

            </p>

          </div>


          <button
            type="button"

            aria-label="Fechar"

            disabled={
              processando
            }

            onClick={
              onFechar
            }

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
            bg-blue-50
            text-blue-900
          ">

            <CheckCircle2
              size={24}
            />

          </div>


          <h3 className="
            mt-4
            text-xl
            font-bold
            text-slate-900
          ">

            A permuta deu certo?

          </h3>


          <p className="
            mt-2
            text-sm
            leading-6
            text-slate-600
          ">

            Esta resposta encerrará a permuta para todos os participantes e liberará os perfis para novas oportunidades.

          </p>


          <div className="
            mt-6
            space-y-3
          ">


            {/* SIM */}

            <button
              type="button"

              disabled={
                processando
              }

              onClick={
                onSucesso
              }

              className="
                flex
                w-full
                items-start
                gap-3
                rounded-xl
                border
                border-green-200
                bg-green-50
                p-4
                text-left
                transition
                hover:border-green-300
                hover:bg-green-100
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <CheckCircle2
                className="
                  mt-0.5
                  h-5
                  w-5
                  shrink-0
                  text-green-700
                "
              />


              <div>

                <p className="
                  text-sm
                  font-bold
                  text-green-800
                ">

                  Sim, concluímos a troca

                </p>


                <p className="
                  mt-1
                  text-xs
                  leading-5
                  text-green-700
                ">

                  A permuta será registrada como concluída com sucesso.

                </p>

              </div>

            </button>


            {/* NÃO */}

            <button
              type="button"

              disabled={
                processando
              }

              onClick={
                onSemSucesso
              }

              className="
                flex
                w-full
                items-start
                gap-3
                rounded-xl
                border
                border-red-200
                bg-red-50
                p-4
                text-left
                transition
                hover:border-red-300
                hover:bg-red-100
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <XCircle
                className="
                  mt-0.5
                  h-5
                  w-5
                  shrink-0
                  text-red-700
                "
              />


              <div>

                <p className="
                  text-sm
                  font-bold
                  text-red-800
                ">

                  Não, não deu certo

                </p>


                <p className="
                  mt-1
                  text-xs
                  leading-5
                  text-red-700
                ">

                  A permuta será encerrada sem sucesso e os participantes serão liberados.

                </p>

              </div>

            </button>

          </div>


          <button
            type="button"

            disabled={
              processando
            }

            onClick={
              onFechar
            }

            className="
              mt-5
              w-full
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

            {
              processando
                ? "Processando..."
                : "Voltar"
            }

          </button>

        </div>


      </div>

    </div>

  );

}


/* ======================================================
   RESUMO DOS ACEITES
====================================================== */

function ResumoAceites({
  proposta,
  nomes,
  usuarioId
}: {
  proposta: Solicitacao;

  nomes: Map<string, string>;

  usuarioId: string;
}) {

  const participantes = [

    {
      id:
        proposta.participante_1,

      aceite:
        Boolean(
          proposta.participante_1_aceite
        )
    },

    {
      id:
        proposta.participante_2,

      aceite:
        Boolean(
          proposta.participante_2_aceite
        )
    },

    ...(proposta.tipo === "ciclo_3" &&
       proposta.participante_3

      ? [

          {
            id:
              proposta.participante_3,

            aceite:
              Boolean(
                proposta.participante_3_aceite
              )
          }

        ]

      : [])

  ];


  return (

    <div className="
      mt-5
      rounded-xl
      border
      border-slate-200
      bg-slate-50
      p-4
    ">

      <p className="
        text-xs
        font-bold
        uppercase
        tracking-wide
        text-slate-500
      ">

        Situação dos aceites

      </p>


      <div className="
        mt-3
        space-y-2
      ">

        {
          participantes.map(
            participante => {

              const voce =
                participante.id ===
                usuarioId;


              return (

                <div
                  key={
                    participante.id
                  }

                  className="
                    flex
                    flex-wrap
                    items-center
                    justify-between
                    gap-3
                  "
                >

                  <span className="
                    text-sm
                    font-medium
                    text-slate-700
                  ">

                    {
                      nomes.get(
                        participante.id
                      )
                      ||
                      "Servidor TJSP"
                    }

                    {
                      voce &&
                      " (Você)"
                    }

                  </span>


                  {
                    participante.aceite

                      ? (

                        <span className="
                          inline-flex
                          items-center
                          gap-1.5
                          rounded-full
                          bg-green-100
                          px-2.5
                          py-1
                          text-xs
                          font-semibold
                          text-green-700
                        ">

                          <CheckCircle2
                            size={13}
                          />

                          Aceitou

                        </span>

                      )

                      : (

                        <span className="
                          inline-flex
                          items-center
                          gap-1.5
                          rounded-full
                          bg-amber-100
                          px-2.5
                          py-1
                          text-xs
                          font-semibold
                          text-amber-700
                        ">

                          <Clock3
                            size={13}
                          />

                          Aguardando

                        </span>

                      )
                  }

                </div>

              );

            }
          )
        }

      </div>

    </div>

  );

}


/* ======================================================
   MOVIMENTO
====================================================== */

function Movimento({
  nome,
  origem,
  destino,
  voce,
  aceite,
  mostrarAceite
}: {
  nome: string;

  origem: string;

  destino: string;

  voce: boolean;

  aceite: boolean;

  mostrarAceite: boolean;
}) {

  return (

    <div className="
      rounded-xl
      border
      border-slate-200
      p-4
    ">


      <div className="
        flex
        flex-wrap
        items-start
        justify-between
        gap-2
      ">


        <div className="
          flex
          flex-wrap
          items-center
          gap-2
          font-semibold
          text-slate-900
        ">

          {nome}


          {
            voce && (

              <span className="
                rounded-full
                bg-blue-600
                px-2
                py-0.5
                text-xs
                text-white
              ">

                Você

              </span>

            )
          }

        </div>


        {
          mostrarAceite && (

            aceite

              ? (

                <span
                  title="Participante aceitou"

                  className="
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-full
                    bg-green-100
                    text-green-700
                  "
                >

                  <CheckCircle2
                    size={16}
                  />

                </span>

              )

              : (

                <span
                  title="Aguardando aceite"

                  className="
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-full
                    bg-amber-100
                    text-amber-700
                  "
                >

                  <Clock3
                    size={15}
                  />

                </span>

              )

          )
        }

      </div>


      <div className="
        mt-3
        flex
        items-center
        gap-2
        text-sm
        text-slate-600
      ">

        <span>
          {origem}
        </span>


        <ArrowRight
          size={16}
          className="
            shrink-0
          "
        />


        <span className="
          font-semibold
          text-blue-700
        ">

          {destino}

        </span>

      </div>


    </div>

  );

}


/* ======================================================
   CONTATOS
====================================================== */

function ContatosConfirmados({
  contatos
}: {
  contatos: ContatoPermuta[];
}) {

  return (

    <div className="
      mt-5
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
        contatos.length === 0

          ? (

            <div className="
              mt-3
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-4
              text-sm
              text-slate-500
            ">

              Os contatos não puderam ser carregados neste momento.

            </div>

          )

          : (

            <div className="
              mt-3
              grid
              gap-4
              md:grid-cols-2
            ">

              {
                contatos.map(
                  contato => (

                    <div
                      key={
                        contato.perfil_id
                      }

                      className="
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


                          <div>

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

                  )
                )
              }

            </div>

          )
      }

    </div>

  );

}


/* ======================================================
   STATUS
====================================================== */

function Status({
  status
}: {
  status: string;
}) {

  if (
    status ===
    "aguardando_aceite"
  ) {

    return (

      <div className="
        mt-2
        inline-flex
        items-center
        gap-2
        rounded-full
        bg-amber-50
        px-3
        py-1
        text-xs
        font-semibold
        text-amber-700
      ">

        <Clock3
          size={14}
        />

        Aguardando aceite

      </div>

    );

  }


  if (
    status ===
    "confirmado"
  ) {

    return (

      <div className="
        mt-2
        inline-flex
        items-center
        gap-2
        rounded-full
        bg-green-50
        px-3
        py-1
        text-xs
        font-semibold
        text-green-700
      ">

        <CheckCircle2
          size={14}
        />

        Confirmada

      </div>

    );

  }


  if (
    status ===
    "concluido"
  ) {

    return (

      <div className="
        mt-2
        inline-flex
        items-center
        gap-2
        rounded-full
        bg-blue-50
        px-3
        py-1
        text-xs
        font-semibold
        text-blue-700
      ">

        <CheckCircle2
          size={14}
        />

        Concluída com sucesso

      </div>

    );

  }


  if (
    status ===
    "encerrado_sem_sucesso"
  ) {

    return (

      <div className="
        mt-2
        inline-flex
        items-center
        gap-2
        rounded-full
        bg-slate-100
        px-3
        py-1
        text-xs
        font-semibold
        text-slate-600
      ">

        <XCircle
          size={14}
        />

        Encerrada sem sucesso

      </div>

    );

  }


  if (
    status ===
    "cancelado_indisponibilidade"
  ) {

    return (

      <div className="
        mt-2
        inline-flex
        items-center
        gap-2
        rounded-full
        bg-amber-50
        px-3
        py-1
        text-xs
        font-semibold
        text-amber-700
      ">

        <XCircle
          size={14}
        />

        Encerrada automaticamente

      </div>

    );

  }


  return (

    <div className="
      mt-2
      inline-flex
      items-center
      gap-2
      rounded-full
      bg-slate-100
      px-3
      py-1
      text-xs
      font-semibold
      text-slate-600
    ">

      <XCircle
        size={14}
      />

      Cancelada

    </div>

  );

}


/* ======================================================
   UTILITÁRIOS
====================================================== */

function obterAceiteUsuario(
  proposta: Solicitacao,
  usuarioId: string
) {

  if (
    proposta.participante_1 ===
    usuarioId
  ) {

    return Boolean(
      proposta.participante_1_aceite
    );

  }


  if (
    proposta.participante_2 ===
    usuarioId
  ) {

    return Boolean(
      proposta.participante_2_aceite
    );

  }


  if (
    proposta.participante_3 ===
    usuarioId
  ) {

    return Boolean(
      proposta.participante_3_aceite
    );

  }


  return false;

}


function nomeComarca(
  comarcas: Map<number, string>,
  id?: number | null
) {

  if (
    typeof id !==
    "number"
  ) {

    return "-";

  }


  return (
    comarcas.get(id)
    ||
    "-"
  );

}


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