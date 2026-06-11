import { Nav } from "@/components/sections/nav";
import { Hero } from "@/components/sections/hero";
import { Trust } from "@/components/sections/trust";
import { Problem } from "@/components/sections/problem";
import { Solution } from "@/components/sections/solution";
import { Features } from "@/components/sections/features";
import { Walkthrough } from "@/components/sections/walkthrough";
import { Results } from "@/components/sections/results";
import { FAQ } from "@/components/sections/faq";
import { FinalCTA } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Trust />
        <Problem />
        <Solution />
        <Features />
        <Walkthrough />
        <Results />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
