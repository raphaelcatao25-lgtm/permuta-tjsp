"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, RefreshCw, Send, UsersRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Participante = {
  ordem: number;
  usuario_id: string;
  nome: string;
  cargo: string;
  origem_comarca: string;
  destino_comarca: string;
};

type CicloQuatro = {
  assinatura: string;
  participantes_ids: string[];
  participantes: Participante[];
  score_total: number;
};

export default function CiclosQuatroPermuta({ usuarioId }: { usuarioId: string }) {
  const [ciclos, setCiclos] = useState<CicloQuatro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const buscar = useCallback(async () => {
    if (!usuarioId) return;
    setCarregando(true);
    setErro("");
    const { data, error } = await supabase.rpc("buscar_ciclos_4_preferencias", {
      p_perfil_id: usuarioId,
      p_limite: 10,
    });
    if (error) {
      console.error("Erro ao buscar ciclos de 4:", error);
      setErro("Não foi possível carregar os ciclos de 4. Tente atualizar novamente.");
      setCiclos([]);
    } else {
      setCiclos((data ?? []).map((item: any) => ({
        ...item,
        participantes: Array.isArray(item.participantes) ? item.participantes : [],
      })) as CicloQuatro[]);
    }
    setCarregando(false);
  }, [usuarioId]);

  useEffect(() => {
    void buscar();
    const atualizar = () => void buscar();
    window.addEventListener("atualizar-ciclos", atualizar);
    return () => window.removeEventListener("atualizar-ciclos", atualizar);
  }, [buscar]);

  async function enviar(ciclo: CicloQuatro) {
    setEnviando(ciclo.assinatura);
    setErro("");
    setSucesso("");
    const { data, error } = await supabase.rpc("criar_permuta_manual_v2", {
      p_usuario_id: usuarioId,
      p_participantes: ciclo.participantes_ids,
      p_mensagem: "Olá! Encontrei uma possibilidade de permuta em cadeia com quatro servidores pelo Permuta TJSP. Confira a proposta e, se tiver interesse, registre seu aceite.",
    });
    setEnviando(null);
    if (error) {
      setErro(error.message || "Não foi possível enviar a proposta.");
      return;
    }
    setCiclos((atuais) => atuais.filter((item) => item.assinatura !== ciclo.assinatura));
    setSucesso("Proposta enviada! Os outros três servidores foram notificados.");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm leading-6 text-slate-400">
          O sistema procura uma cadeia fechada com quatro servidores, respeitando as preferências de comarca/unidade e o mesmo cargo.
        </p>
        <button type="button" onClick={() => void buscar()} disabled={carregando} className="inline-flex items-center gap-2 rounded-lg border border-teal-300/15 px-3 py-2 text-xs font-semibold text-teal-200 hover:bg-teal-400/10 disabled:opacity-50">
          <RefreshCw size={14} className={carregando ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {erro && <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{erro}</div>}
      {sucesso && <div role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{sucesso}</div>}

      {carregando ? (
        <div className="flex min-h-28 items-center justify-center gap-2 text-sm text-slate-400"><LoaderCircle className="animate-spin text-teal-300" size={18} /> Procurando ciclos compatíveis...</div>
      ) : ciclos.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#081b29] px-5 py-8 text-center">
          <UsersRound className="mx-auto text-teal-300/60" size={30} />
          <p className="mt-3 text-sm font-semibold text-slate-200">Nenhum ciclo de quatro encontrado neste momento</p>
          <p className="mt-1 text-xs text-slate-500">Novas combinações poderão aparecer quando outros servidores atualizarem suas preferências.</p>
        </div>
      ) : (
        ciclos.map((ciclo, index) => (
          <article key={ciclo.assinatura} className="rounded-xl border border-teal-300/10 bg-[#081b29] p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Ciclo de 4 servidores</p>
              <h3 className="mt-1 font-bold text-white">Combinação {index + 1}</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ciclo.participantes.map((p) => (
                <div key={p.usuario_id} className="rounded-lg border border-white/[0.06] bg-[#0d2232] p-3">
                  <p className="text-xs text-teal-300">Servidor {p.ordem}{p.usuario_id === usuarioId ? " • Você" : ""}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-white">{p.nome}</p>
                  <p className="text-xs text-slate-500">{p.cargo}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="min-w-0 truncate text-slate-300">{p.origem_comarca}</span>
                    <ArrowRight size={14} className="shrink-0 text-teal-300" />
                    <span className="min-w-0 truncate font-semibold text-teal-200">{p.destino_comarca}</span>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => void enviar(ciclo)} disabled={enviando !== null} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50">
              {enviando === ciclo.assinatura ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={16} />}
              Enviar proposta aos outros 3 servidores
            </button>
          </article>
        ))
      )}
    </div>
  );
}
