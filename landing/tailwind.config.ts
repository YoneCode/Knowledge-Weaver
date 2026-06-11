import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        canvas: "#08090a",
        surface: "#0e0e10",
        "surface-2": "#131316",
        "surface-3": "#1a1a1d",
        line: "#1d1d20",
        "line-strong": "#2a2a30",
        ink: "#fafafa",
        "ink-2": "#a1a1aa",
        "ink-3": "#71717a",
        "ink-4": "#52525b",
        accent: {
          DEFAULT: "#10b981",
          hover: "#34d399",
          press: "#059669",
          fg: "#022c1a",
          tint: "rgba(16,185,129,0.12)",
          border: "rgba(16,185,129,0.32)",
        },
        success: "#34d399",
        danger: "#f87171",
        warn: "#fbbf24",
        info: "#60a5fa",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jbm)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // Editorial scale
        "2xs": ["11px", { lineHeight: "1.4", letterSpacing: "0.04em" }],
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["13px", { lineHeight: "1.55" }],
        base: ["15px", { lineHeight: "1.65" }],
        md: ["17px", { lineHeight: "1.65" }],
        lg: ["19px", { lineHeight: "1.55" }],
        xl: ["22px", { lineHeight: "1.4" }],
        "2xl": ["28px", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        "3xl": ["36px", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "4xl": ["48px", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        "5xl": ["64px", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
        "6xl": ["80px", { lineHeight: "1.0", letterSpacing: "-0.035em" }],
        "7xl": ["96px", { lineHeight: "0.98", letterSpacing: "-0.04em" }],
      },
      letterSpacing: {
        tightest: "-0.05em",
      },
      borderRadius: {
        "4xl": "1.5rem",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        snap: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "dash-flow": {
          "0%": { strokeDashoffset: "32" },
          "100%": { strokeDashoffset: "0" },
        },
        pulse: {
          "0%,100%": { opacity: "0.85" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "dash-flow": "dash-flow 1.6s linear infinite",
        "pulse-soft": "pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
