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
        // এখানে আপনার লেআউট ফাইলের ভেরিয়েবলগুলো কানেক্ট করা হয়েছে
        tarunima: ['var(--font-tarunima)', 'serif'],
        mallika: ['var(--font-mallika)', 'serif'],
        sabrina: ['var(--font-sabrina)', 'serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // মার্কডাউন কন্টেন্টের সুন্দর লেআউটের জন্য
  ],
};