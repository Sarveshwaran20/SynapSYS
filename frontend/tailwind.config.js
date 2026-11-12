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
        // Midnight Marble Palette (theme-adaptive CSS channels)
        obsidian: 'rgb(var(--obsidian-rgb) / <alpha-value>)',
        basalt: 'rgb(var(--basalt-rgb) / <alpha-value>)',
        slate: 'rgb(var(--slate-rgb) / <alpha-value>)',
        graphite: 'rgb(var(--graphite-rgb) / <alpha-value>)',
        line: 'rgb(var(--line-rgb) / <alpha-value>)',
        marble: 'rgb(var(--marble-rgb) / <alpha-value>)',
        silver: 'rgb(var(--silver-rgb) / <alpha-value>)',
        pewter: 'rgb(var(--pewter-rgb) / <alpha-value>)',
        aegean: {
          DEFAULT: 'rgb(var(--aegean-rgb) / <alpha-value>)',
          deep: 'rgb(var(--aegean-deep-rgb) / <alpha-value>)',
          hover: 'rgb(var(--aegean-hover-rgb) / <alpha-value>)',
          faint: 'var(--g-blue-light)',
        },
        tyrian: 'rgb(var(--tyrian-rgb) / <alpha-value>)',
        laurel: {
          DEFAULT: 'rgb(var(--laurel-rgb) / <alpha-value>)',
          faint: 'var(--g-green-light)',
        },
        coral: {
          DEFAULT: 'rgb(var(--coral-rgb) / <alpha-value>)',
          faint: 'var(--g-yellow-light)',
        },
        crimson: {
          DEFAULT: 'rgb(var(--crimson-rgb) / <alpha-value>)',
          faint: 'var(--g-red-light)',
        },

        // Semantic bindings for seamless component styles
        g: {
          bg: 'var(--g-bg)',
          surface: 'var(--g-surface)',
          surfaceElevated: 'var(--g-surface-elevated)',
          surfaceSubtle: 'var(--g-surface-subtle)',
          border: 'var(--g-border)',
          borderSubtle: 'var(--g-border-subtle)',
          text: 'var(--g-text)',
          textSecondary: 'var(--g-text-secondary)',
          textMuted: 'var(--g-text-muted)',
          blue: 'var(--g-blue)',
          blueHover: 'var(--g-blue-hover)',
          blueLight: 'var(--g-blue-light)',
          green: 'var(--g-green)',
          greenLight: 'var(--g-green-light)',
          red: 'var(--g-red)',
          redLight: 'var(--g-red-light)',
          yellow: 'var(--g-yellow)',
          yellowLight: 'var(--g-yellow-light)',
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'Trajan Pro', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '4px',
        btn: '8px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.45)',
        stone: '0 4px 20px -2px rgba(0, 0, 0, 0.7)',
        'card-stone': '0 10px 32px -6px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        'modal-stone': '0 24px 60px -12px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        softAegean: '0 8px 32px 0 rgba(76, 141, 246, 0.16)',
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        card: '0 2px 8px 0 rgba(0, 0, 0, 0.5)',
      },
      keyframes: {
        meanderDraw: {
          '0%': { strokeDashoffset: '400' },
          '100%': { strokeDashoffset: '0' },
        },
        flowLine: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.15)' },
        },
        alarmRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(214, 69, 80, 0.5)' },
          '70%': { boxShadow: '0 0 0 6px rgba(214, 69, 80, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(214, 69, 80, 0)' },
        },
        fadeRise: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        tabSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        numTick: {
          '0%': { opacity: '0.4', transform: 'translateY(-2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        spinReverse: {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
      },
      animation: {
        meander: 'meanderDraw 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        dataFlow: 'flowLine 1.2s linear infinite',
        statusPulse: 'pulseSlow 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        alarmPulse: 'alarmRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        reveal: 'fadeRise 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        fadeIn: 'fadeIn 0.25s ease-out forwards',
        tabSlideIn: 'tabSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        tick: 'numTick 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'spin-slow': 'spin 28s linear infinite',
        'spin-reverse-slow': 'spinReverse 22s linear infinite',
      },
    },
  },
  plugins: [],
}
