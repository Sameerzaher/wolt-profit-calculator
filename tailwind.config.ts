import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          elevated: "rgb(var(--surface-elevated) / <alpha-value>)"
        },
        accent: {
          DEFAULT: "#34d399",
          muted: "#10b981",
          glow: "rgba(52, 211, 153, 0.35)"
        }
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        "glass-lg": "0 16px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        dock: "0 -12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        glow: "0 0 40px rgba(52, 211, 153, 0.15)"
      },
      fontSize: {
        "display-sm": ["1.75rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "800" }],
        display: ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "800" }],
        stat: ["2rem", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "800" }]
      },
      spacing: {
        nav: "var(--nav-height)"
      },
      backdropBlur: {
        glass: "20px"
      }
    }
  },
  plugins: []
};

export default config;
