import React from 'react';
import { Sliders, ShieldCheck, Lock, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Features: React.FC = () => {
  const { language } = useLanguage();

  const t = {
    en: {
      title: "The co-parent that never sleeps.",
      subtitle: "Cognit replaces the \"I'm alone in this\" feeling with a team of experts dedicated to easing your mental load and decision fatigue.",
      feature1Title: "Cure for Decision Fatigue",
      feature1Desc: "You make thousands of decisions a day alone. Let us handle the parenting ones. From \"Is this rash normal?\" to \"How do I explain divorce to a toddler?\", we give you the script so you don't have to overthink it.",
      mentalLoad: "Mental Load Reduced",
      high: "High",
      feature2Title: "Guilt-Free Support",
      feature2Desc: "Adjust the advice to match your reality. We know you can't be perfect 24/7, and that's okay.",
      timeAvailable: "Time Available",
      timeValue: "Low (Rushed)",
      energyLevel: "Energy Level",
      energyValue: "Exhausted",
      feature3Title: "Your Safe Space",
      feature3Desc: "Vent about your ex, your boss, or your burnout without judgment. Our AI is objective, private, and solely focused on helping you and your child thrive.",
      zeroJudgment: "Zero Judgment"
    },
    tr: {
      title: "Asla uyumayan ebeveyn ortağınız.",
      subtitle: "Cognit, \"bu işte yalnızım\" hissini, zihinsel yükünüzü ve karar yorgunluğunuzu hafifletmeye adanmış bir uzman ekibiyle değiştirir.",
      feature1Title: "Karar Yorgunluğuna Çare",
      feature1Desc: "Günde tek başınıza binlerce karar veriyorsunuz. Ebeveynlik kararlarını bize bırakın. \"Bu döküntü normal mi?\"den \"Boşanmayı küçük çocuğa nasıl anlatırım?\"a kadar, fazla düşünmemeniz için size senaryoyu veriyoruz.",
      mentalLoad: "Azalan Zihinsel Yük",
      high: "Yüksek",
      feature2Title: "Suçluluk Hissettirmeyen Destek",
      feature2Desc: "Tavsiyeyi gerçeğinize göre ayarlayın. 7/24 mükemmel olamayacağınızı biliyoruz ve bu sorun değil.",
      timeAvailable: "Müsait Zaman",
      timeValue: "Düşük (Acele)",
      energyLevel: "Enerji Seviyesi",
      energyValue: "Tükenmiş",
      feature3Title: "Güvenli Alanınız",
      feature3Desc: "Eski eşiniz, patronunuz veya tükenmişliğiniz hakkında yargılanmadan içini dökün. Yapay zekamız objektif, gizli ve sadece sizin ve çocuğunuzun gelişmesine odaklıdır.",
      zeroJudgment: "Sıfır Yargılama"
    }
  };

  const text = t[language];

  return (
    <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="mb-16 text-center md:text-left">
        <h2 className="text-3xl md:text-4xl font-semibold text-[#292524] dark:text-[#fafaf9] tracking-tight mb-4">
          {text.title}
        </h2>
        <p className="text-[#78716c] dark:text-[#a8a29e] max-w-2xl text-lg font-light">
          {text.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Large Card */}
        <div className="md:col-span-2 row-span-2 bg-[#fdfcfb] dark:bg-[#1c1917] border border-[#e7e5e4] dark:border-[#292524] rounded-[2rem] p-8 md:p-12 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#fff7ed] dark:bg-[#431407]/20 rounded-full blur-[80px] group-hover:bg-[#ffedd5] dark:group-hover:bg-[#431407]/40 transition-all duration-700"></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-white dark:bg-[#292524] rounded-2xl flex items-center justify-center mb-6 border border-[#e7e5e4] dark:border-[#44403c] shadow-sm text-[#d97757]">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-semibold text-[#292524] dark:text-[#fafaf9] mb-3">
                {text.feature1Title}
              </h3>
              <p className="text-[#78716c] dark:text-[#a8a29e] leading-relaxed max-w-md">
                {text.feature1Desc}
              </p>
            </div>

            {/* Feature Visualization */}
            <div className="mt-12 bg-white dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#44403c] rounded-2xl p-6 flex gap-4 items-center shadow-sm">
              <div className="flex-1">
                <div className="flex justify-between text-xs font-medium text-[#57534e] dark:text-[#d6d3d1] mb-2">
                  <span>{text.mentalLoad}</span>
                  <span>{text.high}</span>
                </div>
                <div className="w-full bg-[#f5f5f4] dark:bg-[#44403c] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-[#fb923c] to-[#d97757] h-full w-[85%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Slider Card */}
        <div className="bg-white dark:bg-[#171514] border border-[#e7e5e4] dark:border-[#292524] rounded-[2rem] p-8 relative overflow-hidden group md:row-span-2 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-[#fafaf9] dark:bg-[#292524] rounded-2xl flex items-center justify-center mb-6 border border-[#e7e5e4] dark:border-[#44403c] text-[#d97757]">
            <Sliders className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-[#292524] dark:text-[#fafaf9] mb-3">
            {text.feature2Title}
          </h3>
          <p className="text-[#78716c] dark:text-[#a8a29e] text-sm leading-relaxed mb-8">
            {text.feature2Desc}
          </p>

          <div className="space-y-6 bg-[#fdfcfb] dark:bg-[#1c1917] p-4 rounded-2xl border border-[#f5f5f4] dark:border-[#292524]">
            <div>
              <label className="flex justify-between text-xs font-semibold text-[#57534e] dark:text-[#d6d3d1] mb-3">
                <span>{text.timeAvailable}</span>
                <span className="text-[#d97757]">{text.timeValue}</span>
              </label>
              <input type="range" min="0" max="100" defaultValue="20" className="w-full" />
            </div>
            <div>
              <label className="flex justify-between text-xs font-semibold text-[#57534e] dark:text-[#d6d3d1] mb-3">
                <span>{text.energyLevel}</span>
                <span className="text-[#d97757]">{text.energyValue}</span>
              </label>
              <input type="range" min="0" max="100" defaultValue="30" className="w-full" />
            </div>
          </div>
        </div>

        {/* Wide Card */}
        <div className="bg-[#f5f0e6] dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#292524] rounded-[2rem] p-8 relative overflow-hidden group md:col-span-3 flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="flex-1">
            <div className="w-12 h-12 bg-white dark:bg-[#1c1917] rounded-2xl flex items-center justify-center mb-6 border border-[#e7e5e4] dark:border-[#44403c] text-[#d97757]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-semibold text-[#292524] dark:text-[#fafaf9] mb-3">
              {text.feature3Title}
            </h3>
            <p className="text-[#57534e] dark:text-[#d6d3d1] leading-relaxed">
              {text.feature3Desc}
            </p>
          </div>
          <div className="flex-1 flex gap-4">
            <div className="bg-white/80 dark:bg-[#171514]/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 dark:border-[#44403c] flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Lock className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-[#44403c] dark:text-[#d6d3d1]">
                {text.zeroJudgment}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;