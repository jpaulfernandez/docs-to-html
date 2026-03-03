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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Rappler brand palette
        navy: {
          DEFAULT: "#172038",
          dark: "#121a2d",
          light: "#454d60",
        },
        orange: {
          courage: "#ff5f1b",
          "courage-light": "#ff8c5a",
        },
        ghost: "#f5f6ff",
        midnight: {
          DEFAULT: "#101626",
          light: "#404551",
          lighter: "#70737d",
        },
        blueblack: "#18213a",
        hustle: "#1e1558",
        midblue: "#575d75",
        ash: "#ebedff",
        move: {
          DEFAULT: "#50558b",
          dark: "#404464",
          light: "#7377a2",
        },
        vanilla: {
          DEFAULT: "#ffffff",
          dark: "#eeeef3",
          darker: "#cbccdc",
        },
        "system-gray": {
          DEFAULT: "#6c6f8b",
          dark: "#56596f",
          darker: "#414353",
        },
      },
      fontFamily: {
        serif: ["'PTSerifRegular'", "Georgia", "serif"],
        "serif-italic": ["'PTSerifItalic'", "Georgia", "serif"],
        sans: ["'IBMPlexSans'", "'IBM Plex Sans'", "system-ui", "sans-serif"],
        condensed: ["'OpenSansCondensed'", "sans-serif"],
      },
      spacing: {
        "gap-s": "16px",
        "gap-m": "32px",
        "gap-l": "56px",
        "col-s": "16px",
        "col-m": "48px",
        "col-l": "56px",
        "col-xl": "64px",
      },
      maxWidth: {
        content: "1124px",
      },
      letterSpacing: {
        regular: "0.01em",
        italic: "0.0313em",
        "header-big": "-0.0625em",
        "header-medium": "-0.0313em",
        "tertiary-big": "0.1875em",
        "tertiary-medium": "0.125em",
      },
      transitionDuration: {
        quick: "200ms",
        slow: "1000ms",
        xslow: "2000ms",
      },
    },
  },
  plugins: [],
};
export default config;
