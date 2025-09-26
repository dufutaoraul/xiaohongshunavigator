/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cosmic-blue': '#0f0f23',
        'deep-space': '#1a0b2e',
        'nebula-purple': '#16213e',
        'cosmic-cyan': '#0f3460',
        'star-gold': '#e94560',
        'aurora-blue': '#533483',
        'galaxy-purple': '#7209b7',
        'cosmic-white': '#e8eaed',
        'stardust-gray': '#9aa0a6'
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out',
        'floating': 'floating 6s ease-in-out infinite',
        'breathing-glow': 'breathingGlow 4s ease-in-out infinite',
        'sparkle': 'sparkle 25s linear infinite'
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(30px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        floating: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        breathingGlow: {
          '0%, 100%': {
            transform: 'scale(1)',
            filter: 'drop-shadow(0 0 20px rgba(233, 69, 96, 0.5))'
          },
          '50%': {
            transform: 'scale(1.05)',
            filter: 'drop-shadow(0 0 30px rgba(233, 69, 96, 0.8))'
          }
        },
        sparkle: {
          '0%': { transform: 'translateY(0px) rotate(0deg)', opacity: '1' },
          '25%': { opacity: '0.8' },
          '50%': { opacity: '1' },
          '75%': { opacity: '0.6' },
          '100%': { transform: 'translateY(-100px) rotate(180deg)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}