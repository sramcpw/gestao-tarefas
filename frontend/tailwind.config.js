/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F5F6FA",
        surface: "#FFFFFF",
        ink: "#1B1F3B",
        muted: "#6B708C",
        border: "#E4E6F0",
        primary: {
          DEFAULT: "#2F5D8A",
          dark: "#1F3F60",
          light: "#EAF1F8",
        },
        accent: {
          DEFAULT: "#E1A32A",
          dark: "#B9820F",
        },
        status: {
          pendente: "#E1A32A",
          concluida: "#2F9E6E",
          cancelada: "#D14D5B",
          adiada: "#7C6FE0",
        },
        priority: {
          baixa: "#8A90AD",
          media: "#3D7DBF",
          alta: "#D9822B",
          urgente: "#DC2626",
        },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
      },
    },
  },
  plugins: [],
};
