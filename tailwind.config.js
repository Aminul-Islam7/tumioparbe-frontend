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
            /* =========================
               COLORS
               ========================= */
            colors: {
                /* Brand Colors */
                brand: {
                    red: 'hsl(var(--brand-red-500))',
                    bubblegum: 'hsl(var(--brand-bubblegum-500))',
                    50: 'hsl(var(--brand-red-50))',
                    100: 'hsl(var(--brand-red-100))',
                    200: 'hsl(var(--brand-red-200))',
                    300: 'hsl(var(--brand-red-300))',
                    400: 'hsl(var(--brand-red-400))',
                    500: 'hsl(var(--brand-red-500))',
                    600: 'hsl(var(--brand-red-600))',
                    700: 'hsl(var(--brand-red-700))',
                    800: 'hsl(var(--brand-red-800))',
                    900: 'hsl(var(--brand-red-900))',
                    950: 'hsl(var(--brand-red-950))',
                },

                /* Primary - Bubblegum Pink */
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    light: 'var(--color-primary-light)',
                    lighter: 'var(--color-primary-lighter)',
                    lightest: 'var(--color-primary-lightest)',
                    dark: 'var(--color-primary-dark)',
                    darker: 'var(--color-primary-darker)',
                    foreground: 'var(--color-primary-foreground)',
                    50: 'hsl(var(--brand-bubblegum-50))',
                    100: 'hsl(var(--brand-bubblegum-100))',
                    200: 'hsl(var(--brand-bubblegum-200))',
                    300: 'hsl(var(--brand-bubblegum-300))',
                    400: 'hsl(var(--brand-bubblegum-400))',
                    500: 'hsl(var(--brand-bubblegum-500))',
                    600: 'hsl(var(--brand-bubblegum-600))',
                    700: 'hsl(var(--brand-bubblegum-700))',
                    800: 'hsl(var(--brand-bubblegum-800))',
                    900: 'hsl(var(--brand-bubblegum-900))',
                    950: 'hsl(var(--brand-bubblegum-950))',
                },

                /* Secondary - Sky Blue */
                secondary: {
                    DEFAULT: 'var(--color-secondary)',
                    light: 'var(--color-secondary-light)',
                    lighter: 'var(--color-secondary-lighter)',
                    lightest: 'var(--color-secondary-lightest)',
                    dark: 'var(--color-secondary-dark)',
                    darker: 'var(--color-secondary-darker)',
                    foreground: 'var(--color-secondary-foreground)',
                    50: 'hsl(var(--ui-sky-50))',
                    100: 'hsl(var(--ui-sky-100))',
                    200: 'hsl(var(--ui-sky-200))',
                    300: 'hsl(var(--ui-sky-300))',
                    400: 'hsl(var(--ui-sky-400))',
                    500: 'hsl(var(--ui-sky-500))',
                    600: 'hsl(var(--ui-sky-600))',
                    700: 'hsl(var(--ui-sky-700))',
                    800: 'hsl(var(--ui-sky-800))',
                    900: 'hsl(var(--ui-sky-900))',
                    950: 'hsl(var(--ui-sky-950))',
                },

                /* Accent Colors - Playful Palette */
                sunny: {
                    DEFAULT: 'var(--color-accent-sunny)',
                    50: 'hsl(var(--ui-sunny-50))',
                    100: 'hsl(var(--ui-sunny-100))',
                    200: 'hsl(var(--ui-sunny-200))',
                    300: 'hsl(var(--ui-sunny-300))',
                    400: 'hsl(var(--ui-sunny-400))',
                    500: 'hsl(var(--ui-sunny-500))',
                    600: 'hsl(var(--ui-sunny-600))',
                    700: 'hsl(var(--ui-sunny-700))',
                    800: 'hsl(var(--ui-sunny-800))',
                    900: 'hsl(var(--ui-sunny-900))',
                },
                tangerine: {
                    DEFAULT: 'var(--color-accent-tangerine)',
                    50: 'hsl(var(--ui-tangerine-50))',
                    100: 'hsl(var(--ui-tangerine-100))',
                    200: 'hsl(var(--ui-tangerine-200))',
                    300: 'hsl(var(--ui-tangerine-300))',
                    400: 'hsl(var(--ui-tangerine-400))',
                    500: 'hsl(var(--ui-tangerine-500))',
                    600: 'hsl(var(--ui-tangerine-600))',
                    700: 'hsl(var(--ui-tangerine-700))',
                    800: 'hsl(var(--ui-tangerine-800))',
                    900: 'hsl(var(--ui-tangerine-900))',
                },
                lavender: {
                    DEFAULT: 'var(--color-accent-lavender)',
                    50: 'hsl(var(--ui-lavender-50))',
                    100: 'hsl(var(--ui-lavender-100))',
                    200: 'hsl(var(--ui-lavender-200))',
                    300: 'hsl(var(--ui-lavender-300))',
                    400: 'hsl(var(--ui-lavender-400))',
                    500: 'hsl(var(--ui-lavender-500))',
                    600: 'hsl(var(--ui-lavender-600))',
                    700: 'hsl(var(--ui-lavender-700))',
                    800: 'hsl(var(--ui-lavender-800))',
                    900: 'hsl(var(--ui-lavender-900))',
                },
                lime: {
                    DEFAULT: 'var(--color-accent-lime)',
                    50: 'hsl(var(--ui-lime-50))',
                    100: 'hsl(var(--ui-lime-100))',
                    200: 'hsl(var(--ui-lime-200))',
                    300: 'hsl(var(--ui-lime-300))',
                    400: 'hsl(var(--ui-lime-400))',
                    500: 'hsl(var(--ui-lime-500))',
                    600: 'hsl(var(--ui-lime-600))',
                    700: 'hsl(var(--ui-lime-700))',
                    800: 'hsl(var(--ui-lime-800))',
                    900: 'hsl(var(--ui-lime-900))',
                },
                marine: {
                    DEFAULT: 'var(--color-accent-marine)',
                    50: 'hsl(var(--ui-marine-50))',
                    100: 'hsl(var(--ui-marine-100))',
                    200: 'hsl(var(--ui-marine-200))',
                    300: 'hsl(var(--ui-marine-300))',
                    400: 'hsl(var(--ui-marine-400))',
                    500: 'hsl(var(--ui-marine-500))',
                    600: 'hsl(var(--ui-marine-600))',
                    700: 'hsl(var(--ui-marine-700))',
                    800: 'hsl(var(--ui-marine-800))',
                    900: 'hsl(var(--ui-marine-900))',
                },
                emerald: {
                    50: 'hsl(var(--ui-emerald-50))',
                    100: 'hsl(var(--ui-emerald-100))',
                    200: 'hsl(var(--ui-emerald-200))',
                    300: 'hsl(var(--ui-emerald-300))',
                    400: 'hsl(var(--ui-emerald-400))',
                    500: 'hsl(var(--ui-emerald-500))',
                    600: 'hsl(var(--ui-emerald-600))',
                    700: 'hsl(var(--ui-emerald-700))',
                    800: 'hsl(var(--ui-emerald-800))',
                    900: 'hsl(var(--ui-emerald-900))',
                },
                amber: {
                    50: 'hsl(var(--ui-amber-50))',
                    100: 'hsl(var(--ui-amber-100))',
                    200: 'hsl(var(--ui-amber-200))',
                    300: 'hsl(var(--ui-amber-300))',
                    400: 'hsl(var(--ui-amber-400))',
                    500: 'hsl(var(--ui-amber-500))',
                    600: 'hsl(var(--ui-amber-600))',
                    700: 'hsl(var(--ui-amber-700))',
                    800: 'hsl(var(--ui-amber-800))',
                    900: 'hsl(var(--ui-amber-900))',
                },

                /* Feedback Colors */
                success: {
                    DEFAULT: 'var(--color-success)',
                    light: 'var(--color-success-light)',
                    dark: 'var(--color-success-dark)',
                    foreground: 'var(--color-success-foreground)',
                },
                warning: {
                    DEFAULT: 'var(--color-warning)',
                    light: 'var(--color-warning-light)',
                    dark: 'var(--color-warning-dark)',
                    foreground: 'var(--color-warning-foreground)',
                },
                error: {
                    DEFAULT: 'var(--color-error)',
                    light: 'var(--color-error-light)',
                    dark: 'var(--color-error-dark)',
                    foreground: 'var(--color-error-foreground)',
                },
                info: {
                    DEFAULT: 'var(--color-info)',
                    light: 'var(--color-info-light)',
                    dark: 'var(--color-info-dark)',
                    foreground: 'var(--color-info-foreground)',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },

                /* Neutrals */
                neutral: {
                    0: 'hsl(var(--neutral-0))',
                    50: 'hsl(var(--neutral-50))',
                    100: 'hsl(var(--neutral-100))',
                    150: 'hsl(var(--neutral-150))',
                    200: 'hsl(var(--neutral-200))',
                    300: 'hsl(var(--neutral-300))',
                    400: 'hsl(var(--neutral-400))',
                    500: 'hsl(var(--neutral-500))',
                    600: 'hsl(var(--neutral-600))',
                    700: 'hsl(var(--neutral-700))',
                    800: 'hsl(var(--neutral-800))',
                    850: 'hsl(var(--neutral-850))',
                    900: 'hsl(var(--neutral-900))',
                    950: 'hsl(var(--neutral-950))',
                    1000: 'hsl(var(--neutral-1000))',
                },

                /* UI Contexts */
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'var(--bg-card)',
                    hover: 'var(--bg-card-hover)',
                    active: 'var(--bg-card-active)',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                border: 'var(--border-default)',
                input: 'var(--bg-card)',
                ring: 'hsl(var(--ring))',

                /* Dashboard Card Colors */
                'card-courses': {
                    bg: 'var(--card-courses-bg)',
                    border: 'var(--card-courses-border)',
                    accent: 'var(--card-courses-accent)',
                },
                'card-assignments': {
                    bg: 'var(--card-assignments-bg)',
                    border: 'var(--card-assignments-border)',
                    accent: 'var(--card-assignments-accent)',
                },
                'card-progress': {
                    bg: 'var(--card-progress-bg)',
                    border: 'var(--card-progress-border)',
                    accent: 'var(--card-progress-accent)',
                },
                'card-schedule': {
                    bg: 'var(--card-schedule-bg)',
                    border: 'var(--card-schedule-border)',
                    accent: 'var(--card-schedule-accent)',
                },
                'card-achievements': {
                    bg: 'var(--card-achievements-bg)',
                    border: 'var(--card-achievements-border)',
                    accent: 'var(--card-achievements-accent)',
                },
                'card-profile': {
                    bg: 'var(--card-profile-bg)',
                    border: 'var(--card-profile-border)',
                    accent: 'var(--card-profile-accent)',
                },
                'card-stats': {
                    bg: 'var(--card-stats-bg)',
                    border: 'var(--card-stats-border)',
                    accent: 'var(--card-stats-accent)',
                },

                /* Chart colors */
                chart: {
                    1: 'var(--chart-1)',
                    2: 'var(--chart-2)',
                    3: 'var(--chart-3)',
                    4: 'var(--chart-4)',
                    5: 'var(--chart-5)',
                    6: 'var(--chart-6)',
                    7: 'var(--chart-7)',
                    8: 'var(--chart-8)',
                },
            },

            /* =========================
               BORDER RADIUS - Kids Friendly
               ========================= */
            borderRadius: {
                none: 'var(--radius-none)',
                xs: 'var(--radius-xs)',
                sm: 'var(--radius-sm)',
                DEFAULT: 'var(--radius-md)',
                md: 'var(--radius-md)',
                lg: 'var(--radius-lg)',
                xl: 'var(--radius-xl)',
                '2xl': 'var(--radius-2xl)',
                '3xl': 'var(--radius-3xl)',
                '4xl': 'var(--radius-4xl)',
                full: 'var(--radius-full)',
                button: 'var(--radius-button)',
                'button-sm': 'var(--radius-button-sm)',
                'button-lg': 'var(--radius-button-lg)',
                card: 'var(--radius-card)',
                'card-sm': 'var(--radius-card-sm)',
                'card-lg': 'var(--radius-card-lg)',
                input: 'var(--radius-input)',
                badge: 'var(--radius-badge)',
                modal: 'var(--radius-modal)',
                tooltip: 'var(--radius-tooltip)',
            },

            /* =========================
               BOX SHADOWS
               ========================= */
            boxShadow: {
                xs: 'var(--shadow-xs)',
                sm: 'var(--shadow-sm)',
                DEFAULT: 'var(--shadow-md)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
                xl: 'var(--shadow-xl)',
                '2xl': 'var(--shadow-2xl)',
                '3xl': 'var(--shadow-3xl)',
                inner: 'var(--shadow-inner)',
                'inner-sm': 'var(--shadow-inner-sm)',
                'inner-lg': 'var(--shadow-inner-lg)',
                card: 'var(--shadow-card)',
                'card-hover': 'var(--shadow-card-hover)',
                button: 'var(--shadow-button)',
                'button-hover': 'var(--shadow-button-hover)',
                dropdown: 'var(--shadow-dropdown)',
                modal: 'var(--shadow-modal)',
                popover: 'var(--shadow-popover)',
                tooltip: 'var(--shadow-tooltip)',
                'glow-primary': 'var(--shadow-glow-primary)',
                'glow-secondary': 'var(--shadow-glow-secondary)',
                'glow-success': 'var(--shadow-glow-success)',
                'glow-warning': 'var(--shadow-glow-warning)',
                'glow-error': 'var(--shadow-glow-error)',
                sunny: 'var(--shadow-sunny)',
                tangerine: 'var(--shadow-tangerine)',
                lavender: 'var(--shadow-lavender)',
                lime: 'var(--shadow-lime)',
                marine: 'var(--shadow-marine)',
                bubblegum: 'var(--shadow-bubblegum)',
                sky: 'var(--shadow-sky)',
            },

            /* =========================
               SPACING
               ========================= */
            spacing: {
                px: 'var(--space-px)',
                0.5: 'var(--space-0-5)',
                1: 'var(--space-1)',
                1.5: 'var(--space-1-5)',
                2: 'var(--space-2)',
                2.5: 'var(--space-2-5)',
                3: 'var(--space-3)',
                3.5: 'var(--space-3-5)',
                4: 'var(--space-4)',
                5: 'var(--space-5)',
                6: 'var(--space-6)',
                7: 'var(--space-7)',
                8: 'var(--space-8)',
                9: 'var(--space-9)',
                10: 'var(--space-10)',
                11: 'var(--space-11)',
                12: 'var(--space-12)',
                14: 'var(--space-14)',
                16: 'var(--space-16)',
                20: 'var(--space-20)',
                24: 'var(--space-24)',
                28: 'var(--space-28)',
                32: 'var(--space-32)',
                36: 'var(--space-36)',
                40: 'var(--space-40)',
                44: 'var(--space-44)',
                48: 'var(--space-48)',
                52: 'var(--space-52)',
                56: 'var(--space-56)',
                60: 'var(--space-60)',
                64: 'var(--space-64)',
                72: 'var(--space-72)',
                80: 'var(--space-80)',
                96: 'var(--space-96)',
            },

            /* =========================
               TYPOGRAPHY
               ========================= */
            fontSize: {
                '2xs': ['var(--text-2xs)', { lineHeight: 'var(--leading-normal)' }],
                xs: ['var(--text-xs)', { lineHeight: 'var(--leading-normal)' }],
                sm: ['var(--text-sm)', { lineHeight: 'var(--leading-normal)' }],
                base: ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
                lg: ['var(--text-lg)', { lineHeight: 'var(--leading-normal)' }],
                xl: ['var(--text-xl)', { lineHeight: 'var(--leading-tight)' }],
                '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-tight)' }],
                '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }],
                '4xl': ['var(--text-4xl)', { lineHeight: 'var(--leading-none)' }],
                '5xl': ['var(--text-5xl)', { lineHeight: 'var(--leading-none)' }],
                '6xl': ['var(--text-6xl)', { lineHeight: 'var(--leading-none)' }],
                '7xl': ['var(--text-7xl)', { lineHeight: 'var(--leading-none)' }],
            },

            fontFamily: {
                sans: ['var(--font-sans)'],
                bengali: ['var(--font-bengali)', 'serif'],
                mono: ['var(--font-mono)'],
            },

            fontWeight: {
                thin: 'var(--font-thin)',
                extralight: 'var(--font-extralight)',
                light: 'var(--font-light)',
                normal: 'var(--font-normal)',
                medium: 'var(--font-medium)',
                semibold: 'var(--font-semibold)',
                bold: 'var(--font-bold)',
                extrabold: 'var(--font-extrabold)',
                black: 'var(--font-black)',
            },

            lineHeight: {
                none: 'var(--leading-none)',
                tight: 'var(--leading-tight)',
                snug: 'var(--leading-snug)',
                normal: 'var(--leading-normal)',
                relaxed: 'var(--leading-relaxed)',
                loose: 'var(--leading-loose)',
            },

            letterSpacing: {
                tighter: 'var(--tracking-tighter)',
                tight: 'var(--tracking-tight)',
                normal: 'var(--tracking-normal)',
                wide: 'var(--tracking-wide)',
                wider: 'var(--tracking-wider)',
                widest: 'var(--tracking-widest)',
            },

            /* =========================
               Z-INDEX
               ========================= */
            zIndex: {
                behind: 'var(--z-behind)',
                base: 'var(--z-base)',
                raised: 'var(--z-raised)',
                dropdown: 'var(--z-dropdown)',
                sticky: 'var(--z-sticky)',
                fixed: 'var(--z-fixed)',
                sidebar: 'var(--z-sidebar)',
                header: 'var(--z-header)',
                navbar: 'var(--z-navbar)',
                'modal-backdrop': 'var(--z-modal-backdrop)',
                modal: 'var(--z-modal)',
                popover: 'var(--z-popover)',
                tooltip: 'var(--z-tooltip)',
                toast: 'var(--z-toast)',
                max: 'var(--z-max)',
            },

            /* =========================
               TRANSITIONS
               ========================= */
            transitionDuration: {
                instant: 'var(--duration-instant)',
                fastest: 'var(--duration-fastest)',
                faster: 'var(--duration-faster)',
                fast: 'var(--duration-fast)',
                DEFAULT: 'var(--duration-normal)',
                normal: 'var(--duration-normal)',
                slow: 'var(--duration-slow)',
                slower: 'var(--duration-slower)',
                slowest: 'var(--duration-slowest)',
            },

            transitionTimingFunction: {
                DEFAULT: 'var(--ease-in-out)',
                linear: 'var(--ease-linear)',
                in: 'var(--ease-in)',
                out: 'var(--ease-out)',
                'in-out': 'var(--ease-in-out)',
                bounce: 'var(--ease-bounce)',
                elastic: 'var(--ease-elastic)',
                spring: 'var(--ease-spring)',
            },

            /* =========================
               ANIMATIONS
               ========================= */
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'slide-up': {
                    from: { opacity: '0', transform: 'translateY(10px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-down': {
                    from: { opacity: '0', transform: 'translateY(-10px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'scale-in': {
                    from: { opacity: '0', transform: 'scale(0.95)' },
                    to: { opacity: '1', transform: 'scale(1)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in': 'fade-in var(--duration-normal) var(--ease-out)',
                'slide-up': 'slide-up var(--duration-normal) var(--ease-out)',
                'slide-down': 'slide-down var(--duration-normal) var(--ease-out)',
                'scale-in': 'scale-in var(--duration-normal) var(--ease-spring)',
                shimmer: 'shimmer 1.5s ease-in-out infinite',
            },

            /* =========================
               WIDTHS & HEIGHTS
               ========================= */
            width: {
                sidebar: 'var(--sidebar-width)',
                'sidebar-collapsed': 'var(--sidebar-width-collapsed)',
            },
            height: {
                navbar: 'var(--navbar-height)',
                'navbar-sm': 'var(--navbar-height-sm)',
            },
            minHeight: {
                navbar: 'var(--navbar-height)',
            },
            maxWidth: {
                'modal-sm': 'var(--modal-width-sm)',
                'modal-md': 'var(--modal-width-md)',
                'modal-lg': 'var(--modal-width-lg)',
                'modal-xl': 'var(--modal-width-xl)',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
