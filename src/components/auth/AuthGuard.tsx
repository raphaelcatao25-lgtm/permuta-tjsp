"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();

  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    let componenteAtivo = true;

    async function verificarSessao() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!componenteAtivo) {
        return;
      }

      if (error || !session) {
        setAutenticado(false);
        setVerificandoSessao(false);

        router.replace("/login");
        return;
      }

      setAutenticado(true);
      setVerificandoSessao(false);
    }

    verificarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      if (!componenteAtivo) {
        return;
      }

      if (!session) {
        setAutenticado(false);
        router.replace("/login");
        return;
      }

      setAutenticado(true);
    });

    return () => {
      componenteAtivo = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (verificandoSessao) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center text-center">
          <LoaderCircle
            aria-hidden="true"
            className="h-9 w-9 animate-spin text-blue-900"
            strokeWidth={1.8}
          />

          <p className="mt-4 text-sm font-medium text-slate-700">
            Verificando sua sessão...
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Aguarde enquanto preparamos sua área.
          </p>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return null;
  }

  return <>{children}</>;
}