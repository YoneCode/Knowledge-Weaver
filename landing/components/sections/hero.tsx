import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { ConsensusDiagram } from "@/components/consensus-diagram";
import { cn } from "@/lib/utils";
import { DASHBOARD_URL, EXPLORER_CONTRACT_URL } from "@/lib/links";
import { ArrowUpRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* subtle, restrained backdrop — no rainbow gradient */}
      <div className="hero-glow absolute inset-x-0 top-0 h-[640px] -z-10" aria-hidden />

      <Container>
        <div className="pt-20 pb-24 md:pt-28 md:pb-32 lg:pt-36 lg:pb-40 animate-fade-up">
          {/* Eyebrow */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-2xs text-ink-2">
            <span className="relative inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-accent animate-ping opacity-50" />
            </span>
            Live on GenLayer Bradbury · chain 4221
          </div>

          {/* Headline */}
          <h1 className="text-balance font-semibold tracking-tightest text-ink text-4xl sm:text-5xl md:text-6xl lg:text-7xl max-w-[16ch]">
            A graph that requires a quorum to grow.
          </h1>

          <p className="mt-7 max-w-2xl text-pretty text-lg text-ink-2">
            KnowledgeWeaver routes every contribution through five GenLayer
            validators. Each independently judges it with its own LLM. Only
            when their reasoning converges does the entry write to chain.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href={DASHBOARD_URL}
              className={cn(buttonVariants({ size: "lg", variant: "primary" }), "font-semibold")}
            >
              Open the dashboard
            </a>
            <a
              href="#solution"
              className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}
            >
              See the architecture
            </a>
            <a
              href={EXPLORER_CONTRACT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-1.5 px-2 text-sm text-ink-3 hover:text-ink transition-colors"
            >
              View deployed contract
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Product visual — the actual consensus pipeline */}
        <div className="relative pb-20 md:pb-28">
          <div className="rounded-2xl border border-line bg-surface p-4 md:p-8 lg:p-12">
            <div className="mb-5 flex items-center justify-between text-xs text-ink-3 font-mono">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                pipeline / propose
              </span>
              <span className="hidden sm:inline">leader → 5 validators → equivalence</span>
            </div>
            <ConsensusDiagram variant="full" className="w-full max-w-5xl" />
            <div className="mt-6 grid grid-cols-3 sm:grid-cols-5 gap-3 text-left">
              {["Stake", "Run", "Re-derive", "Compare", "Mutate"].map((step, i) => (
                <div
                  key={step}
                  className="rounded-md border border-line/70 bg-surface-2 px-3 py-2 text-xs"
                >
                  <span className="text-ink-3 font-mono mr-2">0{i + 1}</span>
                  <span className="text-ink-2">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
