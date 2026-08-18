"use client";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  CheckCircle2,
  ChevronDown,
  MapPin,
  RefreshCw,
  Search,
  UserRound,
  UsersRound,
  X
} from "lucide-react";

import {
  useRouter
} from "next/navigation";

import {
  supabase
} from "@/lib/supabase";

import {
  AuthGuard
} from "@/components/auth/AuthGuard";

import {
  DashboardLayout
} from "@/components/layout/DashboardLayout";


/* ======================================================
   TIPOS
====================================================== */

type PerfilAtual = {
  id: string;
  nome: string;
  comarca_atual_id: number;
  em_match: boolean | null;
  busca_pausada: boolean | null;
};


type Comarca = {
  id: number;
  nome: string;
  circunscricao_id: number;
};


type PreferenciaUsuario = {
  comarca_destino_id: number;
  prioridade: number;
};


type DestinoServidor = {
  comarca_id: number;
  comarca_nome: string;
  prioridade: number;
};


type ServidorResultado = {
  perfil_id: string;
  nome: string;

  comarca_atual_id: number;
  comarca_atual_nome: string;

  circunscricao_id: number;
  circunscricao_nome: string;

  raj_id: number;
  raj_nome: string;

  destinos: DestinoServidor[];

  compativel_direta: boolean;
};


/* ======================================================
   PÁGINA
====================================================== */

