import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0B0B",
        surface: "#121212",
        "bamako-gold": "#FFBF00",
        "bamako-gold-hover": "#E5AB00",
        "bamako-black": "#0B0B0B",
        "bamako-dark": "#121212",
        "bamako-surface": "#161616",
        "bamako-card": "#1A1A1A",
        "bamako-card-hover": "#222222",
        "bamako-border": "#262626",
        "bamako-border-light": "#333333",
        "bamako-gray": "#B8B8B8",
        "bamako-muted": "#757575",
      },
      fontFamily: {
        headline: ["Poppins", "sans-serif"],
        sans: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
