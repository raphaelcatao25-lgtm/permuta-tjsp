"use client";

import type {
  ReactNode
} from "react";

import {
  useEffect,
  useState
} from "react";

import {
  Header
} from "@/components/layout/Header";

import {
  Sidebar
} from "@/components/layout/Sidebar";

import {
  supabase
} from "@/lib/supabase";


type DashboardLayoutProps = {
  children: ReactNode;
  nomeUsuario?: string;
};


const STORAGE_KEY =
  "sidebar-collapsed";


export function DashboardLayout({
  children,
  nomeUsuario
}: DashboardLayoutProps) {

  const [
    sidebarAberta,
    setSidebarAberta
  ] = useState(false);


  const [
    sidebarRetraida,
    setSidebarRetraida
  ] = useState(false);


  const [
    nomeUsuarioReal,
    setNomeUsuarioReal
  ] = useState(
    nomeUsuario || "Servidor"
  );


  /* ======================================================
     SIDEBAR
  ====================================================== */

  useEffect(() => {

    const valor =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (
      valor === "true"
    ) {

      setSidebarRetraida(
        true
      );

    }

  }, []);


  /* ======================================================
     CARREGA NOME DO USUÁRIO
  ====================================================== */

  useEffect(() => {

    let ativo = true;


    async function carregarNomeUsuario() {

      /*
      Se a página já passou um nome,
      usamos esse nome.
      */

      if (
        nomeUsuario &&
        nomeUsuario.trim()
      ) {

        const primeiroNome =
          nomeUsuario
            .trim()
            .split(/\s+/)[0];


        if (ativo) {

          setNomeUsuarioReal(
            primeiroNome
          );

        }


        return;

      }


      /*
      Caso contrário, busca automaticamente
      o usuário autenticado.
      */

      const {
        data: dadosSessao
      } = await supabase.auth.getSession();


      if (!ativo) {
        return;
      }


      const usuario =
        dadosSessao.session?.user;


      if (!usuario) {

        setNomeUsuarioReal(
          "Servidor"
        );

        return;

      }


      /*
      Busca o nome no perfil.
      */

      const {
        data: perfil,
        error
      } = await supabase
        .from("perfis")
        .select("nome")
        .eq(
          "id",
          usuario.id
        )
        .maybeSingle();


      if (!ativo) {
        return;
      }


      if (
        error
      ) {

        console.error(
          "Erro ao carregar nome do usuário:",
          error
        );


        setNomeUsuarioReal(
          "Servidor"
        );

        return;

      }


      if (
        perfil?.nome
      ) {

        const primeiroNome =
          perfil.nome
            .trim()
            .split(/\s+/)[0];


        setNomeUsuarioReal(
          primeiroNome ||
          "Servidor"
        );

      }

      else {

        setNomeUsuarioReal(
          "Servidor"
        );

      }

    }


    carregarNomeUsuario();


    /* ====================================================
       TROCA DE CONTA / LOGOUT / LOGIN
    ==================================================== */

    const {
      data: authListener
    } = supabase.auth.onAuthStateChange(
      (
        _evento,
        sessao
      ) => {

        if (!ativo) {
          return;
        }


        if (
          !sessao?.user
        ) {

          setNomeUsuarioReal(
            "Servidor"
          );

          return;

        }


        /*
        Quando mudar a sessão,
        busca novamente o nome.
        */

        carregarNomeUsuario();

      }
    );


    return () => {

      ativo = false;

      authListener.subscription.unsubscribe();

    };

  }, [
    nomeUsuario
  ]);


  /* ======================================================
     RECOLHER / EXPANDIR SIDEBAR
  ====================================================== */

  function alternarSidebar() {

    setSidebarRetraida(
      atual => {

        const novo =
          !atual;


        localStorage.setItem(
          STORAGE_KEY,
          String(novo)
        );


        return novo;

      }
    );

  }


  /* ======================================================
     RENDER
  ====================================================== */

  return (

    <div className="
      min-h-screen
      bg-slate-50
    ">

      <Sidebar
        aberta={
          sidebarAberta
        }

        onClose={() =>
          setSidebarAberta(
            false
          )
        }

        retraida={
          sidebarRetraida
        }

        onToggleRetraida={
          alternarSidebar
        }
      />


      <div
        className={[
          "min-h-screen transition-[padding] duration-300",

          sidebarRetraida
            ? "lg:pl-20"
            : "lg:pl-72"

        ].join(" ")}
      >

        <Header
          nomeUsuario={
            nomeUsuarioReal
          }

          onOpenSidebar={() =>
            setSidebarAberta(
              true
            )
          }
        />


        <main className="
          px-4
          py-8
          sm:px-6
          lg:px-8
          lg:py-10
        ">

          <div className="
            mx-auto
            w-full
            max-w-7xl
          ">

            {children}

          </div>

        </main>

      </div>

    </div>

  );

}