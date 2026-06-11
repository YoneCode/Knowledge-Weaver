import { Container } from "@/components/ui/container";

const ITEMS: { k: string; v: string; mono?: boolean }[] = [
  { k: "Network", v: "GenLayer Bradbury · 4221" },
  { k: "Contract", v: "0xE9b1c0c5…5775", mono: true },
  { k: "Validators / proposal", v: "5 independent" },
  { k: "Tolerance band", v: "± 30 quality points" },
  { k: "Source", v: "MIT · open contracts" },
];

export function Trust() {
  return (
    <section aria-label="Trust" className="border-b border-line">
      <Container>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y divide-line lg:divide-y-0 lg:divide-x lg:divide-line">
          {ITEMS.map((it, i) => (
            <div
              key={it.k}
              className={`px-4 py-6 lg:py-7 ${i === 0 ? "" : "lg:pl-8"} ${
                i === ITEMS.length - 1 ? "" : "lg:pr-8"
              }`}
            >
              <div className="text-2xs uppercase tracking-[0.18em] text-ink-3">{it.k}</div>
              <div
                className={`mt-1.5 text-sm ${it.mono ? "font-mono text-ink-2" : "text-ink"}`}
              >
                {it.v}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
