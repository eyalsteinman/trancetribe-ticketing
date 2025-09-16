import type { Config } from "tailwindcss";

export default {
	darkMode: ["class", "media"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))',
					light: 'hsl(var(--primary-light))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					hover: 'hsl(var(--secondary-hover))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				xl: 'calc(var(--radius) + 4px)',
				'2xl': 'calc(var(--radius) + 8px)',
				'3xl': 'calc(var(--radius) + 12px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px) scale(1)' },
					'50%': { transform: 'translateY(-20px) scale(1.02)' }
				},
				'glow': {
					'0%, 100%': { opacity: '1', filter: 'brightness(1)' },
					'50%': { opacity: '0.8', filter: 'brightness(1.2)' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(100%)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'scale(0.95) translateY(20px)' },
					'100%': { opacity: '1', transform: 'scale(1) translateY(0)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.9)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'pulse-glow': {
					'0%, 100%': { 
						boxShadow: '0 0 30px hsla(var(--primary) / 0.6), 0 0 60px hsla(var(--accent) / 0.3)' 
					},
					'50%': { 
						boxShadow: '0 0 60px hsla(var(--primary) / 0.9), 0 0 120px hsla(var(--accent) / 0.5), 0 0 180px hsla(var(--primary) / 0.3)' 
					}
				},
				'gradient-shift': {
					'0%': { background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' },
					'25%': { background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--secondary)))' },
					'50%': { background: 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--primary)))' },
					'75%': { background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' },
					'100%': { background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))' }
				},
				'fade-in-up': {
					'0%': { opacity: '0', transform: 'translateY(40px) scale(0.95)' },
					'100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
				},
				'parallax-float': {
					'0%': { transform: 'translate3d(-50%, -50%, 0) rotate(0deg)' },
					'100%': { transform: 'translate3d(-40%, -60%, 0) rotate(360deg)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				'bounce-gentle': {
					'0%, 100%': { transform: 'translateY(0) scale(1)' },
					'50%': { transform: 'translateY(-10px) scale(1.02)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 4s ease-in-out infinite',
				'float-delayed': 'float 6s ease-in-out infinite 2s',
				'glow': 'glow 3s ease-in-out infinite alternate',
				'slide-up': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
				'fade-in': 'fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
				'scale-in': 'scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
				'pulse-glow': 'pulse-glow 3s ease-in-out infinite alternate',
				'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'gradient-shift': 'gradient-shift 12s ease-in-out infinite',
				'spin-slow': 'spin 12s linear infinite',
				'bounce-slow': 'bounce 4s ease-in-out infinite',
				'bounce-gentle': 'bounce-gentle 3s ease-in-out infinite',
				'fade-in-up': 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
				'parallax-float': 'parallax-float 20s linear infinite',
				'shimmer': 'shimmer 2s linear infinite'
			},
			backdropBlur: {
				xs: '2px',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
