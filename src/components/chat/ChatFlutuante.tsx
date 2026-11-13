"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, LoaderCircle, MessageCircle, Search, Send, Trash2, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Conversa = {
  conversa_id: string;
  outro_usuario_id: string;
  outro_nome: string;
  outro_cargo: string;
  outra_comarca: string;
  ultima_mensagem: string | null;
  ultima_mensagem_em: string | null;
  nao_lidas: number;
};

type Servidor = {
  id: string;
  nome: string;
  cargo: string;
  comarca: string;
};

type Mensagem = {
  id: string;
  conversa_id: string;
  remetente_id: string;
  conteudo: string;
  criado_em: string;
};

export function ChatFlutuante() {
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<Servidor[]>([]);
  const [modoBusca, setModoBusca] = useState(false);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [notificacao, setNotificacao] = useState("");
  const fimMensagensRef = useRef<HTMLDivElement>(null);
  const totalNaoLidas = useMemo(
    () => conversas.reduce((total, conversa) => total + Number(conversa.nao_lidas || 0), 0),
    [conversas],
  );

  const carregarConversas = useCallback(async () => {
    const { data, error } = await supabase.rpc("chat_listar_conversas");
    if (error) {
      console.error("Erro ao carregar conversas:", error.message);
      return;
    }
    setConversas((data || []) as Conversa[]);
  }, []);

  const carregarMensagens = useCallback(async (conversaId: string) => {
    const { data, error } = await supabase
      .from("chat_mensagens")
      .select("id, conversa_id, remetente_id, conteudo, criado_em")
      .eq("conversa_id", conversaId)
      .order("criado_em", { ascending: true })
      .limit(200);
    if (error) {
      console.error("Erro ao carregar mensagens:", error.message);
      return;
    }
    setMensagens((data || []) as Mensagem[]);
    await supabase.rpc("chat_marcar_lida", { p_conversa: conversaId });
    await carregarConversas();
  }, [carregarConversas]);

  useEffect(() => {
    let ativo = true;
    supabase.auth.getUser().then(({ data }) => {
      if (ativo) setUsuarioId(data.user?.id ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuarioId(session?.user?.id ?? null);
      if (!session?.user) {
        setAberto(false);
        setConversas([]);
        setConversaAtiva(null);
      }
    });
    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!usuarioId) return;
    void carregarConversas();
    const canal = supabase
      .channel(`chat-global-${usuarioId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_mensagens" },
        (payload) => {
          const nova = payload.new as Mensagem;
          if (nova.remetente_id !== usuarioId) {
            if (conversaAtiva?.conversa_id === nova.conversa_id && aberto) {
              void carregarMensagens(nova.conversa_id);
            } else {
              setNotificacao("Você recebeu uma nova mensagem.");
              window.setTimeout(() => setNotificacao(""), 5000);
              void carregarConversas();
            }
          } else {
            void carregarConversas();
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [usuarioId, aberto, conversaAtiva?.conversa_id, carregarConversas, carregarMensagens]);

  useEffect(() => {
    fimMensagensRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  useEffect(() => {
    if (!usuarioId || !aberto || !modoBusca || busca.trim().length < 2) {
      setResultados([]);
      return;
    }
    let ativo = true;
    const id = window.setTimeout(async () => {
      setCarregando(true);
      const { data, error } = await supabase.rpc("chat_buscar_servidores", {
        p_termo: busca.trim(),
      });
      if (!ativo) return;
      setCarregando(false);
      if (error) {
        setAviso("Não foi possível realizar a busca. Tente novamente.");
        return;
      }
      setAviso("");
      setResultados((data || []) as Servidor[]);
    }, 300);
    return () => {
      ativo = false;
      window.clearTimeout(id);
    };
  }, [usuarioId, aberto, modoBusca, busca]);

  async function abrirConversa(destinatarioId: string) {
    setCarregando(true);
    setAviso("");
    const { data, error } = await supabase.rpc("chat_abrir_conversa", {
      p_destinatario: destinatarioId,
    });
    if (error || !data) {
      setCarregando(false);
      setAviso(error?.message || "Não foi possível abrir a conversa.");
      return;
    }
    const conversaId = data as string;
    const { data: lista } = await supabase.rpc("chat_listar_conversas");
    const encontrada = ((lista || []) as Conversa[]).find((item) => item.conversa_id === conversaId);
    if (encontrada) setConversaAtiva(encontrada);
    else {
      const servidor = resultados.find((item) => item.id === destinatarioId);
      if (servidor) {
        setConversaAtiva({
          conversa_id: conversaId,
          outro_usuario_id: servidor.id,
          outro_nome: servidor.nome,
          outro_cargo: servidor.cargo,
          outra_comarca: servidor.comarca,
          ultima_mensagem: null,
          ultima_mensagem_em: null,
          nao_lidas: 0,
        });
      }
    }
    setConversas((lista || []) as Conversa[]);
    setMensagens([]);
    setModoBusca(false);
    setBusca("");
    setResultados([]);
    setCarregando(false);
    await carregarMensagens(conversaId);
  }

  async function enviarMensagem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo || !conversaAtiva || !usuarioId || enviando) return;
    setEnviando(true);
    const { error } = await supabase.from("chat_mensagens").insert({
      conversa_id: conversaAtiva.conversa_id,
      remetente_id: usuarioId,
      conteudo,
    });
    setEnviando(false);
    if (error) {
      console.error("Erro ao enviar mensagem no chat:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      setAviso(`Falha ao enviar: ${error.message || "erro desconhecido"}`);
      return;
    }
    setTexto("");
    await carregarMensagens(conversaAtiva.conversa_id);
  }

  async function ocultarConversa(conversa: Conversa) {
    const confirmar = window.confirm(`Remover a conversa com ${conversa.outro_nome} da sua lista? O histórico da outra pessoa será preservado.`);
    if (!confirmar) return;
    const { error } = await supabase.rpc("chat_ocultar_conversa", {
      p_conversa: conversa.conversa_id,
    });
    if (error) {
      console.error("Erro ao remover conversa:", error.message);
      setAviso("Não foi possível remover esta conversa. Tente novamente.");
      return;
    }
    setConversas((atuais) => atuais.filter((item) => item.conversa_id !== conversa.conversa_id));
    if (conversaAtiva?.conversa_id === conversa.conversa_id) {
      setConversaAtiva(null);
      setMensagens([]);
    }
    setAviso("");
  }

  function fecharPainel() {
    setAberto(false);
    setConversaAtiva(null);
    setModoBusca(false);
    setBusca("");
    setAviso("");
  }

  if (!usuarioId) return null;

  return (
    <>
      {notificacao && (
        <div className="fixed bottom-24 right-5 z-[140] max-w-[min(360px,calc(100vw-2rem))] rounded-xl border border-teal-300/25 bg-[#0b2635] px-4 py-3 text-sm font-semibold text-teal-100 shadow-2xl">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-teal-300" />
          {notificacao}
          <button type="button" aria-label="Fechar aviso" onClick={() => setNotificacao("")} className="ml-3 text-teal-200">×</button>
        </div>
      )}

      {aberto && (
        <section className="fixed bottom-24 right-4 z-[130] flex h-[min(620px,calc(100dvh-8rem))] w-[min(410px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-teal-300/20 bg-[#071a28] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
          <header className="flex items-center justify-between border-b border-white/10 bg-[#0a2130] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              {conversaAtiva && (
                <button type="button" onClick={() => { setConversaAtiva(null); setMensagens([]); void carregarConversas(); }} aria-label="Voltar às conversas" className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10">
                  <ArrowLeft size={18} />
                </button>
              )}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-300/20 bg-teal-400/10 text-teal-300">
                <MessageCircle size={19} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-white">{conversaAtiva ? conversaAtiva.outro_nome : "Mensagens"}</h2>
                <p className="truncate text-[11px] text-slate-400">{conversaAtiva ? `${conversaAtiva.outro_cargo} • ${conversaAtiva.outra_comarca}` : "Converse com servidores de outras comarcas"}</p>
              </div>
            </div>
            <button type="button" onClick={fecharPainel} aria-label="Fechar chat" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><X size={19} /></button>
          </header>

          {!conversaAtiva ? (
            <>
              <div className="border-b border-white/10 p-3">
                <button type="button" onClick={() => { setModoBusca(!modoBusca); setBusca(""); setAviso(""); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-300/20 bg-teal-400/10 px-3 py-2.5 text-sm font-semibold text-teal-200 transition hover:bg-teal-400/15">
                  <Search size={16} /> {modoBusca ? "Voltar às conversas" : "Buscar servidor ou comarca"}
                </button>
                {modoBusca && (
                  <div className="mt-3">
                    <input value={busca} onChange={(event) => setBusca(event.target.value)} autoFocus placeholder="Digite um nome ou uma comarca..." className="w-full rounded-xl border border-white/10 bg-[#04131f] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-teal-400/60" />
                    <p className="mt-2 text-[11px] text-slate-500">Busque por parte do nome ou da comarca. A pesquisa ignora acentos e não exige o nome completo.</p>
                  </div>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {modoBusca ? (
                  carregando ? <div className="flex justify-center py-10 text-teal-300"><LoaderCircle className="animate-spin" /></div> :
                  busca.trim().length < 2 ? <p className="px-5 py-10 text-center text-sm text-slate-500">Digite parte do nome ou da comarca. Não precisa escrever o nome completo nem usar acentos.</p> :
                  resultados.length === 0 ? <p className="px-5 py-10 text-center text-sm text-slate-500">Nenhum servidor encontrado.</p> :
                  resultados.map((servidor) => (
                    <button key={servidor.id} type="button" onClick={() => void abrirConversa(servidor.id)} className="flex w-full items-center gap-3 border-b border-white/[0.06] px-4 py-3 text-left transition hover:bg-teal-400/[0.06]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal-300/20 bg-teal-400/10 text-sm font-bold text-teal-200">{servidor.nome.slice(0,1).toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{servidor.nome}</p>
                        <p className="truncate text-xs text-slate-400">{servidor.cargo} • {servidor.comarca}</p>
                      </div>
                      <span className="text-xs font-semibold text-teal-300">Conversar</span>
                    </button>
                  ))
                ) : conversas.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <MessageCircle className="mx-auto h-9 w-9 text-teal-300/50" />
                    <p className="mt-3 text-sm font-semibold text-slate-200">Nenhuma conversa por aqui</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Busque um servidor ou uma comarca e comece uma conversa.</p>
                  </div>
                ) : conversas.map((conversa) => (
                  <div key={conversa.conversa_id} className="flex items-center border-b border-white/[0.06] transition hover:bg-teal-400/[0.06]">
                    <button type="button" onClick={() => { setConversaAtiva(conversa); void carregarMensagens(conversa.conversa_id); }} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal-300/20 bg-teal-400/10 text-sm font-bold text-teal-200">{conversa.outro_nome.slice(0,1).toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{conversa.outro_nome}</p>
                        <p className="truncate text-xs text-slate-400">{conversa.ultima_mensagem || conversa.outra_comarca}</p>
                      </div>
                      {Number(conversa.nao_lidas) > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{conversa.nao_lidas}</span>}
                    </button>
                    <button type="button" title={`Remover conversa com ${conversa.outro_nome}`} aria-label={`Remover conversa com ${conversa.outro_nome}`} onClick={() => void ocultarConversa(conversa)} className="mr-3 rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
                {mensagens.length === 0 ? <p className="py-10 text-center text-xs text-slate-500">Inicie a conversa enviando uma mensagem.</p> : mensagens.map((mensagem) => {
                  const minha = mensagem.remetente_id === usuarioId;
                  return (
                    <div key={mensagem.id} className={`flex ${minha ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 ${minha ? "rounded-br-md bg-gradient-to-br from-teal-600 to-teal-500 text-white" : "rounded-bl-md border border-white/10 bg-[#102a3a] text-slate-100"}`}>
                        <p className="whitespace-pre-wrap break-words text-sm leading-5">{mensagem.conteudo}</p>
                        <p className={`mt-1 text-right text-[10px] ${minha ? "text-teal-50/70" : "text-slate-500"}`}>{new Date(mensagem.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={fimMensagensRef} />
              </div>
              <form onSubmit={enviarMensagem} className="flex items-end gap-2 border-t border-white/10 bg-[#0a2130] p-3">
                <textarea value={texto} onChange={(event) => setTexto(event.target.value)} maxLength={3000} rows={1} placeholder="Digite sua mensagem..." className="max-h-28 min-h-11 flex-1 resize-y rounded-xl border border-white/10 bg-[#04131f] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-teal-400/60" />
                <button type="submit" disabled={!texto.trim() || enviando} aria-label="Enviar mensagem" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-400 text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
                  {enviando ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </>
          )}
          {aviso && <p role="alert" className="border-t border-rose-400/15 bg-rose-400/10 px-4 py-2 text-xs text-rose-200">{aviso}</p>}
          <footer className="border-t border-white/[0.06] px-4 py-2 text-center text-[10px] text-slate-500">Por segurança, telefone, e-mail e Teams não são exibidos na busca.</footer>
        </section>
      )}

      <button type="button" onClick={() => { setAberto(!aberto); if (!aberto) void carregarConversas(); }} aria-label={totalNaoLidas > 0 ? `Abrir chat, ${totalNaoLidas} mensagens não lidas` : "Abrir chat"} className="fixed bottom-5 right-5 z-[130] flex h-14 w-14 items-center justify-center rounded-full border border-amber-200/80 bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 text-white shadow-[0_12px_38px_rgba(249,115,22,0.55)] ring-2 ring-amber-300/25 transition duration-200 hover:-translate-y-1 hover:brightness-110 hover:shadow-[0_16px_44px_rgba(249,115,22,0.7)] active:scale-95">
        {aberto ? <X size={24} /> : <MessageCircle size={25} />}
        {totalNaoLidas > 0 && <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#04111d] bg-rose-500 px-1 text-[10px] font-extrabold text-white">{totalNaoLidas > 99 ? "99+" : totalNaoLidas}</span>}
      </button>
    </>
  );
}
