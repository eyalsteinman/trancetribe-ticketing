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
			colors: {
				// Core neutrals
				border: 'hsl(var(--border))',
				'border-secondary': 'hsl(var(--border-secondary))',
				'border-subtle': 'hsl(var(--border-subtle))',
				input: 'hsl(var(--input))',
				'input-border': 'hsl(var(--input-border))',
				'input-border-focus': 'hsl(var(--input-border-focus))',
				'input-placeholder': 'hsl(var(--input-placeholder))',
				ring: 'hsl(var(--ring))',
				'ring-offset': 'hsl(var(--ring-offset))',
				
				// Backgrounds
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				surface: 'hsl(var(--surface))',
				'surface-secondary': 'hsl(var(--surface-secondary))',
				'surface-tertiary': 'hsl(var(--surface-tertiary))',
				
				// Text colors
				'text-primary': 'hsl(var(--text-primary))',
				'text-secondary': 'hsl(var(--text-secondary))',
				'text-tertiary': 'hsl(var(--text-tertiary))',
				
				// Primary system
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					light: 'hsl(var(--primary-light))',
					dark: 'hsl(var(--primary-dark))',
					hover: 'hsl(var(--primary-hover))'
				},
				
				// Secondary system
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					hover: 'hsl(var(--secondary-hover))'
				},
				
				// Destructive system
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
					light: 'hsl(var(--destructive-light))',
					hover: 'hsl(var(--destructive-hover))'
				},
				
				// Success system
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))',
					light: 'hsl(var(--success-light))'
				},
				
				// Warning system
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))',
					light: 'hsl(var(--warning-light))'
				},
				
				// Muted system
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				
				// Accent system
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					hover: 'hsl(var(--accent-hover))'
				},
				
				// Popover system
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
					border: 'hsl(var(--popover-border))'
				},
				
				// Card system
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
					border: 'hsl(var(--card-border))'
				},
				
				// Sidebar system
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
				'modern-xs': 'var(--radius-xs)',
				'modern-sm': 'var(--radius-sm)',
				'modern': 'var(--radius)',
				'modern-md': 'var(--radius-md)',
				'modern-lg': 'var(--radius-lg)',
				'modern-xl': 'var(--radius-xl)',
				lg: 'var(--radius)',
				md: 'var(--radius-sm)',
				sm: 'var(--radius-xs)'
			},
			boxShadow: {
				'modern-sm': 'var(--shadow-sm)',
				'modern': 'var(--shadow)',
				'modern-md': 'var(--shadow-md)',
				'modern-lg': 'var(--shadow-lg)',
				'modern-xl': 'var(--shadow-xl)'
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['ui-monospace', 'SFMono-Regular', 'monospace']
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
				'6xl': ['3.75rem', { lineHeight: '1' }]
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'128': '32rem'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
