import sharedConfig from "@jeton/tailwindcss-config";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  presets: [sharedConfig],
  theme: {
    extend: {
      keyframes: {
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
      },
    },
  },
};
