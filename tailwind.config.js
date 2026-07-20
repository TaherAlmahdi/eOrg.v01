/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        tarunima: ['var(--font-tarunima)', 'serif'],
        mallika: ['var(--font-mallika)', 'serif'],
        sabrina: ['var(--font-sabrina)', 'serif'],
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '20%': { opacity: '0.85', transform: 'scale(0.98) skewX(-1deg)' },
          '40%': { opacity: '0.95', transform: 'scale(1.02) skewX(1deg)' },
          '60%': { opacity: '0.8', transform: 'scale(0.95)' },
          '80%': { opacity: '1', transform: 'scale(1.01) skewX(-0.5deg)' },
        },
        glow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 15px rgba(251, 191, 36, 0.6))' },
          '50%': { filter: 'drop-shadow(0 0 25px rgba(251, 191, 36, 0.9))' },
        },
      },
      animation: {
        flicker: 'flicker 0.6s infinite alternate ease-in-out',
        glow: 'glow 1.2s infinite ease-in-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // মার্কডাউন কন্টেন্টের সুন্দর লেআউটের জন্য
  ],
};