/** @type {import('tailwindcss').Config} */
export default {
 content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
 ],
 theme: {
  extend: {
   colors: {
    border: 'var(--color-border)', /* slate-200 */
    input: 'var(--color-input)', /* white */
    ring: 'var(--color-ring)', /* blue-700 */
    background: 'var(--color-background)', /* gray-50 */
    foreground: 'var(--color-foreground)', /* gray-900 */
    primary: {
     DEFAULT: 'var(--color-primary)', /* blue-700 */
     foreground: 'var(--color-primary-foreground)', /* white */
    },
    secondary: {
     DEFAULT: 'var(--color-secondary)', /* indigo-950 */
     foreground: 'var(--color-secondary-foreground)', /* white */
    },
    destructive: {
     DEFAULT: 'var(--color-destructive)', /* red-500 */
     foreground: 'var(--color-destructive-foreground)', /* white */
    },
    muted: {
     DEFAULT: 'var(--color-muted)', /* slate-100 */
     foreground: 'var(--color-muted-foreground)', /* gray-500 */
    },
    accent: {
     DEFAULT: 'var(--color-accent)', /* blue-200 */
     foreground: 'var(--color-accent-foreground)', /* gray-900 */
    },
    popover: {
     DEFAULT: 'var(--color-popover)', /* white */
     foreground: 'var(--color-popover-foreground)', /* gray-900 */
    },
    card: {
     DEFAULT: 'var(--color-card)', /* white */
     foreground: 'var(--color-card-foreground)', /* gray-900 */
    },
    success: {
     DEFAULT: 'var(--color-success)', /* emerald-500 */
     foreground: 'var(--color-success-foreground)', /* white */
    },
    warning: {
     DEFAULT: 'var(--color-warning)', /* amber-500 */
     foreground: 'var(--color-warning-foreground)', /* white */
    },
    error: {
     DEFAULT: 'var(--color-error)', /* red-500 */
     foreground: 'var(--color-error-foreground)', /* white */
    },
   },
   borderRadius: {
    lg: 'var(--radius)',
    md: 'calc(var(--radius) - 2px)',
    sm: 'calc(var(--radius) - 4px)',
   },
   fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
   },
   fontSize: {
    'xs': ['0.75rem', { lineHeight: '1rem' }],
    'sm': ['0.875rem', { lineHeight: '1.25rem' }],
    'base': ['1rem', { lineHeight: '1.5rem' }],
    'lg': ['1.125rem', { lineHeight: '1.75rem' }],
    'xl': ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
   },
   fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
   },
   spacing: {
    '18': '4.5rem',
    '88': '22rem',
    '128': '32rem',
   },
   backdropBlur: {
    'xs': '2px',
    'sm': '4px',
    'md': '8px',
    'lg': '12px',
    'xl': '16px',
    '2xl': '24px',
    '3xl': '40px',
   },
   animation: {
    'glass-float': 'glass-float 20s ease-in-out infinite',
    'shimmer': 'shimmer 1.5s infinite',
    'spring-bounce': 'spring-bounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    'fade-in': 'fadeIn 0.2s ease-in-out',
    'slide-up': 'slideUp 0.3s ease-out',
    'slide-down': 'slideDown 0.3s ease-out',
   },
   keyframes: {
    'glass-float': {
     '0%, 100%': {
      transform: 'translateY(0px) rotate(0deg)',
     },
     '33%': {
      transform: 'translateY(-10px) rotate(1deg)',
     },
     '66%': {
      transform: 'translateY(5px) rotate(-1deg)',
     },
    },
    shimmer: {
     '0%': {
      backgroundPosition: '-200% 0',
     },
     '100%': {
      backgroundPosition: '200% 0',
     },
    },
    fadeIn: {
     '0%': {
      opacity: '0',
     },
     '100%': {
      opacity: '1',
     },
    },
    slideUp: {
     '0%': {
      transform: 'translateY(10px)',
      opacity: '0',
     },
     '100%': {
      transform: 'translateY(0)',
      opacity: '1',
     },
    },
    slideDown: {
     '0%': {
      transform: 'translateY(-10px)',
      opacity: '0',
     },
     '100%': {
      transform: 'translateY(0)',
      opacity: '1',
     },
    },
   },
   boxShadow: {
    'glass-sm': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    'glass-md': '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    'glass-lg': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    'glass-xl': '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
    'glass-2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
    'glass-inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
   },
   screens: {
    'xs': '475px',
   },
   zIndex: {
    '60': '60',
    '70': '70',
    '80': '80',
    '90': '90',
    '100': '100',
    '110': '110',
    '150': '150',
    '200': '200',
   },
  },
 },
 plugins: [
  require('@tailwindcss/typography'),
  require('@tailwindcss/forms'),
  require('tailwindcss-animate'),
 ],
}