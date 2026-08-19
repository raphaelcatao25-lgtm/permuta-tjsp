"use client";

import {
  useEffect,
  useState
} from "react";

import {
  useRouter
} from "next/navigation";

import {
  ArrowRight,
  MapPin,
  Users
} from "lucide-react";

import {
  supabase
} from "@/lib/supabase";


interface Props {
  usuarioId: string;
}


interface PermutaDireta {
  candidato_id: string;
  candidato_nome: string;

  comarca_origem: string;
  unidade_origem?: string | null;

  comarca_destino: string;

  tipo_match: string;

  score: number;

  prioridade: number;

  compatibilidade: string;
}


interface PerfilAtual {
  nome: string;
  comarca_atual_id: number;
}


interface Comarca {
  id: number;
  nome: string;
}


/* ======================================================
   COMPONENTE PRINCIPAL
====================================================== */

export default function PermutasDiretas({
  usuarioId
}: Props) {

  const router = useRouter();


  const [
    permutas,
    setPermutas
  ] = useState<PermutaDireta[]>([]);


  const [
    carregando,
    setCarregando
  ] = useState(true);


  const [
    nomeUsuario,
    setNomeUsuario
  ] = useState("");


  const [
    comarcaAtual,
    setComarcaAtual
  ] = useState("");


  /*
  ========================================
  CONTROLA QUAL PROPOSTA ESTÁ SENDO ENVIADA
  ========================================
  */

  const [
    propondo,
    setPropondo
  ] = useState<string | null>(
    null
  );


  /* ======================================================
     BUSCA DAS PERMUTAS
  ====================================================== */

  useEffect(() => {

    if (!usuarioId) {

      setCarregando(false);

      return;

    }


    let ativo = true;


    async function buscarPermutasDiretas() {

      setCarregando(true);


      /*
      ========================================
      PERFIL ATUAL
      ========================================
      */

      const {
        data: perfil,
        error: perfilError
      } = await supabase
        .from("perfis")
        .select(`
          nome,
          comarca_atual_id
        `)
        .eq(
          "id",
          usuarioId
        )
        .single();


      if (!ativo) {
        return;
      }


      if (perfilError) {

        console.error(
          "Erro ao buscar perfil:",
          perfilError
        );

        setCarregando(false);

        return;

      }


      const perfilAtual =
        perfil as PerfilAtual;


      setNomeUsuario(
        perfilAtual.nome
      );


      /*
      ========================================
      COMARCA ATUAL DO USUÁRIO
      ========================================
      */

      const {
        data: comarca,
        error: comarcaError
      } = await supabase
        .from("comarcas_tjsp")
        .select(`
          id,
          nome
        `)
        .eq(
          "id",
          perfilAtual.comarca_atual_id
        )
        .single();


      if (!ativo) {
        return;
      }


      if (comarcaError) {

        console.error(
          "Erro ao buscar comarca atual:",
          comarcaError
        );

      }


      if (comarca) {

        setComarcaAtual(
          (comarca as Comarca).nome
        );

      }


      /*
      ========================================
      PERMUTAS DIRETAS
      ========================================
      */

      const {
        data,
        error
      } = await supabase.rpc(
        "buscar_candidatos_permuta",
        {
          p_perfil_id: usuarioId
        }
      );


      if (!ativo) {
        return;
      }


      if (error) {

        console.error(
          "Erro ao buscar permutas diretas:",
          error
        );

        setPermutas([]);

        setCarregando(false);

        return;

      }


      setPermutas(
        (data ?? []) as PermutaDireta[]
      );


      setCarregando(false);

    }


    /*
    ========================================
    ATUALIZAÇÃO MANUAL
    ========================================
    */

    function atualizarManualmente() {

      buscarPermutasDiretas();

    }


    /*
    ========================================
    AO VOLTAR PARA A PÁGINA
    ========================================
    */

    function aoVoltarParaPagina() {

      buscarPermutasDiretas();

    }


    /*
    ========================================
    ABA VISÍVEL NOVAMENTE
    ========================================
    */

    function aoMudarVisibilidade() {

      if (
        document.visibilityState ===
        "visible"
      ) {

        buscarPermutasDiretas();

      }

    }


    /*
    ========================================
    PRIMEIRA BUSCA
    ========================================
    */

    buscarPermutasDiretas();


    /*
    ========================================
    EVENTOS
    ========================================
    */

    window.addEventListener(
      "atualizar-ciclos",
      atualizarManualmente
    );


    window.addEventListener(
      "focus",
      aoVoltarParaPagina
    );


    window.addEventListener(
      "pageshow",
      aoVoltarParaPagina
    );


    document.addEventListener(
      "visibilitychange",
      aoMudarVisibilidade
    );


    /*
    ========================================
    LIMPEZA
    ========================================
    */

    return () => {

      ativo = false;


      window.removeEventListener(
        "atualizar-ciclos",
        atualizarManualmente
      );


      window.removeEventListener(
        "focus",
        aoVoltarParaPagina
      );


      window.removeEventListener(
        "pageshow",
        aoVoltarParaPagina
      );


      document.removeEventListener(
        "visibilitychange",
        aoMudarVisibilidade
      );

    };


  }, [usuarioId]);


  /* ======================================================
     PROPOR PERMUTA DIRETA
  ====================================================== */

  async function proporPermuta(
    candidatoId: string
  ) {

    if (!usuarioId) {
      return;
    }


    try {

      setPropondo(
        candidatoId
      );


      /* ==================================================
         CRIA A PROPOSTA
      ================================================== */

      const {
        data,
        error
      } = await supabase.rpc(
        "solicitar_permuta_direta",
        {
          p_candidato_id:
            candidatoId,

          p_usuario_id:
            usuarioId
        }
      );


      if (error) {

        throw error;

      }


      console.log(
        "Solicitação direta criada:",
        data
      );


      /* ==================================================
         ENVIA O E-MAIL TRANSACIONAL

         A proposta JÁ FOI CRIADA.

         Portanto, qualquer falha de e-mail não pode
         impedir nem desfazer a solicitação de permuta.
      ================================================== */

      try {

        const {
          data: sessao
        } =
          await supabase.auth.getSession();


        const accessToken =
          sessao.session
            ?.access_token;


        if (accessToken) {

          const respostaEmail =
            await fetch(
              "/api/email/nova-proposta",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  "Authorization":
                    `Bearer ${accessToken}`
                },

                body:
                  JSON.stringify({
                    candidatoId
                  })
              }
            );


          if (
            !respostaEmail.ok
          ) {

            const resultado =
              await respostaEmail
                .json()
                .catch(
                  () => null
                );


            console.error(
              "A proposta foi criada, mas o e-mail não pôde ser enviado:",
              resultado
            );

          }

          else {

            const resultado =
              await respostaEmail
                .json();


            if (
              resultado?.alreadySent
            ) {

              console.log(
                "E-mail da proposta já havia sido enviado."
              );

            }

            else {

              console.log(
                "E-mail de nova proposta enviado com sucesso."
              );

            }

          }

        }

        else {

          console.warn(
            "Proposta criada, mas não foi possível obter a sessão para o envio do e-mail."
          );

        }

      }

      catch (erroEmail) {

        /*
        MUITO IMPORTANTE:

        O e-mail é complementar.

        Uma falha da Brevo/API nunca deve fazer o
        usuário pensar que a proposta não foi criada.
        */

        console.error(
          "Proposta criada, mas houve falha no envio do e-mail:",
          erroEmail
        );

      }


      /* ==================================================
         DEPOIS DE CRIAR A PROPOSTA
         VAI PARA A PÁGINA PROPOSTAS
      ================================================== */

      router.push(
        "/propostas"
      );

    }

    catch (erro: unknown) {

      console.error(
        "Erro ao propor permuta:",
        erro
      );


      let mensagem =
        "Não foi possível enviar a proposta.";


      if (
        typeof erro ===
          "object"
        &&
        erro !== null
        &&
        "message" in erro
        &&
        typeof erro.message ===
          "string"
      ) {

        mensagem =
          erro.message;

      }


      alert(
        mensagem
      );

    }

    finally {

      setPropondo(
        null
      );

    }

  }


  /* ======================================================
     CARREGANDO
  ====================================================== */

  if (carregando) {

    return (

      <div className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-8
        text-center
      ">

        <div className="
          font-medium
          text-slate-400
        ">

          Buscando permutas diretas...

        </div>

      </div>

    );

  }


  /* ======================================================
     NENHUMA PERMUTA DIRETA
  ====================================================== */

  if (
    permutas.length === 0
  ) {

    return (

      <div className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-8
        text-center
      ">

        <Users
          size={40}
          className="
            mx-auto
            mb-3
            text-slate-500
          "
        />


        <h3 className="
          font-semibold
          text-white
        ">

          Nenhuma permuta direta encontrada

        </h3>


        <p className="
          mt-2
          text-sm
          text-slate-500
        ">

          Ainda não há servidor com interesse direto de troca com você.

        </p>

      </div>

    );

  }


  /* ======================================================
     RESULTADOS
  ====================================================== */

  return (

    <div className="space-y-5">

      {
        permutas
          .slice(0, 3)
          .map(
            (
              permuta,
              index
            ) => (

              <PermutaDiretaCard
                key={
                  permuta.candidato_id
                }

                permuta={
                  permuta
                }

                index={
                  index
                }

                nomeUsuario={
                  nomeUsuario
                }

                comarcaAtual={
                  comarcaAtual
                }

                propondo={
                  propondo ===
                  permuta.candidato_id
                }

                onPropor={() =>
                  proporPermuta(
                    permuta.candidato_id
                  )
                }
              />

            )
          )
      }

    </div>

  );

}


