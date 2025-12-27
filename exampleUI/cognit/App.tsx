import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Agents from './components/Agents';
import Research from './components/Research';
import Pricing from './components/Pricing';
import Footer from './components/Footer';
import Entrance from './components/Entrance';
import { LanguageProvider } from './contexts/LanguageContext';

function AppContent() {
  const [isDark, setIsDark] = useState(false);
  const [entranceVisible, setEntranceVisible] = useState(true);

  useEffect(() => {
    // Check system preference on mount
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className="min-h-screen">
      <Entrance onComplete={() => setEntranceVisible(false)} />
      
      {/* Main Content - hidden while entrance is visible to prevent overlap mess, 
          then fades in. Note: background is in index.html, so we can just hide this content. */}
      <div className={`transition-opacity duration-1000 ${entranceVisible ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
        <Navbar isDark={isDark} toggleTheme={toggleTheme} />
        <Hero />
        <Features />
        <Agents />
        <Research />
        <Pricing />
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;