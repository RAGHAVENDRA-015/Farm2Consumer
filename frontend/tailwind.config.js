/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4CAF50', // Fresh Green
          50: '#E8F5E9',      // Fresh light green surface / tint
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',     // Main brand green
          600: '#43A047',
          700: '#2E7D32',     // Dark green for hover, headings
          800: '#1B5E20',     // Forest green
          900: '#0D3810',
        },
        darkText: '#1F2937',
        grayText: '#6B7280',
        cardBg: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        card: '0 4px 12px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -2px rgba(0, 0, 0, 0.03)',
        cardHover: '0 12px 24px -4px rgba(46, 125, 50, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
