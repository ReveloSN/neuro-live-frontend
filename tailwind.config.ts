import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f5f4ef",
        ink: "#171717",
        muted: "#5d5d57",
        line: "#d9d7cf",
        accent: {
          50: "#f1f5f2",
          100: "#dde7e0",
          500: "#5d7b69",
          600: "#4d6658",
          700: "#3e5348"
        },
        alert: {
          normal: "#6e8b74",
          elevated: "#b98d46",
          crisis: "#b85c5c"
        }
      },
      boxShadow: {
        soft: "0 18px 48px rgba(22, 22, 18, 0.08)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      backgroundImage: {
        "calm-grid":
          "radial-gradient(circle at top, rgba(255,255,255,0.7), transparent 34%), linear-gradient(rgba(217,215,207,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(217,215,207,0.45) 1px, transparent 1px)"
      },
      backgroundSize: {
        grid: "100% 100%, 32px 32px, 32px 32px"
      }
    }
  },
  plugins: []
};

export default config;
