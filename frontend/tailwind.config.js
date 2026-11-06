/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      colors: {
        hazenor: {
          navy: "#172B38",
          "navy-deep": "#0F1E28",
          "navy-light": "#213B4D",
          gold: "#C9B58E",
          "gold-light": "#DFD1B4",
          "gold-dark": "#A89268",
          ivory: "#EAE5DB",
          "ivory-light": "#F6F4EF",
          graphite: "#303437",
          "graphite-muted": "#5A6065",
        },
        brand: {
          50: "#F6F4EF",
          100: "#EAE5DB",
          500: "#C9B58E",
          600: "#172B38",
          700: "#12222D",
          900: "#0B161E",
        },
      },
    },
  },
  plugins: [],
};
