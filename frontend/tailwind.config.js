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
        dark: {
          bg: "#0B0F19",
          card: "#111827",
          border: "#1F2937",
          muted: "#374151",
          hover: "#1E293B"
        },
        brand: {
          primary: "#3B82F6",
          accent: "#6366F1",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#EF4444",
          cyan: "#06B6D4"
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
}
