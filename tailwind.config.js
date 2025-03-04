/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            colors: {
                // Brand primary colors - using direct CSS variables
                tp_red: 'var(--tp-red)',
                bubblegum: 'var(--bubblegum)',
                skyblue: 'var(--skyblue)',
                sunny: 'var(--sunny)',
                lime: 'var(--lime)',
                purple: 'var(--purple)',
                tangerine: 'var(--tangerine)',

                // Feedback colors - using direct CSS variables
                success: 'var(--success)',
                warning: 'var(--warning)',
                error: 'var(--error)',
                info: 'var(--info)',
                
                // Typography colors - automatically switch with theme
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                },
                heading: 'var(--heading-color)',
                subheading: 'var(--subheading-color)',
                link: 'var(--link-color)',
                
                // Accent colors
                accent1: 'var(--accent1)',
                accent2: 'var(--accent2)',
                accent3: 'var(--accent3)',

                // Theme colors using CSS variables - these automatically switch between light/dark
                page: {
                    DEFAULT: 'var(--page-background)',
                },
                card: {
                    DEFAULT: 'var(--card-background)',
                    foreground: 'hsl(var(--card-foreground))',
                },
                // Using Shadcn UI compatibility
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
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: 0 },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: 0 },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
            },
            fontFamily: {
                sans: ['var(--font-sans)'],
                bengali: ['var(--font-bengali)'],
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
