import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";


export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const maxDuration = 300;


/* ============================================================
   CONFIGURAÇÕES
============================================================ */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY;

const BREVO_API_KEY =
  process.env.BREVO_API_KEY;

const CRON_SECRET =
  process.env.CRON_SECRET;


/*
============================================================
CONTROLE DE ENVIO

false
→ processa tudo
→ registra alertas
→ NÃO envia e-mails

true + CRON_EMAIL_TEST_USER_ID preenchido
→ envia SOMENTE para o usuário de teste

true + CRON_EMAIL_TEST_USER_ID vazio
→ PRODUÇÃO
→ envia para todos que tiverem oportunidade nova/pendente atual
============================================================
*/

const CRON_EMAIL_ENABLED =
  process.env.CRON_EMAIL_ENABLED ===
  "true";


const CRON_EMAIL_TEST_USER_ID =
  process.env
    .CRON_EMAIL_TEST_USER_ID
    ?.trim() || null;


const SITE_URL =
  "https://permuta-tjsp.vercel.app";


const REMETENTE_EMAIL =
  "permutatjsp@gmail.com";

const REMETENTE_NOME =
  "Permuta TJSP";


const TAMANHO_LOTE =
  20;

const TAMANHO_LOTE_CICLO4 =
  20;


/* ============================================================
   TIPOS
============================================================ */

type Perfil = {
  id: string;
  nome: string;
  email: string | null;
  busca_pausada: boolean | null;
  em_match: boolean | null;
};


type CandidatoDireta = {
  candidato_id: string;
  candidato_nome: string | null;
  comarca_origem: string | null;
  unidade_origem: string | null;
  comarca_destino: string | null;
  tipo_match: string | null;
  score: number | null;
  prioridade: number | null;
  compatibilidade: string | null;
};


type ResultadoLote = {
  usuarios_processados:
    number | null;

  matches_inseridos:
    number | null;
};


type MatchCiclo3 = {
  id: string;

  solicitante_id: string;

  participante_1: string;
  participante_2: string;
  participante_3: string;

  origem_1: number | null;
  destino_1: number | null;
  origem_2: number | null;
  destino_2: number | null;
  origem_3: number | null;
  destino_3: number | null;

  chave_ciclo:
    string | null;

  status: string;
};


type AlertaPendente = {
  id: string;

  usuario_id: string;

  tipo:
    | "direta"
    | "ciclo_3";

  assinatura: string;

  email_enviado: boolean;

  ultima_encontrada_em:
    string;
};


/* ============================================================
   CLIENTE ADMINISTRATIVO
============================================================ */

function criarSupabaseAdmin() {

  if (
    !SUPABASE_URL ||
    !SUPABASE_SECRET_KEY
  ) {

    throw new Error(
      "Configuração do Supabase ausente."
    );

  }


  return createClient(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken:
          false,

        persistSession:
          false,
      },
    }
  );

}


/* ============================================================
   NORMALIZAÇÃO DE ASSINATURAS
============================================================ */

function criarAssinaturaDireta(
  usuario1: string,
  usuario2: string
) {

  return [
    usuario1,
    usuario2,
  ]
    .sort()
    .join("--");

}


function criarAssinaturaCiclo3(
  participantes: string[]
) {

  return [
    ...participantes,
  ]
    .sort()
    .join("--");

}


/* ============================================================
   ESCAPAR HTML
============================================================ */

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


/* ============================================================
   TEMPLATE DO E-MAIL
============================================================ */

