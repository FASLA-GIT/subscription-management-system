/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#F5F7FB',
        surface: '#FFFFFF',
        navy: {
          950: '#070D18',
          900: '#0B1426',
          800: '#111D35',
          700: '#1E2D4A',
          600: '#2A3C5E',
        },
        slate: {
          950: '#0B1426',
          900: '#111D35',
          600: '#64748B',
          500: '#718096',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        accent: {
          50: '#EAF3FF',
          100: '#D5E6FE',
          200: '#B0D0FD',
          300: '#7EAEFC',
          400: '#4686FA',
          500: '#1677F8', // Primary accent #1677F8
          600: '#0A5CD6',
          700: '#0847AA',
          800: '#0B3B89',
          900: '#0F336E',
        },
        success: '#059669',
        warning: '#D97706',
        danger: '#DC2626',
      },
      boxShadow: {
        'glow-sm': '0 0 0 1px rgba(22, 119, 248, 0.25), 0 0 12px rgba(22, 119, 248, 0.08)',
        'glow-md': '0 0 0 1px rgba(22, 119, 248, 0.35), 0 0 20px rgba(22, 119, 248, 0.12)',
        'ambient': '0 20px 40px -15px rgba(22, 119, 248, 0.07)',
        'card': '0 1px 3px 0 rgba(11, 20, 38, 0.04), 0 1px 2px -1px rgba(11, 20, 38, 0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}


