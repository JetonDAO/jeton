module.exports = {
  plugins: {
    "postcss-import": {}, // Import CSS files first
    tailwindcss: {}, // Then apply TailwindCSS
    autoprefixer: {}, // Lastly, add vendor prefixes
  },
};
