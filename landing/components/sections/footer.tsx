import { Container } from "@/components/ui/container";
import { DASHBOARD_URL } from "@/lib/links";
import { Github } from "lucide-react";

const GITHUB_URL = "https://github.com/YoneCode/Knowledge-Weaver";
const X_URL = "https://x.com/YoneCode";

const SITEMAP: { title: string; links: { l: string; h: string; ext?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { l: "Dashboard", h: DASHBOARD_URL },
      { l: "Architecture", h: "#solution" },
      { l: "Walkthrough", h: "#how" },
      { l: "FAQ", h: "#faq" },
    ],
  },
  {
    title: "Network",
    links: [
      { l: "Explorer", h: "https://explorer-bradbury.genlayer.com/", ext: true },
      { l: "Faucet", h: "https://testnet-faucet.genlayer.foundation/", ext: true },
      { l: "GenLayer", h: "https://genlayer.com", ext: true },
    ],
  },
  {
    title: "Developers",
    links: [
      { l: "Docs", h: "https://docs.genlayer.com/", ext: true },
      { l: "GenLayer SDK", h: "https://github.com/genlayerlabs", ext: true },
      { l: "Source", h: GITHUB_URL, ext: true },
    ],
  },
];

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-canvas">
      <Container>
        <div className="py-16 md:py-20 grid grid-cols-2 md:grid-cols-[2fr,1fr,1fr,1fr] gap-10 md:gap-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-accent-border bg-accent-tint text-accent">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 6 L12 12 L19 6" />
                  <path d="M5 18 L12 12 L19 18" />
                  <circle cx="5" cy="6" r="1.6" fill="currentColor" />
                  <circle cx="19" cy="6" r="1.6" fill="currentColor" />
                  <circle cx="5" cy="18" r="1.6" fill="currentColor" />
                  <circle cx="19" cy="18" r="1.6" fill="currentColor" />
                  <circle cx="12" cy="12" r="2.3" fill="currentColor" />
                </svg>
              </span>
              <span className="text-sm font-semibold tracking-tight">KnowledgeWeaver</span>
            </div>
            <p className="mt-4 text-sm text-ink-3 max-w-xs leading-relaxed">
              An on-chain knowledge graph governed by independent AI judgment.
              Built on GenLayer Bradbury.
            </p>
            <p className="mt-6 text-xs text-ink-3 font-mono break-all">
              0xE9b1c0c58fa9f1307223859d703686D7b02a5775
            </p>
          </div>

          {SITEMAP.map((g) => (
            <nav key={g.title} aria-label={g.title}>
              <div className="text-2xs uppercase tracking-[0.18em] text-ink-3 mb-4">
                {g.title}
              </div>
              <ul className="space-y-2.5">
                {g.links.map((lnk) => (
                  <li key={lnk.l}>
                    <a
                      href={lnk.h}
                      {...(lnk.ext ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="text-sm text-ink-2 hover:text-ink transition-colors"
                    >
                      {lnk.l}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-t border-line py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-ink-3">
          <span>© {new Date().getFullYear()} KnowledgeWeaver · Open-source under MIT.</span>
          <div className="flex items-center gap-2">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="View source on GitHub"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href={X_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Follow on X"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
            >
              <XIcon size={14} />
            </a>
            <span className="hidden md:inline-block h-4 w-px bg-line mx-1" aria-hidden />
            <span className="font-mono text-xs">Bradbury · chain 4221</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
