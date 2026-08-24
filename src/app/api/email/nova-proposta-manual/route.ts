import {
  NextRequest,
  NextResponse
} from "next/server";

import {
  createClient
} from "@supabase/supabase-js";


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


interface CorpoRequisicao {
  cicloId?: string;
}

interface CicloManual {
  id: string;
  criado_por: string;
  tipo: string;
  quantidade_participantes: number;
  status: string;
  mensagem: string | null;
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
  ciclo_manual_id: string | null;
  email_enviado: boolean | null;
  email_enviado_em: string | null;
  email_erro: string | null;
}


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


function escaparHtml(
  valor: string
) {

  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function montarEmailNovaPropostaManual({
  nomeDestinatario,
  nomeSolicitante,
  tipo,
  quantidadeParticipantes
}: {
  nomeDestinatario: string;
  nomeSolicitante: string;
  tipo: string;
  quantidadeParticipantes: number;
}) {

  const destinatario =
    escaparHtml(
      nomeDestinatario
    );

  const solicitante =
    escaparHtml(
      nomeSolicitante
    );

  const emCadeia =
    tipo !== "direta";

  const descricao =
    emCadeia
      ? `uma proposta de permuta em cadeia com ${quantidadeParticipantes} participantes`
      : "uma proposta de permuta direta";


  return `
<table
  role="presentation"
  width="100%"
  cellspacing="0"
  cellpadding="0"
  border="0"
  style="margin:0;padding:0;background-color:#071725;"
>
  <tr>
    <td align="center" style="padding:32px 16px;">

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
          <td style="padding:30px 28px;">

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
              <strong style="color:#ffffff;">${solicitante}</strong>
              encontrou ${descricao} pelo Permuta TJSP.
            </div>

            <div
              style="
                color:#cbd5e1;
                font-size:15px;
                line-height:1.7;
                margin-bottom:26px;
              "
            >
              Acesse a página de propostas para conferir a movimentação
              sugerida e registrar sua resposta.
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
                  style="border-radius:10px;"
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
              A proposta só avança quando os participantes registram
              seus aceites na plataforma.
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
            Permuta TJSP é uma plataforma independente para auxiliar
            servidores na busca por oportunidades de permuta.

            <br><br>

            Esta plataforma não representa um canal oficial do
            Tribunal de Justiça de São Paulo.
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
  `;

}


async function registrarErroNotificacao(
  supabaseAdmin: ReturnType<typeof criarSupabaseAdmin>,
  notificacaoId: string,
  mensagem: string
) {

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


export async function POST(
  request: NextRequest
) {

  try {

    if (!BREVO_API_KEY) {

      throw new Error(
        "BREVO_API_KEY não configurada."
      );

    }


    const supabaseAdmin =
      criarSupabaseAdmin();


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


    const corpo =
      (
        await request.json()
      ) as CorpoRequisicao;


    const cicloId =
      corpo.cicloId?.trim();


    if (!cicloId) {

      return NextResponse.json(
        {
          error:
            "Ciclo não informado."
        },
        {
          status: 400
        }
      );

    }


    const {
      data: dadosCiclo,
      error: erroCiclo
    } =
      await supabaseAdmin
        .from(
          "ciclos_manuais"
        )
        .select(`
          id,
          criado_por,
          tipo,
          quantidade_participantes,
          status,
          mensagem
        `)
        .eq(
          "id",
          cicloId
        )
        .single();


    if (
      erroCiclo ||
      !dadosCiclo
    ) {

      return NextResponse.json(
        {
          error:
            "Permuta manual não encontrada."
        },
        {
          status: 404
        }
      );

    }


    const ciclo =
      dadosCiclo as CicloManual;


    if (
      ciclo.criado_por !==
      usuarioId
    ) {

      return NextResponse.json(
        {
          error:
            "Somente o criador da proposta pode iniciar este envio."
        },
        {
          status: 403
        }
      );

    }


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
          ciclo_manual_id,
          email_enviado,
          email_enviado_em,
          email_erro
        `)
        .eq(
          "ciclo_manual_id",
          cicloId
        )
        .in(
          "tipo",
          [
            "nova_proposta_manual_direta",
            "nova_proposta_manual_ciclo"
          ]
        );


    if (erroNotificacoes) {

      throw new Error(
        "Não foi possível localizar as notificações da proposta manual."
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
          enviados: 0,
          jaEnviados: 0,
          falhas: 0,
          aviso:
            "Nenhuma notificação de nova proposta manual encontrada."
        }
      );

    }


    const usuariosNotificados = [
      ...new Set(
        notificacoes.map(
          notificacao =>
            notificacao.usuario_id
        )
      )
    ];


    const idsPerfis = [
      ...new Set([
        usuarioId,
        ...usuariosNotificados
      ])
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
          idsPerfis
        );


    if (erroPerfis) {

      throw new Error(
        "Não foi possível localizar os perfis envolvidos."
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


    const criador =
      mapaPerfis.get(
        usuarioId
      );


    if (!criador) {

      throw new Error(
        "Perfil do criador da proposta não encontrado."
      );

    }


    let enviados = 0;
    let jaEnviados = 0;
    let falhas = 0;


    for (
      const notificacao
      of notificacoes
    ) {

      if (
        notificacao.email_enviado
      ) {

        jaEnviados += 1;
        continue;

      }


      const destinatario =
        mapaPerfis.get(
          notificacao.usuario_id
        );


      if (!destinatario) {

        await registrarErroNotificacao(
          supabaseAdmin,
          notificacao.id,
          "Perfil do destinatário não encontrado."
        );

        falhas += 1;
        continue;

      }


      if (
        !destinatario.email ||
        !destinatario.email.trim()
      ) {

        await registrarErroNotificacao(
          supabaseAdmin,
          notificacao.id,
          "O destinatário não possui e-mail cadastrado."
        );

        falhas += 1;
        continue;

      }


      try {

        const htmlContent =
          montarEmailNovaPropostaManual({
            nomeDestinatario:
              destinatario.nome,

            nomeSolicitante:
              criador.nome,

            tipo:
              ciclo.tipo,

            quantidadeParticipantes:
              ciclo.quantidade_participantes
          });


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
                        destinatario.email,

                      name:
                        destinatario.nome
                    }
                  ],

                  subject:
                    ciclo.tipo === "direta"
                      ? "Nova proposta de permuta direta | Permuta TJSP"
                      : "Nova proposta de permuta em cadeia | Permuta TJSP",

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


        enviados += 1;

      }

      catch(erroEnvio) {

        const mensagemErro =
          erroEnvio instanceof Error
            ? erroEnvio.message
            : "Erro desconhecido ao enviar e-mail.";


        console.error(
          "Erro ao enviar nova proposta manual para:",
          destinatario.email,
          erroEnvio
        );


        await registrarErroNotificacao(
          supabaseAdmin,
          notificacao.id,
          mensagemErro
        );


        falhas += 1;

      }

    }


    return NextResponse.json(
      {
        ok: true,
        enviados,
        jaEnviados,
        falhas
      }
    );

  }

  catch(error) {

    console.error(
      "Erro no envio dos e-mails de nova proposta manual:",
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