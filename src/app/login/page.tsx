"use client";

import Link from "next/link";

import {
  useRouter
} from "next/navigation";

import {
  FormEvent,
  useEffect,
  useState
} from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck
} from "lucide-react";

import {
  PublicLayout
} from "@/components/layout/PublicLayout";

import {
  Button
} from "@/components/ui/Button";

import {
  Card
} from "@/components/ui/Card";

import {
  supabase
} from "@/lib/supabase";


/* ======================================================
   DESTINO APÓS LOGIN

   Se houver:
   /login?redirect=/propostas

   retorna:
   /propostas

   Caso contrário:
   /dashboard
====================================================== */

function obterDestinoAposLogin() {

  if (
    typeof window ===
    "undefined"
  ) {

    return "/dashboard";

  }


  const parametros =
    new URLSearchParams(
      window.location.search
    );


  const redirect =
    parametros.get(
      "redirect"
    );


  if (!redirect) {

    return "/dashboard";

  }


  /*
    SEGURANÇA:

    Permitimos apenas caminhos internos do próprio site.

    Aceita:
    /propostas
    /perfil
    /buscar-permutas

    Bloqueia:
    https://site-malicioso.com
    //site-malicioso.com
  */

  if (
    !redirect.startsWith("/") ||
    redirect.startsWith("//") ||
    redirect.startsWith("/login")
  ) {

    return "/dashboard";

  }


  return redirect;

}


/* ======================================================
   PÁGINA
====================================================== */

