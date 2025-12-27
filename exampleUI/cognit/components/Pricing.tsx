import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Pricing: React.FC = () => {
  const { language } = useLanguage();

  const t = {
    en: {
      title: "Cheaper than a therapy session.",
      subtitle: "More available than a grandparent. Always in your pocket.",
      monthly: "Monthly",
      yearly: "Yearly",
      basicTitle: "The Solo Hero",
      basicDesc: "Crisis support when you really need a second opinion.",
      basicFeat1: "1 Child Profile",
      basicFeat2: "5 Emergency Chats / month",
      basicFeat3: "Basic \"Is this normal?\" Check",
      basicBtn: "Get Backup",
      proTitle: "The Digital Village",
      proBadge: "Working Parent Special",
      proDesc: "Full support squad for decision fatigue relief.",
      proFeat1: "Unlimited 24/7 Access",
      proFeat2: "Guilt-Free Routine Builder",
      proFeat3: "Crisis Mode (Instant Scripts)",
      proFeat4: "Behavioral & Emotional Experts",
      proBtn: "Start 7-Day Free Trial",
      clinicTitle: "Lifetime Peace",
      clinicDesc: "One payment. Support until they leave for college.",
      clinicFeat1: "Unlimited Profiles",
      clinicFeat2: "Teen & Puberty Modules",
      clinicFeat3: "Priority Response",
      clinicBtn: "Get Lifetime Access",
      perMonth: "/mo",
      oneTime: "/one-time"
    },
    tr: {
      title: "Bir terapi seansından daha ucuz.",
      subtitle: "Bir büyükanne/babadan daha ulaşılabilir. Her zaman cebinizde.",
      monthly: "Aylık",
      yearly: "Yıllık",
      basicTitle: "Solo Kahraman",
      basicDesc: "Gerçekten ikinci bir görüşe ihtiyaç duyduğunuzda kriz desteği.",
      basicFeat1: "1 Çocuk Profili",
      basicFeat2: "Ayda 5 Acil Sohbet",
      basicFeat3: "Temel \"Bu normal mi?\" Kontrolü",
      basicBtn: "Destek Al",
      proTitle: "Dijital Köy",
      proBadge: "Çalışan Ebeveyn Özel",
      proDesc: "Karar yorgunluğunu hafifletmek için tam destek ekibi.",
      proFeat1: "Sınırsız 7/24 Erişim",
      proFeat2: "Suçluluk Hissettirmeyen Rutin Oluşturucu",
      proFeat3: "Kriz Modu (Anlık Senaryolar)",
      proFeat4: "Davranışsal ve Duygusal Uzmanlar",
      proBtn: "7 Günlük Ücretsiz Denemeyi Başlat",
      clinicTitle: "Ömür Boyu Huzur",
      clinicDesc: "Tek ödeme. Üniversiteye gidene kadar destek.",
      clinicFeat1: "Sınırsız Profil",
      clinicFeat2: "Ergenlik Modülleri",
      clinicFeat3: "Öncelikli Yanıt",
      clinicBtn: "Ömür Boyu Erişim Al",
      perMonth: "/ay",
      oneTime: "/tek seferlik"
    }
  };

  const text = t[language];

  return (
    <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border-t border-[#e7e5e4] dark:border-[#292524]">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-[#292524] dark:text-[#fafaf9] tracking-tight mb-4">
          {text.title}
        </h2>
        <p className="text-[#78716c] dark:text-[#a8a29e]">
          {text.subtitle}
        </p>

        {/* Custom Toggle */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <span className="text-sm text-[#78716c] dark:text-[#a8a29e] font-medium">
            {text.monthly}
          </span>
          <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
            <input
              type="checkbox"
              name="toggle"
              id="toggle"
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white dark:bg-[#1c1917] border-4 border-[#e7e5e4] dark:border-[#44403c] appearance-none cursor-pointer transition-all duration-300"
            />
            <label
              htmlFor="toggle"
              className="toggle-label block overflow-hidden h-6 rounded-full bg-[#e7e5e4] dark:bg-[#44403c] cursor-pointer"
            ></label>
          </div>
          <span className="text-sm text-[#292524] dark:text-[#fafaf9] font-semibold">
            {text.yearly}{' '}
            <span className="text-[#d97757] text-xs ml-1 font-bold">
              -20%
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Basic */}
        <div className="bg-white dark:bg-[#1c1917] p-8 rounded-[2rem] border border-[#e7e5e4] dark:border-[#292524] flex flex-col hover:border-[#d6d3d1] dark:hover:border-[#44403c] transition-colors shadow-sm">
          <h3 className="text-lg font-medium text-[#292524] dark:text-[#fafaf9] mb-2">
            {text.basicTitle}
          </h3>
          <div className="text-4xl font-bold text-[#292524] dark:text-[#fafaf9] mb-6">
            $0
            <span className="text-sm text-[#78716c] dark:text-[#a8a29e] font-normal">
              {text.perMonth}
            </span>
          </div>
          <p className="text-[#78716c] dark:text-[#a8a29e] text-sm mb-8">
            {text.basicDesc}
          </p>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-[#57534e] dark:text-[#d6d3d1]">
              <Check className="w-4 h-4 text-[#d97757]" />
              {text.basicFeat1}
            </li>
            <li className="flex items-center gap-3 text-sm text-[#57534e] dark:text-[#d6d3d1]">
              <Check className="w-4 h-4 text-[#d97757]" />
              {text.basicFeat2}
            </li>
            <li className="flex items-center gap-3 text-sm text-[#57534e] dark:text-[#d6d3d1]">
              <Check className="w-4 h-4 text-[#d97757]" />
              {text.basicFeat3}
            </li>
          </ul>
          <button className="w-full py-3 rounded-xl border border-[#e7e5e4] dark:border-[#44403c] text-[#57534e] dark:text-[#d6d3d1] hover:bg-[#fafaf9] dark:hover:bg-[#292524] transition-colors text-sm font-bold">
            {text.basicBtn}
          </button>
        </div>

        {/* Pro */}
        <div className="p-8 rounded-[2rem] bg-[#292524] dark:bg-[#fafaf9] text-[#fafaf9] dark:text-[#1c1917] border border-[#292524] dark:border-[#e7e5e4] flex flex-col relative shadow-xl transform scale-105">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#d97757] text-white px-4 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-md">
            {text.proBadge}
          </div>
          <h3 className="text-lg font-medium text-white dark:text-[#1c1917] mb-2">
            {text.proTitle}
          </h3>
          <div className="text-4xl font-bold text-white dark:text-[#1c1917] mb-6">
            $19
            <span className="text-sm text-[#a8a29e] dark:text-[#57534e] font-normal">
              {text.perMonth}
            </span>
          </div>
          <p className="text-[#d6d3d1] dark:text-[#57534e] text-sm mb-8">
            {text.proDesc}
          </p>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-white dark:text-[#1c1917]">
              <Check className="w-4 h-4 text-[#d97757]" />
              {text.proFeat1}
            </li>
            <li className="flex items-center gap-3 text-sm text-white dark:text-[#1c1917]">
              <Check className="w-4 h-4 text-[#d97757]" />
              {text.proFeat2}
            </li>
            <li className="flex items-center gap-3 text-sm text-white dark:text-[#1c1917]">
              <Check className="w-4 h-4 text-[#d97757]" />
              {text.proFeat3}
            </li>
            <li className="flex items-center gap-3 text-sm text-white dark:text-[#1c1917]">
              <Check className="w-4 h-4 text-[#d97757]" />
              {text.proFeat4}
            </li>
          </ul>
          <button className="w-full py-3 rounded-xl bg-[#d97757] text-white hover:bg-[#c26245] transition-colors text-sm font-bold shadow-lg">
            {text.proBtn}
          </button>
        </div>

        {/* Clinic */}
        <div className="bg-white dark:bg-[#1c1917] p-8 rounded-[2rem] border border-[#e7e5e4] dark:border-[#292524] flex flex-col hover:border-[#d6d3d1] dark:hover:border-[#44403c] transition-colors shadow-sm">
          <h3 className="text-lg font-medium text-[#292524] dark:text-[#fafaf9] mb-2">
            {text.clinicTitle}
          </h3>
          <div className="text-4xl font-bold text-[#292524] dark:text-[#fafaf9] mb-6">
            $299
            <span className="text-sm text-[#78716c] dark:text-[#a8a29e] font-normal">
              {text.oneTime}
            </span>
          </div>
          <p className="text-[#78716c] dark:text-[#a8a29e] text-sm mb-8">
            {text.clinicDesc}
          </p>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-[#57534e] dark:text-[#d6d3d1]">
              <Check className="w-4 h-4 text-[#d97757]" />
              {text.clinicFeat1}
            </li>
            <li className="flex items-center gap-3 text-sm text-[#57534e] dark:text-[#d6d3d1]">
              <Check className="w-4 h-4 text-[#d97757]" />
              {text.clinicFeat2}
            </li>
            <li className="flex items-center gap-3 text-sm text-[#57534e] dark:text-[#d6d3d1]">
              <Check className="w-4 h-4 text-[#d97757]" />
              {text.clinicFeat3}
            </li>
          </ul>
          <button className="w-full py-3 rounded-xl border border-[#e7e5e4] dark:border-[#44403c] text-[#57534e] dark:text-[#d6d3d1] hover:bg-[#fafaf9] dark:hover:bg-[#292524] transition-colors text-sm font-bold">
            {text.clinicBtn}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;