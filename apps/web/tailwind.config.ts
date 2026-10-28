import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          hover: "var(--color-secondary-hover)",
        },
        dark: "var(--color-dark)",
        topbar: "var(--color-bg-topbar)",
        "bg-main": "var(--color-bg-primary)",
        "bg-subtle": "var(--color-bg-secondary)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "bg-primary": "var(--color-bg-primary)",
        "bg-secondary": "var(--color-bg-secondary)",
        "bg-topbar": "var(--color-bg-topbar)",
        "border-main": "var(--color-border)",
        "border-light": "var(--color-border-light)",
        gold: "var(--color-gold)",

        // Geriye dönük uyumluluk
        bg: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
        },
        accent: {
          gold: "var(--color-gold)",
          "gold-hover": "#B39358",
          pink: "var(--color-primary)",
          "pink-hover": "var(--color-primary-hover)",
          rose: "var(--color-primary)",
          "rose-hover": "var(--color-primary-hover)",
        },
        beauty: {
          pink: "var(--color-primary)",
          "pink-hover": "var(--color-primary-hover)",
          cyan: "var(--color-secondary)",
          dark: "var(--color-dark)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
        },
        border: {
          DEFAULT: "var(--color-border)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
