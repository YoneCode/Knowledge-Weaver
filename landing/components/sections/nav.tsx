import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DASHBOARD_URL } from "@/lib/links";
import { Github } from "lucide-react";

const NAV = [
  { href: "#problem", label: "Problem" },
  { href: "#solution", label: "Architecture" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "Walkthrough" },
  { href: "#faq", label: "FAQ" },
];

const GITHUB_URL = "https://github.com/YoneCode/Knowledge-Weaver";
const X_URL = "https://x.com/YoneCode";

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/70 backdrop-blur-md backdrop-saturate-150">
      <Container>
        <div className="flex h-14 items-center justify-between gap-4">
          <Link href="#" aria-label="KnowledgeWeaver home" className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-accent-border bg-accent-tint text-accent"
            >
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
          </Link>

          <nav aria-label="Sections" className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="px-3 py-2 text-sm text-ink-2 hover:text-ink transition-colors"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="View source on GitHub"
              className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href={X_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Follow on X"
              className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
            >
              <XIcon size={14} />
            </a>
            <span className="hidden sm:inline-block h-5 w-px bg-line mx-1" aria-hidden />
            <a
              href="https://docs.genlayer.com/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex h-8 items-center rounded-md px-3 text-sm text-ink-2 hover:text-ink transition-colors"
            >
              Docs
            </a>
            <a
              href={DASHBOARD_URL}
              className={cn(buttonVariants({ size: "sm", variant: "primary" }), "font-semibold")}
            >
              Open dashboard
            </a>
          </div>
        </div>
      </Container>
    </header>
  );
}
