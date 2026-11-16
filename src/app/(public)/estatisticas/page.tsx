"use client";

import { useEffect, useState } from "react";
import {
  Activity, ArrowDownRight, BarChart3, BriefcaseBusiness, Building2,
  Map, MapPinned, RefreshCw, Users
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Linha = { nome: string; usuarios: number; preferencias?: number; prioridade_1?: number };
type Dados = {
  resumo: {
    servidores_cadastrados: number;
    servidores_com_preferencias: number;
    preferencias_ativas: number;
    servidores_com_destino_prioritario: number;
  };
  por_raj: (Linha & { id: number })[];
  por_circunscricao: Linha[];
  destinos_mais_procurados: Linha[];
  comarcas_de_origem: Linha[];
  cargos: Linha[];
  distribuicao_prioridades: { ordem: number; preferencias: number }[];
  atualizado_em: string;
};

const fmt = (n: number) => Number(n || 0).toLocaleString("pt-BR");
const pct = (n: number, t: number) =>
  t ? ((n / t) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%" : "0%";

export default function EstatisticasPage() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setLoading(true);
    setErro("");
    const { data, error } = await supabase.rpc("estatisticas_publicas_permutas");
    if (error) {
      console.error(error);
      setErro("Não foi possível carregar os indicadores agora. Tente novamente.");
      setLoading(false);
      return;
    }
    setDados(data as Dados);
    setLoading(false);
  }

  useEffect(() => { void carregar(); }, []);

  const total = dados?.resumo.servidores_cadastrados ?? 0;

  return (
    <div className="min-h-screen bg-[#04111d] text-white">
      <header className="relative overflow-hidden border-b border-teal-300/10">
        <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-teal-400/[0.08] blur-[110px]" />
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-teal-300">
                <Activity size={14} /> Painel da comunidade
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Estatísticas da Permuta TJSP</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Veja em gráficos os interesses de movimentação informados pelos servidores cadastrados na plataforma.
              </p>
            </div>
            <button onClick={() => void carregar()} disabled={loading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-teal-300/20 bg-teal-400/10 px-5 py-3 text-sm font-semibold text-teal-200 transition hover:bg-teal-400/20 disabled:opacity-60">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Atualizar dados
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        {loading && !dados && <div className="rounded-2xl border border-teal-300/10 bg-[#0b2030] p-8 text-center text-slate-300">Carregando estatísticas...</div>}
        {erro && <div role="alert" className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{erro}</div>}

        {dados && <>
          <section>
            <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-teal-400">
              <Activity size={16} /> Visão geral
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi icon={<Users size={21} />} label="Servidores cadastrados" value={fmt(total)} detail="Cadastros fora do grupo de testes" />
              <Kpi icon={<MapPinned size={21} />} label="Com destinos informados" value={fmt(dados.resumo.servidores_com_preferencias)} detail={pct(dados.resumo.servidores_com_preferencias, total) + " dos cadastrados"} />
              <Kpi icon={<Map size={21} />} label="Preferências ativas" value={fmt(dados.resumo.preferencias_ativas)} detail="Destinos selecionados pelos servidores" />
              <Kpi icon={<Activity size={21} />} label="Destino em 1º lugar" value={fmt(dados.resumo.servidores_com_destino_prioritario)} detail="Servidores com preferência prioritária" />
            </div>
          </section>

          <section className="mt-14">
            <Heading icon={<MapPinned size={20} />} eyebrow="Distribuição regional"
              title="Interesse por Região Administrativa Judiciária"
              subtitle="Servidores que selecionaram ao menos uma comarca de cada RAJ. Uma pessoa pode aparecer em mais de uma região." />
            <div className="mt-6">
              <ChartPanel>
                <HorizontalBarChart items={dados.por_raj} valueLabel="servidores" />
              </ChartPanel>
            </div>
          </section>

          <section className="mt-14">
            <Heading icon={<Building2 size={20} />} eyebrow="Destinos desejados"
              title="Comarcas mais procuradas"
              subtitle="As 15 comarcas mais selecionadas como destino, considerando pessoas distintas." />
            <div className="mt-6">
              <ChartPanel>
                <HorizontalBarChart items={dados.destinos_mais_procurados} valueLabel="servidores" showRank showPriority />
              </ChartPanel>
            </div>
          </section>

          <section className="mt-14">
            <Heading icon={<Map size={20} />} eyebrow="Detalhamento territorial"
              title="Interesse por circunscrição judiciária"
              subtitle="Servidores com pelo menos um destino dentro de cada circunscrição. Os totais podem se sobrepor." />
            <div className="mt-6">
              <ChartPanel>
                <HorizontalBarChart items={dados.por_circunscricao} valueLabel="servidores" />
              </ChartPanel>
            </div>
          </section>

          <div className="mt-14 grid gap-10 xl:grid-cols-2">
            <section>
              <Heading icon={<ArrowDownRight size={20} />} eyebrow="Origem atual"
                title="Comarcas de origem"
                subtitle="Comarcas atuais mais informadas nos perfis dos participantes." />
              <div className="mt-6">
                <ChartPanel>
                  <HorizontalBarChart items={dados.comarcas_de_origem} valueLabel="servidores" />
                </ChartPanel>
              </div>
            </section>
            <section>
              <Heading icon={<BriefcaseBusiness size={20} />} eyebrow="Perfil profissional"
                title="Cargos dos participantes"
                subtitle="Distribuição dos participantes por cargo. Categorias com menos de três cadastros não são exibidas." />
              <div className="mt-6">
                <ChartPanel>
                  <HorizontalBarChart items={dados.cargos} valueLabel="servidores" />
                </ChartPanel>
              </div>
            </section>
          </div>

          <section className="mt-14">
            <Heading icon={<BarChart3 size={20} />} eyebrow="Ordem de preferência"
              title="Distribuição das prioridades"
              subtitle="Quantidade de destinos ativos registrados em cada posição de preferência." />
            <div className="mt-6">
              <ChartPanel>
                <ColumnChart items={dados.distribuicao_prioridades.map(x => ({ label: x.ordem + "ª", value: x.preferencias }))} />
              </ChartPanel>
            </div>
          </section>

          <div className="mt-12 rounded-2xl border border-teal-300/10 bg-[#081b29] p-5 text-sm leading-6 text-slate-400">
            <strong className="text-slate-200">Sobre os dados:</strong> estatísticas calculadas a partir dos cadastros e das preferências ativas. Um servidor pode escolher comarcas de diferentes RAJs e circunscrições; por isso, os números regionais não devem ser somados para obter o total de pessoas. Para preservar a privacidade, categorias com menos de três participantes não são exibidas nos recortes de origem, cargo e circunscrição.
            <div className="mt-3 text-xs text-slate-500">
              Última atualização: {new Date(dados.atualizado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
            </div>
          </div>
        </>}
      </main>
    </div>
  );
}

function Kpi({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-teal-300/10 bg-gradient-to-br from-[#0d2637] to-[#081b29] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/10 text-teal-300">{icon}</div>
      <div className="mt-5 text-3xl font-black tracking-tight text-white">{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-200">{label}</div>
      <div className="mt-2 text-xs text-slate-500">{detail}</div>
    </div>
  );
}

function Heading({ icon, eyebrow, title, subtitle }: { icon: React.ReactNode; eyebrow: string; title: string; subtitle: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-teal-400">{icon}{eyebrow}</div>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{subtitle}</p>
    </div>
  );
}

function ChartPanel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-teal-300/10 bg-[#0b2030]/90 p-4 sm:p-6">{children}</div>;
}

function HorizontalBarChart({ items, valueLabel, showRank = false, showPriority = false }: {
  items: Linha[];
  valueLabel: string;
  showRank?: boolean;
  showPriority?: boolean;
}) {
  const max = Math.max(1, ...items.map(x => x.usuarios));
  if (!items.length) return <p className="py-8 text-center text-sm text-slate-500">Ainda não há dados suficientes para este gráfico.</p>;
  return (
    <div className="space-y-5">
      {items.map((item, index) => (
        <div key={item.nome}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {showRank && <span className="w-6 shrink-0 text-xs font-bold tabular-nums text-slate-500">{String(index + 1).padStart(2, "0")}</span>}
              <span className="truncate text-sm font-medium text-slate-200">{item.nome}</span>
            </div>
            <div className="shrink-0 text-right">
              <strong className="text-sm tabular-nums text-teal-300">{fmt(item.usuarios)}</strong>
              <span className="ml-1.5 text-xs text-slate-500">{valueLabel}</span>
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-300 transition-all duration-700"
              style={{ width: (item.usuarios / max * 100) + "%" }} />
          </div>
          {showPriority && <div className="mt-1.5 text-right text-xs text-slate-500">{fmt(item.prioridade_1 ?? 0)} colocaram como 1ª opção</div>}
        </div>
      ))}
      <div className="border-t border-white/[0.06] pt-3 text-xs text-slate-500">Barras proporcionais ao maior valor deste gráfico</div>
    </div>
  );
}

function ColumnChart({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map(x => x.value));
  if (!items.length) return <p className="py-8 text-center text-sm text-slate-500">Ainda não há dados suficientes para este gráfico.</p>;
  return (
    <div>
      <div className="flex h-64 items-end justify-around gap-2 border-b border-white/10 px-1 sm:gap-4 sm:px-4">
        {items.map(item => (
          <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <span className="text-xs font-semibold tabular-nums text-teal-300">{fmt(item.value)}</span>
            <div className="flex w-full flex-1 items-end justify-center">
              <div className="w-full max-w-16 rounded-t-lg bg-gradient-to-t from-teal-600 to-cyan-300 transition-all duration-700"
                style={{ height: Math.max(2, item.value / max * 100) + "%" }} />
            </div>
            <span className="pb-3 text-xs font-medium text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">Quantidade de preferências registradas em cada posição</p>
    </div>
  );
}
