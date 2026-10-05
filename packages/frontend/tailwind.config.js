/**
 * Tailwind CSS v3 configuration.
 *
 * Colours are intentionally *not* declared as literal hex values here. Every
 * semantic colour resolves to a CSS custom property defined in
 * `src/styles/index.css`, which lets a single variable swap in `.dark` retheme
 * the whole application. The `<alpha-value>` placeholder keeps Tailwind's
 * opacity modifiers (`bg-brand/10`) working on top of those variables.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          raised: 'rgb(var(--color-surface-raised) / <alpha-value>)',
          sunken: 'rgb(var(--color-surface-sunken) / <alpha-value>)',
          inverted: 'rgb(var(--color-surface-inverted) / <alpha-value>)'
        },
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          strong: 'rgb(var(--color-border-strong) / <alpha-value>)'
        },
        content: {
          DEFAULT: 'rgb(var(--color-text) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          inverted: 'rgb(var(--color-on-inverted) / <alpha-value>)'
        },
        brand: {
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          subtle: 'rgb(var(--color-brand-subtle) / <alpha-value>)',
          hover: 'rgb(var(--color-brand-hover) / <alpha-value>)',
          on: 'rgb(var(--color-on-brand) / <alpha-value>)'
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          subtle: 'rgb(var(--color-danger-subtle) / <alpha-value>)',
          hover: 'rgb(var(--color-danger-hover) / <alpha-value>)',
          on: 'rgb(var(--color-on-danger) / <alpha-value>)',
          text: 'rgb(var(--color-danger-text) / <alpha-value>)'
        },
        info: {
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
          subtle: 'rgb(var(--color-info-subtle) / <alpha-value>)'
        },
        focus: 'rgb(var(--color-focus) / <alpha-value>)'
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(var(--color-shadow) / 0.1), 0 1px 2px -1px rgb(var(--color-shadow) / 0.1)',
        raised: '0 10px 15px -3px rgb(var(--color-shadow) / 0.1), 0 4px 6px -4px rgb(var(--color-shadow) / 0.1)'
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      maxWidth: {
        form: '28rem'
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'none' }
        }
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out'
      }
    }
  },
  plugins: []
};
