import tailwindAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '24px',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      colors: {
        // Apple Design System Colors
        apple: {
          black: 'var(--apple-fg)',
          blue: '#007AFF',
          background: 'var(--apple-bg)',
          card: 'var(--apple-card)',
          secondary: '#86868B',
          tetriary: '#C7C7CC',
          border: 'var(--apple-border)',
          red: '#FF3B30',
          green: '#34C759',
          orange: '#FF9500',
          surface: '#F2F2F7',
          hover: '#F9FAFB',
        },
        // Shadcn-ui compatible mapping
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontSize: {
        'display': ['24px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.5px' }],
        'heading': ['18px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '-0.5px' }],
        'subheading': ['16px', { lineHeight: '1.5', fontWeight: '600', letterSpacing: '-0.5px' }],
        'body': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      boxShadow: {
        'apple': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'apple-lg': '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-in-out',
        'fade-out': 'fade-out 0.3s ease-in-out',
      },
    },
  },
  plugins: [tailwindAnimate],
};
