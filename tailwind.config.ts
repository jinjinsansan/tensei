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
          primary: '#1A1A1A',
          'primary-light': '#222222',
          secondary: '#E5E5E5',
          'secondary-dark': '#999999',
          accent: '#F5A623',
          'accent-light': '#FFB83D',
          'accent-glow': '#FFD700',
          'text-primary': '#E5E5E5',
          'text-secondary': '#999999',
          'text-dark': '#0A0A0A',
          success: '#4ADE80',
          error: '#FF4D4D',
          warning: '#F5A623',
          'rarity-n': '#666666',
          'rarity-r': '#4ADE80',
          'rarity-sr': '#60A5FA',
          'rarity-ssr': '#F5A623',
          'rarity-ur': '#C084FC',
          'rarity-lr': '#FFD700',
        },
        bg: {
          primary: '#0A0A0A',
          secondary: '#111111',
          card: '#1A1A1A',
          elevated: '#1E1E1E',
        },
        text: {
          primary: '#E5E5E5',
          secondary: '#999999',
          tertiary: '#666666',
        },
        accent: {
          DEFAULT: '#F5A623',
          hover: '#FFB83D',
          dim: 'rgba(245,166,35,0.15)',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          light: 'rgba(255, 255, 255, 0.12)',
          accent: 'rgba(245, 166, 35, 0.4)',
          'accent-strong': 'rgba(245, 166, 35, 0.7)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-noto-sans)', 'sans-serif'],
        serif: ['var(--font-inter)', 'var(--font-noto-sans)', 'sans-serif'],
        display: ['var(--font-inter)', 'var(--font-noto-sans)', 'sans-serif'],
        accent: ['var(--font-inter)', 'var(--font-noto-sans)', 'sans-serif'],
      },
      backgroundImage: {
        'library-gradient': 'linear-gradient(180deg, #111111 0%, #0A0A0A 100%)',
        'library-paper': 'linear-gradient(135deg, #1F1F1F 0%, #111111 100%)',
      },
      boxShadow: {
        'library-gold': '0 8px 30px rgba(245,166,35,0.12)',
        'library-card': '0 12px 35px rgba(0,0,0,0.45)',
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
