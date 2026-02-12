import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        library: {
          primary: '#2C1810',
          'primary-light': '#4A3228',
          secondary: '#F5E6D3',
          'secondary-dark': '#E8D5BE',
          accent: '#C9A84C',
          'accent-light': '#DFC06A',
          'accent-glow': '#FFE4A0',
          'text-primary': '#F5E6D3',
          'text-secondary': '#A89580',
          'text-dark': '#2C1810',
          success: '#4CAF50',
          error: '#C0392B',
          warning: '#C9A84C',
          'rarity-n': '#8B7355',
          'rarity-r': '#6B8E5A',
          'rarity-sr': '#5B7FA5',
          'rarity-ssr': '#C9A84C',
          'rarity-ur': '#9B59B6',
          'rarity-lr': '#FFD700',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Noto Serif JP', 'serif'],
        sans: ['var(--font-sans)', 'Noto Sans JP', 'sans-serif'],
        accent: ['var(--font-accent)', 'Playfair Display', 'serif'],
      },
      backgroundImage: {
        'library-gradient': 'linear-gradient(180deg, #0D0B2E 0%, #1E1245 30%, #2C1810 70%, #1A0F0A 100%)',
        'library-paper': 'radial-gradient(circle at top, rgba(201,168,76,0.15), transparent 65%), linear-gradient(135deg, #F5E6D3 0%, #E8D5BE 100%)',
      },
      boxShadow: {
        'library-gold': '0 4px 15px rgba(201,168,76,0.35)',
        'library-card': '0 8px 32px rgba(0,0,0,0.35)',
      },
      animation: {
        'library-pulse': 'library-pulse 3s ease-in-out infinite',
        'particle-float': 'particle-float var(--particle-duration,8s) linear infinite',
      },
      keyframes: {
        'library-pulse': {
          '0%, 100%': { opacity: 0.9, transform: 'translateY(0px)' },
          '50%': { opacity: 1, transform: 'translateY(-4px)' },
        },
        'particle-float': {
          '0%': { transform: 'translateY(100vh) translateX(0)', opacity: 0 },
          '10%': { opacity: 0.6 },
          '90%': { opacity: 0.6 },
          '100%': { transform: 'translateY(-10vh) translateX(20px)', opacity: 0 },
        },
      },
    },
  },
  plugins: [],
};

export default config;