export default function LoginPage() {

  const router =
    useRouter();


  const [
    email,
    setEmail
  ] =
    useState("");


  const [
    senha,
    setSenha
  ] =
    useState("");


  const [
    mostrarSenha,
    setMostrarSenha
  ] =
    useState(false);


  const [
    carregando,
    setCarregando
  ] =
    useState(false);


  const [
    carregandoGoogle,
    setCarregandoGoogle
  ] =
    useState(false);


  const [
    verificandoSessao,
    setVerificandoSessao
  ] =
    useState(true);


  const [
    mensagemErro,
    setMensagemErro
  ] =
    useState("");


  /* ======================================================
     REDIRECIONA APÓS AUTENTICAÇÃO
  ====================================================== */

  function redirecionarAposLogin() {

    const destino =
      obterDestinoAposLogin();


    router.replace(
      destino
    );


    router.refresh();

  }


  /* ======================================================
     VERIFICA SE JÁ EXISTE UMA SESSÃO

     Agora respeita ?redirect=
  ====================================================== */

  useEffect(() => {

    let ativo =
      true;


    async function verificarSessao() {

      const {
        data
      } =
        await supabase.auth.getSession();


      if (!ativo) {

        return;

      }


      if (
        data.session?.user
      ) {

        const destino =
          obterDestinoAposLogin();


        router.replace(
          destino
        );


        router.refresh();

        return;

      }


      setVerificandoSessao(
        false
      );

    }


    verificarSessao();


    /* ==================================================
       ACOMPANHA ALTERAÇÕES NA AUTENTICAÇÃO
    ================================================== */

    const {
      data: authListener
    } =
      supabase.auth.onAuthStateChange(
        (
          evento,
          sessao
        ) => {

          if (!ativo) {

            return;

          }


          if (
            evento ===
              "SIGNED_IN"
            &&
            sessao?.user
          ) {

            const destino =
              obterDestinoAposLogin();


            router.replace(
              destino
            );


            router.refresh();

          }

        }
      );


    return () => {

      ativo =
        false;


      authListener
        .subscription
        .unsubscribe();

    };


  }, [
    router
  ]);


  /* ======================================================
     VALIDAÇÃO
  ====================================================== */

  function validarFormulario() {

    const emailNormalizado =
      email
        .trim()
        .toLowerCase();


    if (!emailNormalizado) {

      setMensagemErro(
        "Informe seu e-mail."
      );

      return false;

    }


    if (
      !emailNormalizado.includes(
        "@"
      )
    ) {

      setMensagemErro(
        "Informe um endereço de e-mail válido."
      );

      return false;

    }


    if (!senha) {

      setMensagemErro(
        "Informe sua senha."
      );

      return false;

    }


    return true;

  }


  /* ======================================================
     TRADUZ ERROS DO SUPABASE
  ====================================================== */

  function traduzirErroLogin(
    mensagem: string
  ) {

    const mensagemNormalizada =
      mensagem.toLowerCase();


    if (
      mensagemNormalizada.includes(
        "invalid login credentials"
      )
    ) {

      return "E-mail ou senha incorretos.";

    }


    if (
      mensagemNormalizada.includes(
        "email not confirmed"
      )
    ) {

      return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";

    }


    if (
      mensagemNormalizada.includes(
        "too many requests"
      )
    ) {

      return "Muitas tentativas foram realizadas. Aguarde alguns minutos e tente novamente.";

    }


    if (
      mensagemNormalizada.includes(
        "network"
      )
    ) {

      return "Não foi possível conectar ao servidor. Verifique sua internet.";

    }


    return "Não foi possível realizar o login. Tente novamente.";

  }


  /* ======================================================
     LOGIN
  ====================================================== */

  async function fazerLogin(
    evento: FormEvent<HTMLFormElement>
  ) {

    evento.preventDefault();


    setMensagemErro("");


    if (
      !validarFormulario()
    ) {

      return;

    }


    try {

      setCarregando(
        true
      );


      const {
        error
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              email
                .trim()
                .toLowerCase(),

            password:
              senha
          }
        );


      if (error) {

        setMensagemErro(
          traduzirErroLogin(
            error.message
          )
        );

        return;

      }


      /*
        Normalmente o onAuthStateChange acima receberá
        SIGNED_IN e fará o redirecionamento.

        Mantemos este redirecionamento também como
        segurança caso o evento demore ou não seja
        disparado imediatamente.
      */

      redirecionarAposLogin();

    }

    catch {

      setMensagemErro(
        "Ocorreu um erro inesperado ao realizar o login. Tente novamente."
      );

    }

    finally {

      setCarregando(
        false
      );

    }

  }


  /* ======================================================
     LOGIN COM GOOGLE
  ====================================================== */

  async function entrarComGoogle() {

    setMensagemErro("");


    try {

      setCarregandoGoogle(
        true
      );


      const destino =
        obterDestinoAposLogin();


      const callback =
        new URL(
          "/login/google",
          window.location.origin
        );


      /*
        Preservamos o destino também durante o início
        do login Google.

        Depois verificaremos o callback /login/google
        para garantir que ele utilize esse parâmetro.
      */

      callback.searchParams.set(
        "redirect",
        destino
      );


      const {
        error
      } =
        await supabase.auth.signInWithOAuth(
          {
            provider:
              "google",

            options: {
              redirectTo:
                callback.toString()
            }
          }
        );


      if (error) {

        setMensagemErro(
          "Não foi possível iniciar o login com Google. Tente novamente."
        );


        setCarregandoGoogle(
          false
        );

      }

    }

    catch {

      setMensagemErro(
        "Ocorreu um erro inesperado ao iniciar o login com Google."
      );


      setCarregandoGoogle(
        false
      );

    }

  }


  /* ======================================================
     ENQUANTO CONFERE A SESSÃO
  ====================================================== */

  if (
    verificandoSessao
  ) {

    return (

      <PublicLayout
        title="Acesse sua conta"
        description="Verificando sua sessão..."
        maxWidth="sm"
      >

        <Card
          padding="lg"
          shadow="lg"
        >

          <div
            className="
              py-8
              text-center
              text-sm
              text-text-secondary
            "
          >

            Verificando acesso...

          </div>

        </Card>

      </PublicLayout>

    );

  }


  /* ======================================================
     TELA DE LOGIN
  ====================================================== */

  return (

    <PublicLayout
      title="Acesse sua conta"
      description="Entre para visualizar oportunidades de permuta, acompanhar propostas e atualizar suas preferências."
      maxWidth="sm"
    >

      <Card
        padding="lg"
        shadow="lg"
      >


        {/* =================================================
            ÍCONE
        ================================================= */}

        <div
          className="
            mb-7
            flex
            justify-center
          "
        >

          <div
            className="
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              border
              border-teal-300/15
              bg-teal-400/10
              text-teal-300
              shadow-[0_0_28px_rgba(20,184,166,0.10)]
            "
          >

            <LockKeyhole
              aria-hidden="true"
              className="
                h-7
                w-7
              "
              strokeWidth={1.8}
            />

          </div>

        </div>


        {/* =================================================
            GOOGLE
        ================================================= */}

        <button
          type="button"

          onClick={
            entrarComGoogle
          }

          disabled={
            carregando
            ||
            carregandoGoogle
          }

          className="
            flex
            min-h-12
            w-full
            items-center
            justify-center
            gap-3
            rounded-xl
            border
            border-teal-300/15
            bg-[#0b1e2d]
            px-4
            py-3
            text-sm
            font-semibold
            text-white
            transition-all
            duration-200

            hover:-translate-y-0.5
            hover:border-teal-300/30
            hover:bg-[#10283a]

            active:translate-y-0
            active:scale-[0.98]

            focus-visible:outline-none
            focus-visible:ring-4
            focus-visible:ring-teal-400/10

            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >

          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="
              h-5
              w-5
              shrink-0
            "
          >

            <path
              fill="#4285F4"
              d="M21.6 12.23c0-.71-.06-1.4-.19-2.07H12v3.91h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.31 2.98-7.37Z"
            />

            <path
              fill="#34A853"
              d="M12 22c2.7 0 4.97-.89 6.62-2.4l-3.23-2.51c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"
            />

            <path
              fill="#FBBC05"
              d="M6.4 13.93A6.02 6.02 0 0 1 6.09 12c0-.67.11-1.32.31-1.93V7.48H3.06A10 10 0 0 0 2 12c0 1.61.38 3.13 1.06 4.52l3.34-2.59Z"
            />

            <path
              fill="#EA4335"
              d="M12 5.95c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 2.96 14.7 2 12 2a10 10 0 0 0-8.94 5.48l3.34 2.59C7.19 7.71 9.4 5.95 12 5.95Z"
            />

          </svg>


          {
            carregandoGoogle
              ? "Abrindo Google..."
              : "Continuar com Google"
          }

        </button>


        {/* =================================================
            DIVISOR
        ================================================= */}

        <div
          className="
            my-6
            flex
            items-center
            gap-4
          "
        >

          <div
            className="
              h-px
              flex-1
              bg-white/10
            "
          />


          <span
            className="
              text-xs
              font-medium
              uppercase
              tracking-wider
              text-slate-500
            "
          >

            ou

          </span>


          <div
            className="
              h-px
              flex-1
              bg-white/10
            "
          />

        </div>


        {/* =================================================
            FORMULÁRIO
        ================================================= */}

        <form
          onSubmit={
            fazerLogin
          }
          noValidate
        >

          <div
            className="
              space-y-5
            "
          >


            {/* E-MAIL */}

            <div>

              <label
                htmlFor="email"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-white
                "
              >

                E-mail

              </label>


              <div
                className="
                  relative
                "
              >

                <Mail
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    h-5
                    w-5
                    -translate-y-1/2
                    text-slate-500
                  "
                  strokeWidth={1.8}
                />


                <input
                  id="email"
                  name="email"
                  type="email"

                  value={
                    email
                  }

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

                  spellCheck={
                    false
                  }

                  disabled={
                    carregando
                    ||
                    carregandoGoogle
                  }

                  className="
                    min-h-12
                    w-full
                    rounded-xl
                    border
                    border-teal-300/15
                    bg-[#081b29]
                    py-3
                    pl-11
                    pr-4
                    text-sm
                    text-white
                    outline-none
                    transition

                    placeholder:text-slate-600

                    hover:border-teal-300/30

                    focus:border-teal-400
                    focus:ring-4
                    focus:ring-teal-400/10

                    disabled:cursor-not-allowed
                    disabled:opacity-70
                  "
                />

              </div>

            </div>


            {/* SENHA */}

            <div>

              <div
                className="
                  mb-2
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >

                <label
                  htmlFor="senha"
                  className="
                    block
                    text-sm
                    font-semibold
                    text-white
                  "
                >

                  Senha

                </label>


                <span
                  className="
                    text-xs
                    text-slate-500
                  "
                >

                  Mínimo de 8 caracteres

                </span>

              </div>


              <div
                className="
                  relative
                "
              >

                <LockKeyhole
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    h-5
                    w-5
                    -translate-y-1/2
                    text-slate-500
                  "
                  strokeWidth={1.8}
                />


                <input
                  id="senha"
                  name="senha"

                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }

                  value={
                    senha
                  }

                  onChange={
                    evento => {

                      setSenha(
                        evento.target.value
                      );


                      if (
                        mensagemErro
                      ) {

                        setMensagemErro("");

                      }

                    }
                  }

                  placeholder="Digite sua senha"

                  autoComplete="current-password"

                  disabled={
                    carregando
                    ||
                    carregandoGoogle
                  }

                  className="
                    min-h-12
                    w-full
                    rounded-xl
                    border
                    border-teal-300/15
                    bg-[#081b29]
                    py-3
                    pl-11
                    pr-12
                    text-sm
                    text-white
                    outline-none
                    transition

                    placeholder:text-slate-600

                    hover:border-teal-300/30

                    focus:border-teal-400
                    focus:ring-4
                    focus:ring-teal-400/10

                    disabled:cursor-not-allowed
                    disabled:opacity-70
                  "
                />


                <button
                  type="button"

                  onClick={() =>
                    setMostrarSenha(
                      valorAtual =>
                        !valorAtual
                    )
                  }

                  disabled={
                    carregando
                    ||
                    carregandoGoogle
                  }

                  aria-label={
                    mostrarSenha
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }

                  aria-pressed={
                    mostrarSenha
                  }

                  className="
                    absolute
                    right-2
                    top-1/2
                    flex
                    h-9
                    w-9
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-500
                    transition

                    hover:bg-teal-400/10
                    hover:!text-teal-300

                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-teal-400/30

                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >

                  {
                    mostrarSenha

                      ? (

                        <EyeOff
                          aria-hidden="true"
                          className="
                            h-5
                            w-5
                          "
                          strokeWidth={1.8}
                        />

                      )

                      : (

                        <Eye
                          aria-hidden="true"
                          className="
                            h-5
                            w-5
                          "
                          strokeWidth={1.8}
                        />

                      )
                  }

                </button>

              </div>


              {/* ESQUECI MINHA SENHA */}

              <div
                className="
                  mt-3
                  flex
                  justify-end
                "
              >

                <Link
                  href="/esqueci-senha"

                  className="
                    rounded-md
                    text-sm
                    font-medium
                    !text-teal-300
                    transition-colors
                    duration-200

                    hover:!text-teal-200
                    hover:underline
                    hover:underline-offset-4

                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-teal-400/30
                  "
                >

                  Esqueci minha senha

                </Link>

              </div>

            </div>


            {/* ERRO */}

            {
              mensagemErro && (

                <div
                  role="alert"

                  aria-live="polite"

                  className="
                    rounded-xl
                    border
                    border-red-400/20
                    bg-red-400/10
                    px-4
                    py-3
                  "
                >

                  <p
                    className="
                      text-sm
                      font-medium
                      leading-6
                      text-red-300
                    "
                  >

                    {mensagemErro}

                  </p>

                </div>

              )
            }


            {/* ENTRAR */}

            <Button
              type="submit"
              size="lg"
              fullWidth

              loading={
                carregando
              }

              loadingText="Entrando..."
            >

              Entrar

            </Button>

          </div>

        </form>


        {/* =================================================
            PRIMEIRO ACESSO
        ================================================= */}

        <div
          className="
            my-7
            flex
            items-center
            gap-4
          "
        >

          <div
            className="
              h-px
              flex-1
              bg-white/10
            "
          />


          <span
            className="
              text-xs
              font-semibold
              uppercase
              tracking-[0.16em]
              text-slate-500
            "
          >

            Primeiro acesso

          </span>


          <div
            className="
              h-px
              flex-1
              bg-white/10
            "
          />

        </div>


        {/* =================================================
            CADASTRO
        ================================================= */}

        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            gap-3
            sm:flex-row
          "
        >

          <span
            className="
              text-sm
              text-slate-300
            "
          >

            Ainda não possui uma conta?

          </span>


          <Link
            href="/cadastro"

            className="
              inline-flex
              min-h-10
              items-center
              justify-center
              rounded-xl
              border
              border-teal-300/30
              bg-teal-400/[0.05]
              px-4
              py-2
              text-sm
              font-semibold
              !text-teal-300
              transition-all
              duration-200

              hover:-translate-y-0.5
              hover:border-teal-300/60
              hover:bg-teal-400/10
              hover:!text-teal-200
              hover:shadow-lg
              hover:shadow-teal-950/20

              active:translate-y-0
              active:scale-[0.97]

              focus-visible:outline-none
              focus-visible:ring-4
              focus-visible:ring-teal-400/15
            "
          >

            Criar cadastro

          </Link>

        </div>


        {/* =================================================
            SEGURANÇA
        ================================================= */}

        <div
          className="
            group
            mt-7
            rounded-2xl
            border
            border-teal-300/15
            bg-[#0b1e2d]
            p-5
            shadow-sm
            transition-all
            duration-200

            hover:-translate-y-0.5
            hover:border-teal-300/30
            hover:bg-[#0e2638]
            hover:shadow-lg
            hover:shadow-black/10
          "
        >

          <div
            className="
              flex
              items-start
              gap-4
            "
          >

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-teal-300/20
                bg-teal-400/10
                text-teal-300
                transition
                duration-200

                group-hover:border-teal-300/35
                group-hover:bg-teal-400/15
              "
            >

              <ShieldCheck
                aria-hidden="true"
                className="
                  h-5
                  w-5
                "
                strokeWidth={1.8}
              />

            </div>


            <div>

              <p
                className="
                  text-sm
                  font-semibold
                  text-white
                "
              >

                Seus dados estão protegidos

              </p>


              <p
                className="
                  mt-1.5
                  text-xs
                  leading-5
                  text-slate-400
                "
              >

                Seus dados de contato somente serão compartilhados
                conforme as regras de aceite das propostas de permuta.

              </p>

            </div>

          </div>

        </div>

      </Card>


      {/* =================================================
          AVISO
      ================================================= */}

      <p
        className="
          mt-5
          text-center
          text-xs
          leading-5
          text-slate-500
        "
      >

        Esta plataforma é independente e não representa um canal oficial
        do Tribunal de Justiça de São Paulo.

      </p>

    </PublicLayout>

  );

}