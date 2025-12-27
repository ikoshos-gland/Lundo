import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Hero: React.FC = () => {
  const { language } = useLanguage();

  const t = {
    en: {
      badge: "Your 24/7 Village is here",
      titleStart: "You're doing it all.",
      titleEnd: "You shouldn't have to do it alone.",
      description: "The AI co-parent for single parents and busy professionals. Instant, evidence-based decisions for the 2 AM worries and the 6 PM meltdowns, without the judgment.",
      ctaPrimary: "Get Support Now",
      ctaSecondary: "See How It Helps",
      trustedBy: "Trusted by 10,000+ solo & working parents",
      logos: {
        single: "Single",
        parent: "Parent",
        working: "Working",
        mom: "Mom",
        solo: "Solo",
        dad: "Dad",
        career: "Career",
        kids: "&Kids"
      }
    },
    tr: {
      badge: "7/24 Köyünüz Burada",
      titleStart: "Her şeye yetişmeye çalışıyorsunuz.",
      titleEnd: "Bunu yalnız yapmak zorunda değilsiniz.",
      description: "Bekar ebeveynler ve çalışan profesyoneller için yapay zeka ebeveyn ortağı. Yargılama olmadan, sabahın 2'sindeki endişeler ve akşam 6 krizleri için anında, kanıta dayalı kararlar.",
      ctaPrimary: "Hemen Destek Alın",
      ctaSecondary: "Nasıl Çalıştığını Gör",
      trustedBy: "10.000+ bekar ve çalışan ebeveyn tarafından güveniliyor",
      logos: {
        single: "Bekar",
        parent: "Ebeveyn",
        working: "Çalışan",
        mom: "Anne",
        solo: "Solo",
        dad: "Baba",
        career: "Kariyer",
        kids: "&Çocuk"
      }
    }
  };

  const text = t[language];

  return (
    <main className="relative pt-36 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
      {/* Warm ambient blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#fff1eb] dark:bg-[#2a1810] rounded-full blur-[100px] -z-10 opacity-60 transition-colors duration-700"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#f5f5f4] dark:bg-[#1c1917] rounded-full blur-[80px] -z-10 opacity-50 transition-colors duration-700"></div>

      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fff7ed] dark:bg-[#292524] border border-[#ffedd5] dark:border-[#44403c] text-[#c2410c] dark:text-[#fdba74] text-xs font-semibold mb-8 shadow-sm transition-colors duration-300">
        <Sparkles className="w-3 h-3 text-[#fb923c]" />
        {text.badge}
      </div>

      <h1 className="text-5xl md:text-7xl font-semibold text-[#292524] dark:text-[#fafaf9] tracking-tight mb-8 max-w-4xl leading-[1.1] transition-colors duration-300">
        {text.titleStart}<br />
        <span className="text-[#d97757]">{text.titleEnd}</span>
      </h1>

      <p className="text-lg md:text-xl text-[#78716c] dark:text-[#a8a29e] max-w-2xl mb-12 font-normal leading-relaxed transition-colors duration-300">
        {text.description}
      </p>

      <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto mb-20">
        <Link to="/register" className="w-full md:w-auto">
          <button className="w-full md:w-auto bg-[#d97757] text-white h-12 px-8 rounded-full font-semibold text-sm hover:bg-[#c26245] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/10 dark:shadow-orange-900/20">
            {text.ctaPrimary}
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
        <a href="#features" className="w-full md:w-auto">
          <button className="w-full md:w-auto bg-white dark:bg-[#1c1917] border border-[#e7e5e4] dark:border-[#292524] text-[#57534e] dark:text-[#d6d3d1] h-12 px-8 rounded-full font-semibold text-sm hover:bg-[#fafaf9] dark:hover:bg-[#292524] transition-all flex items-center justify-center gap-2 shadow-sm">
            <PlayCircle className="w-4 h-4 text-[#d97757]" />
            {text.ctaSecondary}
          </button>
        </a>
      </div>

      {/* Chat Interface Demo - Will add later */}
      <div className="w-full max-w-6xl bg-warm-100 dark:bg-warm-900 rounded-2xl p-8 mb-12 border-2 border-warm-200 dark:border-warm-800">
        <p className="text-warm-600 dark:text-warm-400 text-center">
          Chat Interface Demo (coming soon)
        </p>
      </div>

      {/* Social Proof */}
      <div className="mt-20 w-full pt-12 border-t border-[#e7e5e4] dark:border-[#292524]">
        <p className="text-center text-sm font-medium text-[#a8a29e] mb-8 uppercase tracking-widest">
          {text.trustedBy}
        </p>
        <div className="flex flex-wrap justify-center gap-10 md:gap-20 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-500">
          <span className="text-xl font-bold text-[#57534e] dark:text-[#a8a29e]">
            {text.logos.single}<span className="font-light">{text.logos.parent}</span>
          </span>
          <span className="text-xl font-bold text-[#57534e] dark:text-[#a8a29e]">
            {text.logos.working}<span className="text-[#d97757]">{text.logos.mom}</span>
          </span>
          <span className="text-xl font-bold text-[#57534e] dark:text-[#a8a29e]">
            {text.logos.solo}<span className="font-light">{text.logos.dad}</span>
          </span>
          <span className="text-xl font-bold text-[#57534e] dark:text-[#a8a29e]">
            {text.logos.career}<span className="font-light">{text.logos.kids}</span>
          </span>
        </div>
      </div>
    </main>
  );
};

export default Hero;
