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
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          DEFAULT: 'var(--surface)',
          secondary: 'var(--surface-secondary)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          light: '#6366F1', // Indigo Accent
          dark: '#030712',  // Very Deep Slate
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        sidebar: {
          light: '#FFFFFF',
          dark: '#090D16',
        },
        slate: {
          405: '#94A3B8',
          450: '#64748B',
          805: '#1E293B',
        },
        indigo: {
          150: '#E0E7FF',
          650: '#4F46E5',
        },
        rose: {
          455: '#F43F5E',
          650: '#E11D48',
        },
        brand: {
          indigo: '#6366F1',
          purple: '#8B5CF6',
          violet: '#7C3AED',
          cyan: '#06B6D4',
          emerald: '#10B981',
          rose: '#F43F5E',
          amber: '#F59E0B',
        },
        glass: {
          bg: 'rgba(15, 23, 42, 0.35)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-glow': 'rgba(99, 102, 241, 0.15)',
        }
      },
      borderRadius: {
        radius: 'var(--radius)',
      },
      boxShadow: {
        token: 'var(--shadow)',
        'token-md': 'var(--shadow-md)',
        'token-lg': 'var(--shadow-lg)',
        'glow-indigo': '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.15)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.15)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        md: '12px',
        lg: '24px',
      }
    },
  },
  plugins: [],
}
