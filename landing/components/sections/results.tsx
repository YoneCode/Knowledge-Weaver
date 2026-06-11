import { Container, SectionEyebrow } from "@/components/ui/container";
import { Check, X, Minus } from "lucide-react";

type Cell = "yes" | "no" | "partial";

const HEADERS = ["", "Single LLM", "Centralized moderation", "EVM contract", "KnowledgeWeaver"];

const ROWS: { label: string; cells: Cell[] }[] = [
  { label: "Subjective decisions", cells: ["yes", "yes", "no", "yes"] },
  { label: "Independent verification", cells: ["no", "no", "yes", "yes"] },
  { label: "Reproducible by anyone", cells: ["no", "no", "yes", "yes"] },
  { label: "Resists single-actor bias", cells: ["no", "no", "yes", "yes"] },
  { label: "Carries reasoning forward", cells: ["partial", "no", "no", "yes"] },
];

function CellIcon({ v }: { v: Cell }) {
  if (v === "yes")
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent-tint border border-accent-border text-accent">
        <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>
    );
  if (v === "no")
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-line text-ink-3">
        <X className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>
    );
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-line text-ink-3">
      <Minus className="h-3.5 w-3.5" strokeWidth={2.25} />
    </span>
  );
}

export function Results() {
  return (
    <section id="results" className="border-b border-line">
      <Container>
        <div className="py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl mb-14">
            <SectionEyebrow>Where it fits</SectionEyebrow>
            <h2 className="text-balance font-semibold tracking-tight text-ink text-3xl md:text-4xl lg:text-5xl">
              The same shape of problem, decided four different ways.
            </h2>
            <p className="mt-6 text-md text-ink-2 leading-relaxed max-w-2xl">
              The single-LLM column and the centralized-moderation column look
              alike for a reason: both put one actor in charge of one decision.
              KnowledgeWeaver picks the shape from the right two columns of
              this table — auditability — and adds the one thing they lack.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-line">
                    {HEADERS.map((h, i) => (
                      <th
                        key={i}
                        scope="col"
                        className={`px-6 py-5 text-left text-2xs uppercase tracking-[0.16em] font-medium ${
                          i === HEADERS.length - 1 ? "text-accent" : "text-ink-3"
                        } ${i === 0 ? "w-[42%]" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r, ri) => (
                    <tr
                      key={r.label}
                      className={ri === ROWS.length - 1 ? "" : "border-b border-line"}
                    >
                      <th
                        scope="row"
                        className="px-6 py-5 text-left font-medium text-ink"
                      >
                        {r.label}
                      </th>
                      {r.cells.map((c, ci) => (
                        <td
                          key={ci}
                          className={`px-6 py-5 ${ci === r.cells.length - 1 ? "bg-surface-2/40" : ""}`}
                        >
                          <CellIcon v={c} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
