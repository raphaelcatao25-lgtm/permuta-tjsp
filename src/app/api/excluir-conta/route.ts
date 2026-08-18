import {
  NextResponse
} from "next/server";

import {
  createClient
} from "@supabase/supabase-js";


export async function POST(
  request: Request
) {

  try {

    /* ===============================================
       VARIÁVEIS DE AMBIENTE
    =============================================== */

   const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const serviceRoleKey =
  process.env.SUPABASE_SECRET_KEY;


    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey
    ) {

      return NextResponse.json(
        {
          error:
            "Configuração do servidor incompleta."
        },
        {
          status: 500
        }
      );

    }


    /* ===============================================
       TOKEN ENVIADO PELO FRONT
    =============================================== */

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
            "Sessão não informada."
        },
        {
          status: 401
        }
      );

    }


    const accessToken =
      authorization.replace(
        "Bearer ",
        ""
      );


    /* ===============================================
       CLIENTE NORMAL PARA VALIDAR O USUÁRIO
    =============================================== */

    const supabaseAuth =
      createClient(
        supabaseUrl,
        anonKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );


    /*
    getUser(token) consulta o Auth e valida
    quem realmente é o dono do token.
    */

    const {
      data: dadosUsuario,
      error: erroUsuario
    } = await supabaseAuth.auth.getUser(
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


    const usuario =
      dadosUsuario.user;


    /* ===============================================
       CLIENTE ADMINISTRATIVO
    =============================================== */

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );


    /* ===============================================
       VERIFICA O PERFIL ANTES DE COMEÇAR
    =============================================== */

    const {
      data: perfil,
      error: erroPerfil
    } = await supabaseAdmin
      .from(
        "perfis"
      )
      .select(`
        id,
        em_match
      `)
      .eq(
        "id",
        usuario.id
      )
      .maybeSingle();


    if (erroPerfil) {

      console.error(
        "Erro ao verificar perfil:",
        erroPerfil
      );


      return NextResponse.json(
        {
          error:
            "Não foi possível verificar sua conta."
        },
        {
          status: 500
        }
      );

    }


    if (!perfil) {

      return NextResponse.json(
        {
          error:
            "Perfil não encontrado."
        },
        {
          status: 404
        }
      );

    }


    /* ===============================================
       NÃO PERMITE EXCLUSÃO DURANTE MATCH
    =============================================== */

    if (
      Boolean(
        perfil.em_match
      )
    ) {

      return NextResponse.json(
        {
          error:
            "Não é possível excluir sua conta enquanto existir uma permuta confirmada em andamento. Encerre a permuta primeiro."
        },
        {
          status: 409
        }
      );

    }


    /* ===============================================
       PREPARAR EXCLUSÃO DOS DADOS DA PLATAFORMA

       O token é colocado no cliente para que auth.uid()
       dentro da RPC seja o próprio usuário.
    =============================================== */

    const supabaseUsuario =
      createClient(
        supabaseUrl,
        anonKey,
        {
          global: {
            headers: {
              Authorization:
                `Bearer ${accessToken}`
            }
          },

          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );


    const {
      data: resultadoPreparacao,
      error: erroPreparacao
    } = await supabaseUsuario.rpc(
      "preparar_exclusao_conta",
      {
        p_usuario_id:
          usuario.id
      }
    );


    if (erroPreparacao) {

      console.error(
        "Erro ao preparar exclusão:",
        erroPreparacao
      );


      return NextResponse.json(
        {
          error:
            erroPreparacao.message ||
            "Não foi possível preparar a exclusão da conta."
        },
        {
          status: 400
        }
      );

    }


    /* ===============================================
       EXCLUI USUÁRIO DO SUPABASE AUTH
    =============================================== */

    const {
      error: erroExcluirAuth
    } =
      await supabaseAdmin.auth.admin.deleteUser(
        usuario.id
      );


    if (erroExcluirAuth) {

      /*
      IMPORTANTE:
      Neste ponto os dados da plataforma já foram
      removidos pela RPC.

      Se o Auth falhar, registramos o problema
      para não esconder uma inconsistência.
      */

      console.error(
        "Dados removidos, mas houve erro ao excluir Auth:",
        erroExcluirAuth
      );


      return NextResponse.json(
        {
          error:
            "Os dados da plataforma foram removidos, mas ocorreu um erro ao remover o login. Entre em contato com o suporte.",
          detalhe:
            erroExcluirAuth.message
        },
        {
          status: 500
        }
      );

    }


    /* ===============================================
       SUCESSO
    =============================================== */

    return NextResponse.json(
      {
        success: true,
        preparacao:
          resultadoPreparacao
      },
      {
        status: 200
      }
    );

  }

  catch(error) {

    console.error(
      "Erro inesperado em excluir-conta:",
      error
    );


    return NextResponse.json(
      {
        error:
          "Ocorreu um erro inesperado ao excluir a conta."
      },
      {
        status: 500
      }
    );

  }

}