"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  Info,
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
  acertos?: number;
  quebra_apos_usuario_id?: string;
  quebra_apos_nome?: string;
  proxima_origem_comarca_id?: number | null;
  proxima_origem_nome?: string | null;
  destino_para_fechamento_id?: number | null;
  destino_para_fechamento_nome?: string | null;
};

export default function BuscarServidoresPage() {
  const [perfil, setPerfil] = useState<PerfilAtual | null>(null);
  const [comarcas, setComarcas] = useState<Comarca[]>([]);
  const [minhasPreferencias, setMinhasPreferencias] = useState<PreferenciaUsuario[]>([]);

  const [comarcaBuscaSelecionada, setComarcaBuscaSelecionada] = useState<Comarca | null>(null);
  const [buscaComarca, setBuscaComarca] = useState("");
  const [abrirComarca, setAbrirComarca] = useState(false);

  const [resultados, setResultados] = useState<ServidorResultado[]>([]);
  const [pesquisou, setPesquisou] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  const [selecionados, setSelecionados] = useState<ServidorResultado[]>([]);
  const [validacao, setValidacao] = useState<LigacaoValidacao[]>([]);
  const [organizacao, setOrganizacao] = useState<OrganizacaoPermuta | null>(null);
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

  const opcoesComarca = useMemo(
    () => filtrarComarcas(comarcas, buscaComarca),
    [comarcas, buscaComarca]
  );

  const idsSelecionados = useMemo(
    () => new Set(selecionados.map(item => item.perfil_id)),
    [selecionados]
  );

  const quantidadeParticipantes = 1 + selecionados.length;
  const montagemValida =
    Boolean(organizacao?.fechou_ciclo) &&
    validacao.length === quantidadeParticipantes &&
    validacao.length >= 2 &&
    validacao.every(item => item.ligacao_compativel);

  const destinosAlternativos = useMemo(() => {
    if (!organizacao?.proxima_origem_comarca_id) return [];

    const contagem = new Map<number, { nome: string; quantidade: number }>();
    for (const servidor of resultados) {
      if (servidor.comarca_atual_id !== organizacao.proxima_origem_comarca_id) continue;
      for (const destino of servidor.destinos.filter(destinoEhValido)) {
        if (destino.comarca_id === organizacao.destino_para_fechamento_id) continue;
        const atual = contagem.get(destino.comarca_id);
        contagem.set(destino.comarca_id, {
          nome: destino.comarca_nome,
          quantidade: (atual?.quantidade ?? 0) + 1
        });
      }
    }

    return [...contagem.entries()]
      .sort((a, b) => b[1].quantidade - a[1].quantidade)
      .slice(0, 3)
      .map(([id, dados]) => ({ id, ...dados }));
  }, [resultados, organizacao]);

  useEffect(() => {
    if (!perfil) return;
    if (selecionados.length < 1) {
      setOrganizacao(null);
      setValidacao([]);
      return;
    }

    let ativo = true;

    async function organizarAutomaticamente() {
      setOrganizando(true);
      setErro("");
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

        if (resultado.fechou_ciclo && Array.isArray(resultado.ordem)) {
          const idsOrdenados = resultado.ordem
            .filter(item => item.usuario_id !== perfil!.id)
            .map(item => item.usuario_id);

          const mapa = new Map(selecionados.map(item => [item.perfil_id, item]));
          const novaOrdem = idsOrdenados
            .map(id => mapa.get(id))
            .filter((item): item is ServidorResultado => Boolean(item));

          const mudou =
            novaOrdem.length === selecionados.length &&
            novaOrdem.some((item, indice) => item.perfil_id !== selecionados[indice]?.perfil_id);

          if (mudou) {
            setSelecionados(novaOrdem);
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

          setValidacao((dadosValidacao ?? []) as LigacaoValidacao[]);
          setMensagemSucesso(resultado.mensagem);
        } else {
          setValidacao([]);
          if (resultado.proxima_origem_comarca_id) {
            const proxima = comarcas.find(
              item => item.id === resultado.proxima_origem_comarca_id
            );
            if (proxima) {
              setComarcaBuscaSelecionada(proxima);
              setBuscaComarca(proxima.nome);
              await buscarAutomaticamentePorOrigem(proxima.id);
            }
          }
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

    organizarAutomaticamente();
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil, selecionados]);

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
      .filter(servidor => servidor.destinos.length > 0);
  }

  async function buscarPorComarca(comarca: Comarca) {
    setBuscando(true);
    setErro("");
    setMensagemSucesso("");

    try {
      const [quemEstaNaComarca, quemQuerIrParaComarca] = await Promise.all([
        executarBusca({ comarcaAtualId: comarca.id }),
        executarBusca({ comarcaDestinoId: comarca.id })
      ]);

      const mapa = new Map<string, ServidorResultado>();
      [...quemEstaNaComarca, ...quemQuerIrParaComarca].forEach(item => {
        if (!idsSelecionados.has(item.perfil_id)) mapa.set(item.perfil_id, item);
      });

      const lista = [...mapa.values()].sort((a, b) => {
        const aAtual = a.comarca_atual_id === comarca.id ? 1 : 0;
        const bAtual = b.comarca_atual_id === comarca.id ? 1 : 0;
        const aDestino = a.destinos.some(d => d.comarca_id === comarca.id) ? 1 : 0;
        const bDestino = b.destinos.some(d => d.comarca_id === comarca.id) ? 1 : 0;
        return bAtual + bDestino - (aAtual + aDestino);
      });

      setResultados(lista);
      setPesquisou(true);
    } catch (error) {
      setResultados([]);
      setPesquisou(true);
      setErro(extrairMensagemErro(error));
    } finally {
      setBuscando(false);
    }
  }

  async function buscarAutomaticamentePorOrigem(origemId: number) {
    setBuscando(true);
    setErro("");

    try {
      const lista = await executarBusca({ comarcaAtualId: origemId });
      setResultados(lista.filter(item => !idsSelecionados.has(item.perfil_id)));
      setPesquisou(true);
    } catch (error) {
      setResultados([]);
      setPesquisou(true);
      setErro(extrairMensagemErro(error));
    } finally {
      setBuscando(false);
    }
  }

  function selecionarComarca(comarca: Comarca) {
    setComarcaBuscaSelecionada(comarca);
    setBuscaComarca(comarca.nome);
    setAbrirComarca(false);
    void buscarPorComarca(comarca);
  }

  function limparComarca() {
    setComarcaBuscaSelecionada(null);
    setBuscaComarca("");
    setAbrirComarca(false);
    setResultados([]);
    setPesquisou(false);
    setErro("");
  }

  function adicionarServidor(servidor: ServidorResultado) {
    setErro("");
    setMensagemSucesso("");

    if (perfil?.em_match) {
      setErro("Você já possui uma permuta confirmada em andamento.");
      return;
    }
    if (perfil?.busca_pausada) {
      setErro("Sua busca está pausada. Reative sua participação em Meu Perfil antes de montar uma proposta.");
      return;
    }
    if (idsSelecionados.has(servidor.perfil_id)) return;
    if (selecionados.length >= 6) {
      setErro("A permuta montada pode ter no máximo 7 participantes contando com você.");
      return;
    }

    setSelecionados(atuais => [...atuais, servidor]);
  }

  function removerServidor(perfilId: string) {
    setSelecionados(atuais => atuais.filter(item => item.perfil_id !== perfilId));
  }

  function limparMontagem() {
    setSelecionados([]);
    setOrganizacao(null);
    setValidacao([]);
    setMensagemSucesso("");
    setErro("");
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
      setSelecionados([]);
      setValidacao([]);
      setOrganizacao(null);
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
                  <p className="text-sm font-semibold text-teal-300">Busca inteligente</p>
                  <h1 className="mt-1 text-3xl font-bold text-white">Buscar Permuta</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                    Pesquise uma comarca. O sistema mostra tanto quem está nela quanto quem deseja ir para ela e reorganiza o ciclo automaticamente conforme você adiciona servidores.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {perfil?.em_match && (
            <Aviso tipo="teal" titulo="Você está em uma permuta confirmada." texto="Você pode consultar servidores, mas não poderá montar uma nova proposta enquanto a permuta atual estiver em andamento." />
          )}

          {!perfil?.em_match && perfil?.busca_pausada && (
            <Aviso tipo="amber" titulo="Sua busca está pausada." texto="Você pode consultar servidores, mas deverá reativar sua busca em Meu Perfil antes de montar uma proposta." />
          )}

          <section className="overflow-visible rounded-2xl border border-teal-300/10 bg-[#0d2232] shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <div className="rounded-xl border border-teal-300/10 bg-[#081b29] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sua comarca atual</p>
                <p className="mt-2 text-lg font-bold text-white">{minhaComarcaAtual?.nome ?? "Não informada"}</p>
              </div>

              <div className="hidden text-slate-600 lg:block">→</div>

              <div className="rounded-xl border border-teal-300/10 bg-[#081b29] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suas comarcas desejadas</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {meusDestinos.length > 0 ? meusDestinos.map(destino => (
                    <span key={destino.id} className="rounded-lg border border-teal-300/10 bg-teal-400/[0.06] px-3 py-1.5 text-sm text-teal-200">
                      {destino.prioridade}. {destino.nome}
                    </span>
                  )) : <span className="text-sm text-slate-500">Nenhuma preferência cadastrada.</span>}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
            <div className="space-y-6">
              <section className="overflow-visible rounded-2xl border border-teal-300/10 bg-[#0d2232] shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
                <div className="border-b border-teal-300/10 bg-[#0a1f2f] px-5 py-5">
                  <div className="flex items-center gap-3">
                    <Search className="h-5 w-5 text-teal-300" />
                    <div>
                      <h2 className="text-lg font-bold text-white">Pesquisar comarca</h2>
                      <p className="mt-1 text-xs leading-5 text-slate-400">Digite somente a comarca. A busca acontece ao selecionar.</p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <AutocompleteComarca
                    label="Comarca"
                    placeholder="Ex.: Vinhedo"
                    valor={buscaComarca}
                    aberta={abrirComarca}
                    selecionada={comarcaBuscaSelecionada}
                    opcoes={opcoesComarca}
                    onFocus={() => setAbrirComarca(true)}
                    onChange={valor => {
                      setBuscaComarca(valor);
                      setComarcaBuscaSelecionada(null);
                      setAbrirComarca(true);
                    }}
                    onSelecionar={selecionarComarca}
                    onLimpar={limparComarca}
                    onFechar={() => setAbrirComarca(false)}
                  />

                  <div className="mt-4 rounded-xl border border-teal-300/10 bg-[#081b29] p-4">
                    <p className="text-xs leading-5 text-slate-400">
                      Exemplo: pesquisando <strong className="text-slate-200">Vinhedo</strong>, você verá servidores que estão em Vinhedo e querem sair de lá, além de servidores de outras comarcas que desejam ir para Vinhedo.
                    </p>
                  </div>
                </div>
              </section>

              {erro && <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">{erro}</div>}
              {mensagemSucesso && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">{mensagemSucesso}</div>}

              <section className="space-y-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Servidores encontrados</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    {buscando ? "Buscando..." : pesquisou ? `${resultados.length} resultado(s).` : "Selecione uma comarca para começar."}
                  </p>
                </div>

                {!carregando && resultados.map(servidor => (
                  <ServidorCard
                    key={servidor.perfil_id}
                    servidor={servidor}
                    comarcaReferenciaId={comarcaBuscaSelecionada?.id ?? null}
                    selecionado={idsSelecionados.has(servidor.perfil_id)}
                    limiteAtingido={selecionados.length >= 6}
                    bloqueado={Boolean(perfil?.em_match) || Boolean(perfil?.busca_pausada)}
                    onAdicionar={() => adicionarServidor(servidor)}
                    onRemover={() => removerServidor(servidor.perfil_id)}
                  />
                ))}

                {!buscando && pesquisou && resultados.length === 0 && (
                  <EstadoVazio titulo="Nenhum servidor encontrado" texto="Não há servidores disponíveis para essa comarca neste momento." />
                )}
              </section>
            </div>

            <div className="space-y-6">
              <section className="overflow-hidden rounded-2xl border border-teal-300/10 bg-[#0d2232] shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                <div className="flex items-start justify-between gap-4 border-b border-teal-300/10 bg-[#0a1f2f] px-5 py-5">
                  <div>
                    <p className="text-sm font-semibold text-teal-300">Montagem visual</p>
                    <h2 className="mt-1 text-xl font-bold text-white">Ciclo de Permuta</h2>
                    <p className="mt-1 text-xs text-slate-400">{quantidadeParticipantes}/7 participantes</p>
                  </div>
                  {selecionados.length > 0 && (
                    <button type="button" onClick={limparMontagem} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.05] hover:text-red-300" title="Limpar ciclo">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="p-5">
                  <CicloVisual
                    perfil={perfil}
                    minhaComarcaAtual={minhaComarcaAtual}
                    selecionados={selecionados}
                    validacao={validacao}
                    onRemover={removerServidor}
                  />

                  <div className="mt-5 rounded-xl border border-teal-300/10 bg-[#081b29] p-4">
                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                      <p className="text-xs leading-5 text-slate-400">
                        Você pode adicionar os servidores em qualquer ordem. O sistema reorganiza automaticamente as peças para encontrar a melhor sequência.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {organizando && (
                <div className="rounded-2xl border border-teal-300/15 bg-teal-400/[0.06] p-5">
                  <p className="text-sm font-semibold text-teal-200">Recalculando o ciclo...</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Testando as combinações possíveis e definindo o próximo elo.</p>
                </div>
              )}

              {!organizando && selecionados.length === 0 && (
                <div className="rounded-2xl border border-dashed border-teal-300/15 bg-[#081b29] p-6 text-center">
                  <CirclePlus className="mx-auto h-8 w-8 text-slate-500" />
                  <p className="mt-3 text-sm font-semibold text-slate-300">Adicione o primeiro servidor</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">O círculo começa com você e cresce automaticamente conforme novas pessoas são adicionadas.</p>
                </div>
              )}

              {!organizando && organizacao && !organizacao.fechou_ciclo && (
                <OrientacaoCiclo
                  organizacao={organizacao}
                  destinosAlternativos={destinosAlternativos}
                />
              )}

              {!organizando && organizacao?.fechou_ciclo && validacao.length > 0 && (
                <section className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.05] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-emerald-300">Ciclo fechado</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">A ordem foi organizada automaticamente.</p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                  </div>

                  <div className="mt-4 space-y-2">
                    {validacao.map(item => <LigacaoCard key={`${item.participante_id}-${item.ordem}`} item={item} />)}
                  </div>

                  <button
                    type="button"
                    onClick={abrirEnvioProposta}
                    disabled={!montagemValida || enviandoProposta}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} />
                    Enviar proposta
                  </button>
                </section>
              )}
            </div>
          </div>
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

function OrientacaoCiclo({
  organizacao,
  destinosAlternativos
}: {
  organizacao: OrganizacaoPermuta;
  destinosAlternativos: { id: number; nome: string; quantidade: number }[];
}) {
  const origem = organizacao.proxima_origem_nome ?? "a comarca indicada";
  const fechamento = organizacao.destino_para_fechamento_nome;

  return (
    <section className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.07] p-5">
      <p className="text-sm font-bold text-amber-200">O ciclo ainda não fecha</p>

      <div className="mt-4 space-y-3">
        {fechamento && (
          <div className="rounded-xl border border-amber-300/15 bg-[#081b29] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Para fechar agora</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Tente encontrar uma pessoa que <strong className="text-amber-200">esteja em {origem}</strong> e queira ir para <strong className="text-amber-200">{fechamento}</strong>.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-cyan-300/15 bg-[#081b29] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ou continue o ciclo</p>
          {destinosAlternativos.length > 0 ? (
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Você também pode adicionar mais um servidor que <strong className="text-cyan-200">esteja em {origem}</strong> e queira ir para {destinosAlternativos.map((item, indice) => (
                <span key={item.id}>
                  {indice > 0 && (indice === destinosAlternativos.length - 1 ? " ou " : ", ")}
                  <strong className="text-cyan-200">{item.nome}</strong>
                </span>
              ))}. Depois disso, o sistema recalcula automaticamente o próximo elo necessário.
            </p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Você também pode adicionar mais um servidor que <strong className="text-cyan-200">esteja em {origem}</strong> e queira ir para outra comarca. Ao adicioná-lo, o sistema recalcula automaticamente quem falta para fechar a cadeia.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function CicloVisual({
  perfil,
  minhaComarcaAtual,
  selecionados,
  validacao,
  onRemover
}: {
  perfil: PerfilAtual | null;
  minhaComarcaAtual: Comarca | null;
  selecionados: ServidorResultado[];
  validacao: LigacaoValidacao[];
  onRemover: (perfilId: string) => void;
}) {
  const participantes = [
    {
      id: perfil?.id ?? "eu",
      nome: perfil?.nome ?? "Você",
      comarca: minhaComarcaAtual?.nome ?? "Não informada",
      fixo: true
    },
    ...selecionados.map(item => ({
      id: item.perfil_id,
      nome: item.nome,
      comarca: item.comarca_atual_nome,
      fixo: false
    }))
  ];

  const ligacoes = new Map(validacao.map(item => [item.participante_id, item.proximo_origem_comarca_nome]));
  const total = participantes.length;
  const tamanho = 520;
  const centro = tamanho / 2;
  const raio = total <= 2 ? 145 : total <= 4 ? 175 : 190;

  return (
    <div className="overflow-x-auto">
      <div className="relative mx-auto h-[520px] min-w-[520px] max-w-[520px]">
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden="true">
          <circle cx={centro} cy={centro} r={raio} fill="none" stroke="rgba(94,234,212,0.18)" strokeWidth="2" strokeDasharray="7 8" />
          {total > 1 && participantes.map((_, indice) => {
            const a1 = -Math.PI / 2 + (indice * 2 * Math.PI) / total;
            const a2 = -Math.PI / 2 + (((indice + 1) % total) * 2 * Math.PI) / total;
            const x1 = centro + Math.cos(a1) * (raio - 52);
            const y1 = centro + Math.sin(a1) * (raio - 52);
            const x2 = centro + Math.cos(a2) * (raio - 52);
            const y2 = centro + Math.sin(a2) * (raio - 52);
            return <line key={indice} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(45,212,191,0.42)" strokeWidth="2" />;
          })}
        </svg>

        <div className="absolute left-1/2 top-1/2 z-10 w-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-teal-300/10 bg-[#071a28] p-4 text-center shadow-xl">
          <UsersRound className="mx-auto h-6 w-6 text-teal-300" />
          <p className="mt-2 text-xs font-semibold text-slate-300">{total === 1 ? "Comece o ciclo" : `${total} participantes`}</p>
        </div>

        {participantes.map((item, indice) => {
          const angulo = -Math.PI / 2 + (indice * 2 * Math.PI) / total;
          const x = centro + Math.cos(angulo) * raio;
          const y = centro + Math.sin(angulo) * raio;
          const destinoLigado = ligacoes.get(item.id);

          return (
            <div
              key={item.id}
              className={`absolute z-20 w-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-3 text-center shadow-lg ${item.fixo ? "border-emerald-300/30 bg-emerald-400/[0.08]" : "border-violet-300/25 bg-violet-400/[0.07]"}`}
              style={{ left: x, top: y }}
            >
              <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ${item.fixo ? "bg-emerald-400/15 text-emerald-300" : "bg-violet-400/15 text-violet-300"}`}>
                <UserRound size={16} />
              </div>
              <p className="mt-2 truncate text-xs font-bold text-white">{item.fixo ? "Você" : item.nome}</p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400">{item.comarca}</p>
              {destinoLigado && <p className="mt-2 text-[10px] leading-4 text-teal-300">→ {destinoLigado}</p>}
              {!item.fixo && (
                <button type="button" onClick={() => onRemover(item.id)} className="mt-2 text-[10px] font-semibold text-red-300 hover:text-red-200">remover</button>
              )}
            </div>
          );
        })}
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
            <p className="text-sm font-semibold text-teal-300">{quantidadeParticipantes === 2 ? "Permuta direta" : `Ciclo de ${quantidadeParticipantes}`}</p>
            <h2 className="mt-1 text-xl font-bold text-white">Enviar proposta</h2>
          </div>
          <button type="button" onClick={onFechar} disabled={enviando} className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.05] hover:text-white"><X size={20} /></button>
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
            <button type="button" onClick={onFechar} disabled={enviando} className="rounded-xl border border-teal-300/15 bg-[#081b29] px-5 py-3 text-sm font-semibold text-slate-300">Cancelar</button>
            <button type="button" onClick={onEnviar} disabled={enviando || !mensagem.trim()} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"><Send size={17} />{enviando ? "Enviando..." : "Confirmar e enviar"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Aviso({ tipo, titulo, texto }: { tipo: "teal" | "amber"; titulo: string; texto: string }) {
  const classes = tipo === "amber" ? "border-amber-300/20 bg-amber-400/[0.07]" : "border-teal-300/10 bg-teal-400/[0.07]";
  const tituloClasse = tipo === "amber" ? "text-amber-200" : "text-teal-200";
  return <div className={`rounded-2xl border p-5 ${classes}`}><p className={`font-semibold ${tituloClasse}`}>{titulo}</p><p className="mt-1 text-sm leading-6 text-slate-400">{texto}</p></div>;
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
    <div ref={containerRef} className="relative z-20">
      <label className="mb-2 block text-sm font-semibold text-slate-300">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={valor}
          onFocus={onFocus}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-teal-300/15 bg-[#081b29] px-4 py-3 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-teal-300/25 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10"
        />
        {valor && <button type="button" onClick={onLimpar} className="absolute right-10 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400"><X size={16} /></button>}
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
      {aberta && !selecionada && (
        <div className="relative z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-teal-300/10 bg-[#071a28] p-1 shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
          {opcoes.length > 0 ? opcoes.map(comarca => (
            <button key={comarca.id} type="button" onMouseDown={event => { event.preventDefault(); onSelecionar(comarca); }} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-teal-400/[0.07] hover:text-teal-200">{comarca.nome}</button>
          )) : <div className="px-3 py-4 text-sm text-slate-400">Nenhuma comarca encontrada.</div>}
        </div>
      )}
    </div>
  );
}

function ServidorCard({
  servidor,
  comarcaReferenciaId,
  selecionado,
  limiteAtingido,
  bloqueado,
  onAdicionar,
  onRemover
}: {
  servidor: ServidorResultado;
  comarcaReferenciaId: number | null;
  selecionado: boolean;
  limiteAtingido: boolean;
  bloqueado: boolean;
  onAdicionar: () => void;
  onRemover: () => void;
}) {
  const estaNaComarca = comarcaReferenciaId === servidor.comarca_atual_id;
  const querIrParaComarca = comarcaReferenciaId
    ? servidor.destinos.some(destino => destino.comarca_id === comarcaReferenciaId)
    : false;

  return (
    <article className="rounded-2xl border border-teal-300/10 bg-[#0d2232] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-teal-300/15 bg-teal-400/[0.08] text-teal-300"><UserRound size={17} /></div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{servidor.nome}</p>
          <p className="mt-1 text-xs text-slate-400">Atual: <strong className="text-slate-200">{servidor.comarca_atual_nome}</strong></p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {estaNaComarca && <span className="rounded-full border border-cyan-300/15 bg-cyan-400/[0.07] px-2 py-1 text-[10px] font-semibold text-cyan-200">Está nesta comarca</span>}
            {querIrParaComarca && <span className="rounded-full border border-emerald-300/15 bg-emerald-400/[0.07] px-2 py-1 text-[10px] font-semibold text-emerald-200">Quer ir para esta comarca</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {servidor.destinos.slice(0, 3).map(destino => <span key={`${destino.comarca_id}-${destino.prioridade}`} className="rounded-lg border border-teal-300/10 bg-[#081b29] px-2 py-1 text-[10px] text-slate-300">→ {destino.comarca_nome}</span>)}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={selecionado ? onRemover : onAdicionar}
        disabled={!selecionado && (bloqueado || limiteAtingido)}
        className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition disabled:opacity-50 ${selecionado ? "border border-red-300/15 bg-red-400/[0.07] text-red-300" : "border border-teal-300/20 bg-teal-600 text-white hover:bg-teal-500"}`}
      >
        {selecionado ? <X size={15} /> : <CirclePlus size={16} />}
        {selecionado ? "Remover" : "Adicionar ao ciclo"}
      </button>
    </article>
  );
}

function LigacaoCard({ item }: { item: LigacaoValidacao }) {
  return (
    <div className={`rounded-xl border p-3 ${item.ligacao_compativel ? "border-emerald-300/15 bg-emerald-400/[0.05]" : "border-red-300/15 bg-red-400/[0.05]"}`}>
      <div className="flex items-start gap-3">
        {item.ligacao_compativel ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />}
        <div>
          <p className="text-xs font-semibold text-slate-200">{item.participante_nome} → {item.proximo_participante_nome}</p>
          <p className="mt-1 text-[11px] text-slate-500">{item.origem_comarca_nome} → {item.proximo_origem_comarca_nome}</p>
        </div>
      </div>
    </div>
  );
}

function EstadoVazio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-teal-300/15 bg-[#081b29] p-8 text-center">
      <Search className="mx-auto h-8 w-8 text-slate-500" />
      <h3 className="mt-3 text-sm font-bold text-white">{titulo}</h3>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-400">{texto}</p>
    </div>
  );
}

function destinoEhValido(destino: DestinoServidor) {
  const nome = normalizarTexto(destino.comarca_nome ?? "");
  return nome.length > 0 && !nome.includes("sem prefer");
}

function filtrarComarcas(lista: Comarca[], busca: string) {
  const termo = normalizarTexto(busca);
  if (!termo) return lista.slice(0, 25);
  return lista.filter(comarca => normalizarTexto(comarca.nome).includes(termo)).slice(0, 25);
}

function normalizarTexto(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function extrairMensagemErro(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const mensagem = String((error as { message?: unknown }).message ?? "");
    if (mensagem) return mensagem;
  }
  return "Ocorreu um erro inesperado. Tente novamente.";
}