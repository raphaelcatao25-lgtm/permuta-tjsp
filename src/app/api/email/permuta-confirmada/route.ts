import {
  NextRequest,
  NextResponse
} from "next/server";

import {
  createClient
} from "@supabase/supabase-js";


/* ======================================================
   CONFIGURAÇÕES
====================================================== */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY;

const BREVO_API_KEY =
  process.env.BREVO_API_KEY;


const SITE_URL =
  "https://permuta-tjsp.vercel.app";

const REMETENTE_EMAIL =
  "permutatjsp@gmail.com";

const REMETENTE_NOME =
  "Permuta TJSP";


/* ======================================================
   TIPOS
====================================================== */

interface CorpoRequisicao {
  solicitacaoId?: string;
}


interface Solicitacao {
  id: string;

  tipo: string;

  solicitante_id: string;

  participante_1: string;
  participante_2: string;
  participante_3?: string | null;

  status: string;
}


interface Perfil {
  id: string;
  nome: string;
  email: string | null;
}


interface Notificacao {
  id: string;

  usuario_id: string;

  tipo: string;

  solicitacao_id: string | null;

  email_enviado: boolean;

  email_enviado_em: string | null;

  email_erro: string | null;
}


/* ======================================================
   SUPABASE ADMIN
====================================================== */

