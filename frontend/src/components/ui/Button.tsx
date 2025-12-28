import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary-600/20';

    const variants = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-orange-900/10 dark:shadow-orange-900/20',
        secondary: 'bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-800 shadow-sm',
        ghost: 'text-warm-600 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800',
    };

    const sizes = {
        sm: 'text-xs px-4 py-2',
        md: 'text-sm px-6 py-2.5',
        lg: 'text-base px-8 py-3',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
