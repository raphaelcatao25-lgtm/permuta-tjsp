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
}

interface ParticipanteManual {
  usuario_id: string;
  status_aceite: string;
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


function montarEmailPermutaManualConfirmada({
  nomeDestinatario,
  tipo,
  quantidadeParticipantes
}: {
  nomeDestinatario: string;
  tipo: string;
  quantidadeParticipantes: number;
}) {

  const nome =
    escaparHtml(
      nomeDestinatario
    );

  const descricao =
    tipo === "direta"
      ? "Sua permuta direta foi confirmada."
      : `Sua permuta em cadeia com ${quantidadeParticipantes} participantes foi confirmada.`;


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
              <strong style="color:#5eead4;">
                ${descricao}
              </strong>
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
              já podem ser consultados na plataforma.
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
                    Ver permuta
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
              Entre em contato com os demais participantes para dar
              continuidade aos procedimentos necessários.

              <br><br>

              Nenhuma movimentação funcional é realizada
              automaticamente pelo Permuta TJSP.
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
          status
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


    const {
      data: dadosParticipantes,
      error: erroParticipantes
    } =
      await supabaseAdmin
        .from(
          "ciclos_manuais_participantes"
        )
        .select(
          "usuario_id, status_aceite"
        )
        .eq(
          "ciclo_id",
          cicloId
        );


    if (erroParticipantes) {

      throw new Error(
        "Não foi possível localizar os participantes da permuta."
      );

    }


    const participantes =
      (
        dadosParticipantes ??
        []
      ) as ParticipanteManual[];


    if (
      !participantes.some(
        participante =>
          participante.usuario_id ===
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


    if (
      ciclo.status !==
      "confirmado"
    ) {

      return NextResponse.json(
        {
          ok: true,
          confirmado: false,
          enviados: 0,
          jaEnviados: 0,
          falhas: 0
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
        .eq(
          "tipo",
          "permuta_manual_confirmada"
        );


    if (erroNotificacoes) {

      throw new Error(
        "Não foi possível localizar as notificações de confirmação da permuta manual."
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
          jaEnviados: 0,
          falhas: 0,
          aviso:
            "Nenhuma notificação de confirmação da permuta manual encontrada."
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


      const perfil =
        mapaPerfis.get(
          notificacao.usuario_id
        );


      if (!perfil) {

        await registrarErroNotificacao(
          supabaseAdmin,
          notificacao.id,
          "Perfil do destinatário não encontrado."
        );

        falhas += 1;
        continue;

      }


      if (
        !perfil.email ||
        !perfil.email.trim()
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
          montarEmailPermutaManualConfirmada({
            nomeDestinatario:
              perfil.nome,

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
                        perfil.email,

                      name:
                        perfil.nome
                    }
                  ],

                  subject:
                    ciclo.tipo === "direta"
                      ? "Permuta direta confirmada | Permuta TJSP"
                      : "Permuta em cadeia confirmada | Permuta TJSP",

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
            : "Erro desconhecido ao enviar o e-mail.";


        console.error(
          "Erro ao enviar confirmação da permuta manual para:",
          perfil.email,
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
        confirmado: true,
        enviados,
        jaEnviados,
        falhas
      }
    );

  }

  catch(error) {

    console.error(
      "Erro no envio dos e-mails da permuta manual confirmada:",
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