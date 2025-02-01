/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}", //@TODO: will be removed
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}", //@TODO: will be removed
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}", //@TODO: will be removed
    './node_modules/tailwind-datepicker-react/dist/**/*.js',
    './src/**/*.module.css',
    './src/styles/*.css'
  ],
  // separator: '_',
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {}
    }
  },
  plugins: [require("tailwindcss-animate")],
}

