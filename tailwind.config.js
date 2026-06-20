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
        // Drawn from the actual GES/Ghana coat of arms (eagle gold + shield
        // green) rather than a generic amber/brown palette.
        gold: {
          50:  '#FBF3D9',
          100: '#F7E7A8',
          300: '#E8C547',
          500: '#D4AF37',
          600: '#C49A1A',
          700: '#9C7A0A',
        },
        brown: {
          900: '#0D2818',
          800: '#163D24',
          700: '#1F4D30',
        },
        cream: {
          50:  '#FFFEFA',
          100: '#F7F5EF',
          200: '#EFEAE0',
        }
      }
    },
  },
  plugins: [],
}