function montarEmailOportunidades({
  nome,
  diretas,
  ciclos,
}: {
  nome: string;
  diretas: number;
  ciclos: number;
}) {

  const nomeSeguro =
    escaparHtml(
      nome
    );


  const partes:
    string[] = [];


  if (
    diretas > 0
  ) {

    partes.push(
      diretas === 1
        ? "1 possibilidade de permuta direta"
        : `${diretas} possibilidades de permuta direta`
    );

  }


  if (
    ciclos > 0
  ) {

    partes.push(
      ciclos === 1
        ? "1 possibilidade de permuta em cadeia com 3 servidores"
        : `${ciclos} possibilidades de permuta em cadeia com 3 servidores`
    );

  }


  const resumo =
    partes.join(" e ");


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
          overflow:hidden;
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
              Nova possibilidade de permuta
            </div>


            <div
              style="
                color:#cbd5e1;
                font-size:15px;
                line-height:1.7;
                margin-bottom:16px;
              "
            >
              Olá, ${nomeSeguro}.
            </div>


            <div
              style="
                color:#cbd5e1;
                font-size:15px;
                line-height:1.7;
                margin-bottom:20px;
              "
            >
              Encontramos nova oportunidade compatível
              com as preferências que você cadastrou
              no <strong style="color:#ffffff;">
                Permuta TJSP
              </strong>.
            </div>


            <div
              style="
                margin:22px 0;
                padding:18px;
                background-color:#081b29;
                border:1px solid #1f4b57;
                border-radius:10px;
                text-align:center;
                color:#5eead4;
                font-size:16px;
                font-weight:bold;
                line-height:1.6;
              "
            >
              ${resumo}
            </div>


            <div
              style="
                color:#cbd5e1;
                font-size:15px;
                line-height:1.7;
                margin-bottom:26px;
              "
            >
              Acesse a página
              <strong style="color:#ffffff;">
                Buscar Permutas
              </strong>
              para visualizar as combinações encontradas
              e decidir se deseja enviar uma proposta.
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
                    href="${SITE_URL}/buscar-permutas"
                    style="
                      display:inline-block;
                      padding:14px 24px;
                      color:#ffffff;
                      text-decoration:none;
                      font-size:15px;
                      font-weight:bold;
                    "
                  >
                    Ver possibilidades
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
              Este e-mail é apenas um aviso de
              compatibilidade. Nenhuma proposta
              foi enviada automaticamente.
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

            Permuta TJSP é uma plataforma
            100% gratuita e independente
            para auxiliar servidores na busca
            por oportunidades de permuta.

            <br><br>

            Esta plataforma não representa
            um canal oficial do Tribunal de
            Justiça de São Paulo.

          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
  `;

}


/* ============================================================
   ENVIAR E-MAIL PELA BREVO
============================================================ */

async function enviarEmail({
  nome,
  email,
  diretas,
  ciclos,
}: {
  nome: string;
  email: string;
  diretas: number;
  ciclos: number;
}) {

  if (
    !BREVO_API_KEY
  ) {

    throw new Error(
      "BREVO_API_KEY não configurada."
    );

  }


  const htmlContent =
    montarEmailOportunidades({
      nome,
      diretas,
      ciclos,
    });


  const resposta =
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
            BREVO_API_KEY,
        },

        body:
          JSON.stringify({
            sender: {
              name:
                REMETENTE_NOME,

              email:
                REMETENTE_EMAIL,
            },

            to: [
              {
                email,
                name:
                  nome,
              },
            ],

            subject:
              "Nova possibilidade de permuta | Permuta TJSP",

            htmlContent,
          }),
      }
    );


  if (
    !resposta.ok
  ) {

    const texto =
      await resposta.text();


    throw new Error(
      `Brevo ${resposta.status}: ${texto}`
    );

  }

}


/* ============================================================
   GET
============================================================ */

export async function GET(
  request: NextRequest
) {

  const inicioMs =
    Date.now();

  const execucaoIniciadaEm =
    new Date()
      .toISOString();


  try {

    /* ========================================================
       1. CONFIGURAÇÃO
    ======================================================== */

    if (
      !SUPABASE_URL ||
      !SUPABASE_SECRET_KEY
    ) {

      throw new Error(
        "Variáveis do Supabase não configuradas."
      );

    }


    if (
      !CRON_SECRET
    ) {

      throw new Error(
        "CRON_SECRET não configurado."
      );

    }


    /* ========================================================
       2. SEGURANÇA
    ======================================================== */

    const authorization =
      request.headers.get(
        "authorization"
      );


    if (
      authorization !==
      `Bearer ${CRON_SECRET}`
    ) {

      return NextResponse.json(
        {
          ok: false,
          erro:
            "Não autorizado.",
        },
        {
          status: 401,
        }
      );

    }


    const supabase =
      criarSupabaseAdmin();


    console.log(
      "[CRON MATCHING] Iniciando."
    );


    /* ========================================================
       3. PERFIS DISPONÍVEIS
    ======================================================== */

    const {
      data:
        perfisData,

      error:
        perfisError,
    } =
      await supabase
        .from(
          "perfis"
        )
        .select(`
          id,
          nome,
          email,
          busca_pausada,
          em_match
        `)
        .eq(
          "busca_pausada",
          false
        )
        .eq(
          "em_match",
          false
        )
        .order(
          "id"
        );


    if (
      perfisError
    ) {

      throw new Error(
        `Erro ao carregar perfis: ${perfisError.message}`
      );

    }


    const perfis =
      (
        perfisData ??
        []
      ) as Perfil[];

    const { error: historicoStatusError } = await supabase
      .from("historico_oportunidades_usuario")
      .update({ status: "indisponivel", updated_at: new Date().toISOString() })
      .eq("status", "ativa");
    if (historicoStatusError) {
      throw new Error(`Erro ao atualizar status do histórico: ${historicoStatusError.message}`);
    }


    /* ========================================================
       4. PRESERVAR CICLOS ANTERIORES ANTES DA REGERAÇÃO
    ======================================================== */
    const { data: ciclosAnteriores, error: ciclosAnterioresError } = await supabase
      .from("matches_ciclo_3").select("*").eq("status", "disponivel");
    if (ciclosAnterioresError) {
      throw new Error(`Erro ao preservar ciclos anteriores: ${ciclosAnterioresError.message}`);
    }

    const idsParticipantesAnteriores = [...new Set((ciclosAnteriores ?? []).flatMap((c: any) => [
      c.participante_1, c.participante_2, c.participante_3
    ]).filter(Boolean))];
    const idsComarcasAnteriores = [...new Set((ciclosAnteriores ?? []).flatMap((c: any) => [
      c.origem_1, c.destino_1, c.origem_2, c.destino_2, c.origem_3, c.destino_3
    ]).filter(Boolean))];

    const [{ data: perfisAnteriores }, { data: comarcasAnteriores }] = await Promise.all([
      idsParticipantesAnteriores.length
        ? supabase.from("perfis").select("id,nome").in("id", idsParticipantesAnteriores)
        : Promise.resolve({ data: [] as any[] }),
      idsComarcasAnteriores.length
        ? supabase.from("comarcas_tjsp").select("id,nome").in("id", idsComarcasAnteriores)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const nomesAnteriores = new Map((perfisAnteriores ?? []).map((p: any) => [p.id, p.nome]));
    const nomesComarcasAnteriores = new Map((comarcasAnteriores ?? []).map((c: any) => [c.id, c.nome]));
    const historicoCiclo3Anterior: any[] = [];

    for (const ciclo of ciclosAnteriores ?? []) {
      const participantes = [1, 2, 3].map((n) => ({
        ordem: n,
        usuario_id: ciclo[`participante_${n}`],
        nome: nomesAnteriores.get(ciclo[`participante_${n}`]) ?? "Servidor TJSP",
        origem_comarca_id: ciclo[`origem_${n}`],
        origem_comarca: nomesComarcasAnteriores.get(ciclo[`origem_${n}`]) ?? "Comarca não informada",
        destino_comarca_id: ciclo[`destino_${n}`],
        destino_comarca: nomesComarcasAnteriores.get(ciclo[`destino_${n}`]) ?? "Comarca não informada",
        origem_unidade_id: ciclo[`origem_unidade_${n}`] ?? null,
        destino_unidade_id: ciclo[`destino_unidade_${n}`] ?? null,
      }));
      const assinatura = [ciclo.participante_1, ciclo.participante_2, ciclo.participante_3].sort().join("--");
      for (const participante of participantes) {
        historicoCiclo3Anterior.push({
          usuario_id: participante.usuario_id,
          tipo: "ciclo_3",
          assinatura,
          participantes,
          status: "indisponivel",
          ultima_encontrada_em: ciclo.updated_at ?? ciclo.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
    if (historicoCiclo3Anterior.length) {
      const { error } = await supabase.from("historico_oportunidades_usuario")
        .upsert(historicoCiclo3Anterior, { onConflict: "usuario_id,tipo,assinatura" });
      if (error) throw new Error(`Erro ao arquivar ciclos anteriores: ${error.message}`);
    }

    /* ========================================================
       4. LIMPAR SOMENTE CICLOS DISPONÍVEIS

       Aceitos/concluídos não são tocados.
    ======================================================== */

    const {
      error:
        limparError,
    } =
      await supabase
        .from(
          "matches_ciclo_3"
        )
        .delete()
        .eq(
          "status",
          "disponivel"
        );


    if (
      limparError
    ) {

      throw new Error(
        `Erro ao limpar ciclos disponíveis: ${limparError.message}`
      );

    }


    /* ========================================================
       5. CICLO 3 EM LOTES
    ======================================================== */

    let offset =
      0;

    let usuariosProcessadosCiclo =
      0;

    let ciclosInseridos =
      0;


    while (
      offset <
      perfis.length
    ) {

      const {
        data:
          resultadoData,

        error:
          resultadoError,
      } =
        await supabase
          .rpc(
            "gerar_matches_ciclo_3_lote",
            {
              p_offset:
                offset,

              p_limite:
                TAMANHO_LOTE,
            }
          );


      if (
        resultadoError
      ) {

        throw new Error(
          `Erro no lote de ciclo 3 (${offset}): ${resultadoError.message}`
        );

      }


      const linhas =
        Array.isArray(
          resultadoData
        )
          ? resultadoData as ResultadoLote[]
          : [];


      const resultado =
        linhas[0];


      usuariosProcessadosCiclo +=
        Number(
          resultado
            ?.usuarios_processados ??
          0
        );


      ciclosInseridos +=
        Number(
          resultado
            ?.matches_inseridos ??
          0
        );


      offset +=
        TAMANHO_LOTE;

    }


    /* ========================================================
       6. PERMUTAS DIRETAS
    ======================================================== */

    let diretasEncontradas =
      0;

    let alertasDiretaNovos =
      0;


    for (
      const perfil
      of perfis
    ) {

      const {
        data:
          candidatosData,

        error:
          candidatosError,
      } =
        await supabase
          .rpc(
            "buscar_candidatos_permuta_cron",
            {
              p_perfil_id:
                perfil.id,
            }
          );


      if (
        candidatosError
      ) {

        console.error(
          `[CRON] Direta ${perfil.id}:`,
          candidatosError.message
        );

        continue;

      }


      const candidatos =
        (
          candidatosData ??
          []
        ) as CandidatoDireta[];


      for (
        const candidato
        of candidatos
      ) {

        if (
          !candidato
            .candidato_id
        ) {
          continue;
        }


        diretasEncontradas++;


        const assinatura =
          criarAssinaturaDireta(
            perfil.id,
            candidato.candidato_id
          );

        const participantesDireta = [
          { usuario_id: perfil.id, nome: perfil.nome, origem_comarca: "Sua comarca atual" },
          {
            usuario_id: candidato.candidato_id,
            nome: candidato.candidato_nome ?? "Servidor TJSP",
            origem_comarca: candidato.comarca_origem ?? "Comarca não informada",
            destino_comarca: candidato.comarca_destino ?? "Destino não informado",
            unidade_origem: candidato.unidade_origem ?? null,
          },
        ];
        const { error: historicoDiretaError } = await supabase
          .from("historico_oportunidades_usuario")
          .upsert({
            usuario_id: perfil.id,
            tipo: "direta",
            assinatura,
            participantes: participantesDireta,
            status: "ativa",
            ultima_encontrada_em: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "usuario_id,tipo,assinatura" });
        if (historicoDiretaError) {
          console.error("[CRON] Erro ao preservar permuta direta:", historicoDiretaError.message);
        }


        const {
          data:
            existente,

          error:
            existenteError,
        } =
          await supabase
            .from(
              "alertas_oportunidades_email"
            )
            .select(
              "id"
            )
            .eq(
              "usuario_id",
              perfil.id
            )
            .eq(
              "tipo",
              "direta"
            )
            .eq(
              "assinatura",
              assinatura
            )
            .maybeSingle();


        if (
          existenteError
        ) {

          console.error(
            "[CRON] Erro alerta direta:",
            existenteError.message
          );

          continue;

        }


        const agora =
          new Date()
            .toISOString();


        if (
          existente
        ) {

          await supabase
            .from(
              "alertas_oportunidades_email"
            )
            .update({
              ultima_encontrada_em:
                agora,

              updated_at:
                agora,
            })
            .eq(
              "id",
              existente.id
            );


          continue;

        }


        const {
          error:
            inserirError,
        } =
          await supabase
            .from(
              "alertas_oportunidades_email"
            )
            .insert({
              usuario_id:
                perfil.id,

              tipo:
                "direta",

              assinatura,

              primeira_encontrada_em:
                agora,

              ultima_encontrada_em:
                agora,

              email_enviado:
                false,
            });


        if (
          inserirError
        ) {

          console.error(
            "[CRON] Erro inserindo alerta direta:",
            inserirError.message
          );

          continue;

        }


        alertasDiretaNovos++;

      }

    }


    /* ========================================================
       7. CICLOS ATUAIS
    ======================================================== */

    const {
      data:
        ciclosData,

      error:
        ciclosError,
    } =
      await supabase
        .from(
          "matches_ciclo_3"
        )
        .select(`
          id,
          solicitante_id,
          participante_1,
          participante_2,
          participante_3,
          origem_1,
          destino_1,
          origem_2,
          destino_2,
          origem_3,
          destino_3,
          chave_ciclo,
          status
        `)
        .eq(
          "status",
          "disponivel"
        );


    if (
      ciclosError
    ) {

      throw new Error(
        `Erro ao consultar ciclos: ${ciclosError.message}`
      );

    }


    const ciclos =
      (
        ciclosData ??
        []
      ) as MatchCiclo3[];

    const historicoCiclo3Atual: any[] = [];
    const idsTodosCiclos = [...new Set(ciclos.flatMap((c) => [
      c.participante_1, c.participante_2, c.participante_3
    ]))];
    const idsComarcasCiclo = [...new Set(ciclos.flatMap((c) => [
      c.origem_1, c.destino_1, c.origem_2, c.destino_2, c.origem_3, c.destino_3
    ]).filter(Boolean))];
    const [{ data: perfisCiclo }, { data: comarcasCiclo }] = await Promise.all([
      idsTodosCiclos.length
        ? supabase.from("perfis").select("id,nome").in("id", idsTodosCiclos)
        : Promise.resolve({ data: [] as any[] }),
      idsComarcasCiclo.length
        ? supabase.from("comarcas_tjsp").select("id,nome").in("id", idsComarcasCiclo)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const mapaPerfisCiclo = new Map((perfisCiclo ?? []).map((p: any) => [p.id, p]));
    const mapaComarcasCiclo = new Map((comarcasCiclo ?? []).map((c: any) => [c.id, c.nome]));

    for (const ciclo of ciclos) {
      const ids = [ciclo.participante_1, ciclo.participante_2, ciclo.participante_3];
      const assinatura = [...ids].sort().join("--");
      const participantes = ids.map((id, index) => {
        const ordem = index + 1;
        const origemId = ciclo[`origem_${ordem}`];
        const destinoId = ciclo[`destino_${ordem}`];
        return {
          ordem,
          usuario_id: id,
          nome: mapaPerfisCiclo.get(id)?.nome ?? "Servidor TJSP",
          origem_comarca_id: origemId,
          origem_comarca: mapaComarcasCiclo.get(origemId) ?? "Comarca não informada",
          destino_comarca_id: destinoId,
          destino_comarca: mapaComarcasCiclo.get(destinoId) ?? "Destino não informado",
        };
      });
      for (const id of ids) {
        historicoCiclo3Atual.push({
          usuario_id: id,
          tipo: "ciclo_3",
          assinatura,
          participantes,
          status: "ativa",
          ultima_encontrada_em: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
    if (historicoCiclo3Atual.length) {
      const { error } = await supabase.from("historico_oportunidades_usuario")
        .upsert(historicoCiclo3Atual, { onConflict: "usuario_id,tipo,assinatura" });
      if (error) throw new Error(`Erro ao registrar ciclos atuais no histórico: ${error.message}`);
    }

    /* ========================================================
       8. HISTÓRICO DE CICLOS COM QUATRO PARTICIPANTES

       A busca de ciclo 4 é dinâmica e individual. Este processamento
       registra as combinações únicas encontradas para alimentar
       o contador público, sem armazenar nomes ou dados pessoais.
    ======================================================== */

    let perfisAnalisadosCiclo4 = 0;

    const hashesCiclo4Encontrados = new Set<string>();

    for (
      let offsetCiclo4 = 0;
      offsetCiclo4 < perfis.length;
      offsetCiclo4 += TAMANHO_LOTE_CICLO4
    ) {
      const lotePerfisCiclo4 = perfis
        .slice(
          offsetCiclo4,
          offsetCiclo4 + TAMANHO_LOTE_CICLO4
        )
        .map((perfil) => perfil.id);

      const {
        data: historicoCiclo4Data,
        error: historicoCiclo4Error,
      } = await supabase.rpc(
        "registrar_oportunidades_ciclo4_lote",
        {
          p_perfis_ids: lotePerfisCiclo4,
        }
      );

      if (historicoCiclo4Error) {
        throw new Error(
          `Erro no lote de ciclo 4 (perfis ${offsetCiclo4 + 1} a ${offsetCiclo4 + lotePerfisCiclo4.length}): ${historicoCiclo4Error.message}`
        );
      }

      const historicoCiclo4 = Array.isArray(historicoCiclo4Data)
        ? historicoCiclo4Data[0]
        : null;

      perfisAnalisadosCiclo4 += Number(
        historicoCiclo4?.perfis_analisados ?? 0
      );

      const hashesLote = Array.isArray(historicoCiclo4?.hashes_lote)
        ? historicoCiclo4.hashes_lote as string[]
        : [];

      for (const hash of hashesLote) {
        hashesCiclo4Encontrados.add(hash);
      }

      console.log(
        "[CRON MATCHING] Lote de ciclo 4 concluído.",
        {
          inicio: offsetCiclo4 + 1,
          fim: offsetCiclo4 + lotePerfisCiclo4.length,
          perfisAnalisados: historicoCiclo4?.perfis_analisados ?? 0,
          ciclosUnicosNoLote: historicoCiclo4?.ciclos_unicos_encontrados ?? 0,
        }
      );
    }

    const ciclosQuatroEncontrados =
      hashesCiclo4Encontrados.size;


    /* ========================================================
       9. BUSCAR SOMENTE ALERTAS QUE CONTINUAM ATUAIS

       Isso é importante.

       Não envia alerta antigo de uma oportunidade
       que já deixou de existir.

       Para ser enviado, ele precisa ter sido
       encontrado NESTA execução.
    ======================================================== */

    const {
      data:
        alertasData,

      error:
        alertasError,
    } =
      await supabase
        .from(
          "alertas_oportunidades_email"
        )
        .select(`
          id,
          usuario_id,
          tipo,
          assinatura,
          email_enviado,
          ultima_encontrada_em
        `)
        .eq(
          "email_enviado",
          false
        )
        .gte(
          "ultima_encontrada_em",
          execucaoIniciadaEm
        );


    if (
      alertasError
    ) {

      throw new Error(
        `Erro ao consultar alertas pendentes: ${alertasError.message}`
      );

    }


    let alertasAtuais =
      (
        alertasData ??
        []
      ) as AlertaPendente[];


    /* ========================================================
       10. MODO DE TESTE

       Se CRON_EMAIL_TEST_USER_ID estiver definido,
       nenhum outro servidor recebe e-mail.
    ======================================================== */

    if (
      CRON_EMAIL_TEST_USER_ID
    ) {

      alertasAtuais =
        alertasAtuais.filter(
          (
            alerta
          ) =>
            alerta.usuario_id ===
            CRON_EMAIL_TEST_USER_ID
        );

    }


    /* ========================================================
       11. AGRUPAR POR USUÁRIO
    ======================================================== */

    const alertasPorUsuario =
      new Map<
        string,
        AlertaPendente[]
      >();


    for (
      const alerta
      of alertasAtuais
    ) {

      const atuais =
        alertasPorUsuario.get(
          alerta.usuario_id
        ) ?? [];


      atuais.push(
        alerta
      );


      alertasPorUsuario.set(
        alerta.usuario_id,
        atuais
      );

    }


    /* ========================================================
       12. ENVIAR UM E-MAIL POR SERVIDOR
    ======================================================== */

    let emailsEnviados =
      0;

    let emailsComErro =
      0;


    if (
      CRON_EMAIL_ENABLED
    ) {

      for (
        const [
          usuarioId,
          alertasUsuario,
        ]
        of alertasPorUsuario
      ) {

        const {
          data:
            perfil,

          error:
            perfilError,
        } =
          await supabase
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
          perfilError ||
          !perfil
        ) {

          console.error(
            `[CRON] Perfil não encontrado: ${usuarioId}`
          );

          continue;

        }


        const ids =
          alertasUsuario.map(
            (
              alerta
            ) =>
              alerta.id
          );


        if (
          !perfil.email ||
          !perfil.email.trim()
        ) {

          const mensagem =
            "Servidor sem e-mail cadastrado.";


          await supabase
            .from(
              "alertas_oportunidades_email"
            )
            .update({
              email_erro:
                mensagem,

              updated_at:
                new Date()
                  .toISOString(),
            })
            .in(
              "id",
              ids
            );


          emailsComErro++;

          continue;

        }


        const diretas =
          alertasUsuario
            .filter(
              (
                alerta
              ) =>
                alerta.tipo ===
                "direta"
            )
            .length;


        const ciclosUsuario =
          alertasUsuario
            .filter(
              (
                alerta
              ) =>
                alerta.tipo ===
                "ciclo_3"
            )
            .length;


        try {

          await enviarEmail({
            nome:
              perfil.nome,

            email:
              perfil.email,

            diretas,

            ciclos:
              ciclosUsuario,
          });


          const agora =
            new Date()
              .toISOString();


          const {
            error:
              marcarError,
          } =
            await supabase
              .from(
                "alertas_oportunidades_email"
              )
              .update({
                email_enviado:
                  true,

                email_enviado_em:
                  agora,

                email_erro:
                  null,

                updated_at:
                  agora,
              })
              .in(
                "id",
                ids
              );


          if (
            marcarError
          ) {

            console.error(
              "[CRON] E-mail enviado, mas erro ao atualizar alertas:",
              marcarError.message
            );

          }


          emailsEnviados++;

        }

        catch(
          error
        ) {

          const mensagem =
            error instanceof Error
              ? error.message
              : "Erro desconhecido no envio.";


          console.error(
            `[CRON] Erro enviando para ${usuarioId}:`,
            mensagem
          );


          await supabase
            .from(
              "alertas_oportunidades_email"
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
                ),

              updated_at:
                new Date()
                  .toISOString(),
            })
            .in(
              "id",
              ids
            );


          emailsComErro++;

        }

      }

    }


    /* ========================================================
       13. RESULTADO
    ======================================================== */

    const duracaoMs =
      Date.now() -
      inicioMs;


    const modo =
      !CRON_EMAIL_ENABLED
        ? "SEM_EMAIL"
        : CRON_EMAIL_TEST_USER_ID
          ? "EMAIL_TESTE"
          : "PRODUCAO";


    const processamento = {

      perfisAnalisados:
        perfis.length,

      tamanhoLote:
        TAMANHO_LOTE,

      usuariosProcessadosCiclo,

      ciclosInseridos,

      ciclosDisponiveis:
        ciclos.length,

      diretasEncontradas,

      alertasDiretaNovos,

      alertasCicloNovos,

      perfisAnalisadosCiclo4,

      ciclosQuatroEncontrados,

      usuariosComAlertasAtuais:
        alertasPorUsuario.size,

      alertasAtuais:
        alertasAtuais.length,

      emailsEnviados,

      emailsComErro,

      duracaoMs,

    };


    console.log(
      "[CRON MATCHING] Concluído.",
      {
        modo,
        ...processamento,
      }
    );


    return NextResponse.json({

      ok: true,

      modo,

      emailHabilitado:
        CRON_EMAIL_ENABLED,

      usuarioTeste:
        CRON_EMAIL_TEST_USER_ID,

      processamento,

    });

  }

  catch(
    error
  ) {

    console.error(
      "[CRON MATCHING] ERRO:",
      error
    );


    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido.";


    return NextResponse.json(
      {
        ok: false,
        erro:
          mensagem,
      },
      {
        status: 500,
      }
    );

  }

}