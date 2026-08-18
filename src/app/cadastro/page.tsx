"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import Link from "next/link";

import {
  Eye,
  EyeOff,
} from "lucide-react";


import {
  supabase,
} from "@/lib/supabase";


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

import {
ComarcaInfoCard
} from "@/components/perfil/ComarcaInfoCard";





const CARGOS = [

  "Escrevente Técnico Judiciário",

  "Oficial de Justiça",

  "Assistente Judiciário",

  "Analista Judiciário",

  "Agente Administrativo Judiciário",

  "Outro",

];





export default function CadastroPage(){


const router = useRouter();

const searchParams = useSearchParams();

const cadastroGoogle =
searchParams.get("google") === "1";





/*
================================================
DADOS DE ACESSO
================================================
*/


const [nome,setNome] =
useState("");


const [email,setEmail] =
useState("");


const [confirmarEmail,setConfirmarEmail] =
useState("");



const [senha,setSenha] =
useState("");


const [confirmarSenha,setConfirmarSenha] =
useState("");



const [mostrarSenha,setMostrarSenha] =
useState(false);





/*
================================================
DADOS DO SERVIDOR
================================================
*/


const [cargo,setCargo] =
useState("");



const [telefone,setTelefone] =
useState("");


const [mostrarTelefone,setMostrarTelefone] =
useState(false);





/*
================================================
COMARCAS
================================================
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






/*
================================================
CONTROLE
================================================
*/


const [erro,setErro] =
useState("");



const [carregando,setCarregando] =
useState(false);


const [carregandoGoogle,setCarregandoGoogle] =
useState(false);


const [verificandoSessao,setVerificandoSessao] =
useState(true);


const [aceitouTermos,setAceitouTermos] =
useState(false);










/*
===============================================
VERIFICAR SESSÃO / CADASTRO GOOGLE
===============================================
*/


useEffect(()=>{

let ativo = true;


async function verificarSessao(){

try{

const {
data,
error
}=await supabase.auth.getSession();


if(!ativo){
return;
}


if(error){

console.warn(
"Não foi possível verificar a sessão:",
error.message
);

setVerificandoSessao(false);

return;

}


const usuario =
data.session?.user;


if(usuario){

/*
No cadastro iniciado pelo Google o usuário já está
autenticado. Em vez de mandá-lo direto ao dashboard,
mantemos esta página aberta para ele completar cargo,
telefone, comarca atual e destinos.
*/

if(cadastroGoogle){

const {
data:perfilExistente,
error:perfilExistenteError
}=await supabase
.from("perfis")
.select(`
id,
nome,
email,
cargo,
comarca_atual_id
`)
.eq(
"id",
usuario.id
)
.maybeSingle();


if(!ativo){
return;
}


if(perfilExistenteError){

console.warn(
"Não foi possível verificar o perfil existente:",
perfilExistenteError.message
);

}


const perfilCompleto =
Boolean(
perfilExistente?.id
&&
perfilExistente?.cargo
&&
perfilExistente?.comarca_atual_id
);


if(perfilCompleto){

router.replace(
"/dashboard"
);

return;

}


const nomeGoogle =
(
usuario.user_metadata?.full_name
||
usuario.user_metadata?.name
||
perfilExistente?.nome
||
searchParams.get("nome")
||
""
)
.toString()
.trim();


const emailGoogle =
(
usuario.email
||
perfilExistente?.email
||
searchParams.get("email")
||
""
)
.toString()
.trim()
.toLowerCase();


setNome(
nomeGoogle
);

setEmail(
emailGoogle
);

setConfirmarEmail(
emailGoogle
);

setVerificandoSessao(false);

return;

}


/*
Usuário autenticado pelo fluxo tradicional.
*/

router.replace(
"/dashboard"
);

return;

}


/*
Se a URL indicar cadastro Google, mas não existir
mais sessão OAuth, voltamos ao login.
*/

if(cadastroGoogle){

router.replace(
"/login"
);

return;

}


setVerificandoSessao(false);


}

catch(error){

console.warn(
"Erro inesperado ao verificar sessão."
);

if(ativo){

setVerificandoSessao(false);

}

}

}


verificarSessao();


return()=>{

ativo=false;

};


},[
router,
cadastroGoogle,
searchParams
]);







/*
================================================
CARREGAR COMARCAS TJSP
================================================
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


console.error(

"Erro carregando comarcas",

error

);


return;


}







const listaFormatada = (data ?? []).map((item:any)=>({

id:item.id,

nome:item.nome,

circunscricao:
item.circunscricoes_tjsp?.nome ?? "",

raj:
item.circunscricoes_tjsp?.rajs_tjsp?.nome ?? ""

}));





setComarcas(listaFormatada);



}





carregarComarcas();



},[]);








const destinosIds = useMemo(()=>{


return destinos.map(

(item)=>

item.id

);



},[destinos]);








function selecionarComarcaAtual(
  comarca: ComarcaAtual
){

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



setDestinos(

novaLista

);



}

function removerDestino(id: number) {

  setDestinos(

    atual =>
      atual.filter(
        item => item.id !== id
      )

  );

}


/*
================================================
VALIDAÇÕES E SALVAMENTO
================================================
*/


function bloquearColar(
event:React.ClipboardEvent<HTMLInputElement>
){

event.preventDefault();

}





async function entrarComGoogle(){

setErro("");

try{

setCarregandoGoogle(true);


const {
error
}=await supabase.auth.signInWithOAuth({

provider:"google",

options:{

redirectTo:
`${window.location.origin}/login/google`

}

});


if(error){

setErro(
"Não foi possível iniciar o cadastro com Google. Tente novamente."
);

setCarregandoGoogle(false);

}

}
catch{

setErro(
"Ocorreu um erro inesperado ao iniciar o cadastro com Google."
);

setCarregandoGoogle(false);

}

}





async function salvarCadastro(){


setErro("");



if(!nome.trim()){

setErro(
"Informe seu nome."
);

return;

}



if(!email.trim()){

setErro(
"Informe seu e-mail."
);

return;

}



if(
!cadastroGoogle
&&
email.trim().toLowerCase() !== confirmarEmail.trim().toLowerCase()
){

setErro(
"Os e-mails informados são diferentes."
);

return;

}



if(
!cadastroGoogle
&&
!senha
){

setErro(
"Informe uma senha."
);

return;

}



if(
!cadastroGoogle
&&
senha.length < 8
){

setErro(
"A senha deve possuir no mínimo 8 caracteres."
);

return;

}



if(
!cadastroGoogle
&&
senha !== confirmarSenha
){

setErro(
"As senhas informadas são diferentes."
);

return;

}



if(!cargo){

setErro(
"Selecione seu cargo."
);

return;

}



if(!comarcaAtualId){

setErro(
"Selecione sua comarca atual."
);

return;

}



if(destinos.length === 0){

setErro(
"Selecione pelo menos uma comarca desejada."
);

return;

}


if(!aceitouTermos){

setErro(
"Para criar sua conta, você precisa aceitar os Termos de Uso e a Política de Privacidade."
);

return;

}





setCarregando(true);




try{



/*
===============================================
1 - OBTÉM / CRIA USUÁRIO AUTH
===============================================
*/


let usuarioId = "";


if(cadastroGoogle){

const {
data:sessaoGoogle,
error:sessaoGoogleError
}=await supabase.auth.getSession();


if(sessaoGoogleError){

throw sessaoGoogleError;

}


if(!sessaoGoogle.session?.user){

throw new Error(
"Sua sessão com Google não está mais disponível. Entre novamente."
);

}


usuarioId =
sessaoGoogle.session.user.id;

}
else{

const {

data:authData,

error:authError

}=await supabase.auth.signUp({


email:email.trim(),


password:senha,


options:{


data:{


nome:nome.trim()


}


}


});





if(authError){

throw authError;

}





if(!authData.user){


throw new Error(

"Não foi possível criar usuário."

);


}





usuarioId =
authData.user.id;

}






/*
===============================================
2 - CRIA / ATUALIZA PERFIL
===============================================
*/


const dadosPerfil = {

id:usuarioId,


nome:nome.trim(),


cargo,


telefone,


mostrar_telefone:mostrarTelefone,


mostrar_email:true,


email:email.trim(),


comarca_atual_id:Number(comarcaAtualId),


updated_at:new Date().toISOString()

};


const {

error:perfilError

} =
cadastroGoogle

?
await supabase

.from("perfis")

.upsert(
{

...dadosPerfil,

created_at:new Date().toISOString()

},
{

onConflict:"id"

}
)

:
await supabase

.from("perfis")

.insert(
{

...dadosPerfil,

created_at:new Date().toISOString()

}
);





if(perfilError){


throw perfilError;


}








/*
================================================
3 - SALVA DESTINOS
================================================
*/


if(cadastroGoogle){

const {
error:limparPreferenciasError
}=await supabase

.from("preferencias_movimentacao")

.delete()

.eq(
"perfil_id",
usuarioId
);


if(limparPreferenciasError){

throw limparPreferenciasError;

}

}




const preferencias = destinos.map(

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





const {

error:preferenciaError

}=await supabase


.from("preferencias_movimentacao")


.insert(preferencias);







if(preferenciaError){


throw preferenciaError;


}









/*
===============================================
4 - GARANTE SESSÃO AUTENTICADA
===============================================
*/


if(!cadastroGoogle){

const {

error:loginError

}=await supabase.auth.signInWithPassword({

email:email.trim(),

password:senha

});


if(loginError){

console.warn(
"Cadastro criado, mas não foi possível iniciar a sessão:",
loginError.message
);


setErro(
"Sua conta foi criada, mas não foi possível entrar automaticamente. Acesse a página de login."
);

return;

}

}






/*
================================================
5 - RECALCULA MATCHING DE CICLO 3
================================================

O perfil e as preferências já foram gravados.
Agora que o usuário está autenticado, executamos
a mesma rotina utilizada ao salvar o Meu Perfil.

Isso evita que um servidor recém-cadastrado precise
entrar no perfil e clicar em "Salvar alterações"
para começar a receber ciclos.
*/


const {

error:recalculoError

}=await supabase.rpc(

"recalcular_matches_ciclo_3_usuario",

{

p_perfil_id:usuarioId

}

);


if(recalculoError){

console.warn(
"Cadastro concluído, mas houve falha ao recalcular ciclos:",
recalculoError.message
);

/*
Não bloqueamos o cadastro nem removemos a conta.
O usuário já foi criado corretamente e poderá
continuar usando a plataforma.
*/

}




/*
================================================
6 - VAI PARA O DASHBOARD
================================================
*/


router.push("/dashboard");

router.refresh();




}



catch(error:any){


console.warn(
"Falha inesperada no cadastro:",
error?.message ?? "Erro sem mensagem."
);



setErro(

error?.message ??

"Erro ao criar cadastro."

);



}



finally{


setCarregando(false);


}



}


if(verificandoSessao){

return(

<div className="
min-h-screen
bg-slate-50
px-6
py-10
">

<div className="
mx-auto
flex
min-h-[50vh]
max-w-3xl
items-center
justify-center
">

<div className="
rounded-2xl
border
border-slate-200
bg-white
px-6
py-5
text-sm
font-medium
text-slate-600
shadow-sm
">

Verificando sua sessão...

</div>

</div>

</div>

);

}


return (

<div className="min-h-screen bg-slate-50 px-6 py-10">


<div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">


<h1 className="text-2xl font-bold text-slate-900">

{cadastroGoogle
?
"Complete seu cadastro"
:
"Criar conta Permuta TJSP"
}

</h1>


<p className="mt-2 mb-8 text-sm text-slate-500">

{cadastroGoogle
?
"Seu acesso com Google foi confirmado. Complete os dados abaixo para começar a buscar oportunidades de permuta."
:
"Cadastre seus dados para encontrar oportunidades de permuta."
}

</p>





<div className="space-y-6">

{
!cadastroGoogle && (

<>

<button

type="button"

onClick={entrarComGoogle}

disabled={carregando || carregandoGoogle}

className="
flex
w-full
items-center
justify-center
gap-3
rounded-xl
border
border-slate-300
bg-white
px-4
py-3
font-semibold
text-slate-800
transition
hover:bg-slate-50
hover:border-slate-400
disabled:cursor-not-allowed
disabled:opacity-60
"

>

<svg
aria-hidden="true"
viewBox="0 0 24 24"
className="h-5 w-5 shrink-0"
>

<path
fill="#4285F4"
d="M21.6 12.23c0-.71-.06-1.4-.19-2.07H12v3.91h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.31 2.98-7.37Z"
/>

<path
fill="#34A853"
d="M12 22c2.7 0 4.97-.89 6.62-2.4l-3.23-2.51c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"
/>

<path
fill="#FBBC05"
d="M6.4 13.93A6.02 6.02 0 0 1 6.09 12c0-.67.11-1.32.31-1.93V7.48H3.06A10 10 0 0 0 2 12c0 1.61.38 3.13 1.06 4.52l3.34-2.59Z"
/>

<path
fill="#EA4335"
d="M12 5.95c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 2.96 14.7 2 12 2a10 10 0 0 0-8.94 5.48l3.34 2.59C7.19 7.71 9.4 5.95 12 5.95Z"
/>

</svg>


{
carregandoGoogle
?
"Abrindo Google..."
:
"Continuar com Google"
}

</button>


<div className="
flex
items-center
gap-4
">

<div className="
h-px
flex-1
bg-slate-200
"/>

<span className="
text-xs
font-medium
uppercase
tracking-wider
text-slate-400
">

ou cadastre-se com e-mail

</span>

<div className="
h-px
flex-1
bg-slate-200
"/>

</div>

</>

)
}





<div>

<label className="mb-2 block text-sm font-medium">

Nome completo

</label>


<input

value={nome}

onChange={(e)=>setNome(e.target.value)}

autoComplete="name"

readOnly={cadastroGoogle}

className={`
w-full rounded-xl border
border-slate-300
px-4 py-3
text-slate-900
${cadastroGoogle ? "bg-slate-100" : ""}
`}

placeholder="Digite seu nome"

 />


</div>







<div>


<label className="mb-2 block text-sm font-medium">

E-mail

</label>


<input

type="email"

value={email}

onChange={(e)=>setEmail(e.target.value)}

autoComplete="email"

readOnly={cadastroGoogle}

className={`
w-full rounded-xl border
border-slate-300
px-4 py-3
text-slate-900
${cadastroGoogle ? "bg-slate-100" : ""}
`}

placeholder="seu@email.com"

/>


</div>


{
cadastroGoogle && (

<div className="
rounded-xl
border
border-blue-100
bg-blue-50
p-4
text-sm
leading-6
text-slate-600
">

Seu nome e e-mail foram obtidos da sua conta Google. Complete os demais dados para finalizar seu cadastro no Permuta TJSP.

</div>

)
}









{
!cadastroGoogle && (

<>
<div>


<label className="mb-2 block text-sm font-medium">

Confirmar e-mail

</label>


<input


type="email"


value={confirmarEmail}


onChange={(e)=>setConfirmarEmail(e.target.value)}


onPaste={bloquearColar}


onCopy={bloquearColar}


autoComplete="off"


className="
w-full rounded-xl border
border-slate-300
px-4 py-3
text-slate-900
"


placeholder="Digite novamente seu e-mail"

/>



</div>









<div>


<label className="mb-2 block text-sm font-medium">

Senha

</label>



<div className="relative">


<input


type={mostrarSenha ? "text" : "password"}


value={senha}


onChange={(e)=>setSenha(e.target.value)}


autoComplete="new-password"


className="
w-full rounded-xl border
border-slate-300
px-4 py-3 pr-12
text-slate-900
"


placeholder="Mínimo 8 caracteres"

/>


<button


type="button"


onClick={()=>setMostrarSenha(!mostrarSenha)}


className="
absolute right-3 top-1/2
-translate-y-1/2
text-slate-500
"


>


{

mostrarSenha

?

<EyeOff size={20}/>

:

<Eye size={20}/>

}


</button>


</div>


</div>









<div>


<label className="mb-2 block text-sm font-medium">

Confirmar senha

</label>



<input


type={mostrarSenha ? "text" : "password"}


value={confirmarSenha}


onChange={(e)=>setConfirmarSenha(e.target.value)}


onPaste={bloquearColar}


onCopy={bloquearColar}


autoComplete="off"


className="
w-full rounded-xl border
border-slate-300
px-4 py-3
text-slate-900
"


placeholder="Digite novamente a senha"

/>



</div>










</>

)
}





<div>


<label className="mb-2 block text-sm font-medium">

Cargo

</label>



<select


value={cargo}


onChange={(e)=>setCargo(e.target.value)}


className="
w-full rounded-xl border
border-slate-300
px-4 py-3
text-slate-900
"

>


<option value="">

Selecione seu cargo

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


<label className="mb-2 block text-sm font-medium">

Telefone

</label>


<input


value={telefone}


onChange={(e)=>setTelefone(e.target.value)}


className="
w-full rounded-xl border
border-slate-300
px-4 py-3
text-slate-900
"


placeholder="(00) 00000-0000"

/>



<label className="mt-3 flex items-center gap-2 text-sm">


<input


type="checkbox"


checked={mostrarTelefone}


onChange={(e)=>setMostrarTelefone(e.target.checked)}


/>


Permitir exibição do telefone


</label>


</div>









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







<ComarcaDesejadaSelector


comarcas={comarcas}


comarcaAtualId={comarcaAtualId}


comarcasSelecionadasIds={destinosIds}


onAdicionar={adicionarDestino}


/>









{

destinos.length > 0 && (


<div className="
rounded-xl
bg-slate-50
p-4
">


<h2 className="mb-4 font-semibold">

Prioridade das comarcas

</h2>


<ComarcaPrioridadeList

  comarcas={destinos}

  onChange={alterarPrioridade}

  onRemove={removerDestino}

/>


</div>


)

}










{/* ================================================
    TERMOS E PRIVACIDADE
================================================ */}

<div
className="
rounded-xl
border
border-slate-200
bg-slate-50
p-4
"
>

<label
className="
flex
cursor-pointer
items-start
gap-3
"
>

<input
type="checkbox"
checked={aceitouTermos}
onChange={(e)=>
setAceitouTermos(
e.target.checked
)
}
className="
mt-1
h-4
w-4
shrink-0
cursor-pointer
accent-blue-900
"
/>

<span
className="
text-sm
leading-6
text-slate-600
"
>

Li e aceito os{" "}

<Link
href="/termos"
target="_blank"
rel="noopener noreferrer"
className="
font-semibold
text-blue-900
hover:underline
"
onClick={(e)=>
e.stopPropagation()
}
>
Termos de Uso
</Link>

{" "}e a{" "}

<Link
href="/privacidade"
target="_blank"
rel="noopener noreferrer"
className="
font-semibold
text-blue-900
hover:underline
"
onClick={(e)=>
e.stopPropagation()
}
>
Política de Privacidade
</Link>.

</span>

</label>

</div>


{

erro && (


<div className="
rounded-xl
bg-red-50
p-3
text-sm
text-red-700
">


{erro}


</div>


)


}









<button


type="button"


onClick={salvarCadastro}


disabled={carregando || carregandoGoogle || !aceitouTermos}


className="
w-full rounded-xl
bg-blue-900
py-3
font-semibold
text-white
disabled:opacity-50
"


>


{

carregando

?

"Salvando..."

:

cadastroGoogle

?

"Concluir meu cadastro"

:

"Criar minha conta"

}


</button>








</div>


</div>


</div>

);


}