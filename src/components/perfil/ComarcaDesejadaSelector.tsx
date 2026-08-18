"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";


export type ComarcaDesejadaOpcao = {
  id: number;
  nome: string;
  circunscricao: string;
  raj: string;
};




type ComarcaDesejadaSelectorProps = {

  comarcas:ComarcaDesejadaOpcao[];

  comarcaAtualId:string;

  comarcasSelecionadasIds:number[];

  limite?:number;

  onAdicionar:(comarca:ComarcaDesejadaOpcao)=>void;

};




function normalizarTexto(texto:string){

  return texto

  .normalize("NFD")

  .replace(/[\u0300-\u036f]/g,"")

  .toLowerCase()

  .trim();

}





export function ComarcaDesejadaSelector({

  comarcas,

  comarcaAtualId,

  comarcasSelecionadasIds,

  limite=10,

  onAdicionar,

}:ComarcaDesejadaSelectorProps){



const [busca,setBusca]=useState("");

const [listaAberta,setListaAberta]=useState(false);





const atingiuLimite =

comarcasSelecionadasIds.length >= limite;






const resultados = useMemo(()=>{


const texto = normalizarTexto(busca);



return comarcas

.filter((comarca)=>{



const jaSelecionada =

comarcasSelecionadasIds.includes(
comarca.id
);



const eAtual =

Number(comarcaAtualId) === comarca.id;




if(jaSelecionada || eAtual){

return false;

}



if(!texto){

return true;

}




return (

normalizarTexto(comarca.nome)

.includes(texto)

);



})

.slice(0,8);



},[

busca,

comarcas,

comarcasSelecionadasIds,

comarcaAtualId

]);








function adicionar(

comarca:ComarcaDesejadaOpcao

){


if(atingiuLimite){

return;

}



onAdicionar(comarca);


setBusca("");

setListaAberta(false);


}







return (

<div>



<div className="mb-2 flex items-center justify-between">


<label className="text-sm font-medium text-slate-700">

Comarcas desejadas

</label>


<span className="text-xs text-slate-500">

{comarcasSelecionadasIds.length}/{limite}

</span>


</div>





<div className="relative">


<Search

size={20}

className="
absolute left-3 top-1/2
-translate-y-1/2
text-slate-400
"

/>





<input


type="text"


value={busca}


onChange={(e)=>{


setBusca(e.target.value);

setListaAberta(true);


}}


onFocus={()=>setListaAberta(true)}


disabled={atingiuLimite}


placeholder={

atingiuLimite

?

`Limite de ${limite} atingido`

:

"Digite uma comarca desejada"

}


autoComplete="off"


className="
w-full rounded-xl border
border-slate-300
py-3 pl-10
text-slate-900
outline-none
focus:border-blue-700
disabled:bg-slate-100
"

/>






{


listaAberta && !atingiuLimite && (



<div className="
absolute z-30 mt-2
max-h-80 w-full
overflow-y-auto
rounded-xl
border bg-white
shadow-xl
">


{


resultados.length > 0 ?


resultados.map((comarca)=>(



<button


key={comarca.id}


type="button"


onClick={()=>adicionar(comarca)}


className="
flex w-full
items-center justify-between
gap-3
px-4 py-3
text-left
hover:bg-blue-50
"



>


<div>


<p className="font-medium text-slate-800">

{comarca.nome}

</p>



<p className="text-xs text-slate-500">

Circunscrição: {comarca.circunscricao ?? "-"}

</p>



<p className="text-xs text-slate-500">

RAJ: {comarca.raj ?? "-"}

</p>



</div>




<Plus

size={18}

className="text-blue-900"

/>



</button>



))


:

(


<p className="
px-4 py-4
text-sm text-slate-500
">

Nenhuma comarca encontrada.

</p>


)



}



</div>



)



}



</div>




<p className="
mt-2 text-xs text-slate-500
">

Você pode adicionar até {limite} comarcas.

</p>



</div>

);


}