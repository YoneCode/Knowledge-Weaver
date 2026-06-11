import { cn } from "@/lib/utils";
import * as React from "react";

/**
 * Full-width, left-anchored container.
 *
 * Sections span the entire viewport (background/borders edge-to-edge);
 * content uses generous left/right padding instead of an auto-centered
 * narrow column. On very wide screens the content area extends to the
 * right naturally — like a modern business dashboard.
 *
 * Individual text columns within sections still cap their width
 * (e.g. max-w-2xl on paragraphs) so prose stays readable.
 */
export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("w-full px-6 sm:px-8 lg:px-12 xl:px-16", className)}
      {...props}
    />
  );
}

export function SectionEyebrow({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-2xs uppercase tracking-[0.18em] text-ink-3 mb-4 font-medium",
        className,
      )}
      {...props}
    />
  );
}