/* ======================================================
   CARD DA PERMUTA DIRETA
====================================================== */

function PermutaDiretaCard({
  permuta,
  index,
  nomeUsuario,
  comarcaAtual,
  propondo,
  onPropor
}: {
  permuta: PermutaDireta;
  index: number;
  nomeUsuario: string;
  comarcaAtual: string;
  propondo: boolean;
  onPropor: () => void;
}) {


  const medalha =

    index === 0

      ? "🥇"

      : index === 1

      ? "🥈"

      : "🥉";


  const titulo =

    index === 0

      ? "Melhor escolha"

      : index === 1

      ? "2ª melhor escolha"

      : "3ª melhor escolha";


  return (

    <div className="
      overflow-hidden
      rounded-2xl
      border
      border-slate-200
      bg-white
      shadow-sm
    ">


      {/* CABEÇALHO */}

      <div className="
        flex
        flex-wrap
        items-center
        justify-between
        gap-4
        border-b
        border-teal-300/10
        p-5
      ">


        <div className="
          flex
          items-center
          gap-3
        ">


          <div className="text-3xl">

            {medalha}

          </div>


          <div>

            <h3 className="
              text-xl
              font-bold
              text-white
            ">

              {titulo}

            </h3>


            <p className="
              mt-1
              text-sm
              text-slate-500
            ">

              Permuta direta entre 2 servidores

            </p>

          </div>

        </div>


        {/* BOTÃO PROPOR */}

        <button
          type="button"
          onClick={
            onPropor
          }
          disabled={
            propondo
          }
          className="
            rounded-xl
            border
            border-teal-300/20
            bg-teal-600
            px-4
            py-2
            text-sm
            font-semibold
            text-white
            transition-all
            duration-200
            hover:-translate-y-[1px]
            hover:bg-teal-500
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >

          {
            propondo
              ? "Enviando..."
              : "Propor permuta"
          }

        </button>

      </div>


      {/* FLUXO */}

      <div className="
        grid
        gap-5
        p-5
        lg:grid-cols-2
      ">


        {/* VOCÊ */}

        <ServidorDiretoCard
          titulo="Você"
          nome={
            nomeUsuario
          }
          origem={
            comarcaAtual
          }
          destino={
            permuta.comarca_origem
          }
          destaque
        />


        {/* OUTRO SERVIDOR */}

        <ServidorDiretoCard
          titulo="Outro servidor"
          nome={
            permuta.candidato_nome
          }
          origem={
            permuta.comarca_origem
          }
          destino={
            permuta.comarca_destino
          }
        />


      </div>


      {/* EXPLICAÇÃO */}

      <div className="
        border-t
        border-teal-300/10
        bg-[#081b29]
        px-5
        py-4
      ">

        <div className="
          flex
          flex-wrap
          items-center
          justify-center
          gap-2
          text-sm
          text-slate-400
        ">


          <span className="
            font-semibold
            text-white
          ">

            {nomeUsuario}

          </span>


          <span>
            vai para
          </span>


          <span className="
            font-semibold
            text-teal-300
          ">

            {permuta.comarca_origem}

          </span>


          <ArrowRight
            size={16}
            className="
              text-teal-400
            "
          />


          <span className="
            font-semibold
            text-white
          ">

            {permuta.candidato_nome}

          </span>


          <span>
            vai para
          </span>


          <span className="
            font-semibold
            text-teal-300
          ">

            {permuta.comarca_destino}

          </span>


        </div>

      </div>


    </div>

  );

}


/* ======================================================
   CARD DO SERVIDOR
====================================================== */

function ServidorDiretoCard({
  titulo,
  nome,
  origem,
  destino,
  destaque = false
}: {
  titulo: string;
  nome: string;
  origem: string;
  destino: string;
  destaque?: boolean;
}) {

  return (

    <div
      className={`
        rounded-2xl
        border
        p-5

        ${
          destaque

            ? "border-teal-300/25 bg-teal-400/[0.08]"

            : "border-teal-300/10 bg-[#081b29]"
        }
      `}
    >


      <div className="
        mb-4
        flex
        items-center
        justify-between
        gap-3
      ">


        <div>

          <div className="
            text-xs
            font-bold
            uppercase
            tracking-wide
            text-slate-500
          ">

            {titulo}

          </div>


          <div className="
            mt-1
            font-bold
            text-white
          ">

            {nome}

          </div>

        </div>


        {
          destaque && (

            <span className="
              rounded-full
              bg-teal-600
              px-2.5
              py-1
              text-xs
              font-bold
              text-white
            ">

              Você

            </span>

          )
        }


      </div>


      <div className="
        grid
        items-center
        gap-3
        md:grid-cols-[1fr_auto_1fr]
      ">


        <LocalDireto
          titulo="Local atual"
          nome={
            origem
          }
        />


        <ArrowRight
          size={22}
          className="
            mx-auto
            text-teal-400
          "
        />


        <LocalDireto
          titulo="Deseja ir para"
          nome={
            destino
          }
          destino
        />


      </div>


    </div>

  );

}


/* ======================================================
   LOCAL
====================================================== */

function LocalDireto({
  titulo,
  nome,
  destino = false
}: {
  titulo: string;
  nome: string;
  destino?: boolean;
}) {

  return (

    <div>


      <div
        className={`
          mb-2
          flex
          items-center
          gap-1.5
          text-xs
          font-bold
          uppercase
          tracking-wide

          ${
            destino

              ? "text-teal-300"

              : "text-slate-500"
          }
        `}
      >

        <MapPin
          size={14}
        />

        {titulo}

      </div>


      <div className="
        font-semibold
        leading-snug
        text-white
      ">

        {nome}

      </div>


    </div>

  );

}