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
                // Primary brand color
                primary: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#ffdbd0',
                    300: '#fed7aa',
                    400: '#fdba74',
                    500: '#fb923c',
                    600: '#d97757',
                    700: '#c26245',
                    800: '#9a3412',
                    900: '#7c2d12',
                    950: '#431407',
                },
                // Warm neutral palette
                warm: {
                    50: '#fafaf9',
                    100: '#f5f5f4',
                    200: '#e7e5e4',
                    300: '#d6d3d1',
                    400: '#a8a29e',
                    500: '#78716c',
                    600: '#57534e',
                    700: '#44403c',
                    800: '#292524',
                    900: '#1c1917',
                    950: '#0c0a09',
                },
            },
            fontFamily: {
                sans: ['Outfit', 'system-ui', 'sans-serif'],
            },
            animation: {
                blob: 'blob 10s infinite',
                float: 'float 6s ease-in-out infinite',
                pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                blob: {
                    '0%': {
                        transform: 'translate(0px, 0px) scale(1)',
                    },
                    '33%': {
                        transform: 'translate(30px, -50px) scale(1.1)',
                    },
                    '66%': {
                        transform: 'translate(-20px, 20px) scale(0.9)',
                    },
                    '100%': {
                        transform: 'translate(0px, 0px) scale(1)',
                    },
                },
                float: {
                    '0%, 100%': {
                        transform: 'translateY(0)',
                    },
                    '50%': {
                        transform: 'translateY(-10px)',
                    },
                },
            },
            boxShadow: {
                'soft': '0 4px 20px -5px rgba(0, 0, 0, 0.1)',
                'glow': '0 0 20px rgba(217, 119, 87, 0.3)',
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
