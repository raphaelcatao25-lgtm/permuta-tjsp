"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  usePathname,
} from "next/navigation";

import {
  Bell,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  RefreshCw,
  Search,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import {
  Logo,
} from "@/components/logo/Logo";

import {
  supabase,
} from "@/lib/supabase";


type SidebarProps = {
  aberta: boolean;
  onClose: () => void;
  retraida: boolean;
  onToggleRetraida: () => void;
};


/* =========================================================
   ITENS DO MENU
========================================================= */

const itensMenu = [

  {
    nome: "Início",
    href: "/dashboard",
    icone: Home,
  },

  {
    nome: "Meu perfil",
    href: "/perfil",
    icone: UserRound,
  },

  {
    nome: "Buscar permutas",
    href: "/buscar-permutas",
    icone: RefreshCw,
  },

  {
    nome: "Buscar servidores",
    href: "/buscar-servidores",
    icone: UsersRound,
  },

  {
    nome: "Propostas",
    href: "/propostas",
    icone: FileText,
  },

  {
    nome: "Notificações",
    href: "/notificacoes",
    icone: Bell,
  },

];


/* =========================================================
   COMPONENTE
========================================================= */

export function Sidebar({
  aberta,
  onClose,
  retraida,
  onToggleRetraida,
}: SidebarProps) {

  const pathname =
    usePathname();


  const [
    notificacoesNaoLidas,
    setNotificacoesNaoLidas,
  ] =
    useState(0);


  const consultaEmAndamento =
    useRef(false);


  const componenteAtivo =
    useRef(true);


  /* =======================================================
     VERIFICA ROTA ATIVA
  ======================================================= */

  function rotaAtiva(
    href: string
  ) {

    if (
      href === "/dashboard"
    ) {

      return (
        pathname === "/dashboard"
      );

    }


    return (

      pathname === href

      ||

      pathname.startsWith(
        `${href}/`
      )

    );

  }


  /* =======================================================
     CARREGA CONTADOR DE NOTIFICAÇÕES
  ======================================================= */

  const carregarNotificacoesNaoLidas =
    useCallback(

      async (
        usuarioIdDireto?: string
      ) => {

        /*
        Evita consultas duplicadas.
        */

        if (
          consultaEmAndamento.current
        ) {

          return;

        }


        consultaEmAndamento.current =
          true;


        try {

          let usuarioId =
            usuarioIdDireto;


          /*
          Caso o ID não tenha sido informado,
          recupera a sessão atual.
          */

          if (!usuarioId) {

            const {
              data: dadosSessao,
            } =
              await supabase.auth.getSession();


            if (
              !componenteAtivo.current
            ) {

              return;

            }


            usuarioId =
              dadosSessao.session?.user.id;

          }


          /*
          Nenhum usuário autenticado.
          */

          if (!usuarioId) {

            if (
              componenteAtivo.current
            ) {

              setNotificacoesNaoLidas(0);

            }


            return;

          }


          /*
          Conta as notificações não lidas
          pertencentes ao usuário atual.
          */

          const {
            count,
            error,
          } =
            await supabase
              .from("notificacoes")
              .select(
                "id",
                {
                  count: "exact",
                  head: true,
                }
              )
              .eq(
                "usuario_id",
                usuarioId
              )
              .eq(
                "lida",
                false
              );


          if (
            !componenteAtivo.current
          ) {

            return;

          }


          /*
          IMPORTANTE:

          Não usamos console.error aqui.

          Uma consulta pode falhar durante uma
          transição de sessão ou enquanto o token
          está sendo restaurado.

          No Next.js 16, console.error em desenvolvimento
          gera o painel vermelho na interface.
          */

          if (error) {

            setNotificacoesNaoLidas(0);

            return;

          }


          setNotificacoesNaoLidas(
            Number(
              count ?? 0
            )
          );

        }

        catch {

          /*
          Falha temporária não deve derrubar
          a navegação nem gerar overlay do Next.
          */

          if (
            componenteAtivo.current
          ) {

            setNotificacoesNaoLidas(0);

          }

        }

        finally {

          consultaEmAndamento.current =
            false;

        }

      },

      []

    );


  /* =======================================================
     INICIALIZA CONTADOR
  ======================================================= */

  useEffect(() => {

    componenteAtivo.current =
      true;


    carregarNotificacoesNaoLidas();


    return () => {

      componenteAtivo.current =
        false;

    };

  }, [
    carregarNotificacoesNaoLidas,
  ]);


  /* =======================================================
     AUTH
  ======================================================= */

  useEffect(() => {

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (
          _evento,
          sessao
        ) => {

          /*
          Executamos fora do ciclo imediato
          do callback do Supabase.
          */

          setTimeout(
            () => {

              if (
                !componenteAtivo.current
              ) {

                return;

              }


              if (
                !sessao?.user
              ) {

                setNotificacoesNaoLidas(0);

                return;

              }


              carregarNotificacoesNaoLidas(
                sessao.user.id
              );

            },
            0
          );

        }
      );


    return () => {

      authListener
        .subscription
        .unsubscribe();

    };

  }, [
    carregarNotificacoesNaoLidas,
  ]);


  /* =======================================================
     EVENTOS DE ATUALIZAÇÃO
  ======================================================= */

  useEffect(() => {

    function atualizarContador() {

      carregarNotificacoesNaoLidas();

    }


    function aoGanharFoco() {

      carregarNotificacoesNaoLidas();

    }


    function aoMudarVisibilidade() {

      if (
        document.visibilityState ===
        "visible"
      ) {

        carregarNotificacoesNaoLidas();

      }

    }


    window.addEventListener(
      "atualizar-notificacoes",
      atualizarContador
    );


    window.addEventListener(
      "focus",
      aoGanharFoco
    );


    document.addEventListener(
      "visibilitychange",
      aoMudarVisibilidade
    );


    return () => {

      window.removeEventListener(
        "atualizar-notificacoes",
        atualizarContador
      );


      window.removeEventListener(
        "focus",
        aoGanharFoco
      );


      document.removeEventListener(
        "visibilitychange",
        aoMudarVisibilidade
      );

    };

  }, [
    carregarNotificacoesNaoLidas,
  ]);


  /* =======================================================
     AO TROCAR DE PÁGINA
  ======================================================= */

  useEffect(() => {

    /*
    Atualizamos o contador também quando
    existe mudança de rota dentro da área
    autenticada.
    */

    carregarNotificacoesNaoLidas();

  }, [
    pathname,
    carregarNotificacoesNaoLidas,
  ]);


  /* =======================================================
     BADGE
  ======================================================= */

  const textoBadge =

    notificacoesNaoLidas > 9

      ? "9+"

      : String(
          notificacoesNaoLidas
        );


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <>

      {/* ===================================================
          FUNDO ESCURO MOBILE
      =================================================== */}

      {
        aberta && (

          <button
            type="button"

            aria-label="Fechar menu"

            onClick={
              onClose
            }

            className="
              fixed
              inset-0
              z-40
              bg-slate-950/70
              backdrop-blur-[2px]
              lg:hidden
            "
          />

        )
      }


      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        className={[
          `
            fixed
            inset-y-0
            left-0
            z-50
            flex
            flex-col
            border-r
            border-teal-300/10
            bg-[#061521]
            shadow-2xl
            transition-all
            duration-300
          `,

          retraida
            ? "w-72 lg:w-20"
            : "w-72",

          aberta
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",

        ].join(" ")}
      >


        {/* =================================================
            TOPO / LOGO
        ================================================= */}

        <div
          className={[
            `
              flex
              min-h-[66px]
              items-center
              border-b
              border-teal-300/10
            `,

            retraida
              ? "justify-between px-4 lg:justify-center lg:px-2"
              : "justify-between px-5",

          ].join(" ")}
        >


          {/* LOGO */}

          <div
            className={
              retraida
                ? "lg:flex lg:justify-center"
                : ""
            }
          >

            <Logo
              href="/"
              compact={
                retraida
              }
            />

          </div>


          {/* FECHAR MOBILE */}

          <button
            type="button"

            onClick={
              onClose
            }

            aria-label="Fechar menu"

            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              text-slate-400
              transition-all
              duration-200
              hover:-translate-y-[1px]
              hover:bg-teal-400/10
              hover:text-teal-200
              lg:hidden
            "
          >

            <X
              className="
                h-5
                w-5
              "
              strokeWidth={1.8}
            />

          </button>


          {/* RECOLHER */}

          {
            !retraida && (

              <button
                type="button"

                onClick={
                  onToggleRetraida
                }

                aria-label="Recolher menu lateral"

                title="Recolher menu"

                className="
                  hidden
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  text-slate-400
                  transition-all
                  duration-200
                  hover:-translate-y-[1px]
                  hover:bg-teal-400/10
                  hover:text-teal-200
                  lg:flex
                "
              >

                <ChevronLeft
                  className="
                    h-5
                    w-5
                  "
                  strokeWidth={1.8}
                />

              </button>

            )
          }

        </div>


        {/* =================================================
            EXPANDIR
        ================================================= */}

        {
          retraida && (

            <div
              className="
                hidden
                justify-center
                border-b
                border-teal-300/10
                py-3
                lg:flex
              "
            >

              <button
                type="button"

                onClick={
                  onToggleRetraida
                }

                aria-label="Expandir menu lateral"

                title="Expandir menu"

                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  text-slate-400
                  transition-all
                  duration-200
                  hover:-translate-y-[1px]
                  hover:bg-teal-400/10
                  hover:text-teal-200
                "
              >

                <ChevronRight
                  className="
                    h-5
                    w-5
                  "
                  strokeWidth={1.8}
                />

              </button>

            </div>

          )
        }


        {/* =================================================
            ÁREA DO SERVIDOR
        ================================================= */}

        {
          !retraida && (

            <div
              className="
                border-b
                border-teal-300/10
                px-5
                py-5
              "
            >

              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-teal-400
                "
              >
                Área do servidor
              </p>


              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-400
                "
              >
                Gerencie seu perfil e acompanhe
                oportunidades de permuta.
              </p>

            </div>

          )
        }


        {/* =================================================
            NAVEGAÇÃO
        ================================================= */}

        <nav
          className={[
            `
              flex-1
              space-y-2
              overflow-y-auto
              py-4
            `,

            retraida
              ? "px-3"
              : "px-4",

          ].join(" ")}
        >

          {
            itensMenu.map(
              item => {

                const Icone =
                  item.icone;


                const ativo =
                  rotaAtiva(
                    item.href
                  );


                const itemNotificacoes =
                  item.href ===
                  "/notificacoes";


                const mostrarBadge =

                  itemNotificacoes

                  &&

                  notificacoesNaoLidas > 0;


                return (

                  <Link
                    key={
                      item.href
                    }

                    href={
                      item.href
                    }

                    onClick={
                      onClose
                    }

                    title={
                      retraida
                        ? item.nome
                        : undefined
                    }

                    className={[
                      `
                        group
                        relative
                        flex
                        min-h-11
                        items-center
                        rounded-xl
                        py-2.5
                        text-sm
                        font-medium
                        transition-all
                        duration-200
                      `,

                      retraida
                        ? `
                          lg:justify-center
                          lg:gap-0
                          lg:px-2
                        `
                        : `
                          gap-3
                          px-3
                        `,

                      ativo
                        ? `
                          border
                          border-teal-300/20
                          bg-teal-500/20
                          text-white
                          shadow-[0_5px_18px_rgba(20,184,166,0.08)]
                        `
                        : `
                          border
                          border-transparent
                          text-slate-400
                          hover:-translate-y-[1px]
                          hover:border-teal-300/10
                          hover:bg-teal-400/[0.07]
                          hover:text-teal-200
                        `,

                    ].join(" ")}
                  >


                    {/* ÍCONE */}

                    <div
                      className="
                        relative
                        shrink-0
                      "
                    >

                      <Icone
                        className={[
                          `
                            h-5
                            w-5
                            shrink-0
                            transition-colors
                            duration-200
                          `,

                          ativo
                            ? "text-teal-200"
                            : `
                              text-slate-400
                              group-hover:text-teal-300
                            `,

                        ].join(" ")}
                        strokeWidth={1.8}
                      />


                      {/* BADGE SIDEBAR RETRAÍDA */}

                      {
                        mostrarBadge &&
                        retraida && (

                          <span
                            aria-label={
                              `${notificacoesNaoLidas} notificações não lidas`
                            }

                            className="
                              absolute
                              -right-3
                              -top-3
                              flex
                              min-h-5
                              min-w-5
                              items-center
                              justify-center
                              rounded-full
                              bg-red-500
                              px-1
                              text-[10px]
                              font-bold
                              leading-none
                              text-white
                              shadow
                              ring-2
                              ring-[#061521]
                            "
                          >
                            {textoBadge}
                          </span>

                        )
                      }

                    </div>


                    {/* TEXTO */}

                    <span
                      className={
                        retraida
                          ? "lg:hidden"
                          : ""
                      }
                    >
                      {item.nome}
                    </span>


                    {/* BADGE NORMAL */}

                    {
                      mostrarBadge &&
                      !retraida && (

                        <span
                          aria-label={
                            `${notificacoesNaoLidas} notificações não lidas`
                          }

                          className="
                            ml-auto
                            flex
                            min-h-5
                            min-w-5
                            items-center
                            justify-center
                            rounded-full
                            bg-red-500
                            px-1.5
                            text-[10px]
                            font-bold
                            leading-none
                            text-white
                            shadow-sm
                          "
                        >
                          {textoBadge}
                        </span>

                      )
                    }


                    {/* INDICADOR */}

                    {
                      ativo &&
                      !retraida &&
                      !mostrarBadge && (

                        <span
                          className="
                            ml-auto
                            h-1.5
                            w-1.5
                            rounded-full
                            bg-teal-300
                            shadow-[0_0_8px_rgba(94,234,212,0.8)]
                          "
                        />

                      )
                    }

                  </Link>

                );

              }
            )
          }

        </nav>


        {/* =================================================
            RODAPÉ
        ================================================= */}

        <div
          className="
            border-t
            border-teal-300/10
            p-4
          "
        >

          {
            !retraida

              ? (

                <div
                  className="
                    rounded-2xl
                    border
                    border-teal-300/10
                    bg-teal-400/[0.04]
                    px-4
                    py-3
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <Search
                      className="
                        h-4
                        w-4
                        text-teal-400
                      "
                      strokeWidth={1.8}
                    />


                    <p
                      className="
                        text-xs
                        font-semibold
                        text-slate-300
                      "
                    >
                      Permuta TJSP
                    </p>

                  </div>


                  <p
                    className="
                      mt-1.5
                      text-[11px]
                      leading-4
                      text-slate-500
                    "
                  >
                    Plataforma independente para auxiliar
                    servidores na busca por permutas.
                  </p>

                </div>

              )

              : (

                <div
                  className="
                    hidden
                    justify-center
                    lg:flex
                  "
                >

                  <div
                    className="
                      h-2
                      w-2
                      rounded-full
                      bg-teal-400
                      shadow-[0_0_8px_rgba(45,212,191,0.6)]
                    "
                    title="Permuta TJSP"
                  />

                </div>

              )
          }

        </div>

      </aside>

    </>

  );

}