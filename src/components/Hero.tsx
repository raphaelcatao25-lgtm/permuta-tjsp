"use client";

import ServerCount from "@/components/ServerCount";

import Link from "next/link";

import {
  ArrowRight,
  ArrowRightLeft,
  ShieldCheck,
  Search,
} from "lucide-react";


const SP_PATH = `M 0 404 L 22 395 L 59 405 L 73 396 L 127 412 L 143 390 L 198 411 L 262 411 L 319 431 L 333 450 L 448 446 L 458 466 L 480 472 L 494 491 L 506 558 L 500 580 L 556 650 L 541 694 L 645 697 L 658 708 L 645 744 L 651 755 L 665 743 L 681 751 L 694 742 L 702 771 L 720 781 L 770 723 L 868 661 L 877 644 L 960 597 L 986 598 L 1000 576 L 1030 566 L 1098 578 L 1094 591 L 1126 594 L 1122 567 L 1109 561 L 1102 576 L 1097 549 L 1126 541 L 1130 529 L 1146 531 L 1146 519 L 1170 506 L 1178 517 L 1190 512 L 1174 489 L 1186 456 L 1229 435 L 1262 433 L 1278 412 L 1244 397 L 1209 402 L 1196 378 L 1182 375 L 1102 408 L 1092 400 L 1062 408 L 1062 397 L 1054 399 L 1057 407 L 1039 415 L 1055 424 L 1044 438 L 1027 432 L 1010 443 L 964 444 L 966 425 L 946 415 L 956 394 L 921 376 L 913 358 L 928 336 L 917 327 L 927 317 L 917 291 L 940 262 L 941 238 L 922 224 L 870 231 L 839 159 L 858 123 L 830 92 L 835 55 L 805 25 L 784 37 L 747 29 L 743 48 L 731 35 L 713 51 L 694 34 L 692 52 L 608 54 L 599 93 L 584 53 L 564 74 L 553 72 L 542 48 L 550 26 L 524 28 L 508 17 L 459 23 L 377 0 L 315 29 L 288 68 L 252 80 L 211 130 L 212 165 L 176 191 L 179 218 L 161 246 L 145 247 L 151 267 L 105 330 Z`;


