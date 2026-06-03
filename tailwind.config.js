/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: '375px',
      },
      colors: {
        gold: {
          50:  '#fdf8e1',
          100: '#f9efb4',
          300: '#e6c84a',
          500: '#C9A227',
          600: '#B8860B',
          700: '#9a6f09',
        },
        brown: {
          900: '#1C0A00',
          800: '#2D1A00',
          700: '#3d2200',
        },
        cream: {
          50:  '#FFFEF9',
          100: '#FAF7F0',
          200: '#F5F0E8',
        }
      }
    },
  },
  plugins: [],
}