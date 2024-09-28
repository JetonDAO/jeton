/** @type {import('tailwindcss').Config} */
const config = {
  theme: {
    extend: {
      colors: {
        paarl: {
          DEFAULT: "#A76026",
          50: "#E8BE9C",
          100: "#E5B48B",
          200: "#DD9E6A",
          300: "#D68849",
          400: "#C8732E",
          500: "#A76026",
          600: "#79461C",
          700: "#4C2B11",
          800: "#1E1107",
          900: "#000000",
        },
      },
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
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        growIn: {
          "0%": {
            transform: "scale(0.5)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        flip: {
          "0%": {
            transform: "rotateY(90deg)",
          },
          "100%": {
            transform: "rotateY(0deg)",
          },
        },
        fading: {
          "0%": {
            opacity: "0",
          },
          "10%": {
            opacity: "1",
          },
          "80%": {
            opacity: "1",
          },
          "100%": {
            opacity: "0",
          },
        },
        headShake: {
          "0%": { transform: "translateX(0)" },
          "6.5%": { transform: "translateX(-6px) rotateY(-9deg) scale(1.3)" },
          "18.5%": { transform: "translateX(5px) rotateY(7deg) scale(1.3)" },
          "31.5%": { transform: "translateX(-3px) rotateY(-5deg) scale(1.3)" },
          "43.5%": { transform: "translateX(2px) rotateY(3deg) scale(1.3)" },
          "50%": { transform: "translateX(0) scale(1)" },
        },
      },
      animation: {
        fadeIn: "fadeIn .5s cubic-bezier(0.165, 0.840, 0.440, 1.000) forwards",
        fadeOut: "fadeOut .5s cubic-bezier(0.165, 0.840, 0.440, 1.000) forwards",
        scaleUp: "scaleUp .5s cubic-bezier(0.165, 0.840, 0.440, 1.000) forwards",
        scaleBack: "scaleBack .5s cubic-bezier(0.165, 0.840, 0.440, 1.000) forwards",
        blinky1: "blinky1 2s linear forwards",
        blinky2: "blinky2 3s 14s linear infinite",
        "slide-in": "slideIn 1s ease-out",
        "grow-in": "growIn 0.5s ease-out",
        "flip-y": "flip 1s",
        fading: "fading .7s",
        headShake: "headShake 1s ease-in-out .5s",
      },
    },
  },
  plugins: [],
};

export default config;
