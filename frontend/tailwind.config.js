/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#5b9a8b", // Soft Teal
          50: "#f0f7f5",
          100: "#d9ebe6",
          200: "#b8d9cf",
          300: "#91c2b3",
          400: "#7fb8aa",
          500: "#5b9a8b",
          600: "#4a8275",
          700: "#3d6a60",
          800: "#345650",
          900: "#2d4943",
        },
        accent: {
          DEFAULT: "#d4a5a0", // Soft Coral
          50: "#faf6f5",
          100: "#f2e8e6",
          200: "#e8c4c0",
          300: "#d4a5a0",
          400: "#c18982",
          500: "#b3736b",
          600: "#a35f57",
          700: "#8b4f49",
          800: "#744540",
          900: "#5f3a35",
        },
        neutral: {
          DEFAULT: "#f8f9fa",
          50: "#fcfcfd",
          100: "#f8f9fa",
          200: "#f1f3f5",
          300: "#e9ecef",
          400: "#dee2e6",
          500: "#adb5bd",
          600: "#868e96",
          700: "#495057",
          800: "#343a40",
          900: "#212529",
        },
      },
      fontFamily: {
        poppins: ["Poppins", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "sans-serif"],
        quicksand: ["Quicksand", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "sans-serif"],
        sans: ["Poppins", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "sans-serif"],
      },
      fontSize: {
        body: ["18px", "1.6"],
        "body-sm": ["16px", "1.5"],
        "heading-sm": ["24px", "1.4"],
        heading: ["32px", "1.3"],
        "heading-lg": ["48px", "1.2"],
      },
      screens: {
        desktop: "1280px",
        wide: "1440px",
        ultrawide: "1920px",
      },
      animation: {
        parallax: "parallax 20s linear infinite",
        float: "float 3s ease-in-out infinite",
        "bounce-slow": "bounce 2s infinite",
      },
      keyframes: {
        parallax: {
          "0%": { transform: "translateY(0px)" },
          "100%": { transform: "translateY(-100px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
};
