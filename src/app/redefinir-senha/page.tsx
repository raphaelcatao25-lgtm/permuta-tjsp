"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
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


export default function RedefinirSenhaPage() {

  const [
    senha,
    setSenha,
  ] = useState("");


  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState("");


  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);


  const [
    verificando,
    setVerificando,
  ] = useState(true);


  const [
    acessoValido,
    setAcessoValido,
  ] = useState(false);


  const [
    carregando,
    setCarregando,
  ] = useState(false);


  const [
    senhaAlterada,
    setSenhaAlterada,
  ] = useState(false);


  const [
    mensagemErro,
    setMensagemErro,
  ] = useState("");


  /*
  ======================================================
  VERIFICA O ACESSO DE RECUPERAÇÃO
  ======================================================
  */

  useEffect(() => {

    let ativo = true;


    async function verificarAcesso() {

      try {

        /*
        ==================================================
        1 - CONFERE SE O LINK VEIO COM ?code=
        ==================================================

        No fluxo PKCE, o Supabase pode redirecionar para:

        /redefinir-senha?code=...
        */

        const parametros =
          new URLSearchParams(
            window.location.search
          );


        const code =
          parametros.get("code");


        if (code) {

          const {
            error,
          } =
            await supabase.auth.exchangeCodeForSession(
              code
            );


          if (error) {

            console.error(
              "Erro ao trocar código por sessão:",
              error
            );

          }

        }


        /*
        ==================================================
        2 - VERIFICA SE EXISTE SESSÃO DE RECUPERAÇÃO
        ==================================================
        */

        const {
          data,
          error,
        } =
          await supabase.auth.getSession();


        if (!ativo) {
          return;
        }


        if (error) {

          console.error(
            "Erro verificando sessão:",
            error
          );


          setAcessoValido(
            false
          );

          setVerificando(
            false
          );

          return;

        }


        if (
          data.session?.user
        ) {

          setAcessoValido(
            true
          );

        }

        else {

          setAcessoValido(
            false
          );

        }


        setVerificando(
          false
        );

      }

      catch (error) {

        console.error(
          "Erro inesperado verificando recuperação:",
          error
        );


        if (ativo) {

          setAcessoValido(
            false
          );

          setVerificando(
            false
          );

        }

      }

    }


    verificarAcesso();


    /*
    ======================================================
    ESCUTA O EVENTO PASSWORD_RECOVERY
    ======================================================
    */

    const {
      data: authListener,
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
            evento === "PASSWORD_RECOVERY"
            &&
            sessao?.user
          ) {

            setAcessoValido(
              true
            );

            setVerificando(
              false
            );

          }

        }
      );


    return () => {

      ativo = false;

      authListener.subscription.unsubscribe();

    };

  }, []);


  /*
  ======================================================
  VALIDA SENHA
  ======================================================
  */

  function validarFormulario() {

    setMensagemErro("");


    if (!senha) {

      setMensagemErro(
        "Informe sua nova senha."
      );

      return false;

    }


    if (
      senha.length < 8
    ) {

      setMensagemErro(
        "A nova senha deve possuir no mínimo 8 caracteres."
      );

      return false;

    }


    if (!confirmarSenha) {

      setMensagemErro(
        "Confirme sua nova senha."
      );

      return false;

    }


    if (
      senha !== confirmarSenha
    ) {

      setMensagemErro(
        "As senhas informadas são diferentes."
      );

      return false;

    }


    return true;

  }


  /*
  ======================================================
  ALTERAR SENHA
  ======================================================
  */

  async function alterarSenha(
    evento: FormEvent<HTMLFormElement>
  ) {

    evento.preventDefault();


    if (carregando) {
      return;
    }


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
        error,
      } =
        await supabase.auth.updateUser(
          {
            password: senha,
          }
        );


      if (error) {

        const mensagem =
          error.message.toLowerCase();


        /*
        ==================================================
        SENHA IGUAL À ANTERIOR
        ==================================================

        O Supabase atualmente pode retornar:
        "New password should be different from the old password."
        */

        if (
          mensagem.includes(
            "same password"
          )
          ||
          mensagem.includes(
            "different from the old password"
          )
        ) {

          setMensagemErro(
            "A nova senha deve ser diferente da senha utilizada anteriormente. Escolha uma nova senha."
          );

          return;

        }


        /*
        ==================================================
        OUTROS ERROS
        ==================================================
        */

        console.error(
          "Erro alterando senha:",
          error
        );


        setMensagemErro(
          "Não foi possível alterar sua senha. Solicite um novo link de recuperação e tente novamente."
        );

        return;

      }


      setSenhaAlterada(
        true
      );


      /*
      ==================================================
      ENCERRA A SESSÃO DE RECUPERAÇÃO
      ==================================================
      */

      const {
        error: logoutError,
      } =
        await supabase.auth.signOut();


      if (logoutError) {

        console.error(
          "Erro encerrando sessão após redefinição:",
          logoutError
        );

      }

    }

    catch (error) {

      console.error(
        "Erro inesperado alterando senha:",
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
  VERIFICANDO LINK
  ======================================================
  */

  if (verificando) {

    return (

      <PublicLayout
        title="Redefinir senha"
        description="Estamos validando seu link de recuperação."
        maxWidth="sm"
      >

        <Card
          padding="lg"
          shadow="lg"
        >

          <div className="
            py-8
            text-center
            text-sm
            text-text-secondary
          ">

            Verificando link de recuperação...

          </div>

        </Card>

      </PublicLayout>

    );

  }


  /*
  ======================================================
  SENHA ALTERADA
  ======================================================
  */

  if (senhaAlterada) {

    return (

      <PublicLayout
        title="Senha alterada"
        description="Sua nova senha foi cadastrada com sucesso."
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
              bg-emerald-50
              text-emerald-700
            ">

              <CheckCircle2
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

              Senha redefinida

            </h2>


            <p className="
              mt-3
              text-sm
              leading-6
              text-text-secondary
            ">

              Sua senha foi alterada com sucesso.
              Agora você já pode entrar novamente
              na sua conta.

            </p>


            <div className="
              mt-6
            ">

              <Link
                href="/login"
                className="
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-primary
                  px-6
                  py-3
                  text-sm
                  font-semibold
                  !text-white
                  transition
                  hover:bg-primary-dark
                "
              >

                Ir para o login

              </Link>

            </div>

          </div>

        </Card>

      </PublicLayout>

    );

  }


  /*
  ======================================================
  LINK INVÁLIDO OU EXPIRADO
  ======================================================
  */

  if (!acessoValido) {

    return (

      <PublicLayout
        title="Link inválido ou expirado"
        description="Não foi possível validar esta solicitação de redefinição de senha."
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
              bg-amber-50
              text-amber-700
            ">

              <KeyRound
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

              Solicite um novo link

            </h2>


            <p className="
              mt-3
              text-sm
              leading-6
              text-text-secondary
            ">

              O link pode ter expirado, já ter sido
              utilizado ou não ser válido.

            </p>


            <div className="
              mt-6
              flex
              flex-col
              gap-3
            ">

              <Link
                href="/esqueci-senha"
                className="
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-primary
                  px-6
                  py-3
                  text-sm
                  font-semibold
                  !text-white
                  transition
                  hover:bg-primary-dark
                "
              >

                Solicitar novo link

              </Link>


              <Link
                href="/login"
                className="
                  text-sm
                  font-semibold
                  text-primary
                  transition
                  hover:text-primary-dark
                  hover:underline
                "
              >

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
  FORMULÁRIO DE NOVA SENHA
  ======================================================
  */

  return (

    <PublicLayout
      title="Crie uma nova senha"
      description="Informe e confirme a nova senha que será utilizada para acessar sua conta."
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

            <KeyRound
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
            alterarSenha
          }
          noValidate
        >

          <div className="
            space-y-5
          ">


            {/* NOVA SENHA */}

            <div>

              <label
                htmlFor="nova-senha"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-text-primary
                "
              >

                Nova senha

              </label>


              <div className="
                relative
              ">

                <LockKeyhole
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
                  id="nova-senha"
                  name="nova-senha"
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  value={senha}
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
                  placeholder="Mínimo de 8 caracteres"
                  autoComplete="new-password"
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
                    pr-12
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
                  }
                  aria-label={
                    mostrarSenha
                      ? "Ocultar senha"
                      : "Mostrar senha"
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
                    text-text-muted
                    transition
                    hover:bg-slate-100
                    hover:text-text-primary
                  "
                >

                  {
                    mostrarSenha

                      ? (
                        <EyeOff
                          className="
                            h-5
                            w-5
                          "
                          strokeWidth={1.8}
                        />
                      )

                      : (
                        <Eye
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

            </div>


            {/* CONFIRMAR SENHA */}

            <div>

              <label
                htmlFor="confirmar-senha"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-text-primary
                "
              >

                Confirmar nova senha

              </label>


              <div className="
                relative
              ">

                <LockKeyhole
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
                  id="confirmar-senha"
                  name="confirmar-senha"
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  value={confirmarSenha}
                  onChange={
                    evento => {

                      setConfirmarSenha(
                        evento.target.value
                      );

                      if (
                        mensagemErro
                      ) {

                        setMensagemErro("");

                      }

                    }
                  }
                  placeholder="Digite novamente a nova senha"
                  autoComplete="new-password"
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


            {/* ERRO */}

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
              loadingText="Alterando senha..."
            >

              Salvar nova senha

            </Button>

          </div>

        </form>

      </Card>

    </PublicLayout>

  );

}