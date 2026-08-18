"use client";


type ComarcaInfoCardProps = {

titulo?: string;

nome: string;

circunscricao?: string;

raj?: string;

};



export function ComarcaInfoCard({

titulo = "Comarca selecionada",

nome,

circunscricao,

raj,

}:ComarcaInfoCardProps){



return (

<div
className="
mt-4
rounded-xl
border
border-blue-200
bg-blue-50
p-4
"
>


<div className="
mb-3
flex
items-center
gap-2
font-semibold
text-blue-900
">


<span>

📍

</span>


<span>

{titulo}

</span>


</div>





<div className="
text-lg
font-semibold
text-slate-900
">

{nome}

</div>







<div className="
mt-3
space-y-1
text-sm
text-slate-600
">


{

circunscricao && (

<p>

<strong>

Circunscrição:

</strong>

{" "}

{circunscricao}

</p>

)

}





{

raj && (

<p>

<strong>

RAJ:

</strong>

{" "}

{raj}

</p>

)

}



</div>




</div>

);


}