import { Container, SectionEyebrow } from "@/components/ui/container";
import { ConsensusDiagram } from "@/components/consensus-diagram";

export function Solution() {
  return (
    <section id="solution" className="border-b border-line">
      <Container>
        <div className="py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl">
            <SectionEyebrow>The architecture</SectionEyebrow>
            <h2 className="text-balance font-semibold tracking-tight text-ink text-3xl md:text-4xl lg:text-5xl">
              Independent reasoning, with consensus as the verifier.
            </h2>
            <p className="mt-6 text-md text-ink-2 leading-relaxed">
              KnowledgeWeaver runs every proposal through a leader and a
              quorum of validators. Each validator independently re-derives
              the judgment using its own model. The contract accepts the
              verdict only when validators converge — not on a hash, but on
              the substance of the reasoning.
            </p>
          </div>

          <figure className="mt-16 rounded-2xl border border-line bg-surface p-6 md:p-10 lg:p-14">
            <ConsensusDiagram variant="full" className="w-full max-w-5xl" />

            <figcaption className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-px bg-line border-t border-line">
              {[
                {
                  k: "Leader",
                  v: "Runs the prompt once and proposes a verdict to the network.",
                },
                {
                  k: "Validators",
                  v: "Each rerun the same task with their own model and emit an independent verdict.",
                },
                {
                  k: "Equivalence",
                  v: "Agreement on decision plus quality within a coarse band; otherwise, rotate.",
                },
              ].map((step) => (
                <div key={step.k} className="bg-surface p-6">
                  <div className="text-2xs uppercase tracking-[0.18em] text-ink-3 mb-2">
                    {step.k}
                  </div>
                  <div className="text-sm text-ink-2 leading-relaxed">{step.v}</div>
                </div>
              ))}
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
