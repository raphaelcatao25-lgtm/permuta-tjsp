"use client";

import Link from "next/link";

import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  usePathname
} from "next/navigation";

import {
  Bell,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  RefreshCcw,
  UserRound,
  X
} from "lucide-react";

import {
  Logo
} from "@/components/logo/Logo";

import {
  supabase
} from "@/lib/supabase";


type SidebarProps = {
  aberta: boolean;
  onClose: () => void;
  retraida?: boolean;
  onToggleRetraida?: () => void;
};


const menuItems = [
  {
    href: "/dashboard",
    label: "Início",
    icon: Home
  },
  {
    href: "/perfil",
    label: "Meu perfil",
    icon: UserRound
  },
  {
    href: "/buscar-permutas",
    label: "Buscar permutas",
    icon: RefreshCcw
  },
  {
    href: "/propostas",
    label: "Propostas",
    icon: FileText
  },
  {
    href: "/notificacoes",
    label: "Notificações",
    icon: Bell
  }
];


export function Sidebar({
  aberta,
  onClose,
  retraida = false,
  onToggleRetraida
}: SidebarProps) {

  const pathname =
    usePathname();


  const [
    notificacoesNaoLidas,
    setNotificacoesNaoLidas
  ] = useState(0);


  /* ======================================================
     CONTADOR DE NOTIFICAÇÕES
  ====================================================== */

  const consultaEmAndamento =
    useRef(false);


  const tentativaPendente =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );


  useEffect(() => {

    let ativo = true;


    /*
    ========================================
    CONSULTA O CONTADOR
    ========================================

    Recebe o UUID quando ele já é conhecido
    pelo evento de autenticação.

    Isso evita chamar getSession() novamente
    justamente durante a transição do login.
    */

    async function carregarNotificacoesNaoLidas(
      usuarioIdDireto?: string,
      permitirNovaTentativa = true
    ) {

      if (
        !ativo
        ||
        consultaEmAndamento.current
      ) {

        return;

      }


      let idUsuario =
        usuarioIdDireto;


      /*
      ========================================
      OBTÉM A SESSÃO SOMENTE SE NECESSÁRIO
      ========================================
      */

      if (!idUsuario) {

        const {
          data: dadosSessao,
          error: erroSessao
        } = await supabase.auth.getSession();


        if (!ativo) {
          return;
        }


        if (erroSessao) {

          setNotificacoesNaoLidas(0);

          return;

        }


        idUsuario =
          dadosSessao.session?.user.id;

      }


      if (!idUsuario) {

        setNotificacoesNaoLidas(0);

        return;

      }


      consultaEmAndamento.current =
        true;


      try {

        const {
          count,
          error
        } = await supabase
          .from(
            "notificacoes"
          )
          .select(
            "id",
            {
              count: "exact",
              head: true
            }
          )
          .eq(
            "usuario_id",
            idUsuario
          )
          .eq(
            "lida",
            false
          );


        if (!ativo) {
          return;
        }


        /*
        ========================================
        ERRO TRANSITÓRIO APÓS LOGIN
        ========================================

        Durante SIGNED_IN pode existir uma
        pequena janela até a sessão estar
        totalmente disponível para a consulta.

        Não exibimos console.error, pois isso
        gerava o overlay vermelho do Next em
        desenvolvimento.

        Fazemos somente uma nova tentativa
        curta. Se ainda falhar, o contador fica
        em zero até o próximo evento de foco,
        visibilidade ou atualização interna.
        */

        if (error) {

          setNotificacoesNaoLidas(0);


          if (
            permitirNovaTentativa
            &&
            ativo
          ) {

            if (
              tentativaPendente.current
            ) {

              clearTimeout(
                tentativaPendente.current
              );

            }


            tentativaPendente.current =
              setTimeout(
                () => {

                  consultaEmAndamento.current =
                    false;

                  carregarNotificacoesNaoLidas(
                    idUsuario,
                    false
                  );

                },
                500
              );

              return;

          }


          return;

        }


        setNotificacoesNaoLidas(
          count ?? 0
        );

      }

      finally {

        consultaEmAndamento.current =
          false;

      }

    }


    /*
    ========================================
    PRIMEIRA CARGA
    ========================================
    */

    carregarNotificacoesNaoLidas();


    /*
    ========================================
    QUANDO VOLTA PARA A JANELA
    ========================================
    */

    function aoGanharFoco() {

      carregarNotificacoesNaoLidas();

    }


    /*
    ========================================
    QUANDO VOLTA PARA A ABA
    ========================================
    */

    function aoMudarVisibilidade() {

      if (
        document.visibilityState ===
        "visible"
      ) {

        carregarNotificacoesNaoLidas();

      }

    }


    /*
    ========================================
    EVENTO INTERNO
    ========================================

    Usado quando uma notificação é marcada
    como lida ou quando alguma ação gera uma
    nova notificação.
    */

    function atualizarContador() {

      carregarNotificacoesNaoLidas();

    }


    window.addEventListener(
      "focus",
      aoGanharFoco
    );


    window.addEventListener(
      "atualizar-notificacoes",
      atualizarContador
    );


    document.addEventListener(
      "visibilitychange",
      aoMudarVisibilidade
    );


    /*
    ========================================
    AUTH
    ========================================

    No login usamos diretamente o UUID que
    chegou na nova sessão. A consulta é
    agendada para o próximo ciclo do navegador,
    evitando disputar com a atualização interna
    da sessão do Supabase.
    */

    const {
      data: authListener
    } = supabase.auth.onAuthStateChange(
      (_evento, sessao) => {

        if (!ativo) {
          return;
        }


        if (!sessao?.user) {

          setNotificacoesNaoLidas(0);

          return;

        }


        if (
          tentativaPendente.current
        ) {

          clearTimeout(
            tentativaPendente.current
          );

        }


        tentativaPendente.current =
          setTimeout(
            () => {

              carregarNotificacoesNaoLidas(
                sessao.user.id
              );

            },
            0
          );

      }
    );


    return () => {

      ativo = false;


      if (
        tentativaPendente.current
      ) {

        clearTimeout(
          tentativaPendente.current
        );

      }


      window.removeEventListener(
        "focus",
        aoGanharFoco
      );


      window.removeEventListener(
        "atualizar-notificacoes",
        atualizarContador
      );


      document.removeEventListener(
        "visibilitychange",
        aoMudarVisibilidade
      );


      authListener.subscription.unsubscribe();

    };

  }, []);


  /*
  ======================================================
  ATUALIZA QUANDO MUDA DE PÁGINA
  ======================================================

  Mantemos o badge sincronizado quando a
  navegação muda, mas sem criar uma segunda
  consulta concorrente no login.
  */

  useEffect(() => {

    if (
      pathname ===
      "/notificacoes"
    ) {

      window.dispatchEvent(
        new Event(
          "atualizar-notificacoes"
        )
      );

    }

  }, [pathname]);


  /*
  ======================================================
  BADGE
  ======================================================
  */

  const textoBadge =

    notificacoesNaoLidas > 9

      ? "9+"

      : String(
          notificacoesNaoLidas
        );


  return (

    <>

      {
        aberta && (

          <button
            type="button"
            aria-label="Fechar menu"
            onClick={onClose}
            className="
              fixed
              inset-0
              z-40
              bg-slate-950/40
              backdrop-blur-sm
              lg:hidden
            "
          />

        )
      }


      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-300",

          retraida
            ? "lg:w-20"
            : "lg:w-72",

          "w-72 lg:translate-x-0",

          aberta
            ? "translate-x-0"
            : "-translate-x-full"

        ].join(" ")}
      >


        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <div
          className={[
            "flex min-h-16 items-center border-b border-slate-200 transition-all duration-300",

            retraida

              ? "justify-center px-3 lg:justify-center"

              : "justify-between px-5"

          ].join(" ")}
        >


          <div
            className={[
              "min-w-0 overflow-hidden transition-all duration-300",

              retraida

                ? "lg:w-0 lg:opacity-0"

                : "w-auto opacity-100"

            ].join(" ")}
          >

            <Logo />

          </div>


          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-slate-900
              focus-visible:outline-none
              focus-visible:ring-4
              focus-visible:ring-blue-900/20
              lg:hidden
            "
          >

            <X
              aria-hidden="true"
              className="
                h-5
                w-5
              "
              strokeWidth={1.8}
            />

          </button>


          {
            onToggleRetraida && (

              <button
                type="button"

                onClick={
                  onToggleRetraida
                }

                aria-label={
                  retraida
                    ? "Expandir menu lateral"
                    : "Recolher menu lateral"
                }

                title={
                  retraida
                    ? "Expandir menu lateral"
                    : "Recolher menu lateral"
                }

                className="
                  hidden
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-500
                  transition
                  hover:bg-slate-100
                  hover:text-blue-900
                  focus-visible:outline-none
                  focus-visible:ring-4
                  focus-visible:ring-blue-900/20
                  lg:flex
                "
              >

                {
                  retraida

                    ? (

                      <ChevronRight
                        aria-hidden="true"
                        className="
                          h-5
                          w-5
                        "
                        strokeWidth={1.8}
                      />

                    )

                    : (

                      <ChevronLeft
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

            )
          }

        </div>


        {/* =================================================
            ÁREA DO SERVIDOR
        ================================================= */}

        <div
          className={[
            "overflow-hidden border-b border-slate-200 transition-all duration-300",

            retraida

              ? "lg:max-h-0 lg:border-b-0 lg:px-0 lg:py-0 lg:opacity-0"

              : "max-h-40 px-5 py-5 opacity-100"

          ].join(" ")}
        >

          <p className="
            whitespace-nowrap
            text-xs
            font-semibold
            uppercase
            tracking-wider
            text-blue-900
          ">

            Área do servidor

          </p>


          <p className="
            mt-1
            min-w-60
            text-sm
            leading-5
            text-slate-500
          ">

            Gerencie seu perfil e acompanhe oportunidades de permuta.

          </p>

        </div>


        {/* =================================================
            MENU
        ================================================= */}

        <nav
          className={[
            "flex-1 space-y-1 overflow-y-auto py-5 transition-all duration-300",

            retraida
              ? "lg:px-3"
              : "px-3"

          ].join(" ")}
        >

          {
            menuItems.map(
              item => {

                const Icon =
                  item.icon;


                const ativo =

                  pathname ===
                  item.href

                  ||

                  (
                    item.href !==
                    "/dashboard"

                    &&

                    pathname.startsWith(
                      `${item.href}/`
                    )
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

                    aria-label={
                      retraida
                        ? item.label
                        : undefined
                    }

                    title={
                      retraida
                        ? item.label
                        : undefined
                    }

                    className={[
                      "group relative flex min-h-11 items-center rounded-xl py-2.5 text-sm font-medium transition",

                      retraida

                        ? "lg:justify-center lg:gap-0 lg:px-2"

                        : "gap-3 px-3",

                      ativo

                        ? "bg-blue-900 text-white shadow-sm"

                        : "text-slate-600 hover:bg-blue-50 hover:text-blue-900"

                    ].join(" ")}
                  >


                    {/* ÍCONE + BADGE */}

                    <div className="
                      relative
                      shrink-0
                    ">

                      <Icon
                        aria-hidden="true"

                        className={[
                          "h-5 w-5 shrink-0 transition",

                          ativo

                            ? "text-white"

                            : "text-slate-500 group-hover:text-blue-900"

                        ].join(" ")}

                        strokeWidth={1.8}
                      />


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
                              bg-red-600
                              px-1
                              text-[10px]
                              font-bold
                              leading-none
                              text-white
                              shadow-sm
                              ring-2
                              ring-white
                            "
                          >

                            {textoBadge}

                          </span>

                        )
                      }

                    </div>


                    {/* TEXTO */}

                    <span
                      className={[
                        "whitespace-nowrap transition-all duration-300",

                        retraida

                          ? "lg:w-0 lg:overflow-hidden lg:opacity-0"

                          : "w-auto opacity-100",

                        ativo

                          ? "text-white"

                          : "text-slate-600 group-hover:text-blue-900"

                      ].join(" ")}
                    >

                      {item.label}

                    </span>


                    {/* BADGE MENU ABERTO */}

                    {
                      mostrarBadge && (

                        <span
                          aria-label={
                            `${notificacoesNaoLidas} notificações não lidas`
                          }

                          className={[
                            "ml-auto flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm",

                            retraida
                              ? "lg:hidden"
                              : ""

                          ].join(" ")}
                        >

                          {textoBadge}

                        </span>

                      )
                    }


                    {/* TOOLTIP SIDEBAR RETRAÍDA */}

                    {
                      retraida && (

                        <span className="
                          pointer-events-none
                          absolute
                          left-full
                          z-50
                          ml-3
                          hidden
                          whitespace-nowrap
                          rounded-lg
                          bg-slate-950
                          px-3
                          py-2
                          text-xs
                          font-semibold
                          text-white
                          opacity-0
                          shadow-lg
                          transition-opacity
                          group-hover:opacity-100
                          lg:block
                        ">

                          {item.label}

                          {
                            mostrarBadge &&
                            ` (${notificacoesNaoLidas})`
                          }

                        </span>

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
          className={[
            "overflow-hidden border-t border-slate-200 transition-all duration-300",

            retraida

              ? "lg:max-h-0 lg:border-t-0 lg:px-0 lg:py-0 lg:opacity-0"

              : "max-h-24 px-5 py-4 opacity-100"

          ].join(" ")}
        >

          <p className="
            whitespace-nowrap
            text-xs
            leading-5
            text-slate-400
          ">

            Permuta TJSP

          </p>


          <p className="
            whitespace-nowrap
            text-xs
            leading-5
            text-slate-400
          ">

            Conectando servidores

          </p>

        </div>


      </aside>

    </>

  );

}