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
  Send,
  Users,
  X
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

const MENSAGEM_PADRAO =
  "Olá! Encontrei uma possibilidade de permuta pelo Permuta TJSP e gostaria de verificar se você tem interesse em seguir com essa combinação. Se quiser, podemos conversar para alinhar os detalhes.";


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

  const [
    candidatoModal,
    setCandidatoModal
  ] = useState<PermutaDireta | null>(
    null
  );

  const [
    mensagemProposta,
    setMensagemProposta
  ] = useState(
    MENSAGEM_PADRAO
  );

  const [
    erroModal,
    setErroModal
  ] = useState("");


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


      const diretasRecebidas =
        (data ?? []) as PermutaDireta[];


      /* ==================================================
         REMOVE OPORTUNIDADES QUE JÁ POSSUEM PROPOSTA ATIVA
         ================================================== */

      const idsComPropostaAtiva =
        new Set<string>();


      const {
        data: solicitacoesAtivas,
        error: erroSolicitacoesAtivas
      } = await supabase
        .from("solicitacoes_permuta")
        .select(`
          participante_1,
          participante_2,
          participante_3,
          status
        `)
        .or(
          `participante_1.eq.${usuarioId},participante_2.eq.${usuarioId},participante_3.eq.${usuarioId}`
        )
        .in(
          "status",
          [
            "aguardando_aceite",
            "confirmado"
          ]
        );


      if (erroSolicitacoesAtivas) {

        console.error(
          "Erro ao verificar propostas automáticas existentes:",
          erroSolicitacoesAtivas
        );

      }


      (
        solicitacoesAtivas ?? []
      ).forEach(
        solicitacao => {

          const participantes = [
            solicitacao.participante_1,
            solicitacao.participante_2,
            solicitacao.participante_3
          ].filter(
            (id): id is string =>
              Boolean(id)
          );


          if (
            participantes.length === 2 &&
            participantes.includes(usuarioId)
          ) {

            participantes
              .filter(id => id !== usuarioId)
              .forEach(id =>
                idsComPropostaAtiva.add(id)
              );

          }

        }
      );


      const {
        data: participacoesManuais,
        error: erroParticipacoesManuais
      } = await supabase
        .from("ciclos_manuais_participantes")
        .select("ciclo_id")
        .eq(
          "usuario_id",
          usuarioId
        );


      if (erroParticipacoesManuais) {

        console.error(
          "Erro ao verificar participações manuais:",
          erroParticipacoesManuais
        );

      }


      const idsCiclosManuais =
        [
          ...new Set(
            (
              participacoesManuais ?? []
            ).map(
              item => item.ciclo_id
            )
          )
        ];


      if (
        idsCiclosManuais.length > 0
      ) {

        const {
          data: ciclosManuaisAtivos,
          error: erroCiclosManuaisAtivos
        } = await supabase
          .from("ciclos_manuais")
          .select(`
            id,
            quantidade_participantes,
            status
          `)
          .in(
            "id",
            idsCiclosManuais
          )
          .eq(
            "quantidade_participantes",
            2
          )
          .in(
            "status",
            [
              "aguardando_aceite",
              "confirmado"
            ]
          );


        if (erroCiclosManuaisAtivos) {

          console.error(
            "Erro ao verificar ciclos manuais ativos:",
            erroCiclosManuaisAtivos
          );

        }


        const idsDiretasManuais =
          (
            ciclosManuaisAtivos ?? []
          ).map(
            item => item.id
          );


        if (
          idsDiretasManuais.length > 0
        ) {

          const {
            data: participantesDiretasManuais,
            error: erroParticipantesDiretasManuais
          } = await supabase
            .from("ciclos_manuais_participantes")
            .select(`
              ciclo_id,
              usuario_id
            `)
            .in(
              "ciclo_id",
              idsDiretasManuais
            );


          if (erroParticipantesDiretasManuais) {

            console.error(
              "Erro ao verificar participantes das propostas manuais:",
              erroParticipantesDiretasManuais
            );

          }


          const porCiclo =
            new Map<string, string[]>();


          (
            participantesDiretasManuais ?? []
          ).forEach(
            item => {

              const atual =
                porCiclo.get(
                  item.ciclo_id
                )
                ?? [];

              atual.push(
                item.usuario_id
              );

              porCiclo.set(
                item.ciclo_id,
                atual
              );

            }
          );


          porCiclo.forEach(
            participantes => {

              if (
                participantes.length === 2 &&
                participantes.includes(usuarioId)
              ) {

                participantes
                  .filter(id => id !== usuarioId)
                  .forEach(id =>
                    idsComPropostaAtiva.add(id)
                  );

              }

            }
          );

        }

      }


      setPermutas(
        diretasRecebidas.filter(
          permuta =>
            !idsComPropostaAtiva.has(
              permuta.candidato_id
            )
        )
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
    candidatoId: string,
    mensagem: string
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
        "solicitar_permuta_direta_v2",
        {
          p_candidato_id:
            candidatoId,

          p_usuario_id:
            usuarioId,

          p_mensagem:
            mensagem
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

      setCandidatoModal(
        null
      );

      setMensagemProposta(
        MENSAGEM_PADRAO
      );

      setErroModal("");

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


      if (candidatoModal) {

        setErroModal(
          mensagem
        );

      }

      else {

        alert(
          mensagem
        );

      }

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

                onPropor={() => {
                  setErroModal("");
                  setMensagemProposta(MENSAGEM_PADRAO);
                  setCandidatoModal(permuta);
                }}
              />

            )
          )
      }

      {
        candidatoModal && (

          <ModalMensagemProposta
            titulo="Enviar proposta de permuta direta"
            descricao={`A proposta será enviada para ${candidatoModal.candidato_nome}. Você pode complementar, modificar ou substituir a mensagem abaixo.`}
            mensagem={mensagemProposta}
            enviando={propondo === candidatoModal.candidato_id}
            erro={erroModal}
            onMensagemChange={setMensagemProposta}
            onFechar={() => {
              if (propondo) return;
              setCandidatoModal(null);
              setErroModal("");
            }}
            onEnviar={() => {
              const mensagem = mensagemProposta.trim();

              if (!mensagem) {
                setErroModal("Digite uma mensagem para acompanhar a proposta.");
                return;
              }

              setErroModal("");

              void proporPermuta(
                candidatoModal.candidato_id,
                mensagem
              );
            }}
          />

        )
      }

    </div>

  );

}


