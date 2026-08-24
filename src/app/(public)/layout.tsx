import {
  PublicHeader,
} from "@/components/layout/PublicHeader";


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

    </div>

  );

}