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
  candidatoId?: string;
}


interface SolicitacaoPermuta {
  id: string;

  tipo: string;

  solicitante_id: string;

  participante_1: string;
  participante_2: string;
  participante_3?: string | null;

  status: string;

  created_at: string;
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
   CLIENTE ADMINISTRATIVO DO SUPABASE
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
   ESCAPAR HTML
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
   TEMPLATE DO E-MAIL
====================================================== */

function montarEmailNovaProposta({
  nomeDestinatario,
  nomeSolicitante
}: {
  nomeDestinatario: string;
  nomeSolicitante: string;
}) {

  const destinatario =
    escaparHtml(
      nomeDestinatario
    );

  const solicitante =
    escaparHtml(
      nomeSolicitante
    );


  return `
<table
  role="presentation"
  width="100%"
  cellspacing="0"
  cellpadding="0"
  border="0"
  style="margin:0; padding:0; background-color:#071725;"
>
  <tr>
    <td
      align="center"
      style="padding:32px 16px;"
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
              Nova proposta de permuta
            </div>


            <div
              style="
                color:#cbd5e1;
                font-size:15px;
                line-height:1.7;
                margin-bottom:16px;
              "
            >
              Olá, ${destinatario}.
            </div>


            <div
              style="
                color:#cbd5e1;
                font-size:15px;
                line-height:1.7;
                margin-bottom:16px;
              "
            >
              Você recebeu uma nova proposta de
              <strong
                style="color:#ffffff;"
              >
                permuta direta
              </strong>
              de
              <strong
                style="color:#ffffff;"
              >
                ${solicitante}
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
              Acesse a página de propostas para analisar
              os detalhes e decidir se deseja aceitar.
            </div>


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
                    Ver proposta
                  </a>

                </td>

              </tr>
            </table>


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
              Nenhuma permuta é realizada automaticamente.
              A proposta somente avançará conforme os
              participantes registrarem seus aceites na
              plataforma.
            </div>

          </td>
        </tr>


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

            Esta plataforma não representa um canal
            oficial do Tribunal de Justiça de São Paulo.

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

  let notificacaoId:
    string | null = null;


  try {

    /* ==================================================
       VARIÁVEIS DO SERVIDOR
    ================================================== */

    if (!BREVO_API_KEY) {

      throw new Error(
        "BREVO_API_KEY não configurada."
      );

    }


    const supabaseAdmin =
      criarSupabaseAdmin();


    /* ==================================================
       TOKEN DO USUÁRIO
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


    /* ==================================================
       VALIDA O JWT
    ================================================== */

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
       CORPO DA REQUISIÇÃO
    ================================================== */

    const corpo =
      (
        await request.json()
      ) as CorpoRequisicao;


    const candidatoId =
      corpo.candidatoId?.trim();


    if (!candidatoId) {

      return NextResponse.json(
        {
          error:
            "Candidato não informado."
        },
        {
          status: 400
        }
      );

    }


    if (
      candidatoId ===
      usuarioId
    ) {

      return NextResponse.json(
        {
          error:
            "Participante inválido."
        },
        {
          status: 400
        }
      );

    }


    /* ==================================================
       LOCALIZA A PROPOSTA
    ================================================== */

    const {
      data: solicitacoes,
      error: erroSolicitacoes
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
          status,
          created_at
        `)
        .eq(
          "solicitante_id",
          usuarioId
        )
        .eq(
          "tipo",
          "direta"
        )
        .eq(
          "status",
          "aguardando_aceite"
        )
        .or(
          `participante_1.eq.${candidatoId},participante_2.eq.${candidatoId},participante_3.eq.${candidatoId}`
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(1);


    if (erroSolicitacoes) {

      console.error(
        "Erro ao localizar solicitação:",
        erroSolicitacoes
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível localizar a proposta."
        },
        {
          status: 500
        }
      );

    }


    if (
      !solicitacoes ||
      solicitacoes.length === 0
    ) {

      return NextResponse.json(
        {
          error:
            "Proposta não encontrada."
        },
        {
          status: 404
        }
      );

    }


    const solicitacao =
      solicitacoes[0] as SolicitacaoPermuta;


    /* ==================================================
       VALIDA PARTICIPAÇÃO
    ================================================== */

    const participanteValido =
      solicitacao.participante_1 ===
        candidatoId
      ||
      solicitacao.participante_2 ===
        candidatoId
      ||
      solicitacao.participante_3 ===
        candidatoId;


