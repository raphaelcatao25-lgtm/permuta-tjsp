"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Mail,
  Send,
} from "lucide-react";

import {
  supabase,
} from "@/lib/supabase";

import {
  PublicLayout,
} from "@/components/layout/PublicLayout";

import {
  Card,
} from "@/components/ui/Card";

import {
  Button,
} from "@/components/ui/Button";


export default function EsqueciSenhaPage() {

  const [
    email,
    setEmail,
  ] = useState("");


  const [
    carregando,
    setCarregando,
  ] = useState(false);


  const [
    enviado,
    setEnviado,
  ] = useState(false);


  const [
    mensagemErro,
    setMensagemErro,
  ] = useState("");


  /*
  ======================================================
  VERIFICA SE JÁ ESTÁ LOGADO
  ======================================================
  */

  useEffect(() => {

    let ativo = true;


    async function verificarSessao() {

      const {
        data,
      } = await supabase.auth.getSession();


      if (!ativo) {
        return;
      }


      if (
        data.session?.user
      ) {

        window.location.replace(
          "/dashboard"
        );

      }

    }


    verificarSessao();


    return () => {

      ativo = false;

    };

  }, []);


  /*
  ======================================================
  ENVIAR RECUPERAÇÃO
  ======================================================
  */

  async function solicitarRecuperacao(
    evento: FormEvent<HTMLFormElement>
  ) {

    evento.preventDefault();


    if (carregando) {
      return;
    }


    setMensagemErro("");


    const emailNormalizado =
      email
        .trim()
        .toLowerCase();


    if (!emailNormalizado) {

      setMensagemErro(
        "Informe seu e-mail."
      );

      return;

    }


    if (
      !emailNormalizado.includes("@")
    ) {

      setMensagemErro(
        "Informe um endereço de e-mail válido."
      );

      return;

    }


    try {

      setCarregando(
        true
      );


      /*
      ==================================================
      URL DE RETORNO
      ==================================================

      Em localhost:

      http://localhost:3000/redefinir-senha

      Em produção, window.location.origin
      assumirá automaticamente o domínio atual.
      */


      const redirectTo =
        `${window.location.origin}/redefinir-senha`;


      const {
        error,
      } =
        await supabase.auth.resetPasswordForEmail(
          emailNormalizado,
          {
            redirectTo,
          }
        );


      if (error) {

        console.error(
          "Erro ao solicitar recuperação:",
          error
        );


        setMensagemErro(
          "Não foi possível enviar o e-mail de recuperação. Tente novamente."
        );

        return;

      }


      setEnviado(
        true
      );

    }

    catch (error) {

      console.error(
        "Erro inesperado na recuperação:",
        error
      );


      setMensagemErro(
        "Ocorreu um erro inesperado. Tente novamente."
      );

    }

    finally {

      setCarregando(
        false
      );

    }

  }


  /*
  ======================================================
  E-MAIL ENVIADO
  ======================================================
  */

  if (enviado) {

    return (

      <PublicLayout
        title="Verifique seu e-mail"
        description="Enviamos as instruções para redefinição da sua senha."
        maxWidth="sm"
      >

        <Card
          padding="lg"
          shadow="lg"
        >

          <div className="
            text-center
          ">

            <div className="
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-primary-light
              text-primary
            ">

              <Send
                className="
                  h-7
                  w-7
                "
                strokeWidth={1.8}
              />

            </div>


            <h2 className="
              mt-5
              text-xl
              font-bold
              text-text-primary
            ">

              E-mail enviado

            </h2>


            <p className="
              mt-3
              text-sm
              leading-6
              text-text-secondary
            ">

              Se existir uma conta associada a{" "}

              <span className="
                font-semibold
                text-text-primary
              ">

                {email.trim()}

              </span>

              , você receberá um link para criar uma nova senha.

            </p>


            <p className="
              mt-3
              text-xs
              leading-5
              text-text-muted
            ">

              Verifique também sua caixa de spam ou lixo eletrônico.

            </p>


            <div className="
              mt-6
            ">

              <Link
                href="/login"
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  text-sm
                  font-semibold
                  text-primary
                  transition
                  hover:text-primary-dark
                  hover:underline
                "
              >

                <ArrowLeft
                  className="
                    h-4
                    w-4
                  "
                />

                Voltar para o login

              </Link>

            </div>

          </div>

        </Card>

      </PublicLayout>

    );

  }


  /*
  ======================================================
  FORMULÁRIO
  ======================================================
  */

  return (

    <PublicLayout
      title="Esqueci minha senha"
      description="Informe o e-mail cadastrado para receber um link de redefinição de senha."
      maxWidth="sm"
    >

      <Card
        padding="lg"
        shadow="lg"
      >

        <div className="
          mb-7
          flex
          justify-center
        ">

          <div className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-primary-light
            text-primary
          ">

            <Mail
              className="
                h-7
                w-7
              "
              strokeWidth={1.8}
            />

          </div>

        </div>


        <form
          onSubmit={
            solicitarRecuperacao
          }
          noValidate
        >

          <div className="
            space-y-5
          ">


            <div>

              <label
                htmlFor="email"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-text-primary
                "
              >

                E-mail

              </label>


              <div className="
                relative
              ">

                <Mail
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    h-5
                    w-5
                    -translate-y-1/2
                    text-text-muted
                  "
                  strokeWidth={1.8}
                />


                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={
                    evento => {

                      setEmail(
                        evento.target.value
                      );


                      if (
                        mensagemErro
                      ) {

                        setMensagemErro("");

                      }

                    }
                  }
                  placeholder="seuemail@exemplo.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={
                    carregando
                  }
                  className="
                    min-h-12
                    w-full
                    rounded-xl
                    border
                    border-border-strong
                    bg-white
                    py-3
                    pl-11
                    pr-4
                    text-sm
                    text-text-primary
                    outline-none
                    transition
                    placeholder:text-slate-400
                    hover:border-slate-400
                    focus:border-primary
                    focus:ring-4
                    focus:ring-primary/10
                    disabled:cursor-not-allowed
                    disabled:bg-slate-100
                    disabled:opacity-70
                  "
                />

              </div>

            </div>


            {
              mensagemErro && (

                <div
                  role="alert"
                  aria-live="polite"
                  className="
                    rounded-xl
                    border
                    border-red-200
                    bg-danger-light
                    px-4
                    py-3
                  "
                >

                  <p className="
                    text-sm
                    font-medium
                    leading-6
                    text-danger
                  ">

                    {mensagemErro}

                  </p>

                </div>

              )
            }


            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={
                carregando
              }
              loadingText="Enviando..."
            >

              Enviar link de recuperação

            </Button>

          </div>

        </form>


        <div className="
          mt-6
          text-center
        ">

          <Link
            href="/login"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-primary
              transition
              hover:text-primary-dark
              hover:underline
            "
          >

            <ArrowLeft
              className="
                h-4
                w-4
              "
            />

            Voltar para o login

          </Link>

        </div>

      </Card>

    </PublicLayout>

  );

}