function criarSupabaseAdmin() {

  if (
    !SUPABASE_URL ||
    !SUPABASE_SECRET_KEY
  ) {

    throw new Error(
      "Configuração do Supabase ausente no servidor."
    );

  }


  return createClient(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

}


/* ======================================================
   ESCAPA HTML
====================================================== */

function escaparHtml(
  valor: string
) {

  return valor
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


/* ======================================================
   TEMPLATE
====================================================== */

function montarEmailPermutaConfirmada({
  nomeDestinatario
}: {
  nomeDestinatario: string;
}) {

  const nome =
    escaparHtml(
      nomeDestinatario
    );


  return `
<table
  role="presentation"
  width="100%"
  cellspacing="0"
  cellpadding="0"
  border="0"
  style="
    margin:0;
    padding:0;
    background-color:#071725;
  "
>
  <tr>

    <td
      align="center"
      style="
        padding:32px 16px;
      "
    >

      <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="
          max-width:560px;
          background-color:#0d2232;
          border:1px solid #1f4b57;
          border-radius:16px;
        "
      >

        <!-- CABEÇALHO -->

        <tr>

          <td
            align="center"
            style="
              padding:28px 28px 20px 28px;
              border-bottom:1px solid #173845;
            "
          >

            <div
              style="
                font-size:28px;
                line-height:1;
                color:#5eead4;
                font-weight:bold;
                margin-bottom:12px;
              "
            >
              ⇄
            </div>


            <div
              style="
                color:#ffffff;
                font-size:22px;
                font-weight:bold;
              "
            >
              Permuta TJSP
            </div>


            <div
              style="
                margin-top:6px;
                color:#94a3b8;
                font-size:13px;
              "
            >
              Conectando servidores
            </div>

          </td>

        </tr>


        <!-- CONTEÚDO -->

        <tr>

          <td
            style="
              padding:30px 28px;
            "
          >

            <div
              style="
                color:#ffffff;
                font-size:22px;
                font-weight:bold;
                margin-bottom:18px;
              "
            >
              Permuta confirmada
            </div>


            <div
              style="
                color:#cbd5e1;
                font-size:15px;
                line-height:1.7;
                margin-bottom:16px;
              "
            >
              Olá, ${nome}.
            </div>


            <div
              style="
                color:#cbd5e1;
                font-size:15px;
                line-height:1.7;
                margin-bottom:16px;
              "
            >
              Sua permuta foi
              <strong
                style="
                  color:#5eead4;
                "
              >
                confirmada
              </strong>.
            </div>


            <div
              style="
                color:#cbd5e1;
                font-size:15px;
                line-height:1.7;
                margin-bottom:26px;
              "
            >
              Todos os participantes aceitaram a proposta.
              Os dados de contato dos demais participantes
              já estão disponíveis na plataforma.
            </div>


            <!-- BOTÃO -->

            <table
              role="presentation"
              cellspacing="0"
              cellpadding="0"
              border="0"
              align="center"
            >

              <tr>

                <td
                  bgcolor="#14b8a6"
                  style="
                    border-radius:10px;
                  "
                >

                  <a
                    href="${SITE_URL}/propostas"
                    style="
                      display:inline-block;
                      padding:14px 24px;
                      color:#ffffff;
                      text-decoration:none;
                      font-size:15px;
                      font-weight:bold;
                    "
                  >
                    Ver permuta
                  </a>

                </td>

              </tr>

            </table>


            <!-- AVISO -->

            <div
              style="
                margin-top:28px;
                padding:14px 16px;
                background-color:#081b29;
                border:1px solid #173845;
                border-radius:10px;
                color:#94a3b8;
                font-size:13px;
                line-height:1.6;
              "
            >
              Entre em contato com os demais participantes
              para dar continuidade aos procedimentos
              necessários.

              <br><br>

              Nenhuma movimentação funcional é realizada
              automaticamente pelo Permuta TJSP.
            </div>

          </td>

        </tr>


        <!-- RODAPÉ -->

        <tr>

          <td
            align="center"
            style="
              padding:18px 24px;
              background-color:#081b29;
              border-top:1px solid #173845;
              color:#64748b;
              font-size:11px;
              line-height:1.6;
            "
          >

            Permuta TJSP é uma plataforma independente
            para auxiliar servidores na busca por
            oportunidades de permuta.

            <br><br>

            Esta plataforma não representa um canal oficial
            do Tribunal de Justiça de São Paulo.

          </td>

        </tr>

      </table>

    </td>

  </tr>

</table>
  `;

}


/* ======================================================
   POST
====================================================== */

export async function POST(
  request: NextRequest
) {

  try {

    /* ==================================================
       CONFIGURAÇÕES
    ================================================== */

    if (!BREVO_API_KEY) {

      throw new Error(
        "BREVO_API_KEY não configurada."
      );

    }


    const supabaseAdmin =
      criarSupabaseAdmin();


    /* ==================================================
       AUTENTICAÇÃO
    ================================================== */

    const authorization =
      request.headers.get(
        "authorization"
      );


    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer "
      )
    ) {

      return NextResponse.json(
        {
          error:
            "Usuário não autenticado."
        },
        {
          status: 401
        }
      );

    }


    const accessToken =
      authorization
        .slice(
          "Bearer ".length
        )
        .trim();


    const {
      data: dadosUsuario,
      error: erroUsuario
    } =
      await supabaseAdmin.auth.getUser(
        accessToken
      );


    if (
      erroUsuario ||
      !dadosUsuario.user
    ) {

      return NextResponse.json(
        {
          error:
            "Sessão inválida ou expirada."
        },
        {
          status: 401
        }
      );

    }


    const usuarioId =
      dadosUsuario.user.id;


    /* ==================================================
       CORPO
    ================================================== */

    const corpo =
      (
        await request.json()
      ) as CorpoRequisicao;


    const solicitacaoId =
      corpo.solicitacaoId?.trim();


    if (!solicitacaoId) {

      return NextResponse.json(
        {
          error:
            "Solicitação não informada."
        },
        {
          status: 400
        }
      );

    }


    /* ==================================================
       BUSCA A SOLICITAÇÃO
    ================================================== */

    const {
      data: dadosSolicitacao,
      error: erroSolicitacao
    } =
      await supabaseAdmin
        .from(
          "solicitacoes_permuta"
        )
        .select(`
          id,
          tipo,
          solicitante_id,
          participante_1,
          participante_2,
          participante_3,
          status
        `)
        .eq(
          "id",
          solicitacaoId
        )
        .single();


    if (
      erroSolicitacao ||
      !dadosSolicitacao
    ) {

      return NextResponse.json(
        {
          error:
            "Solicitação não encontrada."
        },
        {
          status: 404
        }
      );

    }


    const solicitacao =
      dadosSolicitacao as Solicitacao;


    /* ==================================================
       CONFIRMA QUE QUEM CHAMOU PARTICIPA DA PERMUTA
    ================================================== */

    const participantes = [
      solicitacao.participante_1,
      solicitacao.participante_2,
      solicitacao.participante_3
    ].filter(
      (
        id
      ): id is string =>
        Boolean(id)
    );


    if (
      !participantes.includes(
        usuarioId
      )
    ) {

      return NextResponse.json(
        {
          error:
            "Usuário não pertence a esta permuta."
        },
        {
          status: 403
        }
      );

    }


    /* ==================================================
       SOMENTE ENVIA SE REALMENTE ESTIVER CONFIRMADA

       Isso também permite chamar este endpoint após
       aceites intermediários de um ciclo de 3 sem
       enviar e-mail antes da hora.
    ================================================== */

    if (
      solicitacao.status !==
      "confirmado"
    ) {

      return NextResponse.json(
        {
          ok: true,
          confirmado: false,
          enviados: 0
        }
      );

    }


    /* ==================================================
       NOTIFICAÇÕES DE CONFIRMAÇÃO

       Essa é nossa fonte de verdade.
    ================================================== */

    const {
      data: dadosNotificacoes,
      error: erroNotificacoes
    } =
      await supabaseAdmin
        .from(
          "notificacoes"
        )
        .select(`
          id,
          usuario_id,
          tipo,
          solicitacao_id,
          email_enviado,
          email_enviado_em,
          email_erro
        `)
        .eq(
          "solicitacao_id",
          solicitacaoId
        )
        .eq(
          "tipo",
          "permuta_confirmada"
        );


    if (erroNotificacoes) {

      throw new Error(
        "Não foi possível localizar as notificações de confirmação."
      );

    }


    const notificacoes =
      (
        dadosNotificacoes ??
        []
      ) as Notificacao[];


    if (
      notificacoes.length === 0
    ) {

      return NextResponse.json(
        {
          ok: true,
          confirmado: true,
          enviados: 0,
          aviso:
            "Nenhuma notificação de confirmação encontrada."
        }
      );

    }


    /* ==================================================
       PERFIS DOS DESTINATÁRIOS
    ================================================== */

    const usuariosNotificados = [
      ...new Set(
        notificacoes.map(
          notificacao =>
            notificacao.usuario_id
        )
      )
    ];


    const {
      data: dadosPerfis,
      error: erroPerfis
    } =
      await supabaseAdmin
        .from(
          "perfis"
        )
        .select(
          "id, nome, email"
        )
        .in(
          "id",
          usuariosNotificados
        );


    if (erroPerfis) {

      throw new Error(
        "Não foi possível localizar os perfis dos participantes."
      );

    }


    const perfis =
      (
        dadosPerfis ??
        []
      ) as Perfil[];


    const mapaPerfis =
      new Map<
        string,
        Perfil
      >();


    perfis.forEach(
      perfil => {

        mapaPerfis.set(
          perfil.id,
          perfil
        );

      }
    );


    /* ==================================================
       ENVIA UMA NOTIFICAÇÃO POR VEZ

       Assim conseguimos registrar sucesso ou erro
       individualmente para cada participante.
    ================================================== */

    let enviados =
      0;

    let jaEnviados =
      0;

    let falhas =
      0;


    for (
      const notificacao
      of notificacoes
    ) {

      /* ================================================
         EVITA DUPLICIDADE
      ================================================ */

      if (
        notificacao.email_enviado
      ) {

        jaEnviados +=
          1;

        continue;

      }


      const perfil =
        mapaPerfis.get(
          notificacao.usuario_id
        );


      /* ================================================
         PERFIL NÃO ENCONTRADO
      ================================================ */

      if (!perfil) {

        const mensagemErro =
          "Perfil do destinatário não encontrado.";


        await supabaseAdmin
          .from(
            "notificacoes"
          )
          .update({
            email_enviado:
              false,

            email_enviado_em:
              null,

            email_erro:
              mensagemErro
          })
          .eq(
            "id",
            notificacao.id
          );


        falhas +=
          1;

        continue;

      }


      /* ================================================
         SEM E-MAIL
      ================================================ */

      if (
        !perfil.email ||
        !perfil.email.trim()
      ) {

        const mensagemErro =
          "O destinatário não possui e-mail cadastrado.";


        await supabaseAdmin
          .from(
            "notificacoes"
          )
          .update({
            email_enviado:
              false,

            email_enviado_em:
              null,

            email_erro:
              mensagemErro
          })
          .eq(
            "id",
            notificacao.id
          );


        falhas +=
          1;

        continue;

      }


      /* ================================================
         HTML
      ================================================ */

      const htmlContent =
        montarEmailPermutaConfirmada({
          nomeDestinatario:
            perfil.nome
        });


      try {

        /* ==============================================
           BREVO
        ============================================== */

        const respostaBrevo =
          await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
              method:
                "POST",

              headers: {
                accept:
                  "application/json",

                "content-type":
                  "application/json",

                "api-key":
                  BREVO_API_KEY
              },

              body:
                JSON.stringify({
                  sender: {
                    name:
                      REMETENTE_NOME,

                    email:
                      REMETENTE_EMAIL
                  },

                  to: [
                    {
                      email:
                        perfil.email,

                      name:
                        perfil.nome
                    }
                  ],

                  subject:
                    "Permuta confirmada | Permuta TJSP",

                  htmlContent
                })
            }
          );


        if (
          !respostaBrevo.ok
        ) {

          const textoErro =
            await respostaBrevo.text();


          throw new Error(
            `Brevo ${respostaBrevo.status}: ${textoErro}`
          );

        }


        /* ==============================================
           SUCESSO
        ============================================== */

        const {
          error: erroAtualizacao
        } =
          await supabaseAdmin
            .from(
              "notificacoes"
            )
            .update({
              email_enviado:
                true,

              email_enviado_em:
                new Date()
                  .toISOString(),

              email_erro:
                null
            })
            .eq(
              "id",
              notificacao.id
            );


        if (erroAtualizacao) {

          console.error(
            "E-mail enviado, mas houve erro ao atualizar a notificação:",
            erroAtualizacao
          );

        }


        enviados +=
          1;

      }

      catch(erroEnvio) {

        const mensagemErro =
          erroEnvio instanceof Error
            ? erroEnvio.message
            : "Erro desconhecido ao enviar o e-mail.";


        console.error(
          "Erro ao enviar confirmação para:",
          perfil.email,
          erroEnvio
        );


        await supabaseAdmin
          .from(
            "notificacoes"
          )
          .update({
            email_enviado:
              false,

            email_enviado_em:
              null,

            email_erro:
              mensagemErro.slice(
                0,
                2000
              )
          })
          .eq(
            "id",
            notificacao.id
          );


        falhas +=
          1;

      }

    }


    /* ==================================================
       RESULTADO
    ================================================== */

    return NextResponse.json(
      {
        ok: true,

        confirmado: true,

        enviados,

        jaEnviados,

        falhas
      }
    );

  }

  catch(error) {

    console.error(
      "Erro no envio dos e-mails de permuta confirmada:",
      error
    );


    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido.";


    return NextResponse.json(
      {
        ok: false,
        error:
          mensagem
      },
      {
        status: 500
      }
    );

  }

}