    if (!participanteValido) {

      return NextResponse.json(
        {
          error:
            "Participante não pertence à proposta."
        },
        {
          status: 403
        }
      );

    }


    /* ==================================================
       LOCALIZA A NOTIFICAÇÃO
    ================================================== */

    const {
      data: notificacao,
      error: erroNotificacao
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
          "usuario_id",
          candidatoId
        )
        .eq(
          "solicitacao_id",
          solicitacao.id
        )
        .eq(
          "tipo",
          "nova_proposta"
        )
        .maybeSingle();


    if (erroNotificacao) {

      console.error(
        "Erro ao localizar notificação:",
        erroNotificacao
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível localizar a notificação."
        },
        {
          status: 500
        }
      );

    }


    if (!notificacao) {

      return NextResponse.json(
        {
          error:
            "Notificação de nova proposta não encontrada."
        },
        {
          status: 404
        }
      );

    }


    const notificacaoAtual =
      notificacao as Notificacao;


    notificacaoId =
      notificacaoAtual.id;


    /* ==================================================
       EVITA DUPLICIDADE
    ================================================== */

    if (
      notificacaoAtual.email_enviado
    ) {

      return NextResponse.json(
        {
          ok: true,
          alreadySent: true
        }
      );

    }


    /* ==================================================
       PERFIL DO DESTINATÁRIO
    ================================================== */

    const {
      data: perfilDestinatario,
      error: erroPerfilDestinatario
    } =
      await supabaseAdmin
        .from(
          "perfis"
        )
        .select(
          "id, nome, email"
        )
        .eq(
          "id",
          candidatoId
        )
        .single();


    if (
      erroPerfilDestinatario ||
      !perfilDestinatario
    ) {

      throw new Error(
        "Perfil do destinatário não encontrado."
      );

    }


    const destinatario =
      perfilDestinatario as Perfil;


    if (
      !destinatario.email ||
      !destinatario.email.trim()
    ) {

      throw new Error(
        "O destinatário não possui e-mail cadastrado."
      );

    }


    /* ==================================================
       PERFIL DO SOLICITANTE
    ================================================== */

    const {
      data: perfilSolicitante,
      error: erroPerfilSolicitante
    } =
      await supabaseAdmin
        .from(
          "perfis"
        )
        .select(
          "id, nome, email"
        )
        .eq(
          "id",
          usuarioId
        )
        .single();


    if (
      erroPerfilSolicitante ||
      !perfilSolicitante
    ) {

      throw new Error(
        "Perfil do solicitante não encontrado."
      );

    }


    const solicitante =
      perfilSolicitante as Perfil;


    /* ==================================================
       MONTA O HTML
    ================================================== */

    const htmlContent =
      montarEmailNovaProposta({
        nomeDestinatario:
          destinatario.nome,

        nomeSolicitante:
          solicitante.nome
      });


    /* ==================================================
       ENVIA PELA BREVO
    ================================================== */

    const respostaBrevo =
      await fetch(
        "https://api.brevo.com/v3/smtp/email",
        {
          method: "POST",

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
                    destinatario.email,

                  name:
                    destinatario.nome
                }
              ],

              subject:
                "Nova proposta de permuta | Permuta TJSP",

              htmlContent
            })
        }
      );


    /* ==================================================
       ERRO DA BREVO
    ================================================== */

    if (
      !respostaBrevo.ok
    ) {

      const textoErro =
        await respostaBrevo.text();


      throw new Error(
        `Brevo ${respostaBrevo.status}: ${textoErro}`
      );

    }


    /* ==================================================
       MARCA COMO ENVIADO
    ================================================== */

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
          notificacaoAtual.id
        );


    if (erroAtualizacao) {

      console.error(
        "E-mail enviado, mas não foi possível atualizar a notificação:",
        erroAtualizacao
      );

    }


    return NextResponse.json(
      {
        ok: true
      }
    );

  }

  catch(error) {

    console.error(
      "Erro no envio de e-mail de nova proposta:",
      error
    );


    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao enviar e-mail.";


    /* ==================================================
       REGISTRA O ERRO
    ================================================== */

    if (
      notificacaoId &&
      SUPABASE_URL &&
      SUPABASE_SECRET_KEY
    ) {

      try {

        const supabaseAdmin =
          criarSupabaseAdmin();


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
              mensagem.slice(
                0,
                2000
              )
          })
          .eq(
            "id",
            notificacaoId
          );

      }

      catch(erroRegistro) {

        console.error(
          "Erro ao registrar falha do e-mail:",
          erroRegistro
        );

      }

    }


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