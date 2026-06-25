/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        cosmic: {
          950: '#03000a',
          900: '#070214',
          800: '#0f0727',
          700: '#1b0e3d',
          600: '#2a175c',
          500: '#43288f',
          400: '#6344cc',
          300: '#8c6ef0',
          200: '#b8a6f9',
          100: '#ded6fe',
        },
        yes: {
          DEFAULT: '#10b981',
          hover: '#059669',
          light: '#a7f3d0',
          bg: '#064e3b',
        },
        no: {
          DEFAULT: '#f43f5e',
          hover: '#e11d48',
          light: '#fecdd3',
          bg: '#4c0519',
        }
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'orbit-rotate': 'orbitRotate 10s linear infinite',
      },
      keyframes: {
        orbitRotate: {
          '0%': { transform: 'rotate(0deg) translateX(80px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(80px) rotate(-360deg)' }
        }
      }
    },
  },
  plugins: [],
}
