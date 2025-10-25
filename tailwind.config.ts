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
        background: {
          DEFAULT: "#F7F8FA",
          surface: "#FFFFFF",
          subtle: "#EEF1F6",
        },
        foreground: {
          DEFAULT: "#1F2433",
          muted: "#5B6170",
          subtle: "#8892A6",
        },
        border: "#E3E8EF",
        accent: {
          DEFAULT: "#8B5CF6",
          hover: "#7C3AED",
          soft: "#F4F0FF",
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        dashboard: '960px',
      },
      borderRadius: {
        card: '16px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 12px 32px rgba(15, 23, 42, 0.05)',
        soft: '0 6px 18px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
