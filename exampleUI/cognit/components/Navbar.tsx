import React from 'react';
import { BrainCircuit, Sun, Moon, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface NavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isDark, toggleTheme }) => {
  const { language, setLanguage } = useLanguage();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  };

  const t = {
    en: {
      howItWorks: "How it Works",
      experts: "The Experts",
      science: "Science",
      plans: "Plans",
      login: "Log in",
      start: "Start Assessment"
    },
    tr: {
      howItWorks: "Nasıl Çalışır",
      experts: "Uzmanlar",
      science: "Bilim",
      plans: "Planlar",
      login: "Giriş Yap",
      start: "Değerlendirmeyi Başlat"
    }
  };

  const text = t[language];

  return (
    <nav className="fixed w-full z-50 top-0 border-b border-[#e7e5e4]/60 dark:border-[#292524] bg-[#fdfcf8]/80 dark:bg-[#0c0a09]/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#d97757] rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <span className="text-[#292524] dark:text-[#fafaf9] font-semibold tracking-tight text-xl">
            Cognit
          </span>
        </div>

        <div className="hidden md:flex items-center gap-10 text-sm font-medium text-[#78716c] dark:text-[#a8a29e]">
          <a
            href="#features"
            onClick={(e) => scrollToSection(e, 'features')}
            className="hover:text-[#d97757] dark:hover:text-[#d97757] transition-colors"
          >
            {text.howItWorks}
          </a>
          <a
            href="#agents"
            onClick={(e) => scrollToSection(e, 'agents')}
            className="hover:text-[#d97757] dark:hover:text-[#d97757] transition-colors"
          >
            {text.experts}
          </a>
          <a
            href="#research"
            onClick={(e) => scrollToSection(e, 'research')}
            className="hover:text-[#d97757] dark:hover:text-[#d97757] transition-colors"
          >
            {text.science}
          </a>
          <a
            href="#pricing"
            onClick={(e) => scrollToSection(e, 'pricing')}
            className="hover:text-[#d97757] dark:hover:text-[#d97757] transition-colors"
          >
            {text.plans}
          </a>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#e7e5e4] dark:bg-[#292524] text-[#57534e] dark:text-[#a8a29e] hover:bg-[#d6d3d1] dark:hover:bg-[#44403c] transition-all"
          >
            <Globe className="w-3 h-3" />
            {language.toUpperCase()}
          </button>

          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#78716c] dark:text-[#a8a29e] hover:bg-[#e7e5e4]/50 dark:hover:bg-[#292524] transition-all"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="hidden md:block text-sm font-semibold text-[#57534e] dark:text-[#d6d3d1] hover:text-[#d97757] transition-colors"
          >
            {text.login}
          </a>
          <button className="bg-[#292524] dark:bg-[#fafaf9] text-[#fafaf9] dark:text-[#1c1917] hover:bg-[#44403c] dark:hover:bg-[#e7e5e4] px-6 py-2.5 rounded-full text-xs font-semibold transition-all shadow-md">
            {text.start}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;