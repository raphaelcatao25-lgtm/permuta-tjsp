"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  Info,
  Link2,
  MapPin,
  Search,
  Send,
  Trash2,
  UserRound,
  UsersRound,
  X,
  XCircle
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

type PerfilAtual = {
  id: string;
  nome: string;
  cargo: string | null;
  comarca_atual_id: number;
  unidade_atual_id: string | null;
  em_match: boolean | null;
  busca_pausada: boolean | null;
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

type ItemOrdemOrganizada = {
  ordem: number;
  usuario_id: string;
  nome: string;
  comarca_atual_id: number;
  unidade_atual_id: string | null;
};

type OrganizacaoPermuta = {
  valido: boolean;
  fechou_ciclo: boolean;
  quantidade_participantes: number;
  tipo?: string;
  ordem?: ItemOrdemOrganizada[];
  ordem_parcial?: ItemOrdemOrganizada[];
  mensagem: string;
};

type LadoMontagem = "frente" | "tras" | "ponte";

export default function BuscarServidoresPage() {
  const [perfil, setPerfil] = useState<PerfilAtual | null>(null);
  const [comarcas, setComarcas] = useState<Comarca[]>([]);
  const [minhasPreferencias, setMinhasPreferencias] = useState<PreferenciaUsuario[]>([]);

  const [destinoInicial, setDestinoInicial] = useState<Comarca | null>(null);
  const [buscaDestino, setBuscaDestino] = useState("");
  const [abrirDestino, setAbrirDestino] = useState(false);

  const [cadeiaFrente, setCadeiaFrente] = useState<ServidorResultado[]>([]);
  const [cadeiaTras, setCadeiaTras] = useState<ServidorResultado[]>([]);

  const [resultadosFrente, setResultadosFrente] = useState<ServidorResultado[]>([]);
  const [resultadosTras, setResultadosTras] = useState<ServidorResultado[]>([]);
  const [resultadosPonte, setResultadosPonte] = useState<ServidorResultado[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [buscandoSugestoes, setBuscandoSugestoes] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  const [organizacao, setOrganizacao] = useState<OrganizacaoPermuta | null>(null);
  const [validacao, setValidacao] = useState<LigacaoValidacao[]>([]);
  const [organizando, setOrganizando] = useState(false);

  const [modalEnvioAberto, setModalEnvioAberto] = useState(false);
  const [mensagemProposta, setMensagemProposta] = useState(
    "Olá! Encontrei uma possibilidade de permuta compatível pelo Permuta TJSP. Confira a movimentação proposta e, caso tenha interesse, registre seu aceite. Meus dados de contato estão disponíveis nesta proposta para que você possa falar comigo."
  );
  const [enviandoProposta, setEnviandoProposta] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      setCarregando(true);
      setErro("");

      try {
        const { data: dadosUsuario, error: erroUsuario } = await supabase.auth.getUser();
        if (erroUsuario) throw erroUsuario;

        const usuario = dadosUsuario.user;
        if (!usuario) throw new Error("Usuário não autenticado.");

        const [respostaPerfil, respostaComarcas, respostaPreferencias] = await Promise.all([
          supabase
            .from("perfis")
            .select("id,nome,cargo,comarca_atual_id,unidade_atual_id,em_match,busca_pausada")
            .eq("id", usuario.id)
            .single(),
          supabase
            .from("comarcas_tjsp")
            .select("id,nome,circunscricao_id")
            .order("nome", { ascending: true }),
          supabase
            .from("preferencias_movimentacao")
            .select("comarca_destino_id,prioridade")
            .eq("perfil_id", usuario.id)
            .eq("ativo", true)
            .order("prioridade", { ascending: true })
        ]);

        if (respostaPerfil.error) throw respostaPerfil.error;
        if (respostaComarcas.error) throw respostaComarcas.error;
        if (respostaPreferencias.error) throw respostaPreferencias.error;
        if (!ativo) return;

        setPerfil(respostaPerfil.data as PerfilAtual);
        setComarcas((respostaComarcas.data ?? []) as Comarca[]);
        setMinhasPreferencias((respostaPreferencias.data ?? []) as PreferenciaUsuario[]);
      } catch (error) {
        if (ativo) setErro(extrairMensagemErro(error));
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarDados();
    return () => {
      ativo = false;
    };
  }, []);

  const minhaComarcaAtual = useMemo(() => {
    if (!perfil) return null;
    return comarcas.find(item => item.id === perfil.comarca_atual_id) ?? null;
  }, [perfil, comarcas]);

  const meusDestinos = useMemo(() => {
    return minhasPreferencias
      .map(preferencia => {
        const comarca = comarcas.find(item => item.id === preferencia.comarca_destino_id);
        return comarca ? { ...comarca, prioridade: preferencia.prioridade } : null;
      })
      .filter((item): item is Comarca & { prioridade: number } => Boolean(item));
  }, [minhasPreferencias, comarcas]);

  const opcoesDestino = useMemo(() => {
    return filtrarComarcas(meusDestinos, buscaDestino);
  }, [meusDestinos, buscaDestino]);

  const selecionados = useMemo(() => {
    const mapa = new Map<string, ServidorResultado>();
    [...cadeiaFrente, ...cadeiaTras].forEach(item => mapa.set(item.perfil_id, item));
    return [...mapa.values()];
  }, [cadeiaFrente, cadeiaTras]);

  const idsSelecionados = useMemo(
    () => new Set(selecionados.map(item => item.perfil_id)),
    [selecionados]
  );

  const quantidadeParticipantes = 1 + selecionados.length;

  // PONTA DA FRENTE
  // Inicialmente é a comarca onde o usuário quer chegar.
  // Depois que adicionamos alguém desse lado, a nova ponta passa a ser
  // qualquer comarca que o último servidor da frente deseja.
  const alvosFrente = useMemo(() => {
    if (!destinoInicial) return [] as { id: number; nome: string }[];

    const ultimo = cadeiaFrente[cadeiaFrente.length - 1];
    if (!ultimo) return [{ id: destinoInicial.id, nome: destinoInicial.nome }];

    const mapa = new Map<number, string>();
    ultimo.destinos.filter(destinoEhValido).forEach(destino => {
      mapa.set(destino.comarca_id, destino.comarca_nome);
    });

    return [...mapa.entries()].map(([id, nome]) => ({ id, nome }));
  }, [destinoInicial, cadeiaFrente]);

  // PONTA DE TRÁS
  // Inicialmente alguém precisa querer a comarca atual do usuário.
  // Se adicionamos alguém por trás, o próximo precisa querer a comarca atual
  // desse último servidor adicionado.
  const alvoTras = useMemo(() => {
    if (!minhaComarcaAtual) return null;

    const ultimo = cadeiaTras[cadeiaTras.length - 1];
    if (!ultimo) return { id: minhaComarcaAtual.id, nome: minhaComarcaAtual.nome };

    return {
      id: ultimo.comarca_atual_id,
      nome: ultimo.comarca_atual_nome
    };
  }, [minhaComarcaAtual, cadeiaTras]);

  // Se alguma das comarcas desejadas pela ponta da frente já é exatamente
  // a comarca atual da ponta de trás, as pontas se encontraram sem precisar
  // de outra pessoa.
  const pontasSeEncontraram = useMemo(() => {
    if (!alvoTras || alvosFrente.length === 0) return false;
    return alvosFrente.some(alvo => alvo.id === alvoTras.id);
  }, [alvosFrente, alvoTras]);

  const montagemValida =
    Boolean(organizacao?.fechou_ciclo) &&
    validacao.length === quantidadeParticipantes &&
    validacao.length >= 2 &&
    validacao.every(item => item.ligacao_compativel);

  async function executarBusca(filtros: {
    comarcaAtualId?: number | null;
    comarcaDestinoId?: number | null;
  }) {
    if (!perfil) return [] as ServidorResultado[];

    const { data, error } = await supabase.rpc("buscar_servidores_manual_v3", {
      p_usuario_id: perfil.id,
      p_nome: null,
      p_raj_atual_id: null,
      p_circunscricao_atual_id: null,
      p_comarca_atual_id: filtros.comarcaAtualId ?? null,
      p_raj_destino_id: null,
      p_circunscricao_destino_id: null,
      p_comarca_destino_id: filtros.comarcaDestinoId ?? null,
      p_limite: 250
    });

    if (error) throw error;

    return ((data ?? []) as ServidorResultado[])
      .map(servidor => ({
        ...servidor,
        destinos: Array.isArray(servidor.destinos)
          ? servidor.destinos.filter(destinoEhValido)
          : []
      }))
      .filter(servidor => servidor.destinos.length > 0)
      .filter(servidor => !servidor.em_match && !servidor.busca_pausada);
  }

  useEffect(() => {
    if (!perfil || !destinoInicial || !alvoTras || alvosFrente.length === 0) {
      setResultadosFrente([]);
      setResultadosTras([]);
      setResultadosPonte([]);
      return;
    }

    let ativo = true;

    async function carregarSugestoes() {
      setBuscandoSugestoes(true);
      setErro("");

      try {
        const buscasFrente = alvosFrente.slice(0, 10).map(alvo =>
          executarBusca({ comarcaAtualId: alvo.id })
        );

        const [listasFrente, listaTras] = await Promise.all([
          Promise.all(buscasFrente),
          executarBusca({ comarcaDestinoId: alvoTras!.id })
        ]);

        if (!ativo) return;

        const mapaFrente = new Map<string, ServidorResultado>();
        listasFrente.flat().forEach(servidor => {
          if (!idsSelecionados.has(servidor.perfil_id)) {
            mapaFrente.set(servidor.perfil_id, servidor);
          }
        });

        const mapaTras = new Map<string, ServidorResultado>();
        listaTras.forEach(servidor => {
          if (!idsSelecionados.has(servidor.perfil_id)) {
            mapaTras.set(servidor.perfil_id, servidor);
          }
        });

        // PONTE PERFEITA:
        // está em uma das comarcas que a ponta da frente deseja
        // E deseja ir para a comarca atual da ponta de trás.
        const pontes = [...mapaFrente.values()].filter(servidor =>
          servidor.destinos.some(destino => destino.comarca_id === alvoTras!.id)
        );

        const idsPontes = new Set(pontes.map(item => item.perfil_id));

        const frenteSemPontes = [...mapaFrente.values()]
          .filter(item => !idsPontes.has(item.perfil_id))
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

        const trasSemPontes = [...mapaTras.values()]
          .filter(item => !idsPontes.has(item.perfil_id))
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

        setResultadosPonte(pontes.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
        setResultadosFrente(frenteSemPontes);
        setResultadosTras(trasSemPontes);
      } catch (error) {
        if (!ativo) return;
        setResultadosFrente([]);
        setResultadosTras([]);
        setResultadosPonte([]);
        setErro(extrairMensagemErro(error));
      } finally {
        if (ativo) setBuscandoSugestoes(false);
      }
    }

    void carregarSugestoes();
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil, destinoInicial, alvosFrente, alvoTras, idsSelecionados]);

  useEffect(() => {
    if (!perfil || selecionados.length < 1) {
      setOrganizacao(null);
      setValidacao([]);
      return;
    }

    let ativo = true;

    async function organizarAutomaticamente() {
      setOrganizando(true);
      setMensagemSucesso("");

      try {
        const participantes = [perfil!.id, ...selecionados.map(item => item.perfil_id)];

        const { data, error } = await supabase.rpc("organizar_permuta_manual", {
          p_usuario_id: perfil!.id,
          p_participantes: participantes
        });

        if (error) throw error;
        if (!ativo) return;

        const resultado = data as OrganizacaoPermuta;
        setOrganizacao(resultado);

        if (!resultado.fechou_ciclo || !Array.isArray(resultado.ordem)) {
          setValidacao([]);
          return;
        }

        const participantesOrdenados = [
          perfil!.id,
          ...resultado.ordem
            .filter(item => item.usuario_id !== perfil!.id)
            .map(item => item.usuario_id)
        ];

        const { data: dadosValidacao, error: erroValidacao } = await supabase.rpc(
          "validar_permuta_manual",
          {
            p_usuario_id: perfil!.id,
            p_participantes: participantesOrdenados
          }
        );

        if (erroValidacao) throw erroValidacao;
        if (!ativo) return;

        const linhas = (dadosValidacao ?? []) as LigacaoValidacao[];
        setValidacao(linhas);

        if (linhas.length > 0 && linhas.every(item => item.ligacao_compativel)) {
          setMensagemSucesso("Ciclo fechado. Todas as movimentações foram validadas com sucesso.");
        }
      } catch (error) {
        if (!ativo) return;
        setOrganizacao(null);
        setValidacao([]);
        setErro(extrairMensagemErro(error));
      } finally {
        if (ativo) setOrganizando(false);
      }
    }

    void organizarAutomaticamente();
    return () => {
      ativo = false;
    };
  }, [perfil, selecionados]);

  function selecionarDestino(comarca: Comarca) {
    setDestinoInicial(comarca);
    setBuscaDestino(comarca.nome);
    setAbrirDestino(false);
    limparCadeias(false);
  }

  function limparDestino() {
    setDestinoInicial(null);
    setBuscaDestino("");
    setAbrirDestino(false);
    limparCadeias(false);
  }

  function validarPodeAdicionar(servidor: ServidorResultado) {
    setErro("");
    setMensagemSucesso("");

    if (perfil?.em_match) {
      setErro("Você já possui uma permuta confirmada em andamento.");
      return false;
    }

    if (perfil?.busca_pausada) {
      setErro("Sua busca está pausada. Reative sua participação em Meu Perfil antes de montar uma proposta.");
      return false;
    }

    if (idsSelecionados.has(servidor.perfil_id)) return false;

    if (selecionados.length >= 6) {
      setErro("A permuta montada pode ter no máximo 7 participantes contando com você.");
      return false;
    }

    return true;
  }

  function adicionarServidor(servidor: ServidorResultado, lado: LadoMontagem) {
    if (!validarPodeAdicionar(servidor)) return;

    if (lado === "tras") {
      setCadeiaTras(atuais => [...atuais, servidor]);
      return;
    }

    // Uma ponte é adicionada na frente porque sua comarca atual atende a
    // ponta da frente e o seu destino já alcança a ponta de trás.
    setCadeiaFrente(atuais => [...atuais, servidor]);
  }

  function removerServidor(perfilId: string) {
    setCadeiaFrente(atuais => atuais.filter(item => item.perfil_id !== perfilId));
    setCadeiaTras(atuais => atuais.filter(item => item.perfil_id !== perfilId));
    setErro("");
    setMensagemSucesso("");
  }

  function limparCadeias(limparDestinoTambem = false) {
    setCadeiaFrente([]);
    setCadeiaTras([]);
    setResultadosFrente([]);
    setResultadosTras([]);
    setResultadosPonte([]);
    setOrganizacao(null);
    setValidacao([]);
    setMensagemSucesso("");
    setErro("");

    if (limparDestinoTambem) {
      setDestinoInicial(null);
      setBuscaDestino("");
      setAbrirDestino(false);
    }
  }

  function abrirEnvioProposta() {
    if (!montagemValida) {
      setErro("O ciclo precisa estar totalmente compatível antes de enviar a proposta.");
      return;
    }

    setErro("");
    setModalEnvioAberto(true);
  }

  async function enviarPropostaManual() {
    if (!perfil || !montagemValida) return;

    const mensagem = mensagemProposta.trim();
    if (!mensagem) {
      setErro("Digite uma mensagem para acompanhar a proposta.");
      return;
    }

    setEnviandoProposta(true);
    setErro("");

    try {
      const participantes = [perfil.id, ...selecionados.map(item => item.perfil_id)];

      const { error } = await supabase.rpc("criar_permuta_manual", {
        p_usuario_id: perfil.id,
        p_participantes: participantes,
        p_mensagem: mensagem
      });

      if (error) throw error;

      setModalEnvioAberto(false);
      limparCadeias(false);
      setMensagemSucesso(
        participantes.length === 2
          ? "Proposta de permuta direta enviada com sucesso."
          : `Proposta de ciclo com ${participantes.length} participantes enviada com sucesso.`
      );
      window.dispatchEvent(new Event("atualizar-notificacoes"));
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setEnviandoProposta(false);
    }
  }

  const bloqueado = Boolean(perfil?.em_match) || Boolean(perfil?.busca_pausada);

  return (
    <AuthGuard>
      <DashboardLayout nomeUsuario={perfil?.nome?.trim().split(/\s+/)[0] || "Servidor"}>
        <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
          <section className="overflow-hidden rounded-2xl border border-teal-300/10 bg-[#0d2232] shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
            <div className="border-b border-teal-300/10 bg-[#0a1f2f] px-6 py-6 sm:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/[0.08] text-teal-300">
                  <UsersRound size={23} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-teal-300">Vamos montar sua permuta passo a passo</p>
                  <h1 className="mt-1 text-3xl font-bold text-white">Buscar Permuta</h1>
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
                    Funciona como um jogo de encaixar peças: você escolhe para onde quer ir e o sistema mostra quem pode entrar no seu caminho. Você pode começar por qualquer lado e nós organizamos a ordem para você.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {perfil?.em_match && (
            <Aviso
              tipo="teal"
              titulo="Você está em uma permuta confirmada."
              texto="Você pode consultar a montagem, mas não poderá enviar uma nova proposta enquanto a permuta atual estiver em andamento."
            />
          )}

          {!perfil?.em_match && perfil?.busca_pausada && (
            <Aviso
              tipo="amber"
              titulo="Sua busca está pausada."
              texto="Você pode consultar servidores, mas deverá reativar sua busca em Meu Perfil antes de montar uma proposta."
            />
          )}

          <section className="overflow-visible rounded-2xl border border-teal-300/10 bg-[#0d2232] shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
            <div className="grid gap-5 p-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/[0.05] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Você está em</p>
                <p className="mt-2 text-lg font-bold text-white">{minhaComarcaAtual?.nome ?? "Não informada"}</p>
              </div>

              <ArrowRight className="mx-auto hidden text-slate-600 lg:block" />

              <div className="relative z-40 rounded-xl border border-teal-300/10 bg-[#081b29] p-4">
                <AutocompleteComarca
                  label="1. Para onde você quer ir?"
                  placeholder="Escolha a comarca onde você gostaria de trabalhar"
                  valor={buscaDestino}
                  aberta={abrirDestino}
                  selecionada={destinoInicial}
                  opcoes={opcoesDestino}
                  onFocus={() => setAbrirDestino(true)}
                  onChange={valor => {
                    setBuscaDestino(valor);
                    setDestinoInicial(null);
                    setAbrirDestino(true);
                  }}
                  onSelecionar={selecionarDestino}
                  onLimpar={limparDestino}
                  onFechar={() => setAbrirDestino(false)}
                />

                {meusDestinos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {meusDestinos.map(destino => (
                      <button
                        key={destino.id}
                        type="button"
                        onClick={() => selecionarDestino(destino)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
                          destinoInicial?.id === destino.id
                            ? "border-teal-300/30 bg-teal-400/15 text-teal-200"
                            : "border-teal-300/10 bg-[#071a28] text-slate-400 hover:text-teal-200"
                        }`}
                      >
                        {destino.prioridade}. {destino.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {erro && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              {erro}
            </div>
          )}

          {mensagemSucesso && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
              {mensagemSucesso}
            </div>
          )}

          {!destinoInicial ? (
            <EstadoVazio
              titulo={carregando ? "Carregando suas preferências..." : "Primeiro escolha para onde você quer ir"}
              texto="Depois disso, vamos mostrar duas formas simples de começar: alguém que está onde você quer ir ou alguém que quer vir para onde você está."
            />
          ) : (
            <>
              <OrientacaoDuasPontas
                minhaComarca={minhaComarcaAtual}
                destinoInicial={destinoInicial}
                alvosFrente={alvosFrente}
                alvoTras={alvoTras}
                pontasSeEncontraram={pontasSeEncontraram}
                possuiPonte={resultadosPonte.length > 0}
                organizacao={organizacao}
                organizando={organizando}
              />

              <section className="overflow-hidden rounded-2xl border border-teal-300/10 bg-[#0d2232] shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-300/10 bg-[#0a1f2f] px-6 py-5">
                  <div>
                    <p className="text-sm font-semibold text-teal-300">Seu caminho até agora</p>
                    <h2 className="mt-1 text-xl font-bold text-white">{quantidadeParticipantes} participante(s)</h2>
                    <p className="mt-1 text-xs text-slate-400">Adicione as pessoas que fizerem sentido. Você não precisa acertar a ordem: o sistema organiza tudo para você.</p>
                  </div>

                  {selecionados.length > 0 && (
                    <button
                      type="button"
                      onClick={() => limparCadeias(false)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-300/15 bg-red-400/[0.05] px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-400/[0.1]"
                    >
                      <Trash2 size={15} />
                      Limpar pessoas
                    </button>
                  )}
                </div>

                <div className="p-6">
                  <CicloVisualDuasPontas
                    perfil={perfil}
                    minhaComarca={minhaComarcaAtual}
                    destinoInicial={destinoInicial}
                    cadeiaFrente={cadeiaFrente}
                    cadeiaTras={cadeiaTras}
                    alvosFrente={alvosFrente}
                    alvoTras={alvoTras}
                    onRemover={removerServidor}
                  />
                </div>
              </section>

              {montagemValida && validacao.length > 0 ? (
                <section className="rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.06] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-emerald-300">🎉 Todas as peças se encaixaram!</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">O ciclo está completo e todos os participantes têm uma movimentação compatível.</p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                  </div>

                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {validacao.map(item => (
                      <LigacaoCard key={`${item.participante_id}-${item.ordem}`} item={item} />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={abrirEnvioProposta}
                    disabled={bloqueado || enviandoProposta}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={17} />
                    Enviar proposta
                  </button>
                </section>
              ) : (
                <section className="space-y-5">
                  {resultadosPonte.length > 0 && (
                    <GrupoResultados
                      destaque="ponte"
                      titulo="3. Esta pessoa pode completar o ciclo"
                      texto={textoPonte(alvosFrente, alvoTras)}
                      resultados={resultadosPonte}
                      lado="ponte"
                      idsSelecionados={idsSelecionados}
                      limiteAtingido={selecionados.length >= 6}
                      bloqueado={bloqueado}
                      referenciaFrenteIds={new Set(alvosFrente.map(item => item.id))}
                      referenciaTrasId={alvoTras?.id ?? null}
                      onAdicionar={adicionarServidor}
                      onRemover={removerServidor}
                    />
                  )}

                  <div className="grid gap-5 xl:grid-cols-2">
                    <GrupoResultados
                      destaque="frente"
                      titulo="2A. Procure quem está onde você quer ir"
                      texto={textoFrente(alvosFrente)}
                      resultados={resultadosFrente}
                      lado="frente"
                      idsSelecionados={idsSelecionados}
                      limiteAtingido={selecionados.length >= 6}
                      bloqueado={bloqueado}
                      referenciaFrenteIds={new Set(alvosFrente.map(item => item.id))}
                      referenciaTrasId={alvoTras?.id ?? null}
                      onAdicionar={adicionarServidor}
                      onRemover={removerServidor}
                    />

                    <GrupoResultados
                      destaque="tras"
                      titulo="2B. Ou procure quem quer sua vaga"
                      texto={textoTras(alvoTras)}
                      resultados={resultadosTras}
                      lado="tras"
                      idsSelecionados={idsSelecionados}
                      limiteAtingido={selecionados.length >= 6}
                      bloqueado={bloqueado}
                      referenciaFrenteIds={new Set(alvosFrente.map(item => item.id))}
                      referenciaTrasId={alvoTras?.id ?? null}
                      onAdicionar={adicionarServidor}
                      onRemover={removerServidor}
                    />
                  </div>

                  {!buscandoSugestoes &&
                    resultadosPonte.length === 0 &&
                    resultadosFrente.length === 0 &&
                    resultadosTras.length === 0 && (
                      <EstadoVazio
                        titulo="Ainda não encontramos uma peça para continuar"
                        texto="Neste momento não encontramos alguém que encaixe por nenhum dos dois lados. Você pode tentar outra comarca desejada ou voltar depois quando houver novos servidores cadastrados."
                      />
                    )}
                </section>
              )}
            </>
          )}
        </div>

        {modalEnvioAberto && (
          <ModalEnviarProposta
            quantidadeParticipantes={quantidadeParticipantes}
            mensagem={mensagemProposta}
            enviando={enviandoProposta}
            onMensagemChange={setMensagemProposta}
            onFechar={() => setModalEnvioAberto(false)}
            onEnviar={enviarPropostaManual}
          />
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}

function OrientacaoDuasPontas({
  minhaComarca,
  destinoInicial,
  alvosFrente,
  alvoTras,
  pontasSeEncontraram,
  possuiPonte,
  organizacao,
  organizando
}: {
  minhaComarca: Comarca | null;
  destinoInicial: Comarca;
  alvosFrente: { id: number; nome: string }[];
  alvoTras: { id: number; nome: string } | null;
  pontasSeEncontraram: boolean;
  possuiPonte: boolean;
  organizacao: OrganizacaoPermuta | null;
  organizando: boolean;
}) {
  const nomesFrente = formatarNomes(alvosFrente.map(item => item.nome));

  return (
    <section className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.06] p-5">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-amber-200">O que você precisa procurar agora</p>

          {organizacao?.fechou_ciclo ? (
            <p className="mt-2 text-sm leading-6 text-slate-300">🎉 As peças já formam um círculo completo. Agora o sistema só está conferindo se todas as movimentações são válidas.</p>
          ) : pontasSeEncontraram ? (
            <p className="mt-2 text-sm leading-6 text-slate-300">
              🎯 Os dois lados já chegaram em <strong className="text-amber-200">{alvoTras?.nome}</strong>. Isso significa que talvez não seja necessário adicionar mais ninguém. O sistema está conferindo.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-sm leading-6 text-slate-300">
                Você está em <strong className="text-white">{minhaComarca?.nome}</strong> e quer ir para <strong className="text-white">{destinoInicial.nome}</strong>. Agora podemos procurar pessoas pelos dois lados.
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-cyan-300/15 bg-[#081b29] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Caminho 1 — comece por onde você quer chegar</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Procure alguém que <strong className="text-cyan-200">esteja em {nomesFrente}</strong>. Essa pessoa pode continuar o caminho a partir de onde você quer chegar.
                  </p>
                </div>

                <div className="rounded-xl border border-violet-300/15 bg-[#081b29] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">Caminho 2 — comece por quem quer sua vaga</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Procure alguém que <strong className="text-violet-200">queira ir para {alvoTras?.nome ?? "sua comarca"}</strong>. Essa pessoa ajuda a fechar o caminho de volta até você.
                  </p>
                </div>
              </div>

              {alvoTras && (
                <div className={`rounded-xl border p-4 ${possuiPonte ? "border-emerald-300/20 bg-emerald-400/[0.06]" : "border-amber-300/15 bg-[#081b29]"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${possuiPonte ? "text-emerald-300" : "text-amber-300"}`}>
                    {possuiPonte ? "✅ Encontramos a pessoa que pode completar" : "🧩 A pessoa que falta"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Para completar o círculo agora, procure uma pessoa que <strong className="text-white">esteja em {nomesFrente}</strong> e <strong className="text-white">queira ir para {alvoTras.nome}</strong>.
                  </p>
                  {!possuiPonte && (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Não encontrou essa pessoa? Sem problema. Adicione alguém que esteja em uma dessas comarcas ou alguém que queira ir para a comarca indicada. O sistema recalcula o caminho automaticamente.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {organizando && (
            <p className="mt-3 text-xs text-slate-500">Validando as combinações selecionadas...</p>
          )}
        </div>
      </div>
    </section>
  );
}

function GrupoResultados({
  destaque,
  titulo,
  texto,
  resultados,
  lado,
  idsSelecionados,
  limiteAtingido,
  bloqueado,
  referenciaFrenteIds,
  referenciaTrasId,
  onAdicionar,
  onRemover
}: {
  destaque: "frente" | "tras" | "ponte";
  titulo: string;
  texto: string;
  resultados: ServidorResultado[];
  lado: LadoMontagem;
  idsSelecionados: Set<string>;
  limiteAtingido: boolean;
  bloqueado: boolean;
  referenciaFrenteIds: Set<number>;
  referenciaTrasId: number | null;
  onAdicionar: (servidor: ServidorResultado, lado: LadoMontagem) => void;
  onRemover: (perfilId: string) => void;
}) {
  const classes =
    destaque === "ponte"
      ? "border-emerald-300/20 bg-emerald-400/[0.035]"
      : destaque === "frente"
        ? "border-cyan-300/15 bg-cyan-400/[0.025]"
        : "border-violet-300/15 bg-violet-400/[0.025]";

  return (
    <section className={`rounded-2xl border p-5 ${classes}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
          destaque === "ponte"
            ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300"
            : destaque === "frente"
              ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-300"
              : "border-violet-300/20 bg-violet-400/10 text-violet-300"
        }`}>
          {destaque === "ponte" ? <Link2 size={18} /> : destaque === "frente" ? <ArrowRight size={18} /> : <ArrowDown size={18} />}
        </div>
        <div>
          <h3 className="text-base font-bold text-white">{titulo}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">{texto}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {resultados.length > 0 ? (
          resultados.slice(0, 40).map(servidor => (
            <ServidorCard
              key={`${lado}-${servidor.perfil_id}`}
              servidor={servidor}
              lado={lado}
              selecionado={idsSelecionados.has(servidor.perfil_id)}
              limiteAtingido={limiteAtingido}
              bloqueado={bloqueado}
              referenciaFrenteIds={referenciaFrenteIds}
              referenciaTrasId={referenciaTrasId}
              onAdicionar={() => onAdicionar(servidor, lado)}
              onRemover={() => onRemover(servidor.perfil_id)}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-teal-300/10 bg-[#071a28] p-4 text-center text-xs leading-5 text-slate-500">
            Nenhum servidor disponível nesta direção agora.
          </div>
        )}
      </div>
    </section>
  );
}

function CicloVisualDuasPontas({
  perfil,
  minhaComarca,
  destinoInicial,
  cadeiaFrente,
  cadeiaTras,
  alvosFrente,
  alvoTras,
  onRemover
}: {
  perfil: PerfilAtual | null;
  minhaComarca: Comarca | null;
  destinoInicial: Comarca;
  cadeiaFrente: ServidorResultado[];
  cadeiaTras: ServidorResultado[];
  alvosFrente: { id: number; nome: string }[];
  alvoTras: { id: number; nome: string } | null;
  onRemover: (perfilId: string) => void;
}) {
  const ordemVisual = [
    ...cadeiaFrente.map(item => ({ servidor: item, lado: "frente" as const })),
    ...[...cadeiaTras].reverse().map(item => ({ servidor: item, lado: "tras" as const }))
  ];

  const participantes = [
    {
      id: perfil?.id ?? "eu",
      nome: "Você",
      comarca: minhaComarca?.nome ?? "Não informada",
      detalhe: `quer ir para ${destinoInicial.nome}`,
      tipo: "eu" as const,
      removivel: false
    },
    ...ordemVisual.map(({ servidor, lado }) => ({
      id: servidor.perfil_id,
      nome: servidor.nome,
      comarca: servidor.comarca_atual_nome,
      detalhe:
        lado === "frente"
          ? `destinos: ${formatarNomes(servidor.destinos.slice(0, 2).map(item => item.comarca_nome))}`
          : `fecha por trás → ${formatarNomes(servidor.destinos.slice(0, 2).map(item => item.comarca_nome))}`,
      tipo: lado,
      removivel: true
    }))
  ];

  const total = participantes.length;
  const tamanho = 560;
  const centro = tamanho / 2;
  const raio = total <= 2 ? 155 : total <= 4 ? 185 : 205;

  return (
    <div className="overflow-x-auto">
      <div className="relative mx-auto h-[560px] min-w-[560px] max-w-[560px]">
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden="true">
          <circle cx={centro} cy={centro} r={raio} fill="none" stroke="rgba(94,234,212,0.16)" strokeWidth="2" strokeDasharray="8 9" />
          {total > 1 && participantes.map((_, indice) => {
            const a1 = -Math.PI / 2 + (indice * 2 * Math.PI) / total;
            const a2 = -Math.PI / 2 + (((indice + 1) % total) * 2 * Math.PI) / total;
            const x1 = centro + Math.cos(a1) * (raio - 58);
            const y1 = centro + Math.sin(a1) * (raio - 58);
            const x2 = centro + Math.cos(a2) * (raio - 58);
            const y2 = centro + Math.sin(a2) * (raio - 58);
            return <line key={indice} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(45,212,191,0.35)" strokeWidth="2" />;
          })}
        </svg>

        <div className="absolute left-1/2 top-1/2 z-10 w-48 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-teal-300/10 bg-[#071a28] p-4 text-center shadow-xl">
          <UsersRound className="mx-auto h-6 w-6 text-teal-300" />
          <p className="mt-2 text-xs font-bold text-white">O que ainda falta encaixar</p>
          <p className="mt-2 text-[11px] leading-5 text-cyan-200">
            Procure quem está em: {formatarNomes(alvosFrente.map(item => item.nome))}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-violet-200">
            Ou quem quer ir para: {alvoTras?.nome ?? "-"}
          </p>
        </div>

        {participantes.map((item, indice) => {
          const angulo = -Math.PI / 2 + (indice * 2 * Math.PI) / total;
          const x = centro + Math.cos(angulo) * raio;
          const y = centro + Math.sin(angulo) * raio;

          const estilo =
            item.tipo === "eu"
              ? "border-emerald-300/30 bg-emerald-400/[0.08]"
              : item.tipo === "frente"
                ? "border-cyan-300/25 bg-cyan-400/[0.07]"
                : "border-violet-300/25 bg-violet-400/[0.07]";

          return (
            <div
              key={item.id}
              className={`absolute z-20 w-40 -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-3 text-center shadow-lg ${estilo}`}
              style={{ left: x, top: y }}
            >
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-slate-200">
                <UserRound size={16} />
              </div>
              <p className="mt-2 truncate text-xs font-bold text-white">{item.nome}</p>
              <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-300">{item.comarca}</p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">{item.detalhe}</p>
              {item.removivel && (
                <button
                  type="button"
                  onClick={() => onRemover(item.id)}
                  className="mt-2 text-[10px] font-semibold text-red-300 hover:text-red-200"
                >
                  remover
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ServidorCard({
  servidor,
  lado,
  selecionado,
  limiteAtingido,
  bloqueado,
  referenciaFrenteIds,
  referenciaTrasId,
  onAdicionar,
  onRemover
}: {
  servidor: ServidorResultado;
  lado: LadoMontagem;
  selecionado: boolean;
  limiteAtingido: boolean;
  bloqueado: boolean;
  referenciaFrenteIds: Set<number>;
  referenciaTrasId: number | null;
  onAdicionar: () => void;
  onRemover: () => void;
}) {
  const encaixaFrente = referenciaFrenteIds.has(servidor.comarca_atual_id);
  const encaixaTras = referenciaTrasId
    ? servidor.destinos.some(destino => destino.comarca_id === referenciaTrasId)
    : false;

  return (
    <article className="rounded-xl border border-teal-300/10 bg-[#0d2232] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-teal-300/15 bg-teal-400/[0.08] text-teal-300">
          <UserRound size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{servidor.nome}</p>
          <p className="mt-1 text-xs text-slate-400">
            Está em <strong className="text-slate-200">{servidor.comarca_atual_nome}</strong>
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {encaixaFrente && (
              <span className="rounded-full border border-cyan-300/15 bg-cyan-400/[0.07] px-2 py-1 text-[10px] font-semibold text-cyan-200">
                está onde precisamos
              </span>
            )}
            {encaixaTras && (
              <span className="rounded-full border border-violet-300/15 bg-violet-400/[0.07] px-2 py-1 text-[10px] font-semibold text-violet-200">
                quer ir para onde precisamos
              </span>
            )}
            {encaixaFrente && encaixaTras && (
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/[0.08] px-2 py-1 text-[10px] font-semibold text-emerald-200">
                pode completar o ciclo
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {servidor.destinos.slice(0, 4).map(destino => (
              <span
                key={`${destino.comarca_id}-${destino.prioridade}`}
                className="rounded-lg border border-teal-300/10 bg-[#081b29] px-2 py-1 text-[10px] text-slate-300"
              >
                → {destino.comarca_nome}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={selecionado ? onRemover : onAdicionar}
        disabled={!selecionado && (bloqueado || limiteAtingido)}
        className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition disabled:opacity-50 ${
          selecionado
            ? "border border-red-300/15 bg-red-400/[0.07] text-red-300"
            : lado === "ponte"
              ? "border border-emerald-300/20 bg-emerald-600 text-white hover:bg-emerald-500"
              : "border border-teal-300/20 bg-teal-600 text-white hover:bg-teal-500"
        }`}
      >
        {selecionado ? <X size={15} /> : <CirclePlus size={16} />}
        {selecionado ? "Remover" : lado === "ponte" ? "Adicionar e completar" : "Adicionar esta pessoa"}
      </button>
    </article>
  );
}

function LigacaoCard({ item }: { item: LigacaoValidacao }) {
  return (
    <div className={`rounded-xl border p-3 ${
      item.ligacao_compativel
        ? "border-emerald-300/15 bg-emerald-400/[0.05]"
        : "border-red-300/15 bg-red-400/[0.05]"
    }`}>
      <div className="flex items-start gap-3">
        {item.ligacao_compativel ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
        ) : (
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
        )}
        <div>
          <p className="text-xs font-semibold text-slate-200">
            {item.participante_nome} → {item.proximo_participante_nome}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {item.origem_comarca_nome} → {item.proximo_origem_comarca_nome}
          </p>
        </div>
      </div>
    </div>
  );
}

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
              {quantidadeParticipantes === 2 ? "Permuta direta" : `Ciclo de ${quantidadeParticipantes}`}
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">Enviar proposta</h2>
          </div>
          <button
            type="button"
            onClick={onFechar}
            disabled={enviando}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.05] hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <textarea
            value={mensagem}
            onChange={event => onMensagemChange(event.target.value)}
            rows={6}
            maxLength={1200}
            disabled={enviando}
            className="w-full resize-none rounded-xl border border-teal-300/15 bg-[#081b29] px-4 py-3 text-sm leading-6 text-white outline-none focus:border-teal-400"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onFechar}
              disabled={enviando}
              className="rounded-xl border border-teal-300/15 bg-[#081b29] px-5 py-3 text-sm font-semibold text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onEnviar}
              disabled={enviando || !mensagem.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
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
  const tituloClasse = tipo === "amber" ? "text-amber-200" : "text-teal-200";

  return (
    <div className={`rounded-2xl border p-5 ${classes}`}>
      <p className={`font-semibold ${tituloClasse}`}>{titulo}</p>
      <p className="mt-1 text-sm leading-6 text-slate-400">{texto}</p>
    </div>
  );
}

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
  onLimpar,
  onFechar
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
  onFechar: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function verificarCliqueFora(event: MouseEvent) {
      const alvo = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(alvo)) onFechar();
    }

    document.addEventListener("mousedown", verificarCliqueFora);
    return () => document.removeEventListener("mousedown", verificarCliqueFora);
  }, [onFechar]);

  return (
    <div ref={containerRef} className="relative z-50">
      <label className="mb-2 block text-sm font-semibold text-slate-300">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={valor}
          onFocus={onFocus}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-teal-300/15 bg-[#071a28] px-4 py-3 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-teal-300/25 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10"
        />

        {valor && (
          <button
            type="button"
            onClick={onLimpar}
            className="absolute right-10 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400"
          >
            <X size={16} />
          </button>
        )}

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {aberta && !selecionada && (
        <div className="absolute left-0 right-0 z-[80] mt-2 max-h-64 overflow-y-auto rounded-xl border border-teal-300/10 bg-[#071a28] p-1 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
          {opcoes.length > 0 ? (
            opcoes.map(comarca => (
              <button
                key={comarca.id}
                type="button"
                onMouseDown={event => {
                  event.preventDefault();
                  onSelecionar(comarca);
                }}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-teal-400/[0.07] hover:text-teal-200"
              >
                {comarca.nome}
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-sm text-slate-400">Nenhuma comarca desejada encontrada.</div>
          )}
        </div>
      )}
    </div>
  );
}

function EstadoVazio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-teal-300/15 bg-[#081b29] p-8 text-center">
      <Search className="mx-auto h-8 w-8 text-slate-500" />
      <h3 className="mt-3 text-sm font-bold text-white">{titulo}</h3>
      <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-slate-400">{texto}</p>
    </div>
  );
}

function textoPonte(
  alvosFrente: { id: number; nome: string }[],
  alvoTras: { id: number; nome: string } | null
) {
  return `Estas pessoas fazem exatamente a ligação que está faltando: estão em ${formatarNomes(alvosFrente.map(item => item.nome))} e querem ir para ${alvoTras?.nome ?? "a comarca que precisamos"}. Se você adicionar uma delas, o ciclo pode ficar completo.`;
}

function textoFrente(alvosFrente: { id: number; nome: string }[]) {
  return `Estas pessoas estão em ${formatarNomes(alvosFrente.map(item => item.nome))}. Escolha uma delas para continuar o caminho a partir daí. Depois, o sistema mostra qual será a próxima peça necessária.`;
}

function textoTras(alvoTras: { id: number; nome: string } | null) {
  return `Estas pessoas querem ir para ${alvoTras?.nome ?? "a comarca que precisamos"}. Escolha uma delas para montar o caminho de volta até você. Depois, o sistema recalcula o que ainda falta.`;
}

function destinoEhValido(destino: DestinoServidor) {
  const nome = normalizarTexto(destino.comarca_nome ?? "");
  return nome.length > 0 && !nome.includes("sem prefer");
}

function filtrarComarcas<T extends { nome: string }>(lista: T[], busca: string) {
  const termo = normalizarTexto(busca);
  if (!termo) return lista.slice(0, 25);
  return lista.filter(comarca => normalizarTexto(comarca.nome).includes(termo)).slice(0, 25);
}

function formatarNomes(nomes: string[]) {
  const unicos = [...new Set(nomes.filter(Boolean))];
  if (unicos.length === 0) return "a comarca indicada";
  if (unicos.length === 1) return unicos[0];
  if (unicos.length === 2) return `${unicos[0]} ou ${unicos[1]}`;
  return `${unicos.slice(0, -1).join(", ")} ou ${unicos[unicos.length - 1]}`;
}

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function extrairMensagemErro(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const mensagem = String((error as { message?: unknown }).message ?? "");
    if (mensagem) return mensagem;
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
}