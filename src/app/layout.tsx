import type { Metadata } from "next";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {

  title: {
    default: "Permuta TJSP",
    template: "%s | Permuta TJSP",
  },

  description:
    "Plataforma para localização e gerenciamento de oportunidades de permuta entre servidores do Tribunal de Justiça de São Paulo.",

};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (

    <html
      lang="pt-BR"
      className="
        bg-[#04111d]
      "
    >

      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          min-h-screen
          antialiased
        `}
      >

        {children}

      </body>

    </html>

  );

}