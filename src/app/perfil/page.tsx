"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ComarcaInfoCard
} from "@/components/perfil/ComarcaInfoCard";

import {
  Eye,
  EyeOff,
  PauseCircle,
  PlayCircle,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  supabase,
} from "@/lib/supabase";

import {
  AuthGuard,
} from "@/components/auth/AuthGuard";

import {
  DashboardLayout,
} from "@/components/layout/DashboardLayout";

import {
  ComarcaAtualSelector,
  type ComarcaAtual,
} from "@/components/perfil/ComarcaAtualSelector";

import {
  ComarcaDesejadaSelector,
  type ComarcaDesejadaOpcao,
} from "@/components/perfil/ComarcaDesejadaSelector";

import {
  ComarcaPrioridadeList,
} from "@/components/perfil/ComarcaPrioridadeList";


const CARGOS = [

  "Escrevente Técnico Judiciário",

  "Psicólogo",

];





type Perfil = {

  id:string;

  nome:string;

  email:string;

  cargo:string;

  telefone:string | null;

  mostrar_telefone:boolean;

  teams:string | null;

  mostrar_teams:boolean;

  comarca_atual_id:number;

  em_match:boolean;

  busca_pausada:boolean;

};



export default function PerfilPage(){


const [usuarioId,setUsuarioId] =
useState("");


const [perfil,setPerfil] =
useState<Perfil | null>(null);




/*
========================================
DADOS EDITÁVEIS
========================================
*/


const [nome,setNome] =
useState("");


const [emailAtual,setEmailAtual] =
useState("");


const [novoEmail,setNovoEmail] =
useState("");


const [confirmarNovoEmail,setConfirmarNovoEmail] =
useState("");



const [cargo,setCargo] =
useState("");


const [telefone,setTelefone] =
useState("");


const [mostrarTelefone,setMostrarTelefone] =
useState(false);

const [teams,setTeams] = useState("");
const [mostrarTeams,setMostrarTeams] = useState(false);




/*
========================================
SENHA
========================================
*/


const [novaSenha,setNovaSenha] =
useState("");


const [confirmarSenha,setConfirmarSenha] =
useState("");


const [mostrarSenha,setMostrarSenha] =
useState(false);





/*
========================================
COMARCAS
========================================
*/


const [comarcas,setComarcas] =
useState<ComarcaAtual[]>([]);



const [comarcaAtualId,setComarcaAtualId] =
useState("");


const [buscaComarcaAtual,setBuscaComarcaAtual] =
useState("");

const [comarcaSelecionada,setComarcaSelecionada] =
useState<ComarcaAtual | null>(null);

const [destinos,setDestinos] =
useState<ComarcaDesejadaOpcao[]>([]);





const destinosIds = useMemo(()=>{

return destinos.map(

(item)=>

item.id

);


},[destinos]);






const [erro,setErro] =
useState("");


const [mensagem,setMensagem] =
useState("");


const [carregando,setCarregando] =
useState(true);


const [salvando,setSalvando] =
useState(false);


/*
========================================
STATUS DA BUSCA
========================================
*/

const [emMatch,setEmMatch] =
useState(false);

const [buscaPausada,setBuscaPausada] =
useState(false);

const [processandoStatus,setProcessandoStatus] =
useState(false);

const [confirmarPausa,setConfirmarPausa] =
useState(false);

const [modalExcluirConta,setModalExcluirConta] =
useState(false);

const [confirmacaoExclusao,setConfirmacaoExclusao] =
useState("");

const [excluindoConta,setExcluindoConta] =
useState(false);

const [erroExclusao,setErroExclusao] =
useState("");




/*
========================================
CARREGAR COMARCAS
========================================
*/


useEffect(()=>{

async function carregarComarcas(){

const {

data,

error

}=await supabase

.from("comarcas_tjsp")

.select(`

id,

nome,

circunscricao_id,

circunscricoes_tjsp (

nome,

rajs_tjsp (

nome

)

)

`)

.order(

"nome",

{

ascending:true

}

);




if(error){

console.error(error);

return;

}



const listaFormatada =

(data ?? []).map(

(item:any)=>(

{

id:item.id,

nome:item.nome,

circunscricao:

item.circunscricoes_tjsp?.nome ?? "",

raj:

item.circunscricoes_tjsp?.rajs_tjsp?.nome ?? ""

}

)

);



setComarcas(listaFormatada);


}


carregarComarcas();


},[]);
/*
========================================
CARREGAR PERFIL E PREFERÊNCIAS
========================================
*/

useEffect(()=>{

async function carregarPerfil(){

try{

setCarregando(true);


const {

data:{
user

},

error:userError

}=await supabase.auth.getUser();




if(userError || !user){

throw new Error(
"Usuário não autenticado."
);

}


setUsuarioId(user.id);






/*
========================================
BUSCAR PERFIL
========================================
*/

const {

data:dadosPerfil,

error:perfilError

}=await supabase

.from("perfis")

.select(`

id,

nome,

email,

cargo,

telefone,

mostrar_telefone,

teams,

mostrar_teams,

comarca_atual_id,

em_match,

busca_pausada

`)

.eq(

"id",

user.id

)

.single();





if(perfilError){

throw perfilError;

}





const perfilAtual = dadosPerfil as Perfil;


setPerfil(perfilAtual);

setNome(
perfilAtual.nome
);

setEmailAtual(
perfilAtual.email
);

setCargo(
perfilAtual.cargo
);

setTelefone(
perfilAtual.telefone ?? ""
);

setMostrarTelefone(
perfilAtual.mostrar_telefone
);

setTeams(perfilAtual.teams ?? "");
setMostrarTeams(Boolean(perfilAtual.mostrar_teams));

setEmMatch(
Boolean(
perfilAtual.em_match
)
);

setBuscaPausada(
Boolean(
perfilAtual.busca_pausada
)
);


setComarcaAtualId(

String(

perfilAtual.comarca_atual_id

)

);




const comarcaAtual = comarcas.find(

(item)=>

item.id === perfilAtual.comarca_atual_id

);


if(comarcaAtual){

setBuscaComarcaAtual(

comarcaAtual.nome

);

setComarcaSelecionada(
  comarcaAtual
);

}








/*
========================================
BUSCAR DESTINOS
========================================
*/

const {

data:destinosBanco,

error:destinosError

}=await supabase

.from("preferencias_movimentacao")

.select(`

comarca_destino_id,

prioridade

`)

.eq(

"perfil_id",

user.id

)

.order(

"prioridade",

{

ascending:true

}

);





if(destinosError){

throw destinosError;

}





const idsDestinos =

(destinosBanco ?? [])

.map(

(item:any)=>

item.comarca_destino_id

);





const destinosEncontrados =

comarcas.filter(

(item)=>

idsDestinos.includes(item.id)

);





setDestinos(

destinosEncontrados

);




}

catch(error:any){

console.error(error);

setErro(

error.message ??

"Erro ao carregar perfil."

);


}

finally{

setCarregando(false);

}


}


if(comarcas.length > 0){

carregarPerfil();

}


},[comarcas]);








/*
========================================
SELEÇÃO DE COMARCA
========================================
*/

function selecionarComarcaAtual(
  comarca: ComarcaAtual
) {

  if(emMatch){
    setErro(
      "Não é possível alterar sua comarca atual enquanto houver uma permuta confirmada em andamento."
    );
    return;
  }

  setComarcaAtualId(
    String(comarca.id)
  );

  setBuscaComarcaAtual(
    comarca.nome
  );

  setComarcaSelecionada(
    comarca
  );
}







function adicionarDestino(

comarca:ComarcaDesejadaOpcao

){

if(emMatch){

setErro(
"Não é possível alterar suas preferências enquanto houver uma permuta confirmada em andamento."
);

return;

}

setDestinos(

atual=>[

...atual,

comarca

]

);


}







function alterarPrioridade(

novaLista:ComarcaDesejadaOpcao[]

){

if(emMatch){

setErro(
"Não é possível alterar a prioridade das preferências enquanto houver uma permuta confirmada em andamento."
);

return;

}

setDestinos(

novaLista

);

}

function removerDestino(id: number) {

  if(emMatch){

    setErro(
      "Não é possível remover preferências enquanto houver uma permuta confirmada em andamento."
    );

    return;

  }

  setDestinos(
    atual =>
      atual.filter(
        item => item.id !== id
      )
  );

}


/*
========================================
SALVAR PERFIL
========================================
*/

async function salvarPerfil(){

setErro("");

setMensagem("");


setSalvando(true);


try{


/*
========================================
ATUALIZA DADOS PESSOAIS
========================================

Durante uma permuta confirmada, os dados
usados no matching ficam preservados.
*/


const dadosPerfil:any = {

nome,

cargo,

telefone,

teams:teams.trim() || null,

mostrar_telefone:mostrarTelefone,

mostrar_teams:mostrarTeams,

updated_at:new Date().toISOString()

};


if(!emMatch){

dadosPerfil.comarca_atual_id =
Number(comarcaAtualId);

}


const {

error

}=await supabase

.from("perfis")

.update(
dadosPerfil
)

.eq(

"id",

usuarioId

);




if(error){

throw error;

}




/*
========================================
PREFERÊNCIAS / MATCHING
========================================

Só podem ser alteradas quando o usuário
não estiver em uma permuta confirmada.
*/


if(!emMatch){


await supabase

.from("preferencias_movimentacao")

.delete()

.eq(

"perfil_id",

usuarioId

);






const registros = destinos.map(

(item,index)=>(

{

perfil_id:usuarioId,

comarca_destino_id:item.id,

prioridade:index+1,

ativo:true,

tipo_preferencia:"mudanca"

}

)

);






if(registros.length > 0){

const {

error:destinoError

}=await supabase

.from("preferencias_movimentacao")

.insert(registros);





if(destinoError){

throw destinoError;

}

}




const {
  error: recalculoError
} = await supabase.rpc(
  "recalcular_matches_ciclo_3_usuario",
  {
    p_perfil_id: usuarioId
  }
);

if (recalculoError) {
  throw recalculoError;
}


}


setMensagem(

emMatch

?

"Dados pessoais atualizados com sucesso. Comarca e preferências foram mantidas enquanto sua permuta está em andamento."

:

"Perfil atualizado com sucesso."

);


}

catch(error:any){


setErro(

error.message ??

"Erro ao salvar perfil."

);


}

finally{

setSalvando(false);

}


}



/*
========================================
ALTERAR EMAIL
========================================
*/

async function alterarEmail(){


setErro("");

setMensagem("");


if(

novoEmail.trim().toLowerCase()

!==

confirmarNovoEmail.trim().toLowerCase()

){

setErro(

"Os e-mails informados são diferentes."

);

return;

}



const {

error

}=await supabase.auth.updateUser({

email:novoEmail.trim()

});





if(error){

setErro(error.message);

return;

}


setMensagem(

"Solicitação enviada. Confirme o novo e-mail."

);


}







/*
========================================
ALTERAR SENHA
========================================
*/

async function alterarSenha(){


setErro("");

setMensagem("");



if(novaSenha !== confirmarSenha){

setErro(

"As senhas não coincidem."

);

return;

}



if(novaSenha.length < 8){

setErro(

"A senha deve possuir no mínimo 8 caracteres."

);

return;

}



const {

error

}=await supabase.auth.updateUser({

password:novaSenha

});





if(error){

setErro(error.message);

return;

}


setMensagem(

"Senha alterada com sucesso."

);


}

/*
========================================
PAUSAR BUSCA
========================================
*/

async function pausarBusca(){

if(processandoStatus){
return;
}

setErro("");
setMensagem("");
setProcessandoStatus(true);

try{

const { error }=await supabase.rpc(
"pausar_busca",
{ p_usuario_id:usuarioId }
);

if(error){ throw error; }

setBuscaPausada(true);
setConfirmarPausa(false);

setMensagem(
"Busca pausada com sucesso. Seu perfil e suas preferências foram mantidos."
);

window.dispatchEvent(new Event("atualizar-ciclos"));

}catch(error:any){
setErro(error.message ?? "Não foi possível pausar a busca.");
}finally{
setProcessandoStatus(false);
}
}


/*
========================================
REATIVAR BUSCA
========================================
*/

async function reativarBusca(){

if(processandoStatus){
return;
}

setErro("");
setMensagem("");
setProcessandoStatus(true);

try{

const { error }=await supabase.rpc(
"reativar_busca",
{ p_usuario_id:usuarioId }
);

if(error){ throw error; }

setBuscaPausada(false);

setMensagem(
"Busca reativada com sucesso. Seu perfil voltou a participar das oportunidades de permuta."
);

window.dispatchEvent(new Event("atualizar-ciclos"));

}catch(error:any){
setErro(error.message ?? "Não foi possível reativar a busca.");
}finally{
setProcessandoStatus(false);
}
}



/*
========================================
EXCLUIR CONTA
========================================
*/

async function excluirConta(){

if(excluindoConta){
return;
}

if(confirmacaoExclusao.trim().toUpperCase() !== "EXCLUIR"){
setErroExclusao('Digite "EXCLUIR" para confirmar.');
return;
}

if(emMatch){
setErroExclusao(
"Não é possível excluir sua conta enquanto existir uma permuta confirmada em andamento. Encerre a permuta primeiro."
);
return;
}

setErroExclusao("");
setExcluindoConta(true);

try{

const {
data:{ session }
}=await supabase.auth.getSession();

const accessToken =
session?.access_token;

if(!accessToken){
throw new Error(
"Sua sessão expirou. Entre novamente para excluir a conta."
);
}

const resposta =
await fetch(
"/api/excluir-conta",
{
method:"POST",
headers:{
Authorization:`Bearer ${accessToken}`
}
}
);

let resultado:any = null;

try{
resultado = await resposta.json();
}catch{
resultado = null;
}

if(!resposta.ok){
throw new Error(
resultado?.error ??
"Não foi possível excluir sua conta."
);
}

try{
await supabase.auth.signOut();
}catch(error){
console.warn(
"Não foi possível encerrar a sessão local após a exclusão:",
error
);
}

window.location.href = "/";

}catch(error:any){

setErroExclusao(
error.message ??
"Não foi possível excluir sua conta."
);

}finally{

setExcluindoConta(false);

}

}

return (

<AuthGuard>

<DashboardLayout>

<div className="mx-auto max-w-4xl space-y-6 px-6 py-8">

  <div>
    <h1 className="text-2xl font-bold text-white">
      Meu Perfil
    </h1>

    <p className="mt-1 text-sm text-slate-400">
      Atualize seus dados e preferências de permuta.
    </p>
  </div>


  {
    carregando && (

      <div className="
        rounded-2xl
        border
        border-teal-300/10
        bg-[#0d2232]
        p-5
        text-sm
        text-slate-300
        shadow-[0_16px_40px_rgba(0,0,0,0.16)]
      ">
        Carregando informações...
      </div>

    )
  }


  {
    !carregando && (

      <>

        {/* ========================================
            STATUS DA BUSCA
        ======================================== */}

        <section className="
          rounded-2xl
          border
          border-teal-300/10
          bg-[#0d2232]
          p-6
          shadow-[0_16px_40px_rgba(0,0,0,0.16)]
        ">

          <div className="flex flex-wrap items-start justify-between gap-4">

            <div>
              <h2 className="text-lg font-semibold text-white">
                Status da busca por permuta
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Controle sua participação nas novas oportunidades de permuta.
              </p>
            </div>


            {
              emMatch ? (

                <span className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-cyan-300/20
                  bg-cyan-400/10
                  px-3
                  py-1.5
                  text-sm
                  font-semibold
                  text-cyan-300
                ">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Em permuta
                </span>

              ) : buscaPausada ? (

                <span className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-amber-300/20
                  bg-amber-400/10
                  px-3
                  py-1.5
                  text-sm
                  font-semibold
                  text-amber-300
                ">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Pausado
                </span>

              ) : (

                <span className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-emerald-300/20
                  bg-emerald-400/10
                  px-3
                  py-1.5
                  text-sm
                  font-semibold
                  text-emerald-300
                ">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Disponível
                </span>

              )
            }

          </div>


          {
            emMatch ? (

              <div className="
                mt-5
                rounded-2xl
                border
                border-cyan-300/15
                bg-cyan-400/[0.06]
                p-5
              ">

                <p className="font-semibold text-cyan-200">
                  Você está em uma permuta confirmada.
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Enquanto essa permuta estiver em andamento, seu perfil não
                  participa de novas buscas. Para voltar a receber oportunidades,
                  encerre primeiro a permuta atual na página Propostas.
                </p>

              </div>

            ) : buscaPausada ? (

              <div className="mt-5">

                <div className="
                  rounded-2xl
                  border
                  border-amber-300/15
                  bg-amber-400/[0.06]
                  p-5
                ">

                  <p className="font-semibold text-amber-200">
                    Sua busca está pausada.
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Seu perfil, sua comarca e suas preferências continuam salvos,
                    mas você não aparece em novas oportunidades de permuta.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={reativarBusca}
                  disabled={processandoStatus}
                  className="
                    mt-4
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-emerald-300/20
                    bg-emerald-500/15
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-emerald-200
                    transition-all
                    duration-200
                    hover:-translate-y-[1px]
                    hover:bg-emerald-500/25
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <PlayCircle size={18}/>

                  {processandoStatus ? "Reativando..." : "Reativar busca"}
                </button>

              </div>

            ) : (

              <div className="mt-5">

                <div className="
                  rounded-2xl
                  border
                  border-emerald-300/15
                  bg-emerald-400/[0.06]
                  p-5
                ">

                  <p className="font-semibold text-emerald-200">
                    Seu perfil está disponível para novas oportunidades.
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Você participa normalmente das buscas de permuta direta e
                    das combinações em cadeia.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={()=>setConfirmarPausa(true)}
                  disabled={processandoStatus}
                  className="
                    mt-4
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-amber-300/20
                    bg-amber-400/[0.05]
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-amber-300
                    transition-all
                    duration-200
                    hover:-translate-y-[1px]
                    hover:bg-amber-400/10
                    hover:text-amber-200
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <PauseCircle size={18}/>
                  Pausar busca
                </button>

              </div>

            )
          }

        </section>


        {/* ========================================
            DADOS PESSOAIS
        ======================================== */}

        <section className="
          rounded-2xl
          border
          border-teal-300/10
          bg-[#0d2232]
          p-6
          shadow-[0_16px_40px_rgba(0,0,0,0.16)]
        ">

          <h2 className="mb-5 text-lg font-semibold text-white">
            Dados pessoais
          </h2>


          <div className="space-y-4">

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Nome
              </label>

              <input
                value={nome}
                onChange={(e)=>setNome(e.target.value)}
                className="
                  w-full
                  rounded-xl
                  border
                  border-teal-300/15
                  bg-[#081b29]
                  px-4
                  py-3
                  text-white
                  outline-none
                  transition
                  placeholder:text-slate-600
                  hover:border-teal-300/25
                  focus:border-teal-400
                  focus:ring-4
                  focus:ring-teal-400/10
                "
              />

            </div>


            <div>

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Cargo
              </label>

              <select
                value={cargo}
                onChange={(e)=>setCargo(e.target.value)}
                className="
                  w-full
                  rounded-xl
                  border
                  border-teal-300/15
                  bg-[#081b29]
                  px-4
                  py-3
                  text-white
                  outline-none
                  transition
                  hover:border-teal-300/25
                  focus:border-teal-400
                  focus:ring-4
                  focus:ring-teal-400/10
                "
              >

                <option value="">
                  Selecione
                </option>

                {
                  CARGOS.map((item)=>(

                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>

                  ))
                }

              </select>

            </div>


            <div>

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Telefone
              </label>

              <input
                value={telefone}
                onChange={(e)=>setTelefone(e.target.value)}
                className="
                  w-full
                  rounded-xl
                  border
                  border-teal-300/15
                  bg-[#081b29]
                  px-4
                  py-3
                  text-white
                  outline-none
                  transition
                  placeholder:text-slate-600
                  hover:border-teal-300/25
                  focus:border-teal-400
                  focus:ring-4
                  focus:ring-teal-400/10
                "
              />

              <label className="
                mt-3
                flex
                w-fit
                items-center
                gap-2
                text-sm
                text-slate-300
              ">

                <input
                  type="checkbox"
                  checked={mostrarTelefone}
                  onChange={(e)=>setMostrarTelefone(e.target.checked)}
                  className="accent-teal-500"
                />

                Mostrar telefone

              </label>

            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Microsoft Teams</label>
              <input
                value={teams}
                onChange={(e)=>setTeams(e.target.value)}
                className="w-full rounded-xl border border-teal-300/15 bg-[#081b29] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 hover:border-teal-300/25 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10"
                placeholder="E-mail ou identificação utilizada no Teams"
              />
              <label className="mt-3 flex w-fit items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={mostrarTeams} onChange={(e)=>setMostrarTeams(e.target.checked)} className="accent-teal-500"/>
                Mostrar Teams
              </label>
            </div>

          </div>

        </section>


        {/* ========================================
            E-MAIL E SEGURANÇA
        ======================================== */}

        <section className="
          rounded-2xl
          border
          border-teal-300/10
          bg-[#0d2232]
          p-6
          shadow-[0_16px_40px_rgba(0,0,0,0.16)]
        ">

          <h2 className="mb-5 text-lg font-semibold text-white">
            E-mail e segurança
          </h2>


          <p className="mb-4 text-sm text-slate-400">

            E-mail atual:

            <strong className="text-slate-200">
              {" "}{emailAtual}
            </strong>

          </p>


          <div className="space-y-4">

            <input
              type="email"
              value={novoEmail}
              onChange={(e)=>setNovoEmail(e.target.value)}
              className="
                w-full
                rounded-xl
                border
                border-teal-300/15
                bg-[#081b29]
                px-4
                py-3
                text-white
                outline-none
                transition
                placeholder:text-slate-600
                hover:border-teal-300/25
                focus:border-teal-400
                focus:ring-4
                focus:ring-teal-400/10
              "
              placeholder="Novo e-mail"
            />


            <input
              type="email"
              value={confirmarNovoEmail}
              onChange={(e)=>setConfirmarNovoEmail(e.target.value)}
              onPaste={(e)=>e.preventDefault()}
              className="
                w-full
                rounded-xl
                border
                border-teal-300/15
                bg-[#081b29]
                px-4
                py-3
                text-white
                outline-none
                transition
                placeholder:text-slate-600
                hover:border-teal-300/25
                focus:border-teal-400
                focus:ring-4
                focus:ring-teal-400/10
              "
              placeholder="Confirmar novo e-mail"
            />


            <button
              type="button"
              onClick={alterarEmail}
              className="
                rounded-xl
                border
                border-teal-300/20
                bg-teal-500/15
                px-5
                py-3
                font-semibold
                text-teal-200
                transition-all
                duration-200
                hover:-translate-y-[1px]
                hover:bg-teal-500/25
              "
            >
              Alterar e-mail
            </button>

          </div>


          <hr className="my-6 border-teal-300/10"/>


          <div className="space-y-4">

            <div className="relative">

              <input
                type={mostrarSenha ? "text":"password"}
                value={novaSenha}
                onChange={(e)=>setNovaSenha(e.target.value)}
                className="
                  w-full
                  rounded-xl
                  border
                  border-teal-300/15
                  bg-[#081b29]
                  px-4
                  py-3
                  pr-12
                  text-white
                  outline-none
                  transition
                  placeholder:text-slate-600
                  hover:border-teal-300/25
                  focus:border-teal-400
                  focus:ring-4
                  focus:ring-teal-400/10
                "
                placeholder="Nova senha"
              />


              <button
                type="button"
                onClick={()=>setMostrarSenha(!mostrarSenha)}
                className="
                  absolute
                  right-2
                  top-1/2
                  flex
                  h-9
                  w-9
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-500
                  transition
                  hover:bg-teal-400/10
                  hover:text-teal-300
                "
              >

                {
                  mostrarSenha
                    ? <EyeOff size={20}/>
                    : <Eye size={20}/>
                }

              </button>

            </div>


            <input
              type={mostrarSenha ? "text":"password"}
              value={confirmarSenha}
              onChange={(e)=>setConfirmarSenha(e.target.value)}
              onPaste={(e)=>e.preventDefault()}
              className="
                w-full
                rounded-xl
                border
                border-teal-300/15
                bg-[#081b29]
                px-4
                py-3
                text-white
                outline-none
                transition
                placeholder:text-slate-600
                hover:border-teal-300/25
                focus:border-teal-400
                focus:ring-4
                focus:ring-teal-400/10
              "
              placeholder="Confirmar nova senha"
            />


            <button
              type="button"
              onClick={alterarSenha}
              className="
                rounded-xl
                border
                border-teal-300/20
                bg-teal-500/15
                px-5
                py-3
                font-semibold
                text-teal-200
                transition-all
                duration-200
                hover:-translate-y-[1px]
                hover:bg-teal-500/25
              "
            >
              Alterar senha
            </button>

          </div>

        </section>


        {/* ========================================
            LOCALIZAÇÃO
        ======================================== */}

        <section className="
          rounded-2xl
          border
          border-teal-300/10
          bg-[#0d2232]
          p-6
          shadow-[0_16px_40px_rgba(0,0,0,0.16)]
        ">

          <h2 className="mb-5 text-lg font-semibold text-white">
            Localização
          </h2>


          {
            emMatch && (

              <div className="
                mb-5
                rounded-2xl
                border
                border-cyan-300/15
                bg-cyan-400/[0.06]
                p-4
              ">

                <p className="font-semibold text-cyan-200">
                  Localização e preferências bloqueadas temporariamente
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Enquanto sua permuta estiver confirmada, sua comarca atual,
                  seus destinos e a ordem de prioridade não podem ser alterados.
                  Isso evita inconsistências na permuta em andamento.
                </p>

              </div>

            )
          }


          <div
            className={
              emMatch
                ? "pointer-events-none select-none opacity-60"
                : ""
            }
          >

            <ComarcaAtualSelector
              comarcas={comarcas}
              comarcaAtualId={comarcaAtualId}
              valorBusca={buscaComarcaAtual}
              onChangeBusca={setBuscaComarcaAtual}
              onSelecionar={selecionarComarcaAtual}
            />


            {
              comarcaSelecionada && (

                <ComarcaInfoCard
                  titulo="Comarca atual"
                  nome={comarcaSelecionada.nome}
                  circunscricao={comarcaSelecionada.circunscricao}
                  raj={comarcaSelecionada.raj}
                />

              )
            }


            <div className="mt-8">

              <ComarcaDesejadaSelector
                comarcas={comarcas}
                comarcaAtualId={comarcaAtualId}
                comarcasSelecionadasIds={destinosIds}
                onAdicionar={adicionarDestino}
              />

            </div>


            {
              destinos.length > 0 && (

                <div className="mt-6">

                  <h3 className="mb-3 font-semibold text-white">
                    Prioridade das comarcas
                  </h3>

                  <ComarcaPrioridadeList
                    comarcas={destinos}
                    onChange={alterarPrioridade}
                    onRemove={removerDestino}
                  />

                </div>

              )
            }

          </div>

        </section>


        {/* ========================================
            MENSAGENS
        ======================================== */}

        {
          erro && (

            <div className="
              rounded-xl
              border
              border-red-400/20
              bg-red-400/10
              p-4
              text-red-300
            ">
              {erro}
            </div>

          )
        }


        {
          mensagem && (

            <div className="
              rounded-xl
              border
              border-emerald-400/20
              bg-emerald-400/10
              p-4
              text-emerald-300
            ">
              {mensagem}
            </div>

          )
        }


        {/* ========================================
            SALVAR PERFIL
        ======================================== */}

        <button
          type="button"
          onClick={salvarPerfil}
          disabled={salvando}
          className="
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-teal-300/20
            bg-teal-600
            py-3
            font-semibold
            text-white
            shadow-[0_10px_25px_rgba(20,184,166,0.12)]
            transition-all
            duration-200
            hover:-translate-y-[1px]
            hover:bg-teal-500
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          <Save size={18}/>

          {
            salvando
              ? "Salvando..."
              : emMatch
                ? "Salvar dados pessoais"
                : "Salvar alterações"
          }

        </button>


        {/* ========================================
            ZONA DE RISCO
        ======================================== */}

        <section className="
          mt-8
          rounded-2xl
          border
          border-red-400/20
          bg-red-950/[0.08]
          p-6
        ">

          <div className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-start
            sm:justify-between
          ">

            <div className="max-w-2xl">

              <h2 className="text-lg font-semibold text-red-300">
                Zona de risco
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                A exclusão da conta é permanente. Seus dados pessoais,
                preferências, notificações e sua participação ativa na
                plataforma serão removidos.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Registros necessários apenas para estatísticas poderão
                permanecer de forma anônima.
              </p>


              {
                emMatch && (

                  <p className="mt-3 text-sm font-semibold text-cyan-300">
                    Você possui uma permuta confirmada em andamento.
                    Encerre essa permuta antes de excluir sua conta.
                  </p>

                )
              }

            </div>


            <button
              type="button"
              disabled={emMatch}
              onClick={() => {

                setErroExclusao("");
                setConfirmacaoExclusao("");
                setModalExcluirConta(true);

              }}
              className="
                inline-flex
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-red-400/25
                bg-red-400/[0.05]
                px-5
                py-3
                text-sm
                font-semibold
                text-red-300
                transition-all
                duration-200
                hover:-translate-y-[1px]
                hover:bg-red-400/10
                hover:text-red-200
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <Trash2 size={18} />
              Excluir minha conta

            </button>

          </div>

        </section>

      </>

    )
  }

</div>


{/* ========================================
    MODAL - PAUSAR BUSCA
======================================== */}

{
  confirmarPausa && (

    <div className="
      fixed
      inset-0
      z-[100]
      flex
      items-center
      justify-center
      bg-slate-950/75
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
        border-amber-300/15
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

            <h2 className="text-xl font-bold text-white">
              Pausar busca por permuta
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Confirme antes de continuar.
            </p>

          </div>


          <button
            type="button"
            aria-label="Fechar"
            disabled={processandoStatus}
            onClick={()=>setConfirmarPausa(false)}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-teal-400/10
              hover:text-teal-300
              disabled:opacity-50
            "
          >
            <X size={20}/>
          </button>

        </div>


        <div className="px-6 py-6">

          <div className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            border
            border-amber-300/20
            bg-amber-400/10
            text-amber-300
          ">
            <PauseCircle size={24}/>
          </div>


          <h3 className="mt-4 text-lg font-bold text-white">
            Deseja pausar sua participação nas buscas por permuta?
          </h3>


          <p className="mt-2 text-sm leading-6 text-slate-300">
            Seu perfil e suas preferências serão mantidos, mas você deixará de
            aparecer em novas oportunidades até reativar a busca.
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
              disabled={processandoStatus}
              onClick={()=>setConfirmarPausa(false)}
              className="
                rounded-xl
                border
                border-teal-300/15
                bg-transparent
                px-4
                py-2.5
                text-sm
                font-semibold
                text-slate-300
                transition
                hover:bg-white/[0.04]
                disabled:opacity-50
              "
            >
              Cancelar
            </button>


            <button
              type="button"
              disabled={processandoStatus}
              onClick={pausarBusca}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-amber-300/20
                bg-amber-500/15
                px-4
                py-2.5
                text-sm
                font-semibold
                text-amber-200
                transition-all
                duration-200
                hover:-translate-y-[1px]
                hover:bg-amber-500/25
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <PauseCircle size={17}/>

              {processandoStatus ? "Pausando..." : "Pausar busca"}

            </button>

          </div>

        </div>

      </div>

    </div>

  )
}


{/* ========================================
    MODAL - EXCLUIR CONTA
======================================== */}

{
  modalExcluirConta && (

    <div className="
      fixed
      inset-0
      z-[110]
      flex
      items-center
      justify-center
      bg-slate-950/80
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
        border-red-400/20
        bg-[#0d2232]
        shadow-2xl
      ">

        <div className="
          flex
          items-start
          justify-between
          gap-4
          border-b
          border-red-400/15
          bg-red-400/[0.04]
          px-6
          py-5
        ">

          <div>

            <h2 className="text-xl font-bold text-red-300">
              Excluir minha conta
            </h2>

            <p className="mt-1 text-sm text-red-300/75">
              Esta ação não poderá ser desfeita.
            </p>

          </div>


          <button
            type="button"
            aria-label="Fechar"
            disabled={excluindoConta}
            onClick={()=>setModalExcluirConta(false)}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-red-400
              transition
              hover:bg-red-400/10
              hover:text-red-300
              disabled:opacity-50
            "
          >

            <X size={20}/>

          </button>

        </div>


        <div className="px-6 py-6">

          <div className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            border
            border-red-400/20
            bg-red-400/10
            text-red-300
          ">

            <Trash2 size={24}/>

          </div>


          <h3 className="mt-4 text-lg font-bold text-white">
            Tem certeza de que deseja excluir sua conta?
          </h3>


          <p className="mt-2 text-sm leading-6 text-slate-300">
            Seus dados pessoais, preferências, notificações e propostas
            vinculadas serão removidos. Registros usados apenas para estatísticas
            poderão permanecer de forma anônima.
          </p>


          <div className="
            mt-5
            rounded-xl
            border
            border-red-400/20
            bg-red-400/[0.06]
            p-4
          ">

            <p className="text-sm font-semibold text-red-200">
              Para confirmar, digite:
            </p>

            <p className="
              mt-1
              font-mono
              text-sm
              font-bold
              tracking-wider
              text-red-300
            ">
              EXCLUIR
            </p>

          </div>


          <div className="mt-5">

            <label className="
              mb-2
              block
              text-sm
              font-semibold
              text-slate-300
            ">
              Confirmação
            </label>


            <input
              type="text"
              value={confirmacaoExclusao}
              disabled={excluindoConta}
              onChange={(event)=>{

                setConfirmacaoExclusao(event.target.value);
                setErroExclusao("");

              }}
              onPaste={(event)=>event.preventDefault()}
              placeholder='Digite "EXCLUIR"'
              autoComplete="off"
              className="
                w-full
                rounded-xl
                border
                border-red-400/20
                bg-[#081b29]
                px-4
                py-3
                text-white
                outline-none
                transition
                placeholder:text-slate-600
                focus:border-red-400
                focus:ring-4
                focus:ring-red-400/10
                disabled:opacity-60
              "
            />

          </div>


          {
            erroExclusao && (

              <div className="
                mt-4
                rounded-xl
                border
                border-red-400/20
                bg-red-400/10
                p-4
                text-sm
                text-red-300
              ">
                {erroExclusao}
              </div>

            )
          }


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
              disabled={excluindoConta}
              onClick={()=>setModalExcluirConta(false)}
              className="
                rounded-xl
                border
                border-teal-300/15
                bg-transparent
                px-4
                py-2.5
                text-sm
                font-semibold
                text-slate-300
                transition
                hover:bg-white/[0.04]
                disabled:opacity-50
              "
            >
              Cancelar
            </button>


            <button
              type="button"
              onClick={excluirConta}
              disabled={
                excluindoConta ||
                confirmacaoExclusao.trim().toUpperCase() !== "EXCLUIR"
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-red-400/20
                bg-red-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition-all
                duration-200
                hover:-translate-y-[1px]
                hover:bg-red-500
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <Trash2 size={17}/>

              {
                excluindoConta
                  ? "Excluindo..."
                  : "Excluir conta definitivamente"
              }

            </button>

          </div>

        </div>

      </div>

    </div>

  )
}

</DashboardLayout>

</AuthGuard>

);

}