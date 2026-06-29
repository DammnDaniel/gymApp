import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-0": "var(--bg-elev-0)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        ink: {
          DEFAULT: "var(--text)",
          mute: "var(--text-mute)",
          faint: "var(--text-faint)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          press: "var(--accent-press)",
          soft: "var(--accent-soft)",
          ink: "var(--accent-ink)",
        },
        danger: "var(--danger)",
      },
      fontFamily: {
        display: ["var(--font-display)", ...defaultTheme.fontFamily.sans],
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-mono)", ...defaultTheme.fontFamily.mono],
      },
      borderRadius: { sm: "10px", md: "16px", lg: "22px", xl: "28px" },
      boxShadow: {
        card: "var(--shadow-card)",
        hero: "var(--shadow-hero)",
        glow: "var(--glow-accent)",
        focusring: "var(--focus-ring)",
      },
      fontSize: {
        "stat-sm": ["28px", { lineHeight: "1" }],
        stat: ["44px", { lineHeight: "0.95", letterSpacing: "-0.02em" }],
        "stat-lg": ["64px", { lineHeight: "0.92", letterSpacing: "-0.03em" }],
      },
      letterSpacing: { kicker: "0.14em", tightd: "-0.02em" },
    },
  },
  plugins: [],
};

export default config;
