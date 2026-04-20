/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
        surface: {
          DEFAULT: '#1a1b1e',
          raised: '#25262b',
          border: '#2c2e33',
        },
      },
    },
  },
  plugins: [],
};
