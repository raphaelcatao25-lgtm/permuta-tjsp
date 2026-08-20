"use client";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  Info,
  MapPin,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserRound,
  UsersRound,
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

type PerfilAtual = {
  id: string;
  nome: string;
  cargo: string | null;
  comarca_atual_id: number;
  unidade_atual_id: string | null;
  em_match: boolean | null;
  busca_pausada: boolean | null;
};


type Raj = {
  id: number;
  nome: string;
};


type Circunscricao = {
  id: number;
  nome: string;
  raj_id: number;
};


type Comarca = {
  id: number;
  nome: string;
  circunscricao_id: number;
};


type PreferenciaUsuario = {
  comarca_destino_id: number;
  prioridade: number;
};


type DestinoServidor = {
  comarca_id: number;
  comarca_nome: string;
  unidade_destino_id?: string | null;
  prioridade: number;
};


type ServidorResultado = {
  perfil_id: string;
  nome: string;
  cargo: string | null;

  comarca_atual_id: number;
  comarca_atual_nome: string;

  circunscricao_id: number;
  circunscricao_nome: string;

  raj_id: number;
  raj_nome: string;

  destinos: DestinoServidor[];

  compativel_direta: boolean;
  em_match: boolean;
  busca_pausada: boolean;
};


type LigacaoValidacao = {
  valido: boolean | null;
  quantidade_participantes: number;
  tipo: "direta" | "ciclo";
  ordem: number;

  participante_id: string;
  participante_nome: string;

  origem_comarca_id: number;
  origem_comarca_nome: string;
  origem_unidade_id: string | null;

  destino_comarca_id: number | null;
  destino_comarca_nome: string | null;
  destino_unidade_id: string | null;

  proximo_participante_id: string;
  proximo_participante_nome: string;

  proximo_origem_comarca_id: number;
  proximo_origem_comarca_nome: string;
  proximo_origem_unidade_id: string | null;

  ligacao_compativel: boolean;
  motivo: string;
};


/* ======================================================
   PÁGINA
====================================================== */

