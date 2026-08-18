import {
  ArrowRight,
  ArrowRightLeft,
  Handshake,
  MapPin,
  UserPlus,
} from "lucide-react";


export default function HowItWorks() {

  return (

    <section
      id="como-funciona"
      className="
        relative
        border-t
        border-teal-300/10
        py-20
        sm:py-24
      "
    >

      <div
        className="
          mx-auto
          max-w-7xl
          px-5
          sm:px-6
          lg:px-8
        "
      >

        {/* =====================================================
            CABEÇALHO
        ===================================================== */}

        <div
          className="
            text-center
          "
        >

          <p
            className="
              text-sm
              font-bold
              uppercase
              tracking-[0.18em]
              text-teal-400
            "
          >
            Simples e objetivo
          </p>


          <h2
            className="
              mt-3
              text-3xl
              font-black
              tracking-tight
              text-white
              sm:text-4xl
            "
          >
            Como funciona
          </h2>


          <p
            className="
              mx-auto
              mt-4
              max-w-xl
              text-base
              leading-7
              text-slate-400
            "
          >
            Em poucos passos você informa seus interesses
            e a plataforma procura oportunidades compatíveis.
          </p>

        </div>


        {/* =====================================================
            ETAPAS
        ===================================================== */}

        <div
          className="
            relative
            mt-14
            grid
            gap-5
            lg:grid-cols-3
          "
        >

          <StepCard
            numero="1"
            icon={
              <UserPlus size={28} />
            }
            titulo="Crie seu perfil"
            descricao="
              Informe seus dados, sua comarca atual
              e as comarcas para onde deseja ir.
            "
          />


          <StepCard
            numero="2"
            icon={
              <ArrowRightLeft size={28} />
            }
            titulo="Encontre oportunidades"
            descricao="
              O sistema cruza automaticamente os interesses
              e encontra permutas compatíveis.
            "
          />


          <StepCard
            numero="3"
            icon={
              <Handshake size={28} />
            }
            titulo="Finalize sua permuta"
            descricao="
              Envie a proposta, aguarde os aceites
              e entre em contato com os participantes.
            "
          />

        </div>


        {/* =====================================================
            SEGURANÇA
        ===================================================== */}

        <div
          className="
            mt-7
            flex
            flex-col
            items-start
            justify-between
            gap-4
            rounded-2xl
            border
            border-teal-300/10
            bg-[#0a2030]/55
            px-5
            py-4
            backdrop-blur-xl
            sm:flex-row
            sm:items-center
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
              text-sm
              text-slate-300
            "
          >

            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-teal-400/10
                text-teal-300
              "
            >
              <MapPin size={18} />
            </div>

            Suas informações permanecem sob seu controle
            durante todo o processo.

          </div>


          <a
            href="/sobre"
            className="
              group
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-teal-300
              transition
              hover:!text-teal-200
            "
          >

            Saiba mais

            <ArrowRight
              size={17}
              className="
                transition-transform
                group-hover:translate-x-1
              "
            />

          </a>

        </div>

      </div>

    </section>

  );

}



/* ============================================================
   CARD DE ETAPA
============================================================ */

function StepCard({
  numero,
  icon,
  titulo,
  descricao,
}: {
  numero: string;
  icon: React.ReactNode;
  titulo: string;
  descricao: string;
}) {

  return (

    <article
      className="
        group
        relative
        overflow-hidden
        rounded-2xl
        border
        border-teal-300/10
        bg-gradient-to-br
        from-[#0d2637]/95
        to-[#081b29]/95
        p-6
        shadow-[0_18px_45px_rgba(0,0,0,0.22)]
        transition
        duration-300
        hover:-translate-y-1
        hover:border-teal-300/25
        hover:shadow-[0_25px_55px_rgba(0,0,0,0.35)]
      "
    >

      <div
        className="
          absolute
          -right-16
          -top-16
          h-40
          w-40
          rounded-full
          bg-teal-400/[0.045]
          blur-2xl
        "
      />


      <div
        className="
          relative
          flex
          items-start
          gap-5
        "
      >

        <div
          className="
            flex
            h-12
            w-12
            shrink-0
            items-center
            justify-center
            rounded-2xl
            border
            border-teal-300/15
            bg-teal-400/10
            text-teal-300
            transition
            duration-300
            group-hover:scale-105
            group-hover:bg-teal-400/15
          "
        >
          {icon}
        </div>


        <div>

          <div
            className="
              mb-2
              flex
              items-center
              gap-3
            "
          >

            <span
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-full
                bg-teal-500
                text-xs
                font-black
                text-white
              "
            >
              {numero}
            </span>


            <h3
              className="
                text-lg
                font-bold
                text-white
              "
            >
              {titulo}
            </h3>

          </div>


          <p
            className="
              text-sm
              leading-6
              text-slate-400
            "
          >
            {descricao}
          </p>

        </div>

      </div>

    </article>

  );

}