import Link from "next/link";

import {
  MapPin,
} from "lucide-react";


type LogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};


export function Logo({
  href = "/",
  compact = false,
  className = "",
}: LogoProps) {

  const logoContent = (

    <div
      className={`
        group
        inline-flex
        items-center
        gap-3
        ${className}
      `}
      aria-label="Permuta TJSP"
    >

      {/* =====================================================
          SÍMBOLO
          SOMENTE ELE TEM MOVIMENTO NO HOVER
      ===================================================== */}

      <div
        className="
          relative
          flex
          h-12
          w-12
          shrink-0
          items-center
          justify-center
          transition-all
          duration-200
          group-hover:-translate-y-0.5
          group-hover:scale-105
        "
      >

        <MapPin
          aria-hidden="true"
          className="
            h-12
            w-12
            text-teal-400
            drop-shadow-[0_0_10px_rgba(45,212,191,0.28)]
          "
          strokeWidth={1.8}
        />


        <span
          aria-hidden="true"
          className="
            absolute
            top-[11px]
            text-[17px]
            font-black
            leading-none
            text-white
          "
        >
          P
        </span>

      </div>


      {/* =====================================================
          TEXTO
          NÃO SE MOVIMENTA
      ===================================================== */}

      {
        !compact && (

          <div
            className="
              leading-tight
            "
          >

            <p
              className="
                text-[17px]
                font-extrabold
                tracking-tight
                text-white
              "
            >
              Permuta TJSP
            </p>


            <p
              className="
                mt-0.5
                text-[11px]
                font-medium
                tracking-wide
                text-slate-400
              "
            >
              Conectando servidores
            </p>

          </div>

        )
      }

    </div>

  );


  if (!href) {

    return logoContent;

  }


  return (

    <Link
      href={href}
      className="
        inline-flex
        rounded-xl
        focus-visible:outline-none
      "
      aria-label="Ir para a página inicial do Permuta TJSP"
    >
      {logoContent}
    </Link>

  );

}