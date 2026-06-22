/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        kfc: {
          red: "#C8102E",
          "red-dark": "#A30D24",
          gold: "#FFC72C",
          black: "#1A1A1A",
          cream: "#FFF8EC",
        },
      },
      fontFamily: {
        display: ["Poppins", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        bucket: "1.25rem",
      },
    },
  },
  plugins: [],
};
