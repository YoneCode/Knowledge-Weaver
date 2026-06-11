import { cn } from "@/lib/utils";

interface DiagramProps {
  className?: string;
  variant?: "compact" | "full";
}

/**
 * Architectural diagram of KnowledgeWeaver consensus.
 * - Compact: hero corner. No labels, just the structure.
 * - Full: solution section. Labeled.
 */
export function ConsensusDiagram({ className, variant = "full" }: DiagramProps) {
  const isFull = variant === "full";

  return (
    <svg
      viewBox="0 0 720 360"
      role="img"
      aria-label="Consensus diagram: a proposal is judged independently by five validators; only when their reasoning converges does it accept"
      className={cn("w-full h-auto", className)}
    >
      <defs>
        <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a2a30" />
          <stop offset="50%" stopColor="#34d399" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#2a2a30" />
        </linearGradient>
        <radialGradient id="dot-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.4" />
        </filter>
      </defs>

      {/* Wires: proposal -> validators */}
      {[60, 120, 180, 240, 300].map((y, i) => (
        <path
          key={`l-${i}`}
          d={`M 132 180 C 220 180 260 ${y} 320 ${y}`}
          fill="none"
          stroke="url(#line-grad)"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="animate-dash-flow"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}

      {/* Wires: validators -> equivalence */}
      {[60, 120, 180, 240, 300].map((y, i) => (
        <path
          key={`r-${i}`}
          d={`M 408 ${y} C 470 ${y} 500 180 540 180`}
          fill="none"
          stroke="url(#line-grad)"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="animate-dash-flow"
          style={{ animationDelay: `${0.6 + i * 0.12}s` }}
        />
      ))}

      {/* Wire: equivalence -> accepted */}
      <path
        d="M 588 180 L 660 180"
        fill="none"
        stroke="#10b981"
        strokeWidth="1.25"
        strokeLinecap="round"
      />

      {/* Proposal node */}
      <g>
        <rect x="48" y="160" width="84" height="40" rx="8" fill="#0e0e10" stroke="#2a2a30" />
        <text
          x="90"
          y="184"
          textAnchor="middle"
          className="fill-ink-2"
          fontFamily="var(--font-jbm), monospace"
          fontSize="11"
          fontWeight="500"
        >
          proposal
        </text>
      </g>

      {/* Validator nodes — five */}
      {[60, 120, 180, 240, 300].map((y, i) => (
        <g key={`v-${i}`}>
          <circle cx="364" cy={y} r="32" fill="url(#dot-glow)" />
          <circle cx="364" cy={y} r="14" fill="#0e0e10" stroke="#2a2a30" strokeWidth="1" />
          <circle cx="364" cy={y} r="3" fill="#34d399" filter="url(#soft)" />
          {isFull && (
            <text
              x={420}
              y={y + 4}
              className="fill-ink-3"
              fontFamily="var(--font-jbm), monospace"
              fontSize="10"
            >
              validator {String.fromCharCode(65 + i)}
            </text>
          )}
        </g>
      ))}

      {/* Equivalence check */}
      <g>
        <rect x="540" y="156" width="48" height="48" rx="10" fill="#0e0e10" stroke="#10b981" strokeOpacity="0.45" />
        <path d="M 552 180 l 8 8 16 -16" stroke="#10b981" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {isFull && (
          <text
            x={564}
            y={224}
            textAnchor="middle"
            className="fill-ink-3"
            fontFamily="var(--font-jbm), monospace"
            fontSize="10"
          >
            equivalence
          </text>
        )}
      </g>

      {/* Accepted node */}
      <g>
        <rect x="660" y="160" width="56" height="40" rx="8" fill="#10b98115" stroke="#10b98155" />
        <text
          x="688"
          y="184"
          textAnchor="middle"
          fill="#34d399"
          fontFamily="var(--font-jbm), monospace"
          fontSize="11"
          fontWeight="500"
        >
          accept
        </text>
      </g>
    </svg>
  );
}
