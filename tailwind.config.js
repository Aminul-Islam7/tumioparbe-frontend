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
                // Primary colors
                bubblegum: '#FF70A6',
                skyblue: '#70D6FF',
                sunny: '#FFD670',
                lime: '#89FC00',
                purple: '#9B5DE5',
                tangerine: '#FF9770',

                // Feedback colors
                success: '#00C853',
                warning: '#FFD600',
                error: '#FF5252',
                info: '#00B0FF',

                // Light mode
                light: {
                    background: '#FFFFFF',
                    card: '#F5F5F5',
                    primary: '#333333',
                    secondary: '#666666',
                    border: '#E0E0E0',
                    disabled: '#BDBDBD',
                },

                // Dark mode
                dark: {
                    background: '#212121',
                    card: '#2C2C2C',
                    primary: '#F5F5F5',
                    secondary: '#BDBDBD',
                    border: '#424242',
                    disabled: '#757575',
                },

                // Accent colors
                accent: {
                    1: '#FF3D7F',
                    2: '#32CD32',
                    3: '#FF8C00',
                },

                // Shadcn UI compatibility
                border: 'var(--border)',
                input: 'var(--input)',
                ring: 'var(--ring)',
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                },
                secondary: {
                    DEFAULT: 'var(--secondary)',
                    foreground: 'var(--secondary-foreground)',
                },
                destructive: {
                    DEFAULT: 'var(--destructive)',
                    foreground: 'var(--destructive-foreground)',
                },
                muted: {
                    DEFAULT: 'var(--muted)',
                    foreground: 'var(--muted-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                },
                popover: {
                    DEFAULT: 'var(--popover)',
                    foreground: 'var(--popover-foreground)',
                },
                card: {
                    DEFAULT: 'var(--card)',
                    foreground: 'var(--card-foreground)',
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
        },
    },
    plugins: [require('tailwindcss-animate')],
};
