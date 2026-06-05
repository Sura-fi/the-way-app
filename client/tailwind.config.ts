import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Sacred Serenity Color Palette ──────────────
      colors: {
        parchment: {
          light: "#FAF6F0",   // Page backgrounds
          DEFAULT: "#F0E6D4", // Card surfaces, callout backgrounds
          dark: "#E8DBC8",    // Hover states, subtle borders
        },
        gold: {
          muted: "#C4A862",   // Accents, active toggle glow, icons
          bright: "#D4B96B",  // Toggle "ON" state, highlight borders
        },
        umber: {
          deep: "#3E2C1E",    // Primary text, headings
          soft: "#6B5744",    // Secondary text, labels
        },
        charcoal: "#2D2A26",    // Dark surfaces (Priest sidebar)
        "cream-white": "#FFFDF7", // Input fields, light surfaces
        sage: "#5A7A5E",        // Success / "Done" toggle state
        "warm-red": "#8B3A3A",  // Error states, destructive actions
      },

      // ── Font Families ─────────────────────────────
      fontFamily: {
        ethiopic: ["var(--font-noto-serif-ethiopic)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },

      // ── Subtle Animations ─────────────────────────
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
