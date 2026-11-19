"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock3, History, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ParticipanteHistorico = {
  ordem?: number;
  usuario_id?: string;
  nome?: string;
  origem_comarca?: string;
  destino_comarca?: string;
  unidade_origem?: string | null;
};

type RegistroHistorico = {
  id: string;
  tipo: "direta" | "ciclo_3" | "ciclo_4";
  participantes: ParticipanteHistorico[];
  primeira_encontrada_em: string;
  ultima_encontrada_em: string;
};

const ROTULOS: Record<RegistroHistorico["tipo"], string> = {
  direta: "Permuta direta",
  ciclo_3: "Permuta em cadeia — 3 servidores",
  ciclo_4: "Permuta em cadeia — 4 servidores",
};

export default function HistoricoOportunidades({ usuarioId }: { usuarioId: string }) {
  const [itens, setItens] = useState<RegistroHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!usuarioId) return;
    setCarregando(true);
    setErro("");
    const { data, error } = await supabase
      .from("historico_oportunidades_usuario")
      .select("id,tipo,participantes,primeira_encontrada_em,ultima_encontrada_em")
      .eq("usuario_id", usuarioId)
      .eq("status", "indisponivel")
      .order("ultima_encontrada_em", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Erro ao carregar histórico de oportunidades:", error);
      setErro("Não foi possível carregar o histórico de oportunidades.");
      setItens([]);
    } else {
      setItens((data ?? []).map((item: any) => ({
        ...item,
        participantes: Array.isArray(item.participantes) ? item.participantes : [],
      })) as RegistroHistorico[]);
    }
    setCarregando(false);
  }, [usuarioId]);

  useEffect(() => {
    void carregar();
    const atualizar = () => void carregar();
    window.addEventListener("atualizar-ciclos", atualizar);
    return () => window.removeEventListener("atualizar-ciclos", atualizar);
  }, [carregar]);

  if (carregando) {
    return <div className="rounded-xl border border-white/5 bg-[#081b29] p-5 text-sm text-slate-400">Carregando histórico de oportunidades...</div>;
  }

  if (erro) {
    return <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">{erro}</div>;
  }

  if (itens.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-300/10 bg-[#0d2232]">
      <div className="flex items-center gap-3 border-b border-amber-300/10 bg-[#0a1f2f] px-6 py-5">
        <History className="text-amber-300" size={21} />
        <div>
          <h2 className="text-lg font-bold text-white">Oportunidades anteriores</h2>
          <p className="mt-1 text-xs text-slate-400">Combinações que já apareceram para você, mas que não estão disponíveis no matching atual.</p>
        </div>
      </div>
      <div className="space-y-3 p-4 sm:p-6">
        {itens.map((item) => (
          <article key={item.id} className="rounded-xl border border-white/[0.07] bg-[#081b29] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-amber-200">{ROTULOS[item.tipo]}</p>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                <Clock3 size={12} />
                Visto em {new Date(item.primeira_encontrada_em).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {item.participantes.map((p, index) => (
                <div key={p.usuario_id ?? index} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                  <p className="text-xs font-semibold text-slate-200">{p.nome ?? `Servidor ${p.ordem ?? index + 1}`}</p>
                  {(p.origem_comarca || p.destino_comarca) && (
                    <p className="mt-1 text-xs text-slate-400">
                      {p.origem_comarca ?? "Origem não informada"} → {p.destino_comarca ?? "Destino não informado"}
                    </p>
                  )}
                  {p.unidade_origem && <p className="mt-1 text-xs text-slate-500">{p.unidade_origem}</p>}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300/10 bg-amber-300/[0.04] p-3 text-xs leading-5 text-amber-100/80">
              <Info size={14} className="mt-0.5 shrink-0" />
              Esta combinação é apenas um registro histórico. Ela pode ter deixado de ser compatível ou algum participante pode ter pausado a busca. Não significa que a oportunidade ainda esteja disponível.
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