export default function BuscarServidoresPage() {

  const router = useRouter();


  const [
    perfil,
    setPerfil
  ] = useState<PerfilAtual | null>(
    null
  );


  const [
    comarcas,
    setComarcas
  ] = useState<Comarca[]>([]);


  const [
    minhasPreferencias,
    setMinhasPreferencias
  ] = useState<PreferenciaUsuario[]>([]);


  /* ======================================================
     FILTROS
  ====================================================== */

  const [
    comarcaAtualSelecionada,
    setComarcaAtualSelecionada
  ] = useState<Comarca | null>(
    null
  );


  const [
    buscaComarcaAtual,
    setBuscaComarcaAtual
  ] = useState("");


  const [
    abrirComarcaAtual,
    setAbrirComarcaAtual
  ] = useState(false);


  const [
    comarcaDestinoSelecionada,
    setComarcaDestinoSelecionada
  ] = useState<Comarca | null>(
    null
  );


  const [
    buscaComarcaDestino,
    setBuscaComarcaDestino
  ] = useState("");


  const [
    abrirComarcaDestino,
    setAbrirComarcaDestino
  ] = useState(false);


  /* ======================================================
     RESULTADOS
  ====================================================== */

  const [
    resultados,
    setResultados
  ] = useState<ServidorResultado[]>([]);


  const [
    pesquisou,
    setPesquisou
  ] = useState(false);


  const [
    carregando,
    setCarregando
  ] = useState(true);


  const [
    buscando,
    setBuscando
  ] = useState(false);


  const [
    propondoId,
    setPropondoId
  ] = useState<string | null>(
    null
  );


  const [
    erro,
    setErro
  ] = useState("");


  /* ======================================================
     CARREGAR DADOS INICIAIS
  ====================================================== */

  useEffect(() => {

    let ativo = true;


    async function carregarDados() {

      setCarregando(true);

      setErro("");


      try {

        /* ===============================================
           USUÁRIO
        =============================================== */

        const {
          data: dadosUsuario,
          error: erroUsuario
        } = await supabase.auth.getUser();


        if (erroUsuario) {
          throw erroUsuario;
        }


        const usuario =
          dadosUsuario.user;


        if (!usuario) {

          throw new Error(
            "Usuário não autenticado."
          );

        }


        /* ===============================================
           PERFIL
        =============================================== */

        const {
          data: dadosPerfil,
          error: erroPerfil
        } = await supabase
          .from("perfis")
          .select(`
            id,
            nome,
            comarca_atual_id,
            em_match,
            busca_pausada
          `)
          .eq(
            "id",
            usuario.id
          )
          .single();


        if (erroPerfil) {
          throw erroPerfil;
        }


        /* ===============================================
           COMARCAS
        =============================================== */

        const {
          data: dadosComarcas,
          error: erroComarcas
        } = await supabase
          .from("comarcas_tjsp")
          .select(`
            id,
            nome,
            circunscricao_id
          `)
          .order(
            "nome",
            {
              ascending: true
            }
          );


        if (erroComarcas) {
          throw erroComarcas;
        }


        /* ===============================================
           MINHAS PREFERÊNCIAS
        =============================================== */

        const {
          data: dadosPreferencias,
          error: erroPreferencias
        } = await supabase
          .from(
            "preferencias_movimentacao"
          )
          .select(`
            comarca_destino_id,
            prioridade
          `)
          .eq(
            "perfil_id",
            usuario.id
          )
          .eq(
            "ativo",
            true
          )
          .order(
            "prioridade",
            {
              ascending: true
            }
          );


        if (erroPreferencias) {
          throw erroPreferencias;
        }


        if (!ativo) {
          return;
        }


        setPerfil(
          dadosPerfil as PerfilAtual
        );


        setComarcas(
          (dadosComarcas ?? []) as Comarca[]
        );


        setMinhasPreferencias(
          (dadosPreferencias ?? []) as PreferenciaUsuario[]
        );

      }

      catch(error) {

        console.error(
          "Erro ao carregar busca de servidores:",
          error
        );


        setErro(
          extrairMensagemErro(
            error
          )
        );

      }

      finally {

        if (ativo) {

          setCarregando(false);

        }

      }

    }


    carregarDados();


    return () => {

      ativo = false;

    };

  }, []);


  /* ======================================================
     MINHA COMARCA ATUAL
  ====================================================== */

  const minhaComarcaAtual =
    useMemo(
      () => {

        if (!perfil) {
          return null;
        }


        return (
          comarcas.find(
            comarca =>
              comarca.id ===
              perfil.comarca_atual_id
          )
          ??
          null
        );

      },
      [
        perfil,
        comarcas
      ]
    );


  /* ======================================================
     MEUS DESTINOS
  ====================================================== */

  const meusDestinos =
    useMemo(
      () => {

        return minhasPreferencias
          .map(
            preferencia => {

              const comarca =
                comarcas.find(
                  item =>
                    item.id ===
                    preferencia.comarca_destino_id
                );


              if (!comarca) {
                return null;
              }


              return {
                ...comarca,
                prioridade:
                  preferencia.prioridade
              };

            }
          )
          .filter(
            (
              item
            ): item is Comarca & {
              prioridade: number;
            } =>
              Boolean(item)
          );

      },
      [
        minhasPreferencias,
        comarcas
      ]
    );


  /* ======================================================
     AUTOCOMPLETE - COMARCA ATUAL DO SERVIDOR
  ====================================================== */

  const opcoesComarcaAtual =
    useMemo(
      () => {

        const termo =
          normalizarTexto(
            buscaComarcaAtual
          );


        if (!termo) {

          return comarcas.slice(
            0,
            20
          );

        }


        return comarcas
          .filter(
            comarca =>
              normalizarTexto(
                comarca.nome
              ).includes(
                termo
              )
          )
          .slice(
            0,
            20
          );

      },
      [
        buscaComarcaAtual,
        comarcas
      ]
    );


  /* ======================================================
     AUTOCOMPLETE - COMARCA DESEJADA PELO SERVIDOR
  ====================================================== */

  const opcoesComarcaDestino =
    useMemo(
      () => {

        const termo =
          normalizarTexto(
            buscaComarcaDestino
          );


        if (!termo) {

          return comarcas.slice(
            0,
            20
          );

        }


        return comarcas
          .filter(
            comarca =>
              normalizarTexto(
                comarca.nome
              ).includes(
                termo
              )
          )
          .slice(
            0,
            20
          );

      },
      [
        buscaComarcaDestino,
        comarcas
      ]
    );


  /* ======================================================
     SELECIONAR COMARCA ATUAL DO SERVIDOR
  ====================================================== */

  function selecionarComarcaAtual(
    comarca: Comarca
  ) {

    setComarcaAtualSelecionada(
      comarca
    );


    setBuscaComarcaAtual(
      comarca.nome
    );


    setAbrirComarcaAtual(
      false
    );

  }


  /* ======================================================
     LIMPAR COMARCA ATUAL DO SERVIDOR
  ====================================================== */

  function limparComarcaAtual() {

    setComarcaAtualSelecionada(
      null
    );


    setBuscaComarcaAtual("");

    setAbrirComarcaAtual(
      false
    );

  }


  /* ======================================================
     SELECIONAR COMARCA DESEJADA PELO SERVIDOR
  ====================================================== */

  function selecionarComarcaDestino(
    comarca: Comarca
  ) {

    setComarcaDestinoSelecionada(
      comarca
    );


    setBuscaComarcaDestino(
      comarca.nome
    );


    setAbrirComarcaDestino(
      false
    );

  }


  /* ======================================================
     LIMPAR COMARCA DESEJADA PELO SERVIDOR
  ====================================================== */

  function limparComarcaDestino() {

    setComarcaDestinoSelecionada(
      null
    );


    setBuscaComarcaDestino("");

    setAbrirComarcaDestino(
      false
    );

  }


  /* ======================================================
     BUSCAR SERVIDORES
  ====================================================== */

  async function buscarServidores() {

    if (!perfil) {
      return;
    }


    setBuscando(true);

    setErro("");


    try {

      const {
        data,
        error
      } = await supabase.rpc(
        "buscar_servidores_manual",
        {
          p_usuario_id:
            perfil.id,

          p_nome:
            null,

          p_comarca_atual_id:
            comarcaAtualSelecionada
              ?.id
            ??
            null,

          p_comarca_destino_id:
            comarcaDestinoSelecionada
              ?.id
            ??
            null,

          p_circunscricao_id:
            null,

          p_raj_id:
            null,

          p_limite:
            50
        }
      );


      if (error) {
        throw error;
      }


      setResultados(
        (data ?? []) as ServidorResultado[]
      );


      setPesquisou(
        true
      );

    }

    catch(error) {

      console.error(
        "Erro ao buscar servidores:",
        error
      );


      setResultados([]);

      setPesquisou(true);


      setErro(
        extrairMensagemErro(
          error
        )
      );

    }

    finally {

      setBuscando(false);

    }

  }


  /* ======================================================
     LIMPAR FILTROS
  ====================================================== */

  function limparFiltros() {

    limparComarcaAtual();

    limparComarcaDestino();

    setResultados([]);

    setPesquisou(false);

    setErro("");

  }


  /* ======================================================
     PROPOR PERMUTA DIRETA
  ====================================================== */

  async function proporPermuta(
    servidor: ServidorResultado
  ) {

    if (!perfil) {
      return;
    }


    if (propondoId) {
      return;
    }


    if (perfil.em_match) {

      setErro(
        "Você já possui uma permuta confirmada em andamento."
      );

      return;

    }


    if (perfil.busca_pausada) {

      setErro(
        "Sua busca está pausada. Reative sua participação em Meu Perfil antes de enviar uma proposta."
      );

      return;

    }


    if (!servidor.compativel_direta) {

      setErro(
        "Não existe compatibilidade direta entre vocês neste momento."
      );

      return;

    }


    setPropondoId(
      servidor.perfil_id
    );


    setErro("");


    try {

      const {
        error
      } = await supabase.rpc(
        "solicitar_permuta_direta",
        {
          p_candidato_id:
            servidor.perfil_id,

          p_usuario_id:
            perfil.id
        }
      );


      if (error) {
        throw error;
      }


      window.dispatchEvent(
        new Event(
          "atualizar-notificacoes"
        )
      );


      router.push(
        "/propostas"
      );

    }

    catch(error) {

      console.error(
        "Erro ao enviar proposta:",
        error
      );


      setErro(
        extrairMensagemErro(
          error
        )
      );

    }

    finally {

      setPropondoId(
        null
      );

    }

  }


  /* ======================================================
     RENDER
  ====================================================== */

  return (

    <AuthGuard>

      <DashboardLayout
        nomeUsuario={
          perfil?.nome
            ?.trim()
            .split(/\s+/)[0]
          ||
          "Servidor"
        }
      >

        <div className="
          mx-auto
          max-w-6xl
          space-y-8
          px-6
          py-8
        ">


          {/* =================================================
              TÍTULO
          ================================================= */}

          <div>

            <h1 className="
              text-3xl
              font-bold
              text-white
            ">

              Buscar servidores

            </h1>


            <p className="
              mt-2
              text-slate-400
            ">

              Consulte servidores disponíveis e compare as preferências deles com as suas.

            </p>

          </div>


          {/* =================================================
              MINHAS INFORMAÇÕES
          ================================================= */}

          <section className="
            overflow-hidden
            rounded-2xl
            border
            border-teal-300/10
            bg-[#0d2232]
            shadow-[0_16px_40px_rgba(0,0,0,0.16)]
          ">


            <div className="
              border-b
              border-teal-300/10
              bg-[#0a1f2f]
              px-6
              py-5
            ">

              <h2 className="
                text-xl
                font-bold
                text-white
              ">

                Suas informações

              </h2>


              <p className="
                mt-1
                text-sm
                text-slate-400
              ">

                Use seus dados abaixo como referência ao pesquisar outros servidores.

              </p>

            </div>


            <div className="
              grid
              gap-5
              p-6
              md:grid-cols-[0.8fr_1.2fr]
            ">


              {/* MINHA COMARCA ATUAL */}

              <div className="
                rounded-xl
                border
                border-teal-300/10
                bg-[#081b29]
                p-4
              ">

                <p className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                ">

                  Sua comarca atual

                </p>


                <p className="
                  mt-2
                  font-semibold
                  text-white
                ">

                  {
                    minhaComarcaAtual
                      ?.nome
                    ??
                    "Não informada"
                  }

                </p>

              </div>


              {/* MEUS DESTINOS */}

              <div className="
                rounded-xl
                border
                border-teal-300/10
                bg-[#081b29]
                p-4
              ">

                <p className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                ">

                  Suas comarcas desejadas

                </p>


                {
                  meusDestinos.length > 0 ? (

                    <div className="
                      mt-3
                      flex
                      flex-wrap
                      gap-2
                    ">

                      {
                        meusDestinos.map(
                          destino => (

                            <span
                              key={
                                destino.id
                              }

                              className="
                                rounded-lg
                                border
                                border-teal-300/15
                                bg-teal-400/[0.05]
                                px-3
                                py-2
                                text-sm
                                text-teal-300
                              "
                            >

                              <strong>

                                {
                                  destino.prioridade
                                }.

                              </strong>

                              {" "}

                              {
                                destino.nome
                              }

                            </span>

                          )
                        )
                      }

                    </div>

                  ) : (

                    <p className="
                      mt-2
                      text-sm
                      text-slate-400
                    ">

                      Nenhuma comarca desejada cadastrada.

                    </p>

                  )
                }

              </div>

            </div>

          </section>


          {/* =================================================
              STATUS EM PERMUTA
          ================================================= */}

          {
            perfil?.em_match && (

              <div className="
                rounded-2xl
                border
                border-teal-300/10
                bg-teal-400/[0.07]
                p-5
              ">

                <p className="
                  font-semibold
                  text-teal-200
                ">

                  Você está em uma permuta confirmada.

                </p>


                <p className="
                  mt-1
                  text-sm
                  leading-6
                  text-slate-400
                ">

                  Você pode consultar servidores, mas não poderá enviar uma nova proposta enquanto a permuta atual estiver em andamento.

                </p>

              </div>

            )
          }


          {/* =================================================
              STATUS PAUSADO
          ================================================= */}

          {
            !perfil?.em_match &&
            perfil?.busca_pausada && (

              <div className="
                rounded-2xl
                border
                border-amber-300/20
                bg-amber-400/[0.07]
                p-5
              ">

                <p className="
                  font-semibold
                  text-amber-200
                ">

                  Sua busca está pausada.

                </p>


                <p className="
                  mt-1
                  text-sm
                  leading-6
                  text-slate-300
                ">

                  Você pode consultar servidores, mas deverá reativar sua busca em Meu Perfil antes de enviar uma proposta.

                </p>

              </div>

            )
          }


          {/* =================================================
              FILTROS
          ================================================= */}

          <section className="
            overflow-visible
            rounded-2xl
            border
            border-teal-300/10
            bg-[#0d2232]
            shadow-[0_16px_40px_rgba(0,0,0,0.16)]
          ">


            <div className="
              rounded-t-2xl
              border-b
              border-teal-300/10
              bg-[#0a1f2f]
              px-6
              py-5
            ">

              <div className="
                flex
                items-center
                gap-3
              ">

                <Search
                  className="
                    h-5
                    w-5
                    text-teal-300
                  "
                />


                <div>

                  <h2 className="
                    text-xl
                    font-bold
                    text-white
                  ">

                    Filtros da busca

                  </h2>


                  <p className="
                    mt-1
                    text-sm
                    text-slate-400
                  ">

                    Os campos abaixo se referem ao servidor que você deseja encontrar.

                  </p>

                </div>

              </div>

            </div>


            <div className="
              grid
              gap-5
              p-6
              md:grid-cols-2
            ">


              {/* =================================================
                  COMARCA ATUAL DO SERVIDOR
              ================================================= */}

              <AutocompleteComarca
                label="Comarca atual do servidor"

                placeholder="Digite a comarca atual"

                valor={
                  buscaComarcaAtual
                }

                aberta={
                  abrirComarcaAtual
                }

                selecionada={
                  comarcaAtualSelecionada
                }

                opcoes={
                  opcoesComarcaAtual
                }

                onFocus={() =>
                  setAbrirComarcaAtual(
                    true
                  )
                }

                onChange={
                  valor => {

                    setBuscaComarcaAtual(
                      valor
                    );

                    setComarcaAtualSelecionada(
                      null
                    );

                    setAbrirComarcaAtual(
                      true
                    );

                  }
                }

                onSelecionar={
                  selecionarComarcaAtual
                }

                onLimpar={
                  limparComarcaAtual
                }
              />


              {/* =================================================
                  COMARCA DESEJADA PELO SERVIDOR
              ================================================= */}

              <AutocompleteComarca
                label="Comarca desejada pelo servidor"

                placeholder="Digite a comarca desejada"

                valor={
                  buscaComarcaDestino
                }

                aberta={
                  abrirComarcaDestino
                }

                selecionada={
                  comarcaDestinoSelecionada
                }

                opcoes={
                  opcoesComarcaDestino
                }

                onFocus={() =>
                  setAbrirComarcaDestino(
                    true
                  )
                }

                onChange={
                  valor => {

                    setBuscaComarcaDestino(
                      valor
                    );

                    setComarcaDestinoSelecionada(
                      null
                    );

                    setAbrirComarcaDestino(
                      true
                    );

                  }
                }

                onSelecionar={
                  selecionarComarcaDestino
                }

                onLimpar={
                  limparComarcaDestino
                }
              />


              {/* =================================================
                  BOTÕES
              ================================================= */}

              <div className="
                flex
                flex-wrap
                gap-3
                md:col-span-2
              ">

                <button
                  type="button"

                  onClick={
                    buscarServidores
                  }

                  disabled={
                    buscando ||
                    carregando
                  }

                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-teal-300/20
                    bg-teal-600
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    transition-all
                    duration-200
                    hover:-translate-y-[1px]
                    hover:bg-teal-500
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >

                  <Search
                    size={18}
                  />


                  {
                    buscando
                      ? "Buscando..."
                      : "Buscar servidores"
                  }

                </button>


                <button
                  type="button"

                  onClick={
                    limparFiltros
                  }

                  disabled={
                    buscando
                  }

                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-teal-300/15
                    bg-[#081b29]
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-slate-300
                    transition-all
                    duration-200
                    hover:-translate-y-[1px]
                    hover:border-teal-300/25
                    hover:bg-teal-400/[0.07]
                    hover:text-teal-200
                    disabled:opacity-50
                  "
                >

                  <RefreshCw
                    size={17}
                  />

                  Limpar filtros

                </button>

              </div>

            </div>

          </section>


          {/* =================================================
              ERRO
          ================================================= */}

          {
            erro && (

              <div className="
                rounded-xl
                border
                border-red-400/20
                bg-red-400/10
                p-4
                text-sm
                text-red-300
              ">

                {erro}

              </div>

            )
          }


          {/* =================================================
              CARREGAMENTO INICIAL
          ================================================= */}

          {
            carregando && (

              <div className="
                rounded-2xl
                border
                border-teal-300/10
                bg-[#0d2232]
                p-8
                text-center
                text-sm
                text-slate-400
              ">

                Carregando dados da pesquisa...

              </div>

            )
          }


          {/* =================================================
              ANTES DA PRIMEIRA BUSCA
          ================================================= */}

          {
            !carregando &&
            !pesquisou && (

              <div className="
                rounded-2xl
                border
                border-dashed
                border-teal-300/15
                bg-[#081b29]
                p-10
                text-center
              ">

                <UsersRound
                  className="
                    mx-auto
                    h-10
                    w-10
                    text-slate-400
                  "
                />


                <h2 className="
                  mt-4
                  text-lg
                  font-bold
                  text-white
                ">

                  Pesquise servidores disponíveis

                </h2>


                <p className="
                  mx-auto
                  mt-2
                  max-w-xl
                  text-sm
                  leading-6
                  text-slate-400
                ">

                  Digite parte do nome da comarca e escolha uma opção da lista para pesquisar.

                </p>

              </div>

            )
          }


          {/* =================================================
              NENHUM RESULTADO
          ================================================= */}

          {
            !carregando &&
            pesquisou &&
            !buscando &&
            resultados.length === 0 && (

              <div className="
                rounded-2xl
                border
                border-teal-300/10
                bg-[#0d2232]
                p-10
                text-center
              ">

                <Search
                  className="
                    mx-auto
                    h-10
                    w-10
                    text-slate-400
                  "
                />


                <h2 className="
                  mt-4
                  text-lg
                  font-bold
                  text-white
                ">

                  Nenhum servidor encontrado

                </h2>


                <p className="
                  mt-2
                  text-sm
                  text-slate-400
                ">

                  Tente alterar ou remover um dos filtros.

                </p>

              </div>

            )
          }


          {/* =================================================
              RESULTADOS
          ================================================= */}

          {
            resultados.length > 0 && (

              <section className="
                space-y-4
              ">


                <div>

                  <h2 className="
                    text-xl
                    font-bold
                    text-white
                  ">

                    Servidores encontrados

                  </h2>


                  <p className="
                    mt-1
                    text-sm
                    text-slate-400
                  ">

                    {
                      resultados.length === 1
                        ? "1 servidor encontrado."
                        : `${resultados.length} servidores encontrados.`
                    }

                  </p>

                </div>


                {
                  resultados.map(
                    servidor => (

                      <ServidorCard
                        key={
                          servidor.perfil_id
                        }

                        servidor={
                          servidor
                        }

                        podePropor={
                          servidor.compativel_direta &&
                          !Boolean(
                            perfil?.em_match
                          ) &&
                          !Boolean(
                            perfil?.busca_pausada
                          )
                        }

                        propondo={
                          propondoId ===
                          servidor.perfil_id
                        }

                        onPropor={() =>
                          proporPermuta(
                            servidor
                          )
                        }
                      />

                    )
                  )
                }

              </section>

            )
          }


        </div>

      </DashboardLayout>

    </AuthGuard>

  );

}


/* ======================================================
   AUTOCOMPLETE
====================================================== */

function AutocompleteComarca({
  label,
  placeholder,
  valor,
  aberta,
  selecionada,
  opcoes,
  onFocus,
  onChange,
  onSelecionar,
  onLimpar
}: {
  label: string;
  placeholder: string;
  valor: string;
  aberta: boolean;
  selecionada: Comarca | null;
  opcoes: Comarca[];
  onFocus: () => void;
  onChange: (valor: string) => void;
  onSelecionar: (comarca: Comarca) => void;
  onLimpar: () => void;
}) {

  return (

    <div className="
      relative
      z-20
    ">

      <label className="
        mb-2
        block
        text-sm
        font-semibold
        text-slate-300
      ">

        {label}

      </label>


      <div className="
        relative
      ">

        <input
          type="text"

          value={
            valor
          }

          onFocus={
            onFocus
          }

          onChange={
            event =>
              onChange(
                event.target.value
              )
          }

          placeholder={
            placeholder
          }

          autoComplete="off"

          className="
            w-full
            rounded-xl
            border
            border-teal-300/15
            bg-[#081b29]
            px-4
            py-3
            pr-20
            text-sm
            text-white
            outline-none
            transition
            placeholder:text-slate-600
            hover:border-teal-300/25
            focus:border-teal-400
            focus:ring-4
            focus:ring-teal-400/10
          "
        />


        {
          valor && (

            <button
              type="button"

              onClick={
                onLimpar
              }

              aria-label="Limpar comarca"

              className="
                absolute
                right-10
                top-1/2
                -translate-y-1/2
                rounded-md
                p-1
                text-slate-400
                transition
                hover:bg-teal-400/[0.07]
                hover:text-slate-300
              "
            >

              <X
                size={16}
              />

            </button>

          )
        }


        <ChevronDown
          size={18}
          className="
            pointer-events-none
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            text-slate-400
          "
        />

      </div>


      {
        aberta &&
        !selecionada && (

          <div className="
            absolute
            left-0
            right-0
            top-full
            z-50
            mt-2
            max-h-72
            overflow-y-auto
            rounded-xl
            border
            border-teal-300/10
            bg-[#081b29]
            p-1
            shadow-[0_20px_50px_rgba(0,0,0,0.35)]
          ">

            {
              opcoes.length > 0 ? (

                opcoes.map(
                  comarca => (

                    <button
                      key={
                        comarca.id
                      }

                      type="button"

                      onMouseDown={
                        event => {

                          event.preventDefault();

                          onSelecionar(
                            comarca
                          );

                        }
                      }

                      className="
                        block
                        w-full
                        rounded-lg
                        px-3
                        py-2.5
                        text-left
                        text-sm
                        text-slate-300
                        transition
                        hover:bg-teal-400/[0.07]
                        hover:text-teal-200
                      "
                    >

                      {comarca.nome}

                    </button>

                  )
                )

              ) : (

                <div className="
                  px-3
                  py-4
                  text-sm
                  text-slate-400
                ">

                  Nenhuma comarca encontrada.

                </div>

              )
            }

          </div>

        )
      }

    </div>

  );

}


/* ======================================================
   CARD DO SERVIDOR
====================================================== */

function ServidorCard({
  servidor,
  podePropor,
  propondo,
  onPropor
}: {
  servidor: ServidorResultado;
  podePropor: boolean;
  propondo: boolean;
  onPropor: () => void;
}) {

  return (

    <article className="
      overflow-hidden
      rounded-2xl
      border
      border-teal-300/10
      bg-[#0d2232]
      shadow-[0_12px_32px_rgba(0,0,0,0.14)]
    ">


      <div className="
        p-6
      ">


        <div className="
          flex
          flex-col
          gap-5
          lg:flex-row
          lg:items-start
          lg:justify-between
        ">


          <div className="
            min-w-0
            flex-1
          ">


            <div className="
              flex
              flex-wrap
              items-center
              gap-3
            ">

              <div className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                border
                border-teal-300/15
                bg-teal-400/[0.08]
                text-teal-300
              ">

                <UserRound
                  size={19}
                />

              </div>


              <div>

                <h3 className="
                  text-lg
                  font-bold
                  text-white
                ">

                  {servidor.nome}

                </h3>


                {
                  servidor.compativel_direta ? (

                    <span className="
                      mt-1
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      border
                      border-emerald-300/15
                      bg-emerald-400/10
                      px-2.5
                      py-1
                      text-xs
                      font-semibold
                      text-emerald-300
                    ">

                      <CheckCircle2
                        size={14}
                      />

                      Permuta direta compatível

                    </span>

                  ) : (

                    <span className="
                      mt-1
                      inline-flex
                      rounded-full
                      border
                      border-slate-600/40
                      bg-white/[0.04]
                      px-2.5
                      py-1
                      text-xs
                      font-semibold
                      text-slate-400
                    ">

                      Sem compatibilidade direta

                    </span>

                  )
                }

              </div>

            </div>


            <div className="
              mt-5
            ">

              <div className="
                rounded-xl
                border
                border-teal-300/10
                bg-[#081b29]
                p-4
              ">

                <p className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                ">

                  Comarca atual do servidor

                </p>


                <p className="
                  mt-2
                  text-sm
                  font-semibold
                  text-white
                ">

                  {
                    servidor.comarca_atual_nome
                  }

                </p>


                <p className="
                  mt-1
                  text-xs
                  text-slate-400
                ">

                  {
                    servidor.circunscricao_nome
                  }

                  {
                    servidor.raj_nome
                      ? ` • ${servidor.raj_nome}`
                      : ""
                  }

                </p>

              </div>

            </div>


            <div className="
              mt-5
            ">

              <div className="
                flex
                items-center
                gap-2
              ">

                <MapPin
                  size={17}
                  className="
                    text-teal-300
                  "
                />


                <h4 className="
                  text-sm
                  font-bold
                  text-white
                ">

                  Destinos desejados pelo servidor

                </h4>

              </div>


              {
                Array.isArray(
                  servidor.destinos
                ) &&
                servidor.destinos.length > 0 ? (

                  <div className="
                    mt-3
                    flex
                    flex-wrap
                    gap-2
                  ">

                    {
                      servidor.destinos.map(
                        destino => (

                          <span
                            key={
                              `${servidor.perfil_id}-${destino.comarca_id}-${destino.prioridade}`
                            }

                            className="
                              rounded-lg
                              border
                              border-teal-300/10
                              bg-teal-400/[0.07]
                              px-3
                              py-2
                              text-sm
                              text-teal-200
                            "
                          >

                            <strong>

                              {
                                destino.prioridade
                              }.

                            </strong>

                            {" "}

                            {
                              destino.comarca_nome
                            }

                          </span>

                        )
                      )
                    }

                  </div>

                ) : (

                  <p className="
                    mt-3
                    text-sm
                    text-slate-400
                  ">

                    Nenhum destino ativo informado.

                  </p>

                )
              }

            </div>

          </div>


          <div className="
            shrink-0
            lg:w-52
          ">

            {
              servidor.compativel_direta ? (

                <button
                  type="button"

                  disabled={
                    !podePropor ||
                    propondo
                  }

                  onClick={
                    onPropor
                  }

                  className="
                    inline-flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-teal-300/20
                    bg-teal-600
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    transition-all
                    duration-200
                    hover:-translate-y-[1px]
                    hover:bg-teal-500
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >

                  {
                    propondo
                      ? "Enviando..."
                      : "Propor permuta"
                  }

                </button>

              ) : (

                <div className="
                  rounded-xl
                  border
                  border-teal-300/10
                  bg-[#081b29]
                  p-4
                  text-center
                ">

                  <p className="
                    text-xs
                    leading-5
                    text-slate-400
                  ">

                    As preferências atuais não fecham uma permuta direta.

                  </p>

                </div>

              )
            }

          </div>

        </div>

      </div>

    </article>

  );

}


/* ======================================================
   NORMALIZAR TEXTO
====================================================== */

function normalizarTexto(
  valor: string
) {

  return valor
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();

}


/* ======================================================
   MENSAGEM DE ERRO
====================================================== */

function extrairMensagemErro(
  error: unknown
) {

  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {

    const mensagem =
      String(
        (
          error as {
            message?: unknown
          }
        ).message ?? ""
      );


    if (mensagem) {
      return mensagem;
    }

  }


  return "Ocorreu um erro inesperado. Tente novamente.";

}