export default function BuscarServidoresPage() {

  const [
    perfil,
    setPerfil
  ] = useState<PerfilAtual | null>(
    null
  );


  const [
    rajs,
    setRajs
  ] = useState<Raj[]>([]);


  const [
    circunscricoes,
    setCircunscricoes
  ] = useState<Circunscricao[]>([]);


  const [
    comarcas,
    setComarcas
  ] = useState<Comarca[]>([]);


  const [
    minhasPreferencias,
    setMinhasPreferencias
  ] = useState<PreferenciaUsuario[]>([]);


  /* ======================================================
     FILTROS
  ====================================================== */

  const [
    nomeServidor,
    setNomeServidor
  ] = useState("");


  const [
    rajSelecionada,
    setRajSelecionada
  ] = useState<number | null>(
    null
  );


  const [
    circunscricaoSelecionada,
    setCircunscricaoSelecionada
  ] = useState<number | null>(
    null
  );


  const [
    comarcaAtualSelecionada,
    setComarcaAtualSelecionada
  ] = useState<Comarca | null>(
    null
  );


  const [
    buscaComarcaAtual,
    setBuscaComarcaAtual
  ] = useState("");


  const [
    abrirComarcaAtual,
    setAbrirComarcaAtual
  ] = useState(false);


  const [
    comarcaDestinoSelecionada,
    setComarcaDestinoSelecionada
  ] = useState<Comarca | null>(
    null
  );


  const [
    buscaComarcaDestino,
    setBuscaComarcaDestino
  ] = useState("");


  const [
    abrirComarcaDestino,
    setAbrirComarcaDestino
  ] = useState(false);


  const [
    ordenacao,
    setOrdenacao
  ] = useState<"AZ" | "ZA">(
    "AZ"
  );


  const [
    ampliarResultados,
    setAmpliarResultados
  ] = useState(false);


  /* ======================================================
     RESULTADOS
  ====================================================== */

  const [
    resultados,
    setResultados
  ] = useState<ServidorResultado[]>([]);


  const [
    pesquisou,
    setPesquisou
  ] = useState(false);


  const [
    carregando,
    setCarregando
  ] = useState(true);


  const [
    buscando,
    setBuscando
  ] = useState(false);


  const [
    erro,
    setErro
  ] = useState("");


  const [
    mensagemSucesso,
    setMensagemSucesso
  ] = useState("");


  /* ======================================================
     MONTAGEM DA PERMUTA
  ====================================================== */

  const [
    selecionados,
    setSelecionados
  ] = useState<ServidorResultado[]>([]);


  const [
    validacao,
    setValidacao
  ] = useState<LigacaoValidacao[]>([]);


  const [
    validando,
    setValidando
  ] = useState(false);


  const [
    modalEnvioAberto,
    setModalEnvioAberto
  ] = useState(false);


  const [
    mensagemProposta,
    setMensagemProposta
  ] = useState(
    "Olá! Encontrei uma possibilidade de permuta compatível pelo Permuta TJSP. Caso tenha interesse, aceite a proposta para que possamos visualizar os dados de contato e conversar sobre a permuta."
  );


  const [
    enviandoProposta,
    setEnviandoProposta
  ] = useState(false);


  /* ======================================================
     CARREGAR DADOS INICIAIS
  ====================================================== */

  useEffect(() => {

    let ativo = true;


    async function carregarDados() {

      setCarregando(true);
      setErro("");


      try {

        const {
          data: dadosUsuario,
          error: erroUsuario
        } = await supabase.auth.getUser();


        if (erroUsuario) {
          throw erroUsuario;
        }


        const usuario =
          dadosUsuario.user;


        if (!usuario) {
          throw new Error(
            "Usuário não autenticado."
          );
        }


        const [
          respostaPerfil,
          respostaRajs,
          respostaCircunscricoes,
          respostaComarcas,
          respostaPreferencias
        ] = await Promise.all([

          supabase
            .from("perfis")
            .select(`
              id,
              nome,
              cargo,
              comarca_atual_id,
              unidade_atual_id,
              em_match,
              busca_pausada
            `)
            .eq(
              "id",
              usuario.id
            )
            .single(),

          supabase
            .from("rajs_tjsp")
            .select(
              "id, nome"
            )
            .order(
              "id",
              {
                ascending: true
              }
            ),

          supabase
            .from("circunscricoes_tjsp")
            .select(`
              id,
              nome,
              raj_id
            `)
            .order(
              "nome",
              {
                ascending: true
              }
            ),

          supabase
            .from("comarcas_tjsp")
            .select(`
              id,
              nome,
              circunscricao_id
            `)
            .order(
              "nome",
              {
                ascending: true
              }
            ),

          supabase
            .from(
              "preferencias_movimentacao"
            )
            .select(`
              comarca_destino_id,
              prioridade
            `)
            .eq(
              "perfil_id",
              usuario.id
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
            )
        ]);


        if (respostaPerfil.error) {
          throw respostaPerfil.error;
        }


        if (respostaRajs.error) {
          throw respostaRajs.error;
        }


        if (respostaCircunscricoes.error) {
          throw respostaCircunscricoes.error;
        }


        if (respostaComarcas.error) {
          throw respostaComarcas.error;
        }


        if (respostaPreferencias.error) {
          throw respostaPreferencias.error;
        }


        if (!ativo) {
          return;
        }


        setPerfil(
          respostaPerfil.data as PerfilAtual
        );


        setRajs(
          (respostaRajs.data ?? []) as Raj[]
        );


        setCircunscricoes(
          (
            respostaCircunscricoes.data ?? []
          ) as Circunscricao[]
        );


        setComarcas(
          (respostaComarcas.data ?? []) as Comarca[]
        );


        setMinhasPreferencias(
          (
            respostaPreferencias.data ?? []
          ) as PreferenciaUsuario[]
        );

      }

      catch(error) {

        console.error(
          "Erro ao carregar busca de servidores:",
          error
        );


        if (ativo) {
          setErro(
            extrairMensagemErro(
              error
            )
          );
        }

      }

      finally {

        if (ativo) {
          setCarregando(false);
        }

      }

    }


    carregarDados();


    return () => {
      ativo = false;
    };

  }, []);


  /* ======================================================
     DADOS DERIVADOS
  ====================================================== */

  const minhaComarcaAtual =
    useMemo(
      () => {

        if (!perfil) {
          return null;
        }


        return (
          comarcas.find(
            comarca =>
              comarca.id ===
              perfil.comarca_atual_id
          ) ?? null
        );

      },
      [
        perfil,
        comarcas
      ]
    );


  const meusDestinos =
    useMemo(
      () => {

        return minhasPreferencias
          .map(
            preferencia => {

              const comarca =
                comarcas.find(
                  item =>
                    item.id ===
                    preferencia.comarca_destino_id
                );


              if (!comarca) {
                return null;
              }


              return {
                ...comarca,
                prioridade:
                  preferencia.prioridade
              };

            }
          )
          .filter(
            (
              item
            ): item is Comarca & {
              prioridade: number;
            } => Boolean(item)
          );

      },
      [
        minhasPreferencias,
        comarcas
      ]
    );


  const circunscricoesFiltradas =
    useMemo(
      () => {

        if (!rajSelecionada) {
          return circunscricoes;
        }


        return circunscricoes.filter(
          item =>
            item.raj_id ===
            rajSelecionada
        );

      },
      [
        circunscricoes,
        rajSelecionada
      ]
    );


  const comarcasPermitidasPelosFiltros =
    useMemo(
      () => {

        let lista =
          [...comarcas];


        if (circunscricaoSelecionada) {

          lista = lista.filter(
            comarca =>
              comarca.circunscricao_id ===
              circunscricaoSelecionada
          );

          return lista;
        }


        if (rajSelecionada) {

          const idsCircunscricoes =
            new Set(
              circunscricoes
                .filter(
                  item =>
                    item.raj_id ===
                    rajSelecionada
                )
                .map(
                  item =>
                    item.id
                )
            );


          lista = lista.filter(
            comarca =>
              idsCircunscricoes.has(
                comarca.circunscricao_id
              )
          );
        }


        return lista;

      },
      [
        comarcas,
        circunscricoes,
        rajSelecionada,
        circunscricaoSelecionada
      ]
    );


  const opcoesComarcaAtual =
    useMemo(
      () =>
        filtrarComarcas(
          comarcasPermitidasPelosFiltros,
          buscaComarcaAtual
        ),
      [
        comarcasPermitidasPelosFiltros,
        buscaComarcaAtual
      ]
    );


  const opcoesComarcaDestino =
    useMemo(
      () =>
        filtrarComarcas(
          comarcas,
          buscaComarcaDestino
        ),
      [
        comarcas,
        buscaComarcaDestino
      ]
    );


  const idsSelecionados =
    useMemo(
      () =>
        new Set(
          selecionados.map(
            servidor =>
              servidor.perfil_id
          )
        ),
      [selecionados]
    );


  const quantidadeParticipantes =
    1 + selecionados.length;


  const nomeTipoMontagem =
    quantidadeParticipantes === 1
      ? "Inicie sua permuta"
      : quantidadeParticipantes === 2
      ? "Permuta direta"
      : `Ciclo de ${quantidadeParticipantes}`;


  const montagemValida =
    validacao.length ===
      quantidadeParticipantes &&
    validacao.length >= 2 &&
    validacao.every(
      item =>
        item.ligacao_compativel
    );


  /* ======================================================
     LIMPAR VALIDAÇÃO AO ALTERAR A MONTAGEM
  ====================================================== */

  useEffect(() => {
    setValidacao([]);
    setMensagemSucesso("");
  }, [selecionados]);


  /* ======================================================
     SELEÇÃO DE FILTROS
  ====================================================== */

  function alterarRaj(
    valor: string
  ) {

    const novoValor =
      valor
        ? Number(valor)
        : null;


    setRajSelecionada(
      novoValor
    );

    setCircunscricaoSelecionada(
      null
    );

    limparComarcaAtual();
  }


  function alterarCircunscricao(
    valor: string
  ) {

    const novoValor =
      valor
        ? Number(valor)
        : null;


    setCircunscricaoSelecionada(
      novoValor
    );

    limparComarcaAtual();
  }


  function selecionarComarcaAtual(
    comarca: Comarca
  ) {

    setComarcaAtualSelecionada(
      comarca
    );

    setBuscaComarcaAtual(
      comarca.nome
    );

    setAbrirComarcaAtual(false);
  }


  function limparComarcaAtual() {

    setComarcaAtualSelecionada(
      null
    );

    setBuscaComarcaAtual("");
    setAbrirComarcaAtual(false);
  }


  function selecionarComarcaDestino(
    comarca: Comarca
  ) {

    setComarcaDestinoSelecionada(
      comarca
    );

    setBuscaComarcaDestino(
      comarca.nome
    );

    setAbrirComarcaDestino(false);
  }


  function limparComarcaDestino() {

    setComarcaDestinoSelecionada(
      null
    );

    setBuscaComarcaDestino("");
    setAbrirComarcaDestino(false);
  }


  /* ======================================================
     BUSCAR SERVIDORES
  ====================================================== */

  async function buscarServidores() {

    if (!perfil) {
      return;
    }


    setBuscando(true);
    setErro("");
    setMensagemSucesso("");


    try {

      const {
        data,
        error
      } = await supabase.rpc(
        "buscar_servidores_manual_v2",
        {
          p_usuario_id:
            perfil.id,

          p_nome:
            nomeServidor.trim()
              ? nomeServidor.trim()
              : null,

          p_comarca_atual_id:
            comarcaAtualSelecionada
              ?.id ?? null,

          p_comarca_destino_id:
            comarcaDestinoSelecionada
              ?.id ?? null,

          p_circunscricao_id:
            circunscricaoSelecionada,

          p_raj_id:
            rajSelecionada,

          p_ordenacao:
            ordenacao,

          p_limite:
            ampliarResultados
              ? 500
              : 100
        }
      );


      if (error) {
        throw error;
      }


      setResultados(
        (data ?? []) as ServidorResultado[]
      );

      setPesquisou(true);

    }

    catch(error) {

      console.error(
        "Erro ao buscar servidores:",
        error
      );

      setResultados([]);
      setPesquisou(true);

      setErro(
        extrairMensagemErro(
          error
        )
      );

    }

    finally {
      setBuscando(false);
    }

  }


  function limparFiltros() {

    setNomeServidor("");
    setRajSelecionada(null);
    setCircunscricaoSelecionada(null);

    limparComarcaAtual();
    limparComarcaDestino();

    setOrdenacao("AZ");
    setAmpliarResultados(false);

    setResultados([]);
    setPesquisou(false);
    setErro("");
    setMensagemSucesso("");
  }


  /* ======================================================
     MONTAGEM DA PERMUTA
  ====================================================== */

  function adicionarServidor(
    servidor: ServidorResultado
  ) {

    setErro("");
    setMensagemSucesso("");


    if (perfil?.em_match) {

      setErro(
        "Você já possui uma permuta confirmada em andamento."
      );

      return;
    }


    if (perfil?.busca_pausada) {

      setErro(
        "Sua busca está pausada. Reative sua participação em Meu Perfil antes de montar uma proposta."
      );

      return;
    }


    if (
      idsSelecionados.has(
        servidor.perfil_id
      )
    ) {
      return;
    }


    if (selecionados.length >= 6) {

      setErro(
        "A permuta montada pode ter no máximo 7 participantes contando com você."
      );

      return;
    }


    setSelecionados(
      atuais => [
        ...atuais,
        servidor
      ]
    );
  }


  function removerServidor(
    perfilId: string
  ) {

    setSelecionados(
      atuais =>
        atuais.filter(
          item =>
            item.perfil_id !==
            perfilId
        )
    );
  }


  function moverServidor(
    indice: number,
    direcao: "cima" | "baixo"
  ) {

    setSelecionados(
      atuais => {

        const destino =
          direcao === "cima"
            ? indice - 1
            : indice + 1;


        if (
          destino < 0 ||
          destino >= atuais.length
        ) {
          return atuais;
        }


        const copia =
          [...atuais];


        [
          copia[indice],
          copia[destino]
        ] = [
          copia[destino],
          copia[indice]
        ];


        return copia;
      }
    );
  }


  function limparMontagem() {
    setSelecionados([]);
    setValidacao([]);
    setErro("");
    setMensagemSucesso("");
  }


  async function verificarPermuta() {

    if (!perfil) {
      return;
    }


    if (selecionados.length < 1) {

      setErro(
        "Adicione pelo menos um servidor para verificar uma permuta direta ou em cadeia."
      );

      return;
    }


    if (perfil.em_match) {

      setErro(
        "Você já possui uma permuta confirmada em andamento."
      );

      return;
    }


    if (perfil.busca_pausada) {

      setErro(
        "Sua busca está pausada. Reative sua participação em Meu Perfil antes de montar uma proposta."
      );

      return;
    }


    setValidando(true);
    setErro("");
    setMensagemSucesso("");


    try {

      const participantes = [
        perfil.id,
        ...selecionados.map(
          item =>
            item.perfil_id
        )
      ];


      const {
        data,
        error
      } = await supabase.rpc(
        "validar_permuta_manual",
        {
          p_usuario_id:
            perfil.id,

          p_participantes:
            participantes
        }
      );


      if (error) {
        throw error;
      }


      const linhas =
        (data ?? []) as LigacaoValidacao[];


      setValidacao(
        linhas
      );


      const todasCompativeis =
        linhas.length ===
          participantes.length &&
        linhas.every(
          item =>
            item.ligacao_compativel
        );


      if (todasCompativeis) {

        setMensagemSucesso(
          participantes.length === 2
            ? "Permuta direta válida. As preferências dos dois servidores fecham a troca."
            : `Ciclo de ${participantes.length} válido. Todas as movimentações são compatíveis.`
        );
      }

    }

    catch(error) {

      console.error(
        "Erro ao validar permuta:",
        error
      );

      setValidacao([]);

      setErro(
        extrairMensagemErro(
          error
        )
      );

    }

    finally {
      setValidando(false);
    }

  }


  /* ======================================================
     ENVIAR PROPOSTA MANUAL
  ====================================================== */

  function abrirEnvioProposta() {

    if (!montagemValida) {
      setErro(
        "Verifique a permuta e confirme que todas as movimentações são compatíveis antes de enviar a proposta."
      );
      return;
    }

    setErro("");
    setMensagemSucesso("");
    setModalEnvioAberto(true);
  }


  async function enviarPropostaManual() {

    if (!perfil || !montagemValida) {
      return;
    }

    const mensagem = mensagemProposta.trim();

    if (!mensagem) {
      setErro("Digite uma mensagem para acompanhar a proposta.");
      return;
    }

    setEnviandoProposta(true);
    setErro("");
    setMensagemSucesso("");

    try {

      const participantes = [
        perfil.id,
        ...selecionados.map(
          item => item.perfil_id
        )
      ];

      const { error } = await supabase.rpc(
        "criar_permuta_manual",
        {
          p_usuario_id: perfil.id,
          p_participantes: participantes,
          p_mensagem: mensagem
        }
      );

      if (error) {
        throw error;
      }

      setModalEnvioAberto(false);
      setSelecionados([]);
      setValidacao([]);

      setMensagemSucesso(
        participantes.length === 2
          ? "Proposta de permuta direta enviada com sucesso. O outro servidor poderá aceitar ou recusar pela página de propostas."
          : `Proposta de ciclo com ${participantes.length} participantes enviada com sucesso. Os demais servidores poderão aceitar ou recusar pela página de propostas.`
      );

      window.dispatchEvent(
        new Event("atualizar-notificacoes")
      );

    } catch (error) {

      console.error(
        "Erro ao enviar proposta manual:",
        error
      );

      setErro(
        extrairMensagemErro(error)
      );

    } finally {
      setEnviandoProposta(false);
    }
  }


  /* ======================================================
     RENDER
  ====================================================== */

  return (

    <AuthGuard>

      <DashboardLayout
        nomeUsuario={
          perfil?.nome
            ?.trim()
            .split(/\s+/)[0]
          ||
          "Servidor"
        }
      >

        <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">

          {/* =================================================
              TÍTULO
          ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-teal-300/10 bg-[#0d2232] shadow-[0_16px_40px_rgba(0,0,0,0.16)]">

            <div className="border-b border-teal-300/10 bg-[#0a1f2f] px-6 py-6 sm:px-8">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/[0.08] text-teal-300">
                  <UsersRound size={23} />
                </div>

                <div>

                  <p className="text-sm font-semibold text-teal-300">
                    Busca e montagem manual
                  </p>

                  <h1 className="mt-1 text-3xl font-bold text-white">
                    Monte sua própria permuta
                  </h1>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                    Pesquise servidores cadastrados e monte uma permuta direta ou em cadeia. Você pode selecionar de 1 a 6 outros servidores, formando uma troca com 2 a 7 participantes. Antes do envio, o sistema verifica se todas as movimentações são compatíveis com as preferências cadastradas.
                  </p>

                </div>

              </div>

            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">

              <MiniEtapa
                numero="1"
                titulo="Pesquise"
                texto="Use nome, RAJ, circunscrição e comarca para localizar servidores."
              />

              <MiniEtapa
                numero="2"
                titulo="Monte"
                texto="Adicione os participantes e ajuste a ordem da movimentação."
              />

              <MiniEtapa
                numero="3"
                titulo="Verifique"
                texto="O sistema confere cada ligação antes de permitir a proposta."
              />

            </div>

          </section>


          {/* =================================================
              STATUS
          ================================================= */}

          {
            perfil?.em_match && (
              <Aviso
                tipo="teal"
                titulo="Você está em uma permuta confirmada."
                texto="Você pode consultar os servidores, mas não poderá montar ou enviar uma nova proposta enquanto a permuta atual estiver em andamento."
              />
            )
          }


          {
            !perfil?.em_match &&
            perfil?.busca_pausada && (
              <Aviso
                tipo="amber"
                titulo="Sua busca está pausada."
                texto="Você pode consultar os servidores, mas deverá reativar sua busca em Meu Perfil antes de montar uma proposta."
              />
            )
          }


          {/* =================================================
              SUAS INFORMAÇÕES
          ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-teal-300/10 bg-[#0d2232] shadow-[0_16px_40px_rgba(0,0,0,0.16)]">

            <div className="border-b border-teal-300/10 bg-[#0a1f2f] px-6 py-5">

              <h2 className="text-xl font-bold text-white">
                Suas informações
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Você será sempre o primeiro participante da permuta montada.
              </p>

            </div>

            <div className="grid gap-5 p-6 md:grid-cols-[0.8fr_1.2fr]">

              <div className="rounded-xl border border-teal-300/10 bg-[#081b29] p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Sua comarca atual
                </p>

                <p className="mt-2 font-semibold text-white">
                  {minhaComarcaAtual?.nome ?? "Não informada"}
                </p>

                {
                  perfil?.cargo && (
                    <p className="mt-1 text-xs text-slate-500">
                      {perfil.cargo}
                    </p>
                  )
                }

              </div>

              <div className="rounded-xl border border-teal-300/10 bg-[#081b29] p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Suas comarcas desejadas
                </p>

                {
                  meusDestinos.length > 0
                    ? (
                      <div className="mt-3 flex flex-wrap gap-2">

                        {
                          meusDestinos.map(
                            destino => (
                              <span
                                key={destino.id}
                                className="rounded-lg border border-teal-300/15 bg-teal-400/[0.05] px-3 py-2 text-sm text-teal-300"
                              >
                                <strong>{destino.prioridade}.</strong>{" "}
                                {destino.nome}
                              </span>
                            )
                          )
                        }

                      </div>
                    )
                    : (
                      <p className="mt-2 text-sm text-slate-400">
                        Nenhuma comarca desejada cadastrada.
                      </p>
                    )
                }

              </div>

            </div>

          </section>


          {/* =================================================
              CONTEÚDO PRINCIPAL
          ================================================= */}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-start">

            <div className="min-w-0 space-y-6">

              {/* =============================================
                  FILTROS
              ============================================= */}

              <section className="overflow-visible rounded-2xl border border-teal-300/10 bg-[#0d2232] shadow-[0_16px_40px_rgba(0,0,0,0.16)]">

                <div className="rounded-t-2xl border-b border-teal-300/10 bg-[#0a1f2f] px-6 py-5">

                  <div className="flex items-center gap-3">

                    <Search className="h-5 w-5 text-teal-300" />

                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Pesquisar servidores
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Todos os campos são opcionais. Sem filtros, a busca lista os servidores disponíveis.
                      </p>
                    </div>

                  </div>

                </div>

                <div className="grid gap-5 p-6 md:grid-cols-2">

                  <CampoTexto
                    label="Nome do servidor"
                    placeholder="Digite parte do nome"
                    valor={nomeServidor}
                    onChange={setNomeServidor}
                  />


                  <CampoSelect
                    label="RAJ"
                    valor={
                      rajSelecionada
                        ?.toString() ?? ""
                    }
                    onChange={alterarRaj}
                    opcoes={
                      rajs.map(
                        raj => ({
                          valor: raj.id.toString(),
                          rotulo: raj.nome
                        })
                      )
                    }
                    placeholder="Todas as RAJs"
                  />


                  <CampoSelect
                    label="Circunscrição"
                    valor={
                      circunscricaoSelecionada
                        ?.toString() ?? ""
                    }
                    onChange={alterarCircunscricao}
                    opcoes={
                      circunscricoesFiltradas.map(
                        item => ({
                          valor: item.id.toString(),
                          rotulo: item.nome
                        })
                      )
                    }
                    placeholder="Todas as circunscrições"
                  />


                  <CampoSelect
                    label="Ordenação"
                    valor={ordenacao}
                    onChange={
                      valor =>
                        setOrdenacao(
                          valor === "ZA"
                            ? "ZA"
                            : "AZ"
                        )
                    }
                    opcoes={[
                      {
                        valor: "AZ",
                        rotulo: "Nome: A–Z"
                      },
                      {
                        valor: "ZA",
                        rotulo: "Nome: Z–A"
                      }
                    ]}
                  />


                  <AutocompleteComarca
                    label="Comarca atual do servidor"
                    placeholder="Digite a comarca atual"
                    valor={buscaComarcaAtual}
                    aberta={abrirComarcaAtual}
                    selecionada={comarcaAtualSelecionada}
                    opcoes={opcoesComarcaAtual}
                    onFocus={() =>
                      setAbrirComarcaAtual(true)
                    }
                    onChange={
                      valor => {
                        setBuscaComarcaAtual(valor);
                        setComarcaAtualSelecionada(null);
                        setAbrirComarcaAtual(true);
                      }
                    }
                    onSelecionar={selecionarComarcaAtual}
                    onLimpar={limparComarcaAtual}
                  />


                  <AutocompleteComarca
                    label="Comarca desejada pelo servidor"
                    placeholder="Digite a comarca desejada"
                    valor={buscaComarcaDestino}
                    aberta={abrirComarcaDestino}
                    selecionada={comarcaDestinoSelecionada}
                    opcoes={opcoesComarcaDestino}
                    onFocus={() =>
                      setAbrirComarcaDestino(true)
                    }
                    onChange={
                      valor => {
                        setBuscaComarcaDestino(valor);
                        setComarcaDestinoSelecionada(null);
                        setAbrirComarcaDestino(true);
                      }
                    }
                    onSelecionar={selecionarComarcaDestino}
                    onLimpar={limparComarcaDestino}
                  />


                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-teal-300/10 bg-[#081b29] p-4 md:col-span-2">

                    <input
                      type="checkbox"
                      checked={ampliarResultados}
                      onChange={
                        event =>
                          setAmpliarResultados(
                            event.target.checked
                          )
                      }
                      className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-[#071725] accent-teal-500"
                    />

                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        Mostrar mais resultados
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        A busca padrão retorna até 100 servidores. Com esta opção, retorna até 500 por consulta.
                      </p>
                    </div>

                  </label>


                  <div className="flex flex-wrap gap-3 md:col-span-2">

                    <button
                      type="button"
                      onClick={buscarServidores}
                      disabled={
                        buscando ||
                        carregando
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-300/20 bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Search size={18} />
                      {buscando ? "Buscando..." : "Buscar servidores"}
                    </button>

                    <button
                      type="button"
                      onClick={limparFiltros}
                      disabled={buscando}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-300/15 bg-[#081b29] px-5 py-3 text-sm font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-[1px] hover:border-teal-300/25 hover:bg-teal-400/[0.07] hover:text-teal-200 disabled:opacity-50"
                    >
                      <RefreshCw size={17} />
                      Limpar filtros
                    </button>

                  </div>

                </div>

              </section>


              {/* =============================================
                  MENSAGENS
              ============================================= */}

              {
                erro && (
                  <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
                    {erro}
                  </div>
                )
              }


              {
                mensagemSucesso && (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
                    {mensagemSucesso}
                  </div>
                )
              }


              {/* =============================================
                  RESULTADOS
              ============================================= */}

              {
                carregando
                  ? (
                    <EstadoVazio
                      titulo="Carregando dados da pesquisa..."
                      texto="Aguarde enquanto preparamos os filtros."
                      icone="usuarios"
                    />
                  )
                  : !pesquisou
                  ? (
                    <EstadoVazio
                      titulo="Pesquise servidores disponíveis"
                      texto="Você pode usar filtros específicos ou clicar em Buscar servidores sem preencher nenhum campo."
                      icone="usuarios"
                    />
                  )
                  : !buscando &&
                    resultados.length === 0
                  ? (
                    <EstadoVazio
                      titulo="Nenhum servidor encontrado"
                      texto="Tente alterar ou remover um dos filtros."
                      icone="busca"
                    />
                  )
                  : null
              }


              {
                resultados.length > 0 && (
                  <section className="space-y-4">

                    <div className="flex flex-wrap items-end justify-between gap-4">

                      <div>
                        <h2 className="text-xl font-bold text-white">
                          Servidores encontrados
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                          {
                            resultados.length === 1
                              ? "1 servidor encontrado."
                              : `${resultados.length} servidores encontrados.`
                          }
                        </p>
                      </div>

                      {
                        resultados.length >=
                          (ampliarResultados ? 500 : 100) && (
                          <p className="text-xs text-amber-300">
                            O limite desta consulta foi atingido. Use os filtros para refinar a busca.
                          </p>
                        )
                      }

                    </div>

                    {
                      resultados.map(
                        servidor => (
                          <ServidorCard
                            key={servidor.perfil_id}
                            servidor={servidor}
                            selecionado={
                              idsSelecionados.has(
                                servidor.perfil_id
                              )
                            }
                            limiteAtingido={
                              selecionados.length >= 6
                            }
                            bloqueado={
                              Boolean(
                                perfil?.em_match
                              ) ||
                              Boolean(
                                perfil?.busca_pausada
                              )
                            }
                            onAdicionar={() =>
                              adicionarServidor(
                                servidor
                              )
                            }
                            onRemover={() =>
                              removerServidor(
                                servidor.perfil_id
                              )
                            }
                          />
                        )
                      )
                    }

                  </section>
                )
              }

            </div>


            {/* ===============================================
                PAINEL DA PERMUTA
            =============================================== */}

            <aside className="xl:sticky xl:top-6">

              <section className="overflow-hidden rounded-2xl border border-teal-300/10 bg-[#0d2232] shadow-[0_20px_50px_rgba(0,0,0,0.2)]">

                <div className="border-b border-teal-300/10 bg-[#0a1f2f] px-5 py-5">

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="text-sm font-semibold text-teal-300">
                        Sua permuta
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-white">
                        {nomeTipoMontagem}
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {quantidadeParticipantes}/7 participantes
                      </p>
                    </div>

                    {
                      selecionados.length > 0 && (
                        <button
                          type="button"
                          onClick={limparMontagem}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.05] hover:text-red-300"
                          aria-label="Limpar permuta"
                          title="Limpar permuta"
                        >
                          <Trash2 size={18} />
                        </button>
                      )
                    }

                  </div>

                </div>


                <div className="space-y-4 p-5">

                  <ParticipanteMontagem
                    ordem={1}
                    nome={perfil?.nome ?? "Você"}
                    cargo={perfil?.cargo ?? null}
                    comarca={
                      minhaComarcaAtual?.nome ??
                      "Comarca não informada"
                    }
                    fixo
                  />


                  {
                    selecionados.map(
                      (servidor, indice) => (
                        <ParticipanteMontagem
                          key={servidor.perfil_id}
                          ordem={indice + 2}
                          nome={servidor.nome}
                          cargo={servidor.cargo}
                          comarca={servidor.comarca_atual_nome}
                          podeSubir={indice > 0}
                          podeDescer={
                            indice <
                            selecionados.length - 1
                          }
                          onSubir={() =>
                            moverServidor(
                              indice,
                              "cima"
                            )
                          }
                          onDescer={() =>
                            moverServidor(
                              indice,
                              "baixo"
                            )
                          }
                          onRemover={() =>
                            removerServidor(
                              servidor.perfil_id
                            )
                          }
                        />
                      )
                    )
                  }


                  {
                    selecionados.length === 0 && (
                      <div className="rounded-xl border border-dashed border-teal-300/15 bg-[#081b29] p-5 text-center">
                        <CirclePlus className="mx-auto h-7 w-7 text-slate-500" />
                        <p className="mt-3 text-sm font-semibold text-slate-300">
                          Adicione um servidor
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Com 2 participantes você terá uma permuta direta. A partir de 3, será uma permuta em cadeia.
                        </p>
                      </div>
                    )
                  }


                  <div className="rounded-xl border border-teal-300/10 bg-[#081b29] p-4">

                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                      <p className="text-xs leading-5 text-slate-400">
                        A ordem importa. Cada participante precisa desejar uma origem compatível com o servidor seguinte; o último precisa fechar a movimentação com você.
                      </p>
                    </div>

                  </div>


                  <button
                    type="button"
                    onClick={verificarPermuta}
                    disabled={
                      selecionados.length < 1 ||
                      validando ||
                      Boolean(
                        perfil?.em_match
                      ) ||
                      Boolean(
                        perfil?.busca_pausada
                      )
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-300/20 bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} />
                    {validando ? "Verificando..." : "Verificar permuta"}
                  </button>


                  {
                    validacao.length > 0 && (
                      <div className="space-y-3 border-t border-teal-300/10 pt-4">

                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-bold text-white">
                            Validação das movimentações
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              montagemValida
                                ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300"
                                : "border-red-300/20 bg-red-400/10 text-red-300"
                            }`}
                          >
                            {montagemValida ? "Válida" : "Não fecha"}
                          </span>
                        </div>


                        {
                          validacao.map(
                            item => (
                              <LigacaoCard
                                key={`${item.participante_id}-${item.ordem}`}
                                item={item}
                              />
                            )
                          )
                        }


                        {
                          montagemValida && (
                            <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/[0.07] p-4">
                              <p className="text-sm font-semibold text-emerald-300">
                                {quantidadeParticipantes === 2
                                  ? "Permuta direta compatível"
                                  : `Ciclo de ${quantidadeParticipantes} compatível`}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-400">
                                Todas as ligações foram validadas. Você já pode enviar a proposta aos participantes.
                              </p>

                              <button
                                type="button"
                                onClick={abrirEnvioProposta}
                                disabled={enviandoProposta}
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Send size={17} />
                                Enviar proposta
                              </button>
                            </div>
                          )
                        }

                      </div>
                    )
                  }

                </div>

              </section>

            </aside>

          </div>

        </div>


        {
          modalEnvioAberto && (
            <ModalEnviarProposta
              quantidadeParticipantes={quantidadeParticipantes}
              mensagem={mensagemProposta}
              enviando={enviandoProposta}
              onMensagemChange={setMensagemProposta}
              onFechar={() => setModalEnvioAberto(false)}
              onEnviar={enviarPropostaManual}
            />
          )
        }

      </DashboardLayout>

    </AuthGuard>
  );
}


/* ======================================================
   MODAL ENVIAR PROPOSTA
====================================================== */

function ModalEnviarProposta({
  quantidadeParticipantes,
  mensagem,
  enviando,
  onMensagemChange,
  onFechar,
  onEnviar
}: {
  quantidadeParticipantes: number;
  mensagem: string;
  enviando: boolean;
  onMensagemChange: (valor: string) => void;
  onFechar: () => void;
  onEnviar: () => void;
}) {

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-teal-300/10 bg-[#0d2232] shadow-2xl">

        <div className="flex items-start justify-between gap-4 border-b border-teal-300/10 bg-[#0a1f2f] px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-teal-300">
              {quantidadeParticipantes === 2
                ? "Permuta direta"
                : `Ciclo de ${quantidadeParticipantes}`}
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              Enviar proposta
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              A proposta será enviada aos demais participantes para aceite.
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            disabled={enviando}
            aria-label="Fechar"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-xl border border-teal-300/10 bg-[#081b29] p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
              <p className="text-xs leading-5 text-slate-400">
                Os dados de contato serão disponibilizados conforme as regras da proposta após os aceites.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Mensagem da proposta
            </label>
            <textarea
              value={mensagem}
              onChange={event => onMensagemChange(event.target.value)}
              rows={6}
              maxLength={1200}
              disabled={enviando}
              className="w-full resize-none rounded-xl border border-teal-300/15 bg-[#081b29] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 hover:border-teal-300/25 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 disabled:opacity-60"
              placeholder="Escreva uma mensagem para os participantes..."
            />
            <p className="mt-2 text-right text-xs text-slate-500">
              {mensagem.length}/1200
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onFechar}
              disabled={enviando}
              className="rounded-xl border border-teal-300/15 bg-[#081b29] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.04] disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onEnviar}
              disabled={enviando || !mensagem.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-300/20 bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={17} />
              {enviando ? "Enviando..." : "Confirmar e enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ======================================================
   MINI ETAPA
====================================================== */

function MiniEtapa({
  numero,
  titulo,
  texto
}: {
  numero: string;
  titulo: string;
  texto: string;
}) {

  return (
    <div className="rounded-xl border border-teal-300/10 bg-[#081b29] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-300/15 bg-teal-400/[0.08] text-sm font-bold text-teal-300">
          {numero}
        </div>
        <div>
          <p className="text-sm font-bold text-white">
            {titulo}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {texto}
          </p>
        </div>
      </div>
    </div>
  );
}


/* ======================================================
   AVISO
====================================================== */

function Aviso({
  tipo,
  titulo,
  texto
}: {
  tipo: "teal" | "amber";
  titulo: string;
  texto: string;
}) {

  const classes =
    tipo === "amber"
      ? "border-amber-300/20 bg-amber-400/[0.07]"
      : "border-teal-300/10 bg-teal-400/[0.07]";

  const tituloClasse =
    tipo === "amber"
      ? "text-amber-200"
      : "text-teal-200";


  return (
    <div className={`rounded-2xl border p-5 ${classes}`}>
      <p className={`font-semibold ${tituloClasse}`}>
        {titulo}
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-400">
        {texto}
      </p>
    </div>
  );
}


/* ======================================================
   CAMPO TEXTO
====================================================== */

function CampoTexto({
  label,
  placeholder,
  valor,
  onChange
}: {
  label: string;
  placeholder: string;
  valor: string;
  onChange: (valor: string) => void;
}) {

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-300">
        {label}
      </label>
      <input
        type="text"
        value={valor}
        onChange={
          event =>
            onChange(
              event.target.value
            )
        }
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-teal-300/15 bg-[#081b29] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-teal-300/25 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10"
      />
    </div>
  );
}


/* ======================================================
   SELECT
====================================================== */

function CampoSelect({
  label,
  valor,
  onChange,
  opcoes,
  placeholder
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  opcoes: {
    valor: string;
    rotulo: string;
  }[];
  placeholder?: string;
}) {

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-300">
        {label}
      </label>

      <div className="relative">
        <select
          value={valor}
          onChange={
            event =>
              onChange(
                event.target.value
              )
          }
          className="w-full appearance-none rounded-xl border border-teal-300/15 bg-[#081b29] px-4 py-3 pr-10 text-sm text-white outline-none transition hover:border-teal-300/25 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10"
        >
          {
            placeholder !== undefined && (
              <option value="">
                {placeholder}
              </option>
            )
          }

          {
            opcoes.map(
              opcao => (
                <option
                  key={opcao.valor}
                  value={opcao.valor}
                >
                  {opcao.rotulo}
                </option>
              )
            )
          }
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}


/* ======================================================
   AUTOCOMPLETE COMARCA
====================================================== */

function AutocompleteComarca({
  label,
  placeholder,
  valor,
  aberta,
  selecionada,
  opcoes,
  onFocus,
  onChange,
  onSelecionar,
  onLimpar
}: {
  label: string;
  placeholder: string;
  valor: string;
  aberta: boolean;
  selecionada: Comarca | null;
  opcoes: Comarca[];
  onFocus: () => void;
  onChange: (valor: string) => void;
  onSelecionar: (comarca: Comarca) => void;
  onLimpar: () => void;
}) {

  return (
    <div className="relative z-20">

      <label className="mb-2 block text-sm font-semibold text-slate-300">
        {label}
      </label>

      <div className="relative">

        <input
          type="text"
          value={valor}
          onFocus={onFocus}
          onChange={
            event =>
              onChange(
                event.target.value
              )
          }
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-teal-300/15 bg-[#081b29] px-4 py-3 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-teal-300/25 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10"
        />

        {
          valor && (
            <button
              type="button"
              onClick={onLimpar}
              aria-label="Limpar comarca"
              className="absolute right-10 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-teal-400/[0.07] hover:text-slate-300"
            >
              <X size={16} />
            </button>
          )
        }

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

      </div>

      {
        aberta &&
        !selecionada && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-teal-300/10 bg-[#081b29] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">

            {
              opcoes.length > 0
                ? opcoes.map(
                    comarca => (
                      <button
                        key={comarca.id}
                        type="button"
                        onMouseDown={
                          event => {
                            event.preventDefault();
                            onSelecionar(
                              comarca
                            );
                          }
                        }
                        className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-teal-400/[0.07] hover:text-teal-200"
                      >
                        {comarca.nome}
                      </button>
                    )
                  )
                : (
                  <div className="px-3 py-4 text-sm text-slate-400">
                    Nenhuma comarca encontrada.
                  </div>
                )
            }

          </div>
        )
      }

    </div>
  );
}


/* ======================================================
   CARD DO SERVIDOR
====================================================== */

function ServidorCard({
  servidor,
  selecionado,
  limiteAtingido,
  bloqueado,
  onAdicionar,
  onRemover
}: {
  servidor: ServidorResultado;
  selecionado: boolean;
  limiteAtingido: boolean;
  bloqueado: boolean;
  onAdicionar: () => void;
  onRemover: () => void;
}) {

  return (
    <article className="overflow-hidden rounded-2xl border border-teal-300/10 bg-[#0d2232] shadow-[0_12px_32px_rgba(0,0,0,0.14)]">

      <div className="p-6">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal-300/15 bg-teal-400/[0.08] text-teal-300">
                <UserRound size={19} />
              </div>

              <div>

                <h3 className="text-lg font-bold text-white">
                  {servidor.nome}
                </h3>

                <div className="mt-1 flex flex-wrap gap-2">

                  {
                    servidor.cargo && (
                      <span className="inline-flex rounded-full border border-slate-600/40 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-400">
                        {servidor.cargo}
                      </span>
                    )
                  }

                  {
                    servidor.compativel_direta
                      ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                          <CheckCircle2 size={14} />
                          Direta compatível
                        </span>
                      )
                      : (
                        <span className="inline-flex rounded-full border border-slate-600/40 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-500">
                          Pode participar de ciclo
                        </span>
                      )
                  }

                </div>

              </div>

            </div>


            <div className="mt-5 rounded-xl border border-teal-300/10 bg-[#081b29] p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Comarca atual
              </p>

              <p className="mt-2 text-sm font-semibold text-white">
                {servidor.comarca_atual_nome}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {servidor.circunscricao_nome}
                {servidor.raj_nome ? ` • ${servidor.raj_nome}` : ""}
              </p>

            </div>


            <div className="mt-5">

              <div className="flex items-center gap-2">
                <MapPin size={17} className="text-teal-300" />
                <h4 className="text-sm font-bold text-white">
                  Destinos desejados
                </h4>
              </div>

              {
                Array.isArray(
                  servidor.destinos
                ) &&
                servidor.destinos.length > 0
                  ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {
                        servidor.destinos.map(
                          destino => (
                            <span
                              key={`${servidor.perfil_id}-${destino.comarca_id}-${destino.prioridade}`}
                              className="rounded-lg border border-teal-300/10 bg-teal-400/[0.07] px-3 py-2 text-sm text-teal-200"
                            >
                              <strong>{destino.prioridade}.</strong>{" "}
                              {destino.comarca_nome}
                            </span>
                          )
                        )
                      }
                    </div>
                  )
                  : (
                    <p className="mt-3 text-sm text-slate-400">
                      Nenhum destino ativo informado.
                    </p>
                  )
              }

            </div>

          </div>


          <div className="shrink-0 lg:w-52">

            {
              selecionado
                ? (
                  <button
                    type="button"
                    onClick={onRemover}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300/15 bg-red-400/[0.07] px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/10"
                  >
                    <X size={17} />
                    Remover da permuta
                  </button>
                )
                : (
                  <button
                    type="button"
                    disabled={
                      bloqueado ||
                      limiteAtingido
                    }
                    onClick={onAdicionar}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-300/20 bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CirclePlus size={18} />
                    Adicionar à permuta
                  </button>
                )
            }

            {
              !selecionado &&
              limiteAtingido && (
                <p className="mt-2 text-center text-xs text-amber-300">
                  Limite de 7 participantes atingido.
                </p>
              )
            }

          </div>

        </div>

      </div>

    </article>
  );
}


/* ======================================================
   PARTICIPANTE DA MONTAGEM
====================================================== */

function ParticipanteMontagem({
  ordem,
  nome,
  cargo,
  comarca,
  fixo = false,
  podeSubir = false,
  podeDescer = false,
  onSubir,
  onDescer,
  onRemover
}: {
  ordem: number;
  nome: string;
  cargo: string | null;
  comarca: string;
  fixo?: boolean;
  podeSubir?: boolean;
  podeDescer?: boolean;
  onSubir?: () => void;
  onDescer?: () => void;
  onRemover?: () => void;
}) {

  return (
    <div className="rounded-xl border border-teal-300/10 bg-[#081b29] p-4">

      <div className="flex items-start gap-3">

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-300/15 bg-teal-400/[0.08] text-xs font-bold text-teal-300">
          {ordem}
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
                {nome}
                {fixo ? " (você)" : ""}
              </p>
              <p className="mt-1 truncate text-xs text-slate-400">
                {comarca}
              </p>
              {
                cargo && (
                  <p className="mt-1 truncate text-[11px] text-slate-500">
                    {cargo}
                  </p>
                )
              }
            </div>

            {
              !fixo && (
                <div className="flex shrink-0 items-center gap-1">

                  <button
                    type="button"
                    disabled={!podeSubir}
                    onClick={onSubir}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/[0.05] hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-25"
                    aria-label="Mover para cima"
                    title="Mover para cima"
                  >
                    <ArrowUp size={15} />
                  </button>

                  <button
                    type="button"
                    disabled={!podeDescer}
                    onClick={onDescer}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/[0.05] hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-25"
                    aria-label="Mover para baixo"
                    title="Mover para baixo"
                  >
                    <ArrowDown size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={onRemover}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-400/10 hover:text-red-300"
                    aria-label="Remover participante"
                    title="Remover participante"
                  >
                    <X size={15} />
                  </button>

                </div>
              )
            }

          </div>

        </div>

      </div>

    </div>
  );
}


/* ======================================================
   CARD DE LIGAÇÃO VALIDADA
====================================================== */

function LigacaoCard({
  item
}: {
  item: LigacaoValidacao;
}) {

  return (
    <div
      className={`rounded-xl border p-3 ${
        item.ligacao_compativel
          ? "border-emerald-300/15 bg-emerald-400/[0.05]"
          : "border-red-300/15 bg-red-400/[0.05]"
      }`}
    >

      <div className="flex items-start gap-3">

        {
          item.ligacao_compativel
            ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            )
            : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            )
        }

        <div className="min-w-0">

          <p className="text-xs font-semibold text-slate-200">
            {item.participante_nome}
            {" → "}
            {item.proximo_participante_nome}
          </p>

          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            {item.origem_comarca_nome}
            {" → "}
            {item.proximo_origem_comarca_nome}
          </p>

          <p
            className={`mt-1 text-[11px] leading-5 ${
              item.ligacao_compativel
                ? "text-emerald-300"
                : "text-red-300"
            }`}
          >
            {item.motivo}
          </p>

        </div>

      </div>

    </div>
  );
}


/* ======================================================
   ESTADO VAZIO
====================================================== */

function EstadoVazio({
  titulo,
  texto,
  icone
}: {
  titulo: string;
  texto: string;
  icone: "usuarios" | "busca";
}) {

  return (
    <div className="rounded-2xl border border-dashed border-teal-300/15 bg-[#081b29] p-10 text-center">

      {
        icone === "usuarios"
          ? (
            <UsersRound className="mx-auto h-10 w-10 text-slate-400" />
          )
          : (
            <Search className="mx-auto h-10 w-10 text-slate-400" />
          )
      }

      <h2 className="mt-4 text-lg font-bold text-white">
        {titulo}
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
        {texto}
      </p>

    </div>
  );
}


/* ======================================================
   FILTRAR COMARCAS
====================================================== */

function filtrarComarcas(
  comarcas: Comarca[],
  busca: string
) {

  const termo =
    normalizarTexto(
      busca
    );


  if (!termo) {
    return comarcas.slice(0, 25);
  }


  return comarcas
    .filter(
      comarca =>
        normalizarTexto(
          comarca.nome
        ).includes(
          termo
        )
    )
    .slice(0, 25);
}


/* ======================================================
   NORMALIZAR TEXTO
====================================================== */

function normalizarTexto(
  valor: string
) {

  return valor
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}


/* ======================================================
   MENSAGEM DE ERRO
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
            message?: unknown;
          }
        ).message ?? ""
      );


    if (mensagem) {
      return mensagem;
    }
  }


  return "Ocorreu um erro inesperado. Tente novamente.";
}