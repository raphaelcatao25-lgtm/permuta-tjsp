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


interface PermutaManualResumo {
  ciclo_id: string;
  criado_por: string;
  tipo: string;
  quantidade_participantes: number;
  status: string;
  mensagem: string | null;
  created_at: string;
  minha_ordem: number;
  meu_status_aceite: string;
  meu_respondido_em: string | null;
  enviada_por_mim: boolean;
}


interface PermutaManualDetalhe {
  ciclo_id: string;
  tipo: string;
  status: string;
  quantidade_participantes: number;
  criado_por: string;
  mensagem: string | null;
  created_at: string;
  ordem: number;
  participante_id: string;
  participante_nome: string;
  participante_cargo: string | null;
  origem_comarca_id: number | null;
  origem_comarca_nome: string | null;
  destino_comarca_id: number | null;
  destino_comarca_nome: string | null;
  status_aceite: string;
  respondido_em: string | null;
  eh_criador: boolean;
  pode_ver_contato: boolean;
  email: string | null;
  telefone: string | null;
  teams: string | null;
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
    permutasManuais,
    setPermutasManuais
  ] = useState<PermutaManualResumo[]>([]);


  const [
    detalhesManuais,
    setDetalhesManuais
  ] = useState<
    Record<string, PermutaManualDetalhe[]>
  >({});


  const [
    processandoManual,
    setProcessandoManual
  ] = useState<string | null>(null);


  const [
    permutaManualEncerramento,
    setPermutaManualEncerramento
  ] = useState<PermutaManualResumo | null>(
    null
  );


  const [
    processandoEncerramentoManual,
    setProcessandoEncerramentoManual
  ] = useState(false);


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

          setPermutasManuais([]);

          setDetalhesManuais({});

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


      /*
      ========================================
      PERMUTAS MONTADAS PELO SERVIDOR
      ========================================
      */

      const {
        data: dadosPermutasManuais,
        error: erroPermutasManuais
      } = await supabase.rpc(
        "buscar_permutas_manuais_usuario",
        {
          p_usuario_id:
            usuarioId
        }
      );


      if (erroPermutasManuais) {
        throw erroPermutasManuais;
      }


      const listaPermutasManuais =
        (dadosPermutasManuais ?? []) as PermutaManualResumo[];


      setPermutasManuais(
        listaPermutasManuais
      );


      const detalhesCarregados:
        Record<
          string,
          PermutaManualDetalhe[]
        > = {};


      await Promise.all(
        listaPermutasManuais.map(
          async permuta => {

            const {
              data: dadosDetalhes,
              error: erroDetalhes
            } = await supabase.rpc(
              "buscar_detalhes_permuta_manual",
              {
                p_ciclo_id:
                  permuta.ciclo_id,

                p_usuario_id:
                  usuarioId
              }
            );


            if (erroDetalhes) {

              console.error(
                "Erro ao carregar detalhes da permuta montada:",
                erroDetalhes
              );

              return;

            }


            detalhesCarregados[
              permuta.ciclo_id
            ] =
              (dadosDetalhes ?? []) as PermutaManualDetalhe[];

          }
        )
      );


      setDetalhesManuais(
        detalhesCarregados
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

      /* ==================================================
         REGISTRA O ACEITE
      ================================================== */

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


      /* ==================================================
         TENTA ENVIAR O E-MAIL DE CONFIRMAÇÃO

         O endpoint verifica no servidor se a proposta
         realmente ficou CONFIRMADA.

         Em ciclos de 3, se ainda faltar outro aceite,
         nenhum e-mail de confirmação será enviado.

         IMPORTANTE:
         falha de e-mail nunca desfaz o aceite.
      ================================================== */

      try {

        const {
          data: sessao
        } =
          await supabase.auth.getSession();


        const accessToken =
          sessao.session
            ?.access_token;


        if (accessToken) {

          const respostaEmail =
            await fetch(
              "/api/email/permuta-confirmada",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  "Authorization":
                    `Bearer ${accessToken}`
                },

                body:
                  JSON.stringify({
                    solicitacaoId:
                      solicitacao.id
                  })
              }
            );


          const resultadoEmail =
            await respostaEmail
              .json()
              .catch(
                () => null
              );


          if (
            !respostaEmail.ok
          ) {

            console.error(
              "Aceite registrado, mas ocorreu erro no envio dos e-mails:",
              resultadoEmail
            );

          }

          else if (
            resultadoEmail
              ?.confirmado ===
            false
          ) {

            console.log(
              "Aceite registrado. A permuta ainda aguarda outros participantes."
            );

          }

          else {

            console.log(
              "Processamento dos e-mails de confirmação concluído:",
              resultadoEmail
            );

          }

        }

        else {

          console.warn(
            "Aceite registrado, mas não foi possível obter a sessão para o envio do e-mail."
          );

        }

      }

      catch(erroEmail) {

        console.error(
          "Aceite registrado, mas houve falha no processamento do e-mail:",
          erroEmail
        );

      }


      /* ==================================================
         ATUALIZA A PÁGINA
      ================================================== */

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
     ACEITAR PERMUTA MONTADA
  ====================================================== */

  async function aceitarPermutaManual(
    permuta: PermutaManualResumo
  ) {

    if (!usuarioId) {
      return;
    }


    setProcessandoManual(
      permuta.ciclo_id
    );

    setMensagemErro("");
    setMensagemSucesso("");


    try {

      const {
        error
      } = await supabase.rpc(
        "aceitar_permuta_manual",
        {
          p_ciclo_id:
            permuta.ciclo_id,

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
        "Seu aceite na permuta montada foi registrado com sucesso."
      );


      window.dispatchEvent(
        new Event(
          "atualizar-notificacoes"
        )
      );

    }

    catch(error) {

      console.error(
        "Erro ao aceitar permuta montada:",
        error
      );


      setMensagemErro(
        extrairMensagemErro(
          error
        )
      );

    }

    finally {

      setProcessandoManual(
        null
      );

    }

  }


  /* ======================================================
     CANCELAR PERMUTA MONTADA PELO CRIADOR
  ====================================================== */

  async function cancelarPermutaManual(
    permuta: PermutaManualResumo
  ) {

    if (!usuarioId) {
      return;
    }


    const confirmou =
      window.confirm(
        permuta.tipo === "direta"
          ? "Deseja realmente cancelar esta proposta de permuta direta?"
          : `Deseja realmente cancelar este ciclo de ${permuta.quantidade_participantes} participantes? Os demais participantes serão avisados.`
      );


    if (!confirmou) {
      return;
    }


    setProcessandoManual(
      permuta.ciclo_id
    );

    setMensagemErro("");
    setMensagemSucesso("");


    try {

      const {
        error
      } = await supabase.rpc(
        "cancelar_permuta_manual",
        {
          p_ciclo_id:
            permuta.ciclo_id,

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
        "A proposta de permuta montada foi cancelada."
      );


      window.dispatchEvent(
        new Event(
          "atualizar-notificacoes"
        )
      );

    }

    catch(error) {

      console.error(
        "Erro ao cancelar permuta montada:",
        error
      );


      setMensagemErro(
        extrairMensagemErro(
          error
        )
      );

    }

    finally {

      setProcessandoManual(
        null
      );

    }

  }


  /* ======================================================
     RECUSAR PERMUTA MONTADA
  ====================================================== */

  async function recusarPermutaManual(
    permuta: PermutaManualResumo
  ) {

    if (!usuarioId) {
      return;
    }


    const confirmou =
      window.confirm(
        permuta.tipo === "direta"
          ? "Deseja realmente recusar esta proposta de permuta direta?"
          : "Deseja realmente recusar esta proposta de permuta em cadeia? Ao recusar, o ciclo inteiro será encerrado."
      );


    if (!confirmou) {
      return;
    }


    setProcessandoManual(
      permuta.ciclo_id
    );

    setMensagemErro("");
    setMensagemSucesso("");


    try {

      const {
        error
      } = await supabase.rpc(
        "recusar_permuta_manual",
        {
          p_ciclo_id:
            permuta.ciclo_id,

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
        "A proposta de permuta montada foi recusada."
      );


      window.dispatchEvent(
        new Event(
          "atualizar-notificacoes"
        )
      );

    }

    catch(error) {

      console.error(
        "Erro ao recusar permuta montada:",
        error
      );


      setMensagemErro(
        extrairMensagemErro(
          error
        )
      );

    }

    finally {

      setProcessandoManual(
        null
      );

    }

  }


  /* ======================================================
     ABRIR ENCERRAMENTO DA PERMUTA MONTADA
  ====================================================== */

  function abrirEncerramentoManual(
    permuta: PermutaManualResumo
  ) {

    setMensagemErro("");
    setMensagemSucesso("");

    setPermutaManualEncerramento(
      permuta
    );

  }


  /* ======================================================
     ENCERRAR PERMUTA MONTADA
  ====================================================== */

  async function encerrarPermutaManual(
    resultado: "sucesso" | "sem_sucesso"
  ) {

    if (
      !permutaManualEncerramento ||
      !usuarioId
    ) {
      return;
    }


    setProcessandoEncerramentoManual(
      true
    );

    setMensagemErro("");
    setMensagemSucesso("");


    try {

      const {
        error
      } = await supabase.rpc(
        "encerrar_permuta_manual",
        {
          p_ciclo_id:
            permutaManualEncerramento.ciclo_id,

          p_usuario_id:
            usuarioId,

          p_resultado:
            resultado
        }
      );


      if (error) {
        throw error;
      }


      setPermutaManualEncerramento(
        null
      );


      await carregarPropostas(
        false
      );


      if (resultado === "sucesso") {

        setMensagemSucesso(
          "Permuta concluída com sucesso. Os participantes foram liberados para novas oportunidades."
        );

      }

      else {

        setMensagemSucesso(
          "Permuta encerrada sem sucesso. Os participantes foram liberados para novas oportunidades."
        );

      }


      window.dispatchEvent(
        new Event(
          "atualizar-notificacoes"
        )
      );


      if (resultado === "sucesso") {

        router.push(
          "/dashboard"
        );

        router.refresh();

      }

    }

    catch(error) {

      console.error(
        "Erro ao encerrar permuta montada:",
        error
      );


      setMensagemErro(
        extrairMensagemErro(
          error
        )
      );

    }

    finally {

      setProcessandoEncerramentoManual(
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


  const permutasManuaisRecebidas =
    permutasManuais.filter(
      item =>
        !item.enviada_por_mim
    );


  const permutasManuaisEnviadas =
    permutasManuais.filter(
      item =>
        item.enviada_por_mim
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
                text-white
              ">

                Propostas

              </h1>


              <p className="
                mt-2
                text-slate-400
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
                    border-teal-300/15
                    bg-[#0d2232]
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-slate-300
                    transition
                    hover:bg-[#081b29]
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
                border-emerald-300/20
                bg-emerald-400/[0.08]
                p-4
                text-sm
                text-emerald-200
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
                border-red-400/20
                bg-red-400/[0.08]
                p-4
                text-sm
                text-red-200
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
                border-teal-300/10
                bg-[#0d2232]
                p-8
                text-center
                text-sm
                text-slate-400
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


                <SecaoPermutasManuais
                  titulo="Permutas montadas recebidas"

                  vazio="Você ainda não recebeu nenhuma permuta montada por outro servidor."

                  permutas={
                    permutasManuaisRecebidas
                  }

                  detalhes={
                    detalhesManuais
                  }

                  usuarioId={
                    usuarioId
                  }

                  processando={
                    processandoManual
                  }

                  onAceitar={
                    aceitarPermutaManual
                  }

                  onRecusar={
                    recusarPermutaManual
                  }

                  onCancelar={
                    cancelarPermutaManual
                  }

                  onEncerrar={
                    abrirEncerramentoManual
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


                <SecaoPermutasManuais
                  titulo="Permutas montadas enviadas"

                  vazio="Você ainda não montou nenhuma proposta manual."

                  permutas={
                    permutasManuaisEnviadas
                  }

                  detalhes={
                    detalhesManuais
                  }

                  usuarioId={
                    usuarioId
                  }

                  processando={
                    processandoManual
                  }

                  onAceitar={
                    aceitarPermutaManual
                  }

                  onRecusar={
                    recusarPermutaManual
                  }

                  onCancelar={
                    cancelarPermutaManual
                  }

                  onEncerrar={
                    abrirEncerramentoManual
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


        {
          permutaManualEncerramento && (

            <ModalEncerrarPermutaManual
              permuta={
                permutaManualEncerramento
              }

              processando={
                processandoEncerramentoManual
              }

              onFechar={() =>
                setPermutaManualEncerramento(
                  null
                )
              }

              onSucesso={() =>
                encerrarPermutaManual(
                  "sucesso"
                )
              }

              onSemSucesso={() =>
                encerrarPermutaManual(
                  "sem_sucesso"
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
      border-teal-300/10
      bg-[#0d2232]
      shadow-[0_16px_40px_rgba(0,0,0,0.16)]
    ">


      <div className="
        border-b
        border-teal-300/10
        bg-[#0a1f2f]
        px-6
        py-5
      ">

        <h2 className="
          text-2xl
          font-bold
          text-white
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
              border-teal-300/15
              bg-[#081b29]
              p-7
              text-center
              text-sm
              text-slate-400
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
      border-teal-300/10
      bg-[#081b29]
      p-5
      shadow-[0_12px_30px_rgba(0,0,0,0.14)]
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
            text-white
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
          text-slate-400
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
            border
            border-teal-300/15
            bg-teal-400/[0.06]
            px-4
            py-3
            text-sm
            leading-6
            text-slate-300
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
                    bg-emerald-600
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-white
                    transition-all
                    duration-200
                    hover:-translate-y-[1px]
                    hover:bg-emerald-500
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
                  bg-emerald-400/[0.08]
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-emerald-300
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
                    border-red-400/20
                    bg-red-400/[0.08]
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-red-300
                    transition-all
                    duration-200
                    hover:-translate-y-[1px]
                    hover:bg-red-400/12
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
              border-emerald-300/20
              bg-emerald-400/[0.08]
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
                    text-emerald-300
                  "
                />


                <div>

                  <p className="
                    text-sm
                    font-bold
                    text-emerald-200
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
                    text-emerald-300
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
              border-teal-300/10
              pt-5
            ">

              <p className="
                text-sm
                font-semibold
                text-slate-200
              ">

                A permuta já foi resolvida?

              </p>


              <p className="
                mt-1
                text-sm
                text-slate-400
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
                  border-teal-300/15
                  bg-[#0d2232]
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-300
                  transition
                  hover:border-teal-300/20
                  hover:bg-teal-400/[0.07]
                  hover:text-teal-200
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
            border-teal-300/15
            bg-teal-400/[0.07]
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
                  text-teal-300
                "
              />


              <div>

                <p className="
                  text-sm
                  font-bold
                  text-teal-200
                ">

                  Permuta concluída com sucesso

                </p>


                <p className="
                  mt-1
                  text-sm
                  leading-6
                  text-slate-300
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
            border-teal-300/10
            bg-[#081b29]
            p-4
          ">

            <p className="
              text-sm
              font-bold
              text-slate-200
            ">

              Permuta encerrada sem sucesso

            </p>


            <p className="
              mt-1
              text-sm
              leading-6
              text-slate-400
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
            bg-[#0d2232]/[0.05]
            p-4
            text-sm
            text-slate-400
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
            border-amber-300/20
            bg-amber-400/[0.08]
            p-4
          ">

            <p className="
              text-sm
              font-semibold
              text-amber-200
            ">

              Esta proposta não está mais disponível.

            </p>


            <p className="
              mt-1
              text-sm
              leading-6
              text-amber-300
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
   SEÇÃO DE PERMUTAS MONTADAS
====================================================== */

function SecaoPermutasManuais({
  titulo,
  vazio,
  permutas,
  detalhes,
  usuarioId,
  processando,
  onAceitar,
  onRecusar,
  onCancelar,
  onEncerrar
}: {
  titulo: string;
  vazio: string;
  permutas: PermutaManualResumo[];
  detalhes: Record<string, PermutaManualDetalhe[]>;
  usuarioId: string;
  processando: string | null;
  onAceitar: (permuta: PermutaManualResumo) => void;
  onRecusar: (permuta: PermutaManualResumo) => void;
  onCancelar: (permuta: PermutaManualResumo) => void;
  onEncerrar: (permuta: PermutaManualResumo) => void;
}) {

  return (

    <section className="
      overflow-hidden
      rounded-2xl
      border
      border-cyan-300/10
      bg-[#0d2232]
      shadow-[0_16px_40px_rgba(0,0,0,0.16)]
    ">

      <div className="
        border-b
        border-cyan-300/10
        bg-[#0a1f2f]
        px-6
        py-5
      ">

        <div className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
        ">

          <div>

            <h2 className="
              text-2xl
              font-bold
              text-white
            ">
              {titulo}
            </h2>

            <p className="
              mt-1
              text-sm
              text-slate-400
            ">
              Permutas diretas ou em cadeia montadas manualmente pelos servidores.
            </p>

          </div>

          <span className="
            rounded-full
            border
            border-cyan-300/15
            bg-cyan-400/[0.07]
            px-3
            py-1.5
            text-xs
            font-semibold
            text-cyan-200
          ">
            Nova ferramenta
          </span>

        </div>

      </div>


      <div className="
        space-y-4
        p-6
      ">

        {
          permutas.length === 0

            ? (

              <div className="
                rounded-xl
                border
                border-dashed
                border-cyan-300/15
                bg-[#081b29]
                p-7
                text-center
                text-sm
                text-slate-400
              ">
                {vazio}
              </div>

            )

            : (

              permutas.map(
                permuta => (

                  <CardPermutaManual
                    key={permuta.ciclo_id}
                    permuta={permuta}
                    participantes={detalhes[permuta.ciclo_id] ?? []}
                    usuarioId={usuarioId}
                    processando={processando === permuta.ciclo_id}
                    onAceitar={() => onAceitar(permuta)}
                    onRecusar={() => onRecusar(permuta)}
                    onCancelar={() => onCancelar(permuta)}
                    onEncerrar={() => onEncerrar(permuta)}
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
   CARD DE PERMUTA MONTADA
====================================================== */

function CardPermutaManual({
  permuta,
  participantes,
  usuarioId,
  processando,
  onAceitar,
  onRecusar,
  onCancelar,
  onEncerrar
}: {
  permuta: PermutaManualResumo;
  participantes: PermutaManualDetalhe[];
  usuarioId: string;
  processando: boolean;
  onAceitar: () => void;
  onRecusar: () => void;
  onCancelar: () => void;
  onEncerrar: () => void;
}) {

  const direta =
    permuta.quantidade_participantes === 2;

  const pendente =
    permuta.status === "aguardando_aceite";

  const confirmado =
    permuta.status === "confirmado";

  const recusado =
    permuta.status === "recusado";

  const cancelado =
    permuta.status === "cancelado" ||
    permuta.status === "cancelado_indisponibilidade";

  const concluido =
    permuta.status === "concluido";

  const semSucesso =
    permuta.status === "encerrado_sem_sucesso";

  const meuParticipante =
    participantes.find(
      item =>
        item.participante_id === usuarioId
    );

  const jaAceitou =
    meuParticipante?.status_aceite === "aceito";

  const souCriador =
    permuta.criado_por === usuarioId;

  const aceites =
    participantes.filter(
      item =>
        item.status_aceite === "aceito"
    ).length;

  const titulo =
    direta
      ? "Permuta direta montada"
      : `Ciclo de ${permuta.quantidade_participantes} participantes`;

  const contatoCriador =
    participantes.find(
      item =>
        item.eh_criador
    );


  return (

    <article className="
      rounded-2xl
      border
      border-cyan-300/10
      bg-[#081b29]
      p-5
      shadow-[0_12px_30px_rgba(0,0,0,0.14)]
    ">

      <div className="
        flex
        flex-wrap
        items-start
        justify-between
        gap-4
      ">

        <div>

          <div className="
            flex
            flex-wrap
            items-center
            gap-2
          ">

            <h3 className="
              text-lg
              font-bold
              text-white
            ">
              {titulo}
            </h3>

            <span className="
              rounded-full
              border
              border-cyan-300/15
              bg-cyan-400/[0.07]
              px-2.5
              py-1
              text-xs
              font-semibold
              text-cyan-200
            ">
              Montada por servidor
            </span>

          </div>

          <div className="mt-2">
            <Status status={permuta.status} />
          </div>

        </div>

        <span className="
          text-sm
          text-slate-400
        ">
          {new Date(permuta.created_at).toLocaleDateString("pt-BR")}
        </span>

      </div>


      <div className="
        mt-5
        rounded-xl
        border
        border-cyan-300/10
        bg-cyan-400/[0.04]
        p-4
      ">

        <p className="
          text-sm
          font-semibold
          text-cyan-100
        ">
          Como funciona esta proposta
        </p>

        <p className="
          mt-1
          text-sm
          leading-6
          text-slate-400
        ">
          {direta
            ? "Os dois participantes precisam aceitar para confirmar a permuta."
            : `Os ${permuta.quantidade_participantes} participantes precisam aceitar. Se um deles recusar, o ciclo inteiro é encerrado.`}
        </p>

      </div>


      {permuta.mensagem && (

        <div className="
          mt-4
          rounded-xl
          border
          border-teal-300/10
          bg-[#0d2232]
          p-4
        ">

          <p className="
            text-xs
            font-semibold
            uppercase
            tracking-wide
            text-slate-500
          ">
            Mensagem do proponente
          </p>

          <p className="
            mt-2
            whitespace-pre-wrap
            text-sm
            leading-6
            text-slate-300
          ">
            {permuta.mensagem}
          </p>

        </div>

      )}


      <div className="
        mt-5
        space-y-3
      ">

        {participantes.map(
          participante => (

            <div
              key={participante.participante_id}
              className="
                rounded-xl
                border
                border-teal-300/10
                bg-[#0d2232]
                p-4
              "
            >

              <div className="
                flex
                flex-col
                gap-3
                md:flex-row
                md:items-center
                md:justify-between
              ">

                <div className="
                  flex
                  min-w-0
                  items-start
                  gap-3
                ">

                  <div className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-teal-400/[0.08]
                    text-teal-300
                  ">
                    <UserRound size={17} />
                  </div>

                  <div className="min-w-0">

                    <p className="
                      font-semibold
                      text-white
                    ">
                      {participante.ordem}. {participante.participante_nome}
                      {participante.participante_id === usuarioId ? " (você)" : ""}
                    </p>

                    <p className="
                      mt-1
                      text-xs
                      text-slate-500
                    ">
                      {participante.participante_cargo || "Cargo não informado"}
                    </p>

                  </div>

                </div>


                <div className="
                  inline-flex
                  items-center
                  gap-2
                  text-xs
                  font-semibold
                ">

                  {participante.status_aceite === "aceito" ? (
                    <span className="text-emerald-300">✓ Aceitou</span>
                  ) : participante.status_aceite === "recusado" ? (
                    <span className="text-red-300">✕ Recusou</span>
                  ) : (
                    <span className="text-amber-300">⏳ Aguardando</span>
                  )}

                </div>

              </div>


              <div className="
                mt-3
                flex
                flex-wrap
                items-center
                gap-2
                text-sm
                text-slate-300
              ">

                <span>
                  {participante.origem_comarca_nome || "Origem não informada"}
                </span>

                <ArrowRight
                  size={15}
                  className="text-cyan-300"
                />

                <span className="font-semibold text-cyan-200">
                  {participante.destino_comarca_nome || "Destino não informado"}
                </span>

              </div>

            </div>

          )
        )}

      </div>


      {pendente && (

        <div className="
          mt-5
          flex
          flex-wrap
          items-center
          gap-3
        ">

          {!souCriador && !jaAceitou && (

            <>

              <button
                type="button"
                disabled={processando}
                onClick={onAceitar}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-emerald-600
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-emerald-500
                  disabled:opacity-50
                "
              >
                <CheckCircle2 size={17} />
                {processando ? "Processando..." : "Aceitar proposta"}
              </button>

              <button
                type="button"
                disabled={processando}
                onClick={onRecusar}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-red-400/20
                  bg-red-400/[0.08]
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-red-300
                  transition
                  hover:bg-red-400/12
                  disabled:opacity-50
                "
              >
                <XCircle size={17} />
                Recusar proposta
              </button>

            </>

          )}


          {souCriador && (
            <button
              type="button"
              disabled={processando}
              onClick={onCancelar}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-red-400/20
                bg-red-400/[0.08]
                px-4
                py-2.5
                text-sm
                font-semibold
                text-red-300
                transition
                hover:bg-red-400/12
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <XCircle size={17} />
              {processando ? "Cancelando..." : "Cancelar proposta"}
            </button>
          )}


          {jaAceitou && (
            <span className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-emerald-400/[0.08]
              px-4
              py-2.5
              text-sm
              font-semibold
              text-emerald-300
            ">
              <CheckCircle2 size={17} />
              Você já aceitou
            </span>
          )}


          <span className="
            text-sm
            text-slate-400
          ">
            {aceites} de {permuta.quantidade_participantes} aceitaram
          </span>

        </div>

      )}


      {pendente && contatoCriador && (

        <ContatoCriadorManual
          participante={contatoCriador}
        />

      )}


      {confirmado && (

        <div className="
          mt-5
          rounded-xl
          border
          border-emerald-300/20
          bg-emerald-400/[0.08]
          p-4
        ">

          <p className="
            font-semibold
            text-emerald-200
          ">
            Permuta confirmada
          </p>

          <p className="
            mt-1
            text-sm
            leading-6
            text-emerald-300
          ">
            Todos os participantes aceitaram. Os contatos autorizados estão disponíveis abaixo.
          </p>

          <div className="
            mt-4
            grid
            gap-3
            md:grid-cols-2
          ">

            {participantes.map(
              participante => (
                <ContatoParticipanteManual
                  key={participante.participante_id}
                  participante={participante}
                />
              )
            )}

          </div>

          <div className="
            mt-5
            border-t
            border-emerald-300/15
            pt-4
          ">

            <p className="
              text-sm
              font-semibold
              text-slate-200
            ">
              A permuta já foi resolvida?
            </p>

            <p className="
              mt-1
              text-sm
              leading-6
              text-slate-400
            ">
              Quando houver uma definição entre os participantes, encerre a permuta para liberar todos os perfis.
            </p>

            <button
              type="button"
              disabled={processando}
              onClick={onEncerrar}
              className="
                mt-4
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-emerald-300/20
                bg-emerald-400/[0.08]
                px-4
                py-2.5
                text-sm
                font-semibold
                text-emerald-200
                transition
                hover:bg-emerald-400/[0.13]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <CheckCircle2 size={17} />
              Encerrar permuta
            </button>

          </div>

        </div>

      )}


      {concluido && (
        <div className="
          mt-5
          rounded-xl
          border
          border-teal-300/15
          bg-teal-400/[0.07]
          p-4
        ">
          <p className="
            font-semibold
            text-teal-200
          ">
            Permuta concluída com sucesso
          </p>

          <p className="
            mt-1
            text-sm
            leading-6
            text-slate-300
          ">
            A permuta foi concluída e os participantes estão novamente disponíveis para novas oportunidades.
          </p>
        </div>
      )}


      {semSucesso && (
        <div className="
          mt-5
          rounded-xl
          border
          border-slate-600/30
          bg-white/[0.03]
          p-4
        ">
          <p className="
            font-semibold
            text-slate-200
          ">
            Permuta encerrada sem sucesso
          </p>

          <p className="
            mt-1
            text-sm
            leading-6
            text-slate-400
          ">
            A permuta não foi concluída. Os participantes estão novamente disponíveis para novas oportunidades.
          </p>
        </div>
      )}


      {recusado && (
        <div className="
          mt-5
          rounded-xl
          border
          border-red-400/15
          bg-red-400/[0.06]
          p-4
          text-sm
          text-red-200
        ">
          Esta proposta foi encerrada porque um dos participantes recusou.
        </div>
      )}


      {cancelado && (
        <div className="
          mt-5
          rounded-xl
          border
          border-amber-300/15
          bg-amber-400/[0.06]
          p-4
          text-sm
          text-amber-200
        ">
          Esta proposta não está mais disponível.
        </div>
      )}

    </article>

  );

}


function ContatoCriadorManual({
  participante
}: {
  participante: PermutaManualDetalhe;
}) {

  const possuiContato =
    Boolean(
      participante.email ||
      participante.telefone ||
      participante.teams
    );


  return (

    <div className="
      mt-5
      rounded-xl
      border
      border-cyan-300/15
      bg-cyan-400/[0.05]
      p-4
    ">

      <p className="
        text-sm
        font-bold
        text-cyan-100
      ">
        Contato de quem montou a proposta
      </p>

      <p className="
        mt-1
        text-xs
        text-slate-400
      ">
        {participante.participante_nome}
      </p>

      {possuiContato ? (
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          {participante.email && (
            <p className="flex items-center gap-2">
              <Mail size={15} />
              {participante.email}
            </p>
          )}
          {participante.telefone && (
            <p className="flex items-center gap-2">
              <Phone size={15} />
              {participante.telefone}
            </p>
          )}
          {participante.teams && (
            <p>
              <strong>Teams:</strong> {participante.teams}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          O proponente ainda não autorizou a exibição de um contato.
        </p>
      )}

    </div>

  );

}


function ContatoParticipanteManual({
  participante
}: {
  participante: PermutaManualDetalhe;
}) {

  const possuiContato =
    Boolean(
      participante.email ||
      participante.telefone ||
      participante.teams
    );


  return (

    <div className="
      rounded-xl
      border
      border-emerald-300/10
      bg-[#081b29]
      p-4
    ">

      <p className="font-semibold text-white">
        {participante.participante_nome}
      </p>

      {possuiContato ? (
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          {participante.email && (
            <p className="flex items-center gap-2">
              <Mail size={15} />
              {participante.email}
            </p>
          )}
          {participante.telefone && (
            <p className="flex items-center gap-2">
              <Phone size={15} />
              {participante.telefone}
            </p>
          )}
          {participante.teams && (
            <p>
              <strong>Teams:</strong> {participante.teams}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          Nenhum contato autorizado para exibição.
        </p>
      )}

    </div>

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
        border
        border-teal-300/10
        bg-[#0d2232]
        shadow-2xl
      ">

        <div className="
          flex
          items-start
          justify-between
          gap-4
          border-b
          border-teal-300/10
          px-6
          py-5
        ">

          <div>

            <h2 className="
              text-xl
              font-bold
              text-white
            ">

              Confirmar cancelamento

            </h2>


            <p className="
              mt-1
              text-sm
              text-slate-400
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
              hover:bg-[#0d2232]/[0.05]
              hover:text-slate-300
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
            bg-red-400/[0.08]
            text-red-300
          ">

            <XCircle
              size={24}
            />

          </div>


          <h3 className="
            mt-4
            text-lg
            font-bold
            text-white
          ">

            Tem certeza de que deseja cancelar esta proposta?

          </h3>


          <p className="
            mt-2
            text-sm
            leading-6
            text-slate-400
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
                border-teal-300/15
                bg-[#0d2232]
                px-4
                py-2.5
                text-sm
                font-semibold
                text-slate-300
                transition
                hover:bg-[#081b29]
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
                hover:bg-red-500
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
        border
        border-teal-300/10
        bg-[#0d2232]
        shadow-2xl
      ">

        <div className="
          flex
          items-start
          justify-between
          gap-4
          border-b
          border-teal-300/10
          px-6
          py-5
        ">

          <div>

            <h2 className="
              text-xl
              font-bold
              text-white
            ">

              Limpar histórico

            </h2>


            <p className="
              mt-1
              text-sm
              text-slate-400
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
              hover:bg-[#0d2232]/[0.05]
              hover:text-slate-300
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
            bg-[#0d2232]/[0.05]
            text-slate-300
          ">

            <Trash2
              size={23}
            />

          </div>


          <h3 className="
            mt-4
            text-lg
            font-bold
            text-white
          ">

            Limpar histórico de propostas?

          </h3>


          <p className="
            mt-2
            text-sm
            leading-6
            text-slate-400
          ">

            As propostas encerradas ou canceladas deixarão de aparecer nesta página. Propostas em andamento ou aguardando aceite não serão afetadas.

          </p>


          <p className="
            mt-3
            text-xs
            leading-5
            text-slate-400
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
                border-teal-300/15
                bg-[#0d2232]
                px-4
                py-2.5
                text-sm
                font-semibold
                text-slate-300
                transition
                hover:bg-[#081b29]
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
                bg-teal-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-teal-500
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
        border
        border-teal-300/10
        bg-[#0d2232]
        shadow-2xl
      ">


        {/* CABEÇALHO */}

        <div className="
          flex
          items-start
          justify-between
          gap-4
          border-b
          border-teal-300/10
          px-6
          py-5
        ">

          <div>

            <h2 className="
              text-xl
              font-bold
              text-white
            ">

              Encerrar permuta

            </h2>


            <p className="
              mt-1
              text-sm
              text-slate-400
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
              hover:bg-[#0d2232]/[0.05]
              hover:text-slate-300
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
            bg-teal-400/[0.07]
            text-teal-200
          ">

            <CheckCircle2
              size={24}
            />

          </div>


          <h3 className="
            mt-4
            text-xl
            font-bold
            text-white
          ">

            A permuta deu certo?

          </h3>


          <p className="
            mt-2
            text-sm
            leading-6
            text-slate-400
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
                border-emerald-300/20
                bg-emerald-400/[0.08]
                p-4
                text-left
                transition
                hover:border-green-300
                hover:bg-emerald-400/10
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
                  text-emerald-300
                "
              />


              <div>

                <p className="
                  text-sm
                  font-bold
                  text-emerald-200
                ">

                  Sim, concluímos a troca

                </p>


                <p className="
                  mt-1
                  text-xs
                  leading-5
                  text-emerald-300
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
                border-red-400/20
                bg-red-400/[0.08]
                p-4
                text-left
                transition
                hover:border-red-300
                hover:bg-red-400/10
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
                  text-red-300
                "
              />


              <div>

                <p className="
                  text-sm
                  font-bold
                  text-red-200
                ">

                  Não, não deu certo

                </p>


                <p className="
                  mt-1
                  text-xs
                  leading-5
                  text-red-300
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
              border-teal-300/15
              bg-[#0d2232]
              px-4
              py-2.5
              text-sm
              font-semibold
              text-slate-300
              transition
              hover:bg-[#081b29]
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
      border-teal-300/10
      bg-[#081b29]
      p-4
    ">

      <p className="
        text-xs
        font-bold
        uppercase
        tracking-wide
        text-slate-400
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
                    text-slate-300
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
                          bg-emerald-400/10
                          px-2.5
                          py-1
                          text-xs
                          font-semibold
                          text-emerald-300
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
                          border
                          border-amber-400/20
                          bg-amber-400/10
                          px-2.5
                          py-1
                          text-xs
                          font-semibold
                          text-amber-300
                        ">

                          <Clock3
                            size={13}
                            strokeWidth={2}
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
      border-teal-300/10
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
          text-white
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
                    bg-emerald-400/10
                    text-emerald-300
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
                    border
                    border-amber-400/20
                    bg-amber-400/10
                    text-amber-300
                  "
                >

                  <Clock3
                    size={15}
                    strokeWidth={2}
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
        text-slate-400
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
          text-teal-300
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
        text-slate-400
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
              border-teal-300/10
              bg-[#081b29]
              p-4
              text-sm
              text-slate-400
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
                        border-teal-300/10
                        bg-[#081b29]
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
                            text-teal-300
                          "
                        />


                        <span className="
                          font-bold
                          text-white
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
                              text-slate-400
                            ">

                              E-mail

                            </p>


                            <p className="
                              break-all
                              font-semibold
                              text-white
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
                              text-slate-400
                            ">

                              Telefone

                            </p>


                            <p className="
                              font-semibold
                              text-white
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
        bg-amber-400/[0.08]
        px-3
        py-1
        text-xs
        font-semibold
        text-amber-300
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
        bg-emerald-400/[0.08]
        px-3
        py-1
        text-xs
        font-semibold
        text-emerald-300
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
        bg-teal-400/[0.07]
        px-3
        py-1
        text-xs
        font-semibold
        text-teal-300
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
        bg-[#0d2232]/[0.05]
        px-3
        py-1
        text-xs
        font-semibold
        text-slate-400
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
        bg-amber-400/[0.08]
        px-3
        py-1
        text-xs
        font-semibold
        text-amber-300
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
      bg-[#0d2232]/[0.05]
      px-3
      py-1
      text-xs
      font-semibold
      text-slate-400
    ">

      <XCircle
        size={14}
      />

      Cancelada

    </div>

  );

}



/* ======================================================
   MODAL ENCERRAR PERMUTA MONTADA
====================================================== */

function ModalEncerrarPermutaManual({
  permuta,
  processando,
  onFechar,
  onSucesso,
  onSemSucesso
}: {
  permuta: PermutaManualResumo;
  processando: boolean;
  onFechar: () => void;
  onSucesso: () => void;
  onSemSucesso: () => void;
}) {

  const descricao =
    permuta.quantidade_participantes === 2
      ? "permuta direta"
      : `ciclo de ${permuta.quantidade_participantes} participantes`;


  return (

    <div className="
      fixed
      inset-0
      z-[110]
      flex
      items-center
      justify-center
      bg-slate-950/70
      px-4
      py-8
      backdrop-blur-sm
    ">

      <div className="
        w-full
        max-w-lg
        overflow-hidden
        rounded-2xl
        border
        border-teal-300/10
        bg-[#0d2232]
        shadow-2xl
      ">

        <div className="
          flex
          items-start
          justify-between
          gap-4
          border-b
          border-teal-300/10
          px-6
          py-5
        ">

          <div>

            <h2 className="
              text-xl
              font-bold
              text-white
            ">
              Encerrar permuta
            </h2>

            <p className="
              mt-1
              text-sm
              text-slate-400
            ">
              Informe o resultado desta {descricao}.
            </p>

          </div>

          <button
            type="button"
            aria-label="Fechar"
            disabled={processando}
            onClick={onFechar}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-white/5
              hover:text-white
              disabled:opacity-50
            "
          >
            <X size={20} />
          </button>

        </div>


        <div className="
          space-y-4
          px-6
          py-6
        ">

          <p className="
            text-sm
            leading-6
            text-slate-300
          ">
            O encerramento libera todos os participantes para novas oportunidades. Se a permuta tiver sido concluída, cada participante poderá avaliar a experiência no Permuta TJSP.
          </p>


          <button
            type="button"
            disabled={processando}
            onClick={onSucesso}
            className="
              flex
              w-full
              items-start
              gap-3
              rounded-xl
              border
              border-emerald-300/20
              bg-emerald-400/[0.08]
              p-4
              text-left
              transition
              hover:bg-emerald-400/[0.13]
              disabled:opacity-50
            "
          >

            <CheckCircle2
              className="
                mt-0.5
                h-5
                w-5
                shrink-0
                text-emerald-300
              "
            />

            <span>
              <span className="
                block
                font-semibold
                text-emerald-200
              ">
                Sim, a permuta deu certo
              </span>

              <span className="
                mt-1
                block
                text-sm
                leading-5
                text-emerald-300/90
              ">
                Registra a conclusão com sucesso e libera os participantes.
              </span>
            </span>

          </button>


          <button
            type="button"
            disabled={processando}
            onClick={onSemSucesso}
            className="
              flex
              w-full
              items-start
              gap-3
              rounded-xl
              border
              border-red-400/20
              bg-red-400/[0.07]
              p-4
              text-left
              transition
              hover:bg-red-400/[0.11]
              disabled:opacity-50
            "
          >

            <XCircle
              className="
                mt-0.5
                h-5
                w-5
                shrink-0
                text-red-300
              "
            />

            <span>
              <span className="
                block
                font-semibold
                text-red-200
              ">
                Não, a permuta não deu certo
              </span>

              <span className="
                mt-1
                block
                text-sm
                leading-5
                text-red-300/90
              ">
                Registra o encerramento sem sucesso e libera os participantes.
              </span>
            </span>

          </button>


          {processando && (
            <p className="
              text-center
              text-sm
              text-slate-400
            ">
              Processando encerramento...
            </p>
          )}

        </div>

      </div>

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