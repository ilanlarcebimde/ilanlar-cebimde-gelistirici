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
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        surface: {
          light: "rgba(255,255,255,0.72)",
          border: "rgba(255,255,255,0.4)",
        },
      },
      fontFamily: {
        sans: ["system-ui", "Segoe UI", "sans-serif"],
        display: ["system-ui", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.06)",
        soft: "0 4px 24px rgba(0,0,0,0.06)",
        hover: "0 12px 40px rgba(0,0,0,0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        marquee: "marquee 40s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      backgroundImage: {
        "gradient-soft": "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
