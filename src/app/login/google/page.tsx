"use client";

import {
  useEffect,
  useState
} from "react";

import {
  useRouter
} from "next/navigation";

import {
  CheckCircle2,
  LoaderCircle
} from "lucide-react";

import {
  PublicLayout
} from "@/components/layout/PublicLayout";

import {
  Card
} from "@/components/ui/Card";

import {
  supabase
} from "@/lib/supabase";


export default function GoogleLoginCallbackPage() {

  const router =
    useRouter();


  const [
    mensagem,
    setMensagem
  ] = useState(
    "Concluindo seu acesso com Google..."
  );


  const [
    erro,
    setErro
  ] = useState("");


  useEffect(() => {

    let ativo = true;


    async function concluirLogin() {

      try {

        /*
        ======================================================
        1. AGUARDA A SESSÃO OAUTH
        ======================================================
        */

        let usuario =
          (
            await supabase.auth.getSession()
          ).data.session?.user;


        /*
        Em alguns navegadores o retorno OAuth pode chegar
        poucos milissegundos antes de a sessão ficar
        disponível no storage.

        Fazemos algumas tentativas curtas.
        */

        for (
          let tentativa = 0;
          tentativa < 10 && !usuario;
          tentativa += 1
        ) {

          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                150
              )
          );


          usuario =
            (
              await supabase.auth.getSession()
            ).data.session?.user;

        }


        if (!ativo) {
          return;
        }


        if (!usuario) {

          setErro(
            "Não foi possível concluir o login com Google. Tente novamente."
          );

          return;

        }


        /*
        ======================================================
        2. VERIFICA SE JÁ EXISTE PERFIL
        ======================================================
        */

        setMensagem(
          "Verificando seu cadastro..."
        );


        const {
          data: perfil,
          error: perfilError
        } = await supabase
          .from(
            "perfis"
          )
          .select(
            `
            id,
            nome,
            email,
            cargo,
            comarca_atual_id
            `
          )
          .eq(
            "id",
            usuario.id
          )
          .maybeSingle();


        if (!ativo) {
          return;
        }


        if (perfilError) {

          setErro(
            "Seu acesso com Google foi realizado, mas não foi possível verificar seu perfil."
          );

          return;

        }


        /*
        ======================================================
        3. PERFIL COMPLETO → DASHBOARD
        ======================================================

        Consideramos o cadastro básico concluído quando
        já existe perfil com cargo e comarca atual.
        */

        const perfilCompleto =
          Boolean(
            perfil?.id
            &&
            perfil?.cargo
            &&
            perfil?.comarca_atual_id
          );


        if (perfilCompleto) {

          setMensagem(
            "Acesso concluído. Entrando..."
          );


          router.replace(
            "/dashboard"
          );

          router.refresh();

          return;

        }


        /*
        ======================================================
        4. PRIMEIRO ACESSO GOOGLE → COMPLETAR CADASTRO
        ======================================================

        O Google normalmente fornece nome e e-mail.
        Passamos esses dados via query string somente
        para pré-preencher a tela.

        O UUID autenticado continua sendo obtido pela
        sessão do Supabase.
        */

        const nomeGoogle =
          (
            usuario.user_metadata?.full_name
            ||
            usuario.user_metadata?.name
            ||
            perfil?.nome
            ||
            ""
          )
            .toString()
            .trim();


        const emailGoogle =
          (
            usuario.email
            ||
            perfil?.email
            ||
            ""
          )
            .toString()
            .trim()
            .toLowerCase();


        const parametros =
          new URLSearchParams();


        if (nomeGoogle) {

          parametros.set(
            "nome",
            nomeGoogle
          );

        }


        if (emailGoogle) {

          parametros.set(
            "email",
            emailGoogle
          );

        }


        parametros.set(
          "google",
          "1"
        );


        setMensagem(
          "Só falta completar seu perfil."
        );


        router.replace(
          `/cadastro?${parametros.toString()}`
        );

        router.refresh();

      }

      catch {

        if (!ativo) {
          return;
        }


        setErro(
          "Ocorreu um erro inesperado ao concluir o login com Google."
        );

      }

    }


    concluirLogin();


    return () => {

      ativo = false;

    };

  }, [router]);


  return (

    <PublicLayout
      title="Acesso com Google"
      description={
        erro
          ? "Não foi possível concluir seu acesso."
          : "Estamos preparando sua conta no Permuta TJSP."
      }
      maxWidth="sm"
    >

      <Card
        padding="lg"
        shadow="lg"
      >

        <div className="
          py-8
          text-center
        ">

          {
            erro
              ? (

                <>

                  <div className="
                    mx-auto
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-full
                    bg-red-50
                    text-red-600
                  ">

                    <CheckCircle2
                      className="
                        h-7
                        w-7
                      "
                      strokeWidth={1.8}
                    />

                  </div>


                  <p className="
                    mt-5
                    text-sm
                    font-medium
                    leading-6
                    text-red-700
                  ">

                    {erro}

                  </p>


                  <button
                    type="button"
                    onClick={() =>
                      router.replace(
                        "/login"
                      )
                    }
                    className="
                      mt-6
                      rounded-xl
                      bg-blue-900
                      px-5
                      py-3
                      text-sm
                      font-semibold
                      text-white
                      transition
                      hover:bg-blue-800
                    "
                  >

                    Voltar ao login

                  </button>

                </>

              )
              : (

                <>

                  <LoaderCircle
                    className="
                      mx-auto
                      h-8
                      w-8
                      animate-spin
                      text-blue-900
                    "
                    strokeWidth={1.8}
                  />


                  <p className="
                    mt-5
                    text-sm
                    leading-6
                    text-text-secondary
                  ">

                    {mensagem}

                  </p>

                </>

              )
          }

        </div>

      </Card>

    </PublicLayout>

  );

}