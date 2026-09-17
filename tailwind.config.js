/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pulse: {
          // Superficies (arquitectura obsidiana)
          bg: '#0A0A0C',
          'bg-alt': '#0E0E10',
          surface: '#121418',
          'surface-alt': '#16181D',
          card: '#1F222A',
          'card-highest': '#2A2E39',
          border: '#1F222A',
          'border-strong': '#2A2E39',
          // Acentos
          lime: '#CCFF00',
          'lime-hover': '#B8E600',
          emerald: '#10B981',
          blue: '#3B82F6',
          // Texto
          white: '#FFFFFF',
          muted: '#9CA3AF',
          faint: '#4B5563',
          alert: '#EF4444',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'label-sm': ['10px', { lineHeight: '12px', letterSpacing: '0.08em', fontWeight: '700' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.04em', fontWeight: '600' }],
        'label-lg': ['14px', { lineHeight: '18px', letterSpacing: '0.02em', fontWeight: '600' }],
        'body-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', letterSpacing: '0em', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '400' }],
        'headline-sm': ['18px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-md': ['22px', { lineHeight: '28px', letterSpacing: '-0.015em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'metric-lg': ['32px', { lineHeight: '34px', letterSpacing: '-0.02em', fontWeight: '800' }],
        'metric-xl': ['48px', { lineHeight: '48px', letterSpacing: '-0.03em', fontWeight: '800' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      spacing: {
        gutter: '1rem',
        'gutter-mobile': '0.75rem',
        margin: '2rem',
        'margin-mobile': '1rem',
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2rem',
      },
      boxShadow: {
        'glow-lime': '0 0 16px rgba(204, 255, 0, 0.15)',
        modal: '0 16px 32px -8px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
}
