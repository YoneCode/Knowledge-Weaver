"use client";

import { Container, SectionEyebrow } from "@/components/ui/container";
import { Plus } from "lucide-react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "How is this different from calling ChatGPT?",
    a: "A single API call to a single model has no second opinion. KnowledgeWeaver requires multiple, independent models to converge — and that convergence is what writes to chain. If one model has a blind spot, the others catch it. The blockchain isn't doing the reasoning; it's recording what an open quorum of reasoners agreed on.",
  },
  {
    q: "What happens when validators disagree?",
    a: "The protocol forces rotation, not unanimity. If decisions diverge or quality scores fall outside the tolerance band, the proposal stays pending and a different set of validators tries. There is no path where one validator's preference quietly becomes the answer.",
  },
  {
    q: "Why a smart contract instead of a database?",
    a: "So nothing is taken on faith. The contract state, the proposals, the verdicts, the participants — all auditable on Bradbury without our cooperation. The point of the chain isn't decentralization for its own sake; it's that a public ledger of judgments cannot be quietly rewritten.",
  },
  {
    q: "Can I run a validator?",
    a: "GenLayer validators are run by the network. KnowledgeWeaver consumes their consensus rather than operating its own. To contribute knowledge you only need a wallet; to run validation you'd join the GenLayer network directly.",
  },
  {
    q: "What does it cost?",
    a: "Internal credit bookkeeping in u256 atto-scale. Submitting a proposal stakes credits; accepted proposals refund the stake plus a small bonus from the reward pool; rejected stake feeds the pool. Bradbury network gas is paid in test GEN, free from the public faucet.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="border-b border-line">
      <Container>
        <div className="py-24 md:py-32 lg:py-40 grid grid-cols-1 lg:grid-cols-[1fr,1.6fr] gap-10 lg:gap-20">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SectionEyebrow>Questions</SectionEyebrow>
            <h2 className="text-balance font-semibold tracking-tight text-ink text-3xl md:text-4xl lg:text-5xl">
              The four objections people actually have.
            </h2>
            <p className="mt-6 text-md text-ink-2 max-w-md">
              Short answers, no marketing language.
            </p>
          </div>

          <div className="border-t border-line">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group border-b border-line py-6 [&[open]]:pb-7"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
                  <span className="text-lg md:text-xl font-medium tracking-tight text-ink">
                    {f.q}
                  </span>
                  <span className="mt-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-line text-ink-3 transition-transform duration-200 group-open:rotate-45 group-open:text-accent group-open:border-accent-border">
                    <Plus className="h-3 w-3" />
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl text-base text-ink-2 leading-relaxed">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
