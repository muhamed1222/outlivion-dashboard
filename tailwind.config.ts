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
        background: "#000000",
        foreground: "#FFFFFF",
        accent: {
          DEFAULT: "#FF6B35",
          hover: "#FF8355",
          dark: "#E85A25",
        },
        gray: {
          850: "#1A1A1A",
          900: "#0F0F0F",
          950: "#050505",
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        'dashboard': '1200px',
      },
    },
  },
  plugins: [],
};

export default config;

