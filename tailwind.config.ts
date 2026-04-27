import type { Config } from "tailwindcss";
import { AgoraTailwindConfig } from "@ama-pt/agora-design-system";

const TailwindConfig: Config = {
  content: [
    "src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    ...AgoraTailwindConfig.theme,
    screens: {
      ...AgoraTailwindConfig.theme.screens,
      sm: "576px",
      lg: "1024px",
    },
    extend: {
      ...AgoraTailwindConfig.theme.extend,
      colors: {
        "accent-light": "#F7F7FF",
        "brand-blue-dark": "#021C51",
        "brand-blue-primary": "#0C02CB",
        "brand-blue-secondary": "#050157",
        "gray-medium": "#64718B",
      },
      fontSize: {
        "24": "24px",
        "32": "32px",
        "40": "40px",
      },
      spacing: {
        "2": "2px",
        "4": "4px",
        "6": "6px",
        "12": "12px",
        "20": "20px",
        "24": "24px",
        "32": "32px",
        "40": "40px",
        "64": "64px",
      },
      fontFamily: {
        sans: ["var(--font-noto-sans)", "sans-serif"],
      },
    },
  },
  plugins: AgoraTailwindConfig.plugins,
  safelist: AgoraTailwindConfig.safelist,
  corePlugins: {
    preflight: false,
  },
};

export default TailwindConfig;
