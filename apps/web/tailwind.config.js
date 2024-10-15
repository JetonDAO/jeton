import sharedConfig from "@jeton/tailwindcss-config";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  presets: [sharedConfig],
  theme: {
    extend: {
      keyframes: {
        tada: {
          "0%": { transform: "scale3d(1, 1, 1)" },
          "10%, 20%": {
            transform: "scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg)",
          },
          "30%, 50%, 70%, 90%": {
            transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)",
          },
          "40%, 60%, 80%": {
            transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)",
          },
          "100%": { transform: "scale3d(1, 1, 1)" },
        },
        cardAnimation: {
          "0%, 100%": { transform: "rotate(0deg) rotateY(0deg)" },
          "30%": { transform: "rotate(360deg)" },
          "50%": { transform: "rotateY(180deg)" },
          "70%": { transform: "rotate(360deg) " },
        },
        deal: {
          "0%": {
            transform: "translateY(20px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        dealAndRotate1: {
          "0%": {
            opacity: "0",
            transform: "translateY(20px) rotate(0deg)",
          },
          "50%": {
            opacity: "1",
            transform: "translateY(0) rotate(0deg)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) rotate(-3deg)",
          },
        },
        dealAndRotate2: {
          "0%": {
            opacity: "0",
            transform: "translateY(-20px) rotate(0deg)",
          },
          "80%": {
            opacity: "1",
            transform: "translateY(0) rotate(0deg)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) rotate(6deg)", // Adjust rotation angle for the second card
          },
        },
        spinner: {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
      },
      animation: {
        deal: "deal 0.5s ease-out forwards",
        dealAndRotate1: "dealAndRotate1 1s ease-out forwards",
        dealAndRotate2: "dealAndRotate2 1s ease-out forwards",
        spinner: "spinner 2s infinite",
        cardLoop: "cardAnimation 5s ease-in-out infinite",
        tada: "tada 1s ease-in-out infinite",
        "pot-charge": "tada 1s ease-in-out .4s",
      },
    },
  },
};
