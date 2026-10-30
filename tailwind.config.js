/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ubf: {
          bg: '#050505',
          card: '#131212',
          cardElevated: '#1a1818',
          border: '#272424',
          orange: '#FF4A0F', // Brand orange-red specified by user
          red: '#EF4444',
          green: '#10B981',
          yellow: '#F59E0B',
          textPrimary: '#F9FAFB',
          textSecondary: '#9CA3AF',
          textMuted: '#6B7280'
        }
      }
    },
  },
  plugins: [],
}
