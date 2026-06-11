import { Container, SectionEyebrow } from "@/components/ui/container";

const ROWS = [
  {
    h: "Single-model risk",
    p: "When a system delegates a decision to one model, that model's blind spots become the system's blind spots. There is no second opinion to catch the failure.",
  },
  {
    h: "Centralized moderation has the same shape",
    p: "Replacing the model with a person doesn't fix the architecture. One arbiter, one bias, one outage.",
  },
  {
    h: "Smart contracts can't decide what isn't a number",
    p: "EVM contracts avoid subjectivity by refusing to express it. Anything that needs reasoning has to be decided off-chain — and quietly trusted.",
  },
];

export function Problem() {
  return (
    <section id="problem" className="border-b border-line">
      <Container>
        <div className="py-24 md:py-32 lg:py-40">
          <SectionEyebrow>The problem</SectionEyebrow>
          <h2 className="text-balance font-semibold tracking-tight text-ink text-3xl md:text-4xl lg:text-5xl max-w-[18ch]">
            A single model is a single point of failure.
          </h2>
          <p className="mt-6 max-w-2xl text-md text-ink-2">
            Most AI-driven systems put one model in charge of one decision.
            Knowledge needs judgment. Judgment without checks is brittle.
          </p>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-line border border-line rounded-xl overflow-hidden">
            {ROWS.map((r) => (
              <article
                key={r.h}
                className="bg-canvas p-6 md:p-8 lg:p-10"
              >
                <h3 className="text-lg font-semibold tracking-tight text-ink mb-3">{r.h}</h3>
                <p className="text-base text-ink-2 leading-relaxed">{r.p}</p>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
