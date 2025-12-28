import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
    children: React.ReactNode;
    isDark: boolean;
    toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, isDark, toggleTheme }) => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar isDark={isDark} toggleTheme={toggleTheme} />

            {/* Main content with padding for fixed navbar */}
            <main className="flex-1 pt-20">
                {children}
            </main>

            <Footer />
        </div>
    );
};

export default Layout;