function ModalMensagemProposta({
  titulo,
  descricao,
  mensagem,
  enviando,
  erro,
  onMensagemChange,
  onFechar,
  onEnviar
}: {
  titulo: string;
  descricao: string;
  mensagem: string;
  enviando: boolean;
  erro: string;
  onMensagemChange: (valor: string) => void;
  onFechar: () => void;
  onEnviar: () => void;
}) {

  return (

    <div className="
      fixed
      inset-0
      z-[100]
      flex
      items-center
      justify-center
      bg-black/70
      p-4
    ">

      <div className="
        w-full
        max-w-xl
        overflow-hidden
        rounded-2xl
        border
        border-teal-300/15
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
          bg-[#0a1f2f]
          p-5
        ">

          <div>
            <h3 className="text-lg font-bold text-white">
              {titulo}
            </h3>

            <p className="mt-1 text-sm leading-5 text-slate-400">
              {descricao}
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            disabled={enviando}
            className="
              rounded-lg
              p-2
              text-slate-400
              transition
              hover:bg-white/5
              hover:text-white
              disabled:opacity-50
            "
            aria-label="Fechar"
          >
            <X size={18} />
          </button>

        </div>

        <div className="p-5">

          <label className="
            mb-2
            block
            text-sm
            font-semibold
            text-slate-300
          ">
            Mensagem para o outro servidor
          </label>

          <textarea
            value={mensagem}
            onChange={event =>
              onMensagemChange(
                event.target.value
              )
            }
            maxLength={1000}
            rows={6}
            className="
              w-full
              resize-y
              rounded-xl
              border
              border-teal-300/15
              bg-[#081b29]
              px-4
              py-3
              text-sm
              leading-6
              text-white
              outline-none
              transition
              placeholder:text-slate-600
              focus:border-teal-300/40
              focus:ring-4
              focus:ring-teal-300/10
            "
          />

          <div className="
            mt-2
            flex
            items-center
            justify-between
            gap-3
            text-xs
            text-slate-500
          ">
            <span>
              A mensagem já vem preenchida, mas pode ser alterada livremente.
            </span>

            <span>
              {mensagem.length}/1000
            </span>
          </div>

          {
            erro && (

              <div className="
                mt-4
                rounded-xl
                border
                border-red-400/20
                bg-red-400/10
                p-3
                text-sm
                text-red-300
              ">
                {erro}
              </div>

            )
          }

          <div className="
            mt-5
            flex
            flex-col-reverse
            gap-3
            sm:flex-row
            sm:justify-end
          ">

            <button
              type="button"
              onClick={onFechar}
              disabled={enviando}
              className="
                rounded-xl
                border
                border-slate-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-slate-300
                transition
                hover:bg-white/5
                disabled:opacity-50
              "
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onEnviar}
              disabled={enviando || !mensagem.trim()}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-teal-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-teal-500
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Send size={16} />

              {
                enviando
                  ? "Enviando..."
                  : "Enviar proposta"
              }
            </button>

          </div>

        </div>

      </div>

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