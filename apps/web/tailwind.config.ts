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
          DEFAULT:
            "color-mix(in srgb, var(--color-primary) calc(<alpha-value> * 100%), transparent)",
          hover:
            "color-mix(in srgb, var(--color-primary-hover) calc(<alpha-value> * 100%), transparent)",
        },
        secondary: {
          DEFAULT:
            "color-mix(in srgb, var(--color-secondary) calc(<alpha-value> * 100%), transparent)",
          hover:
            "color-mix(in srgb, var(--color-secondary-hover) calc(<alpha-value> * 100%), transparent)",
        },
        dark: "color-mix(in srgb, var(--color-dark) calc(<alpha-value> * 100%), transparent)",
        topbar:
          "color-mix(in srgb, var(--color-bg-topbar) calc(<alpha-value> * 100%), transparent)",
        "bg-main":
          "color-mix(in srgb, var(--color-bg-header) calc(<alpha-value> * 100%), var(--color-bg-primary))",
        "bg-header":
          "color-mix(in srgb, var(--color-bg-header) calc(<alpha-value> * 100%), var(--color-bg-primary))",
        "bg-subtle":
          "color-mix(in srgb, var(--color-bg-secondary) calc(<alpha-value> * 100%), transparent)",
        "text-primary":
          "color-mix(in srgb, var(--color-text-primary) calc(<alpha-value> * 100%), transparent)",
        "text-secondary":
          "color-mix(in srgb, var(--color-text-secondary) calc(<alpha-value> * 100%), transparent)",
        "bg-primary":
          "color-mix(in srgb, var(--color-bg-header) calc(<alpha-value> * 100%), var(--color-bg-primary))",
        "bg-secondary":
          "color-mix(in srgb, var(--color-bg-secondary) calc(<alpha-value> * 100%), transparent)",
        "bg-topbar":
          "color-mix(in srgb, var(--color-bg-topbar) calc(<alpha-value> * 100%), transparent)",
        "border-main":
          "color-mix(in srgb, var(--color-border) calc(<alpha-value> * 100%), transparent)",
        "border-light":
          "color-mix(in srgb, var(--color-border-light) calc(<alpha-value> * 100%), transparent)",
        gold: "color-mix(in srgb, var(--color-gold) calc(<alpha-value> * 100%), transparent)",

        // Geriye dönük uyumluluk
        bg: {
          primary:
            "color-mix(in srgb, var(--color-bg-header) calc(<alpha-value> * 100%), var(--color-bg-primary))",
          secondary:
            "color-mix(in srgb, var(--color-bg-secondary) calc(<alpha-value> * 100%), transparent)",
        },
        accent: {
          gold: "color-mix(in srgb, var(--color-gold) calc(<alpha-value> * 100%), transparent)",
          "gold-hover": "#B39358",
          pink: "color-mix(in srgb, var(--color-primary) calc(<alpha-value> * 100%), transparent)",
          "pink-hover":
            "color-mix(in srgb, var(--color-primary-hover) calc(<alpha-value> * 100%), transparent)",
          rose: "color-mix(in srgb, var(--color-primary) calc(<alpha-value> * 100%), transparent)",
          "rose-hover":
            "color-mix(in srgb, var(--color-primary-hover) calc(<alpha-value> * 100%), transparent)",
        },
        beauty: {
          pink: "color-mix(in srgb, var(--color-primary) calc(<alpha-value> * 100%), transparent)",
          "pink-hover":
            "color-mix(in srgb, var(--color-primary-hover) calc(<alpha-value> * 100%), transparent)",
          cyan: "color-mix(in srgb, var(--color-secondary) calc(<alpha-value> * 100%), transparent)",
          dark: "color-mix(in srgb, var(--color-dark) calc(<alpha-value> * 100%), transparent)",
        },
        text: {
          primary:
            "color-mix(in srgb, var(--color-text-primary) calc(<alpha-value> * 100%), transparent)",
          secondary:
            "color-mix(in srgb, var(--color-text-secondary) calc(<alpha-value> * 100%), transparent)",
        },
        border: {
          DEFAULT:
            "color-mix(in srgb, var(--color-border) calc(<alpha-value> * 100%), transparent)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
