"use client";
import { useEffect, useState } from "react";
import { Activity, ArrowDownRight, BarChart3, BriefcaseBusiness, Building2, Map, MapPinned, RefreshCw, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Linha = { nome: string; usuarios: number; preferencias?: number; prioridade_1?: number };
type Dados = {
  resumo: { servidores_cadastrados:number; servidores_com_preferencias:number; preferencias_ativas:number; servidores_com_destino_prioritario:number };
  por_raj: (Linha & {id:number})[];
  por_circunscricao: Linha[];
  destinos_mais_procurados: Linha[];
  comarcas_de_origem: Linha[];
  cargos: Linha[];
  distribuicao_prioridades: {ordem:number; preferencias:number}[];
  atualizado_em:string;
};
const fmt=(n:number)=>Number(n||0).toLocaleString("pt-BR");
const pct=(n:number,t:number)=>t?((n/t)*100).toLocaleString("pt-BR",{maximumFractionDigits:1})+"%":"0%";

export default function EstatisticasPage(){
 const [dados,setDados]=useState<Dados|null>(null);
 const [loading,setLoading]=useState(true);
 const [erro,setErro]=useState("");
 async function carregar(){
  setLoading(true);setErro("");
  const {data,error}=await supabase.rpc("estatisticas_publicas_permutas");
  if(error){console.error(error);setErro("Não foi possível carregar os indicadores agora. Tente novamente.");setLoading(false);return;}
  setDados(data as Dados);setLoading(false);
 }
 useEffect(()=>{void carregar();},[]);
 const total=dados?.resumo.servidores_cadastrados??0;
 const maxRaj=Math.max(1,...(dados?.por_raj.map(x=>x.usuarios)??[1]));
 const maxDest=Math.max(1,...(dados?.destinos_mais_procurados.map(x=>x.usuarios)??[1]));
 const maxPrior=Math.max(1,...(dados?.distribuicao_prioridades.map(x=>x.preferencias)??[1]));
 return <div className="min-h-screen bg-[#04111d] text-white">
  <header className="relative overflow-hidden border-b border-teal-300/10">
   <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-teal-400/[0.08] blur-[110px]"/>
   <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
     <div className="max-w-3xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-teal-300"><Activity size={14}/> Dados da comunidade</div>
      <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Estatísticas da Permuta TJSP</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Um panorama dos interesses de movimentação informados pelos servidores cadastrados na plataforma.</p>
     </div>
     <button onClick={()=>void carregar()} disabled={loading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-teal-300/20 bg-teal-400/10 px-5 py-3 text-sm font-semibold text-teal-200 transition hover:bg-teal-400/20 disabled:opacity-60"><RefreshCw size={16} className={loading?"animate-spin":""}/> Atualizar dados</button>
    </div>
   </div>
  </header>
  <main className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
   {loading&&!dados&&<div className="rounded-2xl border border-teal-300/10 bg-[#0b2030] p-8 text-center text-slate-300">Carregando estatísticas...</div>}
   {erro&&<div role="alert" className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{erro}</div>}
   {dados&&<>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
     <Kpi icon={<Users size={21}/>} label="Servidores cadastrados" value={fmt(total)} detail="Cadastros fora do grupo de testes"/>
     <Kpi icon={<MapPinned size={21}/>} label="Com destinos informados" value={fmt(dados.resumo.servidores_com_preferencias)} detail={pct(dados.resumo.servidores_com_preferencias,total)+" dos cadastrados"}/>
     <Kpi icon={<Map size={21}/>} label="Preferências ativas" value={fmt(dados.resumo.preferencias_ativas)} detail="Destinos selecionados pelos servidores"/>
     <Kpi icon={<Activity size={21}/>} label="Destino em 1º lugar" value={fmt(dados.resumo.servidores_com_destino_prioritario)} detail="Servidores com preferência prioritária"/>
    </div>
    <section className="mt-12">
     <Heading icon={<MapPinned size={20}/>} eyebrow="Distribuição regional" title="Interesse por Região Administrativa Judiciária" subtitle="Servidores que selecionaram ao menos uma comarca de cada RAJ. Uma pessoa pode aparecer em mais de uma região."/>
     <div className="mt-6 grid gap-3 lg:grid-cols-2">{dados.por_raj.map(x=><div key={x.id} className="rounded-2xl border border-teal-300/10 bg-[#0b2030]/90 p-4">
      <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-slate-200">{x.nome}</span><strong className="text-lg tabular-nums text-teal-300">{fmt(x.usuarios)}</strong></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400" style={{width:(x.usuarios/maxRaj*100)+"%"}}/></div>
      <div className="mt-2 flex justify-between text-xs text-slate-500"><span>{pct(x.usuarios,total)} dos cadastrados</span><span>{fmt(x.prioridade_1??0)} em 1º lugar</span></div>
     </div>)}</div>
    </section>
    <section className="mt-14">
     <Heading icon={<Building2 size={20}/>} eyebrow="Destinos desejados" title="Comarcas mais procuradas" subtitle="As 15 comarcas mais selecionadas como destino, contando pessoas distintas."/>
     <div className="mt-6 overflow-hidden rounded-2xl border border-teal-300/10 bg-[#0b2030]/90">{dados.destinos_mais_procurados.map((x,i)=><div key={x.nome} className="border-b border-white/5 px-4 py-4 last:border-0 sm:px-6">
      <div className="flex items-center gap-3"><span className="w-7 shrink-0 text-xs font-bold tabular-nums text-slate-500">{String(i+1).padStart(2,"0")}</span><div className="min-w-0 flex-1">
       <div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-semibold text-slate-200">{x.nome}</span><strong className="shrink-0 text-sm tabular-nums text-teal-300">{fmt(x.usuarios)}</strong></div>
       <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-teal-400" style={{width:(x.usuarios/maxDest*100)+"%"}}/></div>
      </div><div className="hidden w-28 text-right sm:block"><div className="text-xs text-slate-300">{fmt(x.prioridade_1??0)} prioridade 1</div><div className="mt-1 text-[10px] text-slate-500">{pct(x.usuarios,total)} do total</div></div></div>
     </div>)}</div>
    </section>
    <section className="mt-14">
     <Heading icon={<Map size={20}/>} eyebrow="Detalhamento territorial" title="Interesse por circunscrição judiciária" subtitle="Servidores com pelo menos um destino dentro de cada circunscrição. Os totais podem se sobrepor."/>
     <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{dados.por_circunscricao.map(x=><div key={x.nome} className="flex items-center justify-between gap-3 rounded-xl border border-teal-300/10 bg-[#0b2030]/80 px-4 py-3"><span className="text-sm text-slate-300">{x.nome}</span><span className="font-bold tabular-nums text-teal-300">{fmt(x.usuarios)}</span></div>)}</div>
    </section>
    <div className="mt-14 grid gap-8 lg:grid-cols-2">
     <section><Heading icon={<ArrowDownRight size={20}/>} eyebrow="Origem atual" title="Comarcas com mais servidores" subtitle="Distribuição por comarca atual informada no perfil."/><div className="mt-5 space-y-3">{dados.comarcas_de_origem.map(x=><BarRow key={x.nome} item={x} max={Math.max(1,...dados.comarcas_de_origem.map(y=>y.usuarios))}/>)}</div></section>
     <section><Heading icon={<BriefcaseBusiness size={20}/>} eyebrow="Perfil profissional" title="Cargos dos participantes" subtitle="Somente categorias com pelo menos três cadastros."/><div className="mt-5 space-y-3">{dados.cargos.map(x=><BarRow key={x.nome} item={x} max={Math.max(1,...dados.cargos.map(y=>y.usuarios))}/>)}</div></section>
    </div>
    <section className="mt-14">
     <Heading icon={<BarChart3 size={20}/>} eyebrow="Ordem de preferência" title="Distribuição das prioridades" subtitle="Quantidade de destinos ativos registrados em cada posição de preferência."/>
     <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">{dados.distribuicao_prioridades.map(x=><div key={x.ordem} className="rounded-xl border border-teal-300/10 bg-[#0b2030]/90 p-4"><div className="text-xs text-slate-400">{x.ordem}ª preferência</div><div className="mt-2 text-2xl font-black tabular-nums text-teal-300">{fmt(x.preferencias)}</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-cyan-400" style={{width:(x.preferencias/maxPrior*100)+"%"}}/></div></div>)}</div>
    </section>
    <div className="mt-12 rounded-2xl border border-teal-300/10 bg-[#081b29] p-5 text-sm leading-6 text-slate-400">
     <strong className="text-slate-200">Sobre os dados:</strong> estatísticas calculadas a partir dos cadastros e das preferências ativas. Um servidor pode escolher comarcas de diferentes RAJs e circunscrições; por isso, os números regionais não devem ser somados para obter o total de pessoas. Para preservar a privacidade, categorias com menos de três participantes não são exibidas nos recortes de origem, cargo e circunscrição.
     <div className="mt-3 text-xs text-slate-500">Última atualização: {new Date(dados.atualizado_em).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})}</div>
    </div>
   </>}
  </main>
 </div>;
}

function Kpi({icon,label,value,detail}:{icon:React.ReactNode;label:string;value:string;detail:string}){return <div className="rounded-2xl border border-teal-300/10 bg-gradient-to-br from-[#0d2637] to-[#081b29] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.16)]"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/10 text-teal-300">{icon}</div><div className="mt-5 text-3xl font-black tracking-tight text-white">{value}</div><div className="mt-1 text-sm font-semibold text-slate-200">{label}</div><div className="mt-2 text-xs text-slate-500">{detail}</div></div>}
function Heading({icon,eyebrow,title,subtitle}:{icon:React.ReactNode;eyebrow:string;title:string;subtitle:string}){return <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-teal-400">{icon}{eyebrow}</div><h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{subtitle}</p></div>}
function BarRow({item,max}:{item:Linha;max:number}){return <div className="rounded-xl border border-teal-300/10 bg-[#0b2030]/80 p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm text-slate-300">{item.nome}</span><strong className="text-sm tabular-nums text-teal-300">{fmt(item.usuarios)}</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400" style={{width:(item.usuarios/max*100)+"%"}}/></div></div>}
