/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: "#0f172a",
        brand: "#1e40af",
        "brand-light": "#3b82f6",
      },
      fontFamily: {
        sans: ["Inter", "'Noto Sans Khmer'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
