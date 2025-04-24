/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // Scan your components for Tailwind classes
  ],
  theme: {
    extend: {
      colors: {
        brand: "#213333", // optional: now you can use bg-brand
      },
    },
  },
  plugins: [],
};
