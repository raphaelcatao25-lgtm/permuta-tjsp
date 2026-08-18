import Hero from "@/components/Hero";

import PublicStats from "@/components/PublicStats";

import HowItWorks from "@/components/HowItWorks";


export default function Home() {

  return (

    <div
      className="
        public-home
        relative
      "
    >

      <Hero />

      <PublicStats />

      <HowItWorks />

    </div>

  );

}