export default function Hero() {

  return (

    <section
      className="
        relative
        overflow-hidden
        border-b
        border-teal-300/10
      "
    >

      {/* =====================================================
          FUNDO DECORATIVO
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          right-[-15%]
          top-[-25%]
          h-[650px]
          w-[650px]
          rounded-full
          bg-teal-400/[0.07]
          blur-[130px]
        "
      />


      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          bottom-[-300px]
          left-[-180px]
          h-[560px]
          w-[560px]
          rounded-full
          bg-cyan-500/[0.045]
          blur-[120px]
        "
      />


      <div
        className="
          relative
          mx-auto
          max-w-7xl
          px-5
          pb-16
          pt-14
          sm:px-6
          lg:px-8
          lg:pb-20
          lg:pt-20
        "
      >

        <div
          className="
            grid
            items-center
            gap-14
            lg:grid-cols-[1.02fr_0.98fr]
            lg:gap-16
          "
        >


          {/* =================================================
              TEXTO PRINCIPAL
          ================================================= */}

          <div>

            <div
              className="
                badge-teal
              "
            >

              <ShieldCheck size={15} />

              Plataforma independente e gratuita

            </div>


            <h1
              className="
                mt-7
                max-w-[720px]
                text-[2.65rem]
                font-black
                leading-[1.02]
                tracking-[-0.045em]
                text-white
                sm:text-5xl
                lg:text-[4rem]
              "
            >

              A permuta certa para o{" "}

              <span
                className="
                  bg-gradient-to-r
                  from-teal-300
                  via-teal-400
                  to-cyan-400
                  bg-clip-text
                  text-transparent
                "
              >
                próximo capítulo
              </span>

              {" "}da sua carreira.

            </h1>


            <p
              className="
                mt-6
                max-w-xl
                text-base
                leading-7
                text-slate-300
                sm:text-lg
                sm:leading-8
              "
            >
              Conectamos servidores do TJSP de forma segura,
              simples e inteligente para encontrar permutas
              diretas e oportunidades em cadeia entre comarcas.
            </p>


            {/* =================================================
                BOTÕES
            ================================================= */}

            <div
              className="
                mt-8
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-center
              "
            >

              <Link
                href="/cadastro"
                className="
                  btn-primary
                  group
                  sm:min-w-[220px]
                "
              >

                Criar conta gratuita

                <ArrowRight
                  size={19}
                  className="
                    transition-transform
                    duration-200
                    group-hover:translate-x-1
                  "
                />

              </Link>


              <Link
                href="/login"
                className="
                  btn-secondary
                  sm:min-w-[175px]
                "
              >
                Já tenho conta
              </Link>

            </div>


            {/* =================================================
                BENEFÍCIOS RÁPIDOS
            ================================================= */}

            <div
              className="
                mt-8
                grid
                max-w-2xl
                gap-2
                rounded-2xl
                border
                border-teal-300/10
                bg-[#071725]/55
                p-3
                backdrop-blur-lg
                sm:grid-cols-3
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-3
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
                    rounded-full
                    border
                    border-teal-300/20
                    bg-teal-400/10
                    text-teal-300
                  "
                >
                  <Search size={20} />
                </div>

                <div
                  className="
                    text-xs
                    leading-5
                    text-slate-300
                  "
                >
                  <strong
                    className="
                      block
                      text-sm
                      text-white
                    "
                  >
                    Todas
                  </strong>

                  as comarcas
                </div>

              </div>


              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-3
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
                    rounded-full
                    border
                    border-teal-300/20
                    bg-teal-400/10
                    text-teal-300
                  "
                >
                  <ArrowRightLeft size={20} />
                </div>

                <div
                  className="
                    text-xs
                    leading-5
                    text-slate-300
                  "
                >
                  <strong
                    className="
                      block
                      text-sm
                      text-white
                    "
                  >
                    Permutas
                  </strong>

                  inteligentes
                </div>

              </div>


              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-3
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
                    rounded-full
                    border
                    border-teal-300/20
                    bg-teal-400/10
                    text-teal-300
                  "
                >
                  <ShieldCheck size={20} />
                </div>

                <div
                  className="
                    text-xs
                    leading-5
                    text-slate-300
                  "
                >
                  <strong
                    className="
                      block
                      text-sm
                      text-white
                    "
                  >
                    Grátis
                  </strong>

                  para começar
                </div>

              </div>

            </div>


            {/* =================================================
                CONTADOR REAL
            ================================================= */}

            <div
              className="
                mt-6
                max-w-md
              "
            >
              <ServerCount />
            </div>

          </div>



          {/* =================================================
              MAPA DO ESTADO DE SÃO PAULO
          ================================================= */}

          <div
            className="
              relative
              mx-auto
              hidden
              min-h-[470px]
              w-full
              max-w-[610px]
              lg:block
            "
          >

            {/* GLOW */}

            <div
              aria-hidden="true"
              className="
                absolute
                inset-[10%]
                rounded-full
                bg-teal-400/[0.07]
                blur-[115px]
              "
            />


            <div
              className="
                absolute
                inset-0
                flex
                items-center
                justify-center
              "
            >

              <svg
                viewBox="0 0 1280 784"
                role="img"
                aria-label="Mapa estilizado do Estado de São Paulo com conexões entre comarcas"
                className="
                  h-full
                  w-full
                  overflow-visible
                  drop-shadow-[0_30px_60px_rgba(0,0,0,0.34)]
                "
              >

                <defs>

                  <linearGradient
                    id="spFillReal"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor="#0d3343"
                    />

                    <stop
                      offset="52%"
                      stopColor="#092838"
                    />

                    <stop
                      offset="100%"
                      stopColor="#061b2a"
                    />
                  </linearGradient>


                  <pattern
                    id="spDotsReal"
                    width="22"
                    height="22"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle
                      cx="4"
                      cy="4"
                      r="1.4"
                      fill="#2dd4bf"
                      opacity="0.35"
                    />
                  </pattern>


                  <clipPath id="spClipReal">
                    <path d={SP_PATH} />
                  </clipPath>


                  <filter
                    id="pinShadow"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="5"
                      stdDeviation="7"
                      floodColor="#000000"
                      floodOpacity="0.28"
                    />
                  </filter>

                </defs>


                {/* CONTORNO REAL DO ESTADO */}

                <path
                  d={SP_PATH}
                  fill="url(#spFillReal)"
                  stroke="#2dd4bf"
                  strokeOpacity="0.42"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />


                {/* PONTILHADO INTERNO */}

                <rect
                  x="0"
                  y="0"
                  width="1280"
                  height="784"
                  fill="url(#spDotsReal)"
                  clipPath="url(#spClipReal)"
                />


                {/* LINHAS DE FUNDO */}

                <g
                  clipPath="url(#spClipReal)"
                  fill="none"
                  stroke="#5eead4"
                  strokeWidth="1.4"
                  strokeOpacity="0.12"
                >

                  <path
                    d="
                      M120 360
                      C390 210
                      680 210
                      1150 390
                    "
                  />

                  <path
                    d="
                      M180 530
                      C490 360
                      790 390
                      1120 530
                    "
                  />

                  <path
                    d="
                      M520 90
                      C610 270
                      690 470
                      700 715
                    "
                  />

                </g>


                {/* CONEXÕES */}

                <g
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="10 12"
                  opacity="0.78"
                >

                  <path
                    d="
                      M260 370
                      C430 235
                      590 230
                      720 300
                    "
                  />

                  <path
                    d="
                      M260 370
                      C450 500
                      620 535
                      915 445
                    "
                  />

                  <path
                    d="
                      M720 300
                      C760 360
                      810 410
                      915 445
                    "
                  />

                  <path
                    d="
                      M720 300
                      C700 430
                      700 520
                      680 620
                    "
                  />

                  <path
                    d="
                      M915 445
                      C820 540
                      760 585
                      680 620
                    "
                  />

                </g>


                {/* NÚCLEO DO MATCHING */}

                <g
                  transform="translate(630 410)"
                  filter="url(#pinShadow)"
                >

                  <circle
                    r="48"
                    fill="#0d5c60"
                    stroke="#5eead4"
                    strokeOpacity="0.48"
                    strokeWidth="2.5"
                  />

                  <circle
                    r="35"
                    fill="#0a4650"
                    stroke="#5eead4"
                    strokeOpacity="0.18"
                    strokeWidth="1.5"
                  />

                  <g
                    stroke="#ccfbf1"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  >

                    <path d="M-15 -8 H12" />
                    <path d="M6 -15 L14 -8 L6 -1" />
                    <path d="M15 8 H-12" />
                    <path d="M-6 1 L-14 8 L-6 15" />

                  </g>

                </g>


                {/* PINS */}

                <MapPinSvg
                  x={260}
                  y={370}
                />

                <MapPinSvg
                  x={720}
                  y={300}
                />

                <MapPinSvg
                  x={915}
                  y={445}
                />

                <MapPinSvg
                  x={680}
                  y={620}
                />

              </svg>

            </div>


            {/* CARD MATCHING */}

            <div
              className="
                absolute
                bottom-3
                right-0
                rounded-2xl
                border
                border-teal-300/15
                bg-[#071725]/92
                px-5
                py-4
                shadow-[0_18px_45px_rgba(0,0,0,0.28)]
                backdrop-blur-xl
              "
            >

              <p
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.14em]
                  text-teal-300
                "
              >
                Matching inteligente
              </p>


              <p
                className="
                  mt-1
                  text-sm
                  text-slate-300
                "
              >
                Conectando interesses entre comarcas
              </p>

            </div>

          </div>

        </div>

      </div>

    </section>

  );

}



/* ============================================================
   PIN DO MAPA
============================================================ */

function MapPinSvg({
  x,
  y,
}: {
  x: number;
  y: number;
}) {

  return (

    <g
      transform={`translate(${x} ${y})`}
      filter="url(#pinShadow)"
    >

      <circle
        r="24"
        fill="#14b8a6"
        opacity="0.10"
      >

        <animate
          attributeName="r"
          values="20;28;20"
          dur="3s"
          repeatCount="indefinite"
        />

        <animate
          attributeName="opacity"
          values="0.14;0.03;0.14"
          dur="3s"
          repeatCount="indefinite"
        />

      </circle>


      <circle
        r="20"
        fill="#0d5960"
        stroke="#5eead4"
        strokeOpacity="0.48"
        strokeWidth="2"
      />


      <path
        d="
          M0 -10
          C-6 -10 -10 -6 -10 0
          C-10 8 0 15 0 15
          C0 15 10 8 10 0
          C10 -6 6 -10 0 -10
          Z
        "
        fill="#5eead4"
      />


      <circle
        cy="-1"
        r="3.5"
        fill="#0d5960"
      />

    </g>

  );

}