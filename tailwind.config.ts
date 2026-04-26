import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0A0A0A",
          cream: "#F8F5F0",
          "cream-dark": "#EDE8E0",
          gray: {
            900: "#111111",
            800: "#1C1C1C",
            700: "#2C2C2C",
            600: "#6B6B6B",
            400: "#AAAAAA",
            200: "#E5E5E5",
            100: "#F7F7F7",
          },
        },
        status: {
          pending: "#3B82F6",
          completed: "#10B981",
          cancelled: "#EF4444",
          no_show: "#F97316",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
