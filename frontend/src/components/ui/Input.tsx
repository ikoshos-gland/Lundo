import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2"
                >
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`
          w-full px-4 py-3 rounded-2xl
          bg-warm-50 dark:bg-warm-900
          border border-warm-200 dark:border-warm-700
          text-warm-800 dark:text-warm-100
          placeholder:text-warm-400 dark:placeholder:text-warm-500
          focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600
          transition-all duration-200
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default Input;
