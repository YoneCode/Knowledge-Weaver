import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DASHBOARD_URL, EXPLORER_CONTRACT_URL } from "@/lib/links";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="border-b border-line">
      <Container>
        <div className="py-24 md:py-32 lg:py-40">
          <div className="rounded-3xl border border-line bg-surface px-8 py-16 md:p-20 lg:p-24 relative overflow-hidden">
            <div className="hero-glow absolute inset-0 -z-10" aria-hidden />
            <div className="max-w-3xl">
              <h2 className="text-balance font-semibold tracking-tightest text-ink text-3xl md:text-4xl lg:text-5xl">
                Add an entry. Watch it earn its place.
              </h2>
              <p className="mt-6 text-md md:text-lg text-ink-2 leading-relaxed max-w-2xl">
                Open the dashboard, connect a wallet, submit a proposal.
                Five validators will independently judge it within a few
                minutes — and you'll see the verdict as it lands on chain.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <a
                  href={DASHBOARD_URL}
                  className={cn(
                    buttonVariants({ size: "lg", variant: "primary" }),
                    "font-semibold gap-2",
                  )}
                >
                  Open the dashboard
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={EXPLORER_CONTRACT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "secondary" }),
                    "gap-2",
                  )}
                >
                  View contract on explorer
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
