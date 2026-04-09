/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          brand: '#00b6e5',
        },
        blue: {
          hover: '#1c57ff',
        },
        dark: '#383838',
        body: '#666666',
        'bg-light': '#f3f3f3',
        'footer-bg': '#3a3a3a',
      },
      fontFamily: {
        primary: ['"Open Sans Hebrew"', 'Arial', 'sans-serif'],
        accent: ['"Heebo"', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        pill: '9999px',
      },
      height: {
        nav: '70px',
      },
      minHeight: {
        nav: '70px',
      },
    },
  },
  plugins: [
    require('tailwindcss-rtl'),
  ],
};
