import React from 'react';
import { BrainCircuit, Sun, Moon, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../../features/auth';

interface NavbarProps {
    isDark: boolean;
    toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isDark, toggleTheme }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
    const { user, isAuthenticated, logout } = useAuth();

    const navLinks = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Children', href: '/children' },
        { label: 'Chat', href: '/chat' },
    ];

    const handleLogout = async () => {
        await logout();
        setIsUserMenuOpen(false);
        window.location.href = '/';
    };

    return (
        <nav className="fixed w-full z-50 top-0 border-b border-warm-200/60 dark:border-warm-800 bg-warm-50/80 dark:bg-warm-950/80 backdrop-blur-md transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/20">
                        <BrainCircuit className="w-5 h-5" />
                    </div>
                    <span className="text-warm-800 dark:text-warm-50 font-semibold tracking-tight text-xl">
                        Lundo
                    </span>
                </div>

                {/* Desktop Nav - Only show when authenticated */}
                {isAuthenticated && (
                    <div className="hidden md:flex items-center gap-10 text-sm font-medium text-warm-500 dark:text-warm-400">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="hover:text-primary-600 dark:hover:text-primary-600 transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-warm-500 dark:text-warm-400 hover:bg-warm-200/50 dark:hover:bg-warm-800 transition-all"
                        aria-label="Toggle theme"
                    >
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    {isAuthenticated && user ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-warm-200/50 dark:hover:bg-warm-800 transition-all"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                </div>
                                <span className="hidden md:block text-sm font-medium text-warm-700 dark:text-warm-300">
                                    {user.full_name}
                                </span>
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-warm-900 rounded-xl shadow-lg border border-warm-200 dark:border-warm-700 py-2">
                                    <a
                                        href="/dashboard"
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800"
                                    >
                                        <User className="w-4 h-4" />
                                        Dashboard
                                    </a>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-warm-100 dark:hover:bg-warm-800"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <a
                                href="/login"
                                className="hidden md:block text-sm font-semibold text-warm-600 dark:text-warm-300 hover:text-primary-600 transition-colors"
                            >
                                Log in
                            </a>

                            <a
                                href="/register"
                                className="bg-warm-800 dark:bg-warm-50 text-warm-50 dark:text-warm-900 hover:bg-warm-700 dark:hover:bg-warm-200 px-6 py-2.5 rounded-full text-xs font-semibold transition-all shadow-md"
                            >
                                Get Started
                            </a>
                        </>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-warm-500 dark:text-warm-400 hover:bg-warm-200/50 dark:hover:bg-warm-800 transition-all"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-warm-200 dark:border-warm-800 bg-warm-50/95 dark:bg-warm-950/95 backdrop-blur-md">
                    <div className="px-6 py-4 space-y-3">
                        {isAuthenticated && navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="block text-sm font-medium text-warm-600 dark:text-warm-300 hover:text-primary-600 transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className={isAuthenticated ? "pt-2 border-t border-warm-200 dark:border-warm-800" : ""}>
                            {isAuthenticated && user ? (
                                <>
                                    <div className="text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
                                        {user.full_name}
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 transition-colors"
                                    >
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <a
                                        href="/login"
                                        className="block text-sm font-medium text-warm-600 dark:text-warm-300 hover:text-primary-600 transition-colors mb-2"
                                    >
                                        Log in
                                    </a>
                                    <a
                                        href="/register"
                                        className="block text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                                    >
                                        Get Started
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
