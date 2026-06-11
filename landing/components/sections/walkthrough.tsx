import { Container, SectionEyebrow } from "@/components/ui/container";

const STEPS: { n: string; t: string; p: string }[] = [
  {
    n: "01",
    t: "Connect & register",
    p: "Connect a wallet, claim a starting allotment of credits. Registration is the only gate.",
  },
  {
    n: "02",
    t: "Submit a proposal",
    p: "Stake a small number of credits, write the entry plus a category. The contract sanitizes it before any model sees it.",
  },
  {
    n: "03",
    t: "Validators independently judge",
    p: "Five GenLayer validators each run their own LLM call against the same evidence. The leader proposes; the rest verify by re-deriving.",
  },
  {
    n: "04",
    t: "Consensus or rotation",
    p: "If their decisions match and quality is within the tolerance band, the entry is accepted. If not, validators rotate and the round runs again.",
  },
  {
    n: "05",
    t: "Endorse what holds up",
    p: "Anyone can endorse a node. Endorsements raise the proposer's reputation; rejected stake feeds the shared reward pool.",
  },
];

export function Walkthrough() {
  return (
    <section id="how" className="border-b border-line">
      <Container>
        <div className="py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl mb-14">
            <SectionEyebrow>How it works</SectionEyebrow>
            <h2 className="text-balance font-semibold tracking-tight text-ink text-3xl md:text-4xl lg:text-5xl">
              From wallet to canon, in five steps.
            </h2>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-5 gap-px bg-line border border-line rounded-xl overflow-hidden">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="bg-canvas p-6 md:p-7 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-3 tabular">{s.n}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                </div>
                <h3 className="text-base font-semibold tracking-tight text-ink">
                  {s.t}
                </h3>
                <p className="text-sm text-ink-2 leading-relaxed">{s.p}</p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
