/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#008080", // Teal
          50: "#f0fdfd",
          100: "#ccfbf9",
          500: "#008080",
          600: "#006666",
          700: "#004d4d",
        },
        accent: {
          DEFAULT: "#FF7F50", // Coral
          50: "#fff4f2",
          100: "#ffe6e1",
          500: "#FF7F50",
          600: "#e55a2b",
          700: "#cc4a1c",
        },
        neutral: {
          DEFAULT: "#F5F5F5",
          50: "#ffffff",
          100: "#F5F5F5",
          200: "#e5e5e5",
          800: "#404040",
          900: "#262626",
        },
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        quicksand: ["Quicksand", "sans-serif"],
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
