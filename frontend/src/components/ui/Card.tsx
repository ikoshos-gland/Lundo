import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hoverable?: boolean;
}

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

interface CardBodyProps {
    children: React.ReactNode;
    className?: string;
}

interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> & {
    Header: React.FC<CardHeaderProps>;
    Body: React.FC<CardBodyProps>;
    Footer: React.FC<CardFooterProps>;
} = ({ children, className = '', hoverable = false }) => {
    return (
        <div
            className={`
        bg-white dark:bg-warm-900
        border border-warm-200 dark:border-warm-800
        rounded-3xl shadow-sm
        transition-all duration-300
        ${hoverable ? 'hover:shadow-lg hover:scale-[1.02] hover:border-primary-200 dark:hover:border-primary-900' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
    <div className={`px-6 py-4 border-b border-warm-100 dark:border-warm-800 ${className}`}>
        {children}
    </div>
);

const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => (
    <div className={`px-6 py-4 ${className}`}>
        {children}
    </div>
);

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
    <div className={`px-6 py-4 border-t border-warm-100 dark:border-warm-800 ${className}`}>
        {children}
    </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
