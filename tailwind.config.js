/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          950: '#0a0a0b',
          900: '#111113',
          850: '#16161a',
          800: '#1c1c21',
          700: '#26262e',
          600: '#33333d',
        },
        ash: {
          300: '#c9c9c9',
          400: '#a8a8a8',
          500: '#8a8a8a',
          600: '#6b6b6b',
        },
        blood: {
          300: '#e05252',
          400: '#c22b2b',
          500: '#a01f1f',
          600: '#7d1717',
          700: '#5c1010',
        },
        gold: {
          400: '#d9b45b',
          500: '#c09a3f',
        },
      },
      fontFamily: {
        serifcn: ['"Noto Serif SC"', '"Source Han Serif SC"', '"Songti SC"', 'SimSun', 'serif'],
        sanscn: ['"Noto Sans SC"', '"Microsoft YaHei"', '"PingFang SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 1px)' },
          '40%': { transform: 'translate(2px, -1px)' },
          '60%': { transform: 'translate(-1px, -2px)' },
          '80%': { transform: 'translate(1px, 2px)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.015)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        lightflash: {
          '0%': { opacity: '0' },
          '30%': { opacity: '0.9' },
          '70%': { opacity: '0.6' },
          '100%': { opacity: '0' },
        },
        crack: {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        scanline: 'scanline 8s linear infinite',
        glitch: 'glitch 0.3s steps(2) infinite',
        breathe: 'breathe 4s ease-in-out infinite',
        fadeUp: 'fadeUp 0.5s ease-out both',
        lightflash: 'lightflash 2.2s ease-out both',
        crack: 'crack 1.2s ease-out both',
      },
    },
  },
  plugins: [],
}
