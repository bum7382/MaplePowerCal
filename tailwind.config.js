/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {      
      fontFamily: {
        maple: ['"MaplestoryOTFBold"', 'sans-serif'],
        morris: ['"morris9"', 'sans-serif'],
        kohi: ['"KOHIBaeum"', 'sans-serif'],
      },
      animation: {
      'fade-in': 'fadeIn 0.3s ease-out',
      'fade-out': 'fadeOut 0.3s ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeOut: {
          '0%': { opacity: 1, transform: 'translateY(0)' },
          '100%': { opacity: 0, transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [require('tailwind-scrollbar')],

}

