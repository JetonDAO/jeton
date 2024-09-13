/** @type {import('tailwindcss').Config} */
const config = {
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          "0%": { background: "rgba(0,0,0,.0)" },
          "100%": { background: "rgba(0,0,0,.7)" },
        },
        fadeOut: {
          "0%": { background: "rgba(0,0,0,.7)" },
          "100%": { background: "rgba(0,0,0,.0)" },
        },
        scaleUp: {
          "0%": { transform: "scale(.8) translateY(1000px)", opacity: 0 },
          "100%": { transform: "scale(1) translateY(0px)", opacity: 1 },
        },
        scaleBack: {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(.85)" },
        },
        blinky1: {
          "99%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        blinky2: {
          "49%": { opacity: "0" },
          "50%": { opacity: "1" },
          "90%": { opacity: "1" },
        },
      },
      animation: {
        fadeIn: "fadeIn .5s cubic-bezier(0.165, 0.840, 0.440, 1.000) forwards",
        fadeOut: "fadeOut .5s cubic-bezier(0.165, 0.840, 0.440, 1.000) forwards",
        scaleUp: "scaleUp .5s cubic-bezier(0.165, 0.840, 0.440, 1.000) forwards",
        scaleBack: "scaleBack .5s cubic-bezier(0.165, 0.840, 0.440, 1.000) forwards",
        blinky1: "blinky1 2s linear forwards",
        blinky2: "blinky2 3s 14s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
