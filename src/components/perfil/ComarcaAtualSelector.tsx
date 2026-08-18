"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";


export type ComarcaAtual = {
  id: number;
  nome: string;
  circunscricao: string;
  raj: string;
};



type ComarcaAtualSelectorProps = {

  comarcas:ComarcaAtual[];

  comarcaAtualId:string;

  valorBusca:string;

  onChangeBusca:(valor:string)=>void;

  onSelecionar:(comarca:ComarcaAtual)=>void;

};



function normalizarTexto(texto:string){

  return texto

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g,"")

    .toLowerCase()

    .trim();

}





export function ComarcaAtualSelector({

  comarcas,

  comarcaAtualId,

  valorBusca,

  onChangeBusca,

  onSelecionar,

}:ComarcaAtualSelectorProps){



const containerRef = useRef<HTMLDivElement>(null);


const [listaAberta,setListaAberta]=useState(false);





useEffect(()=>{


function fechar(event:MouseEvent){


const alvo = event.target as Node;


if(

containerRef.current &&

!containerRef.current.contains(alvo)

){

setListaAberta(false);

}


}


document.addEventListener(
"mousedown",
fechar
);


return()=>{

document.removeEventListener(
"mousedown",
fechar
);


};


},[]);








const resultados = useMemo(()=>{


const busca = normalizarTexto(valorBusca);



return comarcas

.filter((item)=>{


if(!busca){

return true;

}



return (

normalizarTexto(item.nome)

.includes(busca)

);


})


.slice(0,8);



},[comarcas,valorBusca]);







return (

<div ref={containerRef}>


<label className="mb-2 block text-sm font-medium text-slate-700">

Comarca atual

</label>



<div className="relative">


<Search

className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"

size={20}

/>



<input

type="text"

value={valorBusca}

onChange={(e)=>{

onChangeBusca(e.target.value);

setListaAberta(true);

}}

onFocus={()=>setListaAberta(true)}

placeholder="Digite sua comarca"

autoComplete="off"

className="
w-full rounded-xl border
border-slate-300
py-3 pl-10 pr-10
text-slate-900
outline-none
focus:border-blue-700
"

/>




<ChevronDown

className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"

size={20}

/>







{

listaAberta && (

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

onClick={()=>{

onSelecionar(comarca);

setListaAberta(false);

}}

className="
flex w-full
items-center justify-between
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





{

Number(comarcaAtualId)===comarca.id &&

<Check

size={18}

className="text-blue-900"

/>

}



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


</div>

);


}