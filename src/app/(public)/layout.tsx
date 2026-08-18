import {
  PublicHeader,
} from "@/components/layout/PublicHeader";

import {
  Footer,
} from "@/components/layout/Footer";


export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <div
      className="
        public-page-background
        flex
        min-h-screen
        flex-col
      "
    >

      <PublicHeader />

      <main
        className="
          relative
          z-10
          flex-1
        "
      >

        {children}

      </main>

      <Footer />

    </div>

  );

}