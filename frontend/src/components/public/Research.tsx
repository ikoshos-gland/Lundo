import React from 'react';
import { BookOpen, LineChart, Microscope, ArrowRight, FileText, Share2, Quote } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Research: React.FC = () => {
  const { language } = useLanguage();

  const t = {
    en: {
      badge: "The Science of \"Good Enough\"",
      title: "Quality time over quantity. It's proven.",
      desc: "Research shows that 15 minutes of focused connection is more valuable than 3 hours of distracted proximity. Cognit helps you maximize the limited time you have.",
      btn1: "Read the \"Busy Parent\" Study",
      btn2: "View Sources & Citations",
      quote: "Working parents often feel guilty, but Cognit focuses on the 'repair'—helping them reconnect quickly after a stressful day. That's what builds resilience.",
      stat1: "Research time saved per month",
      stat2: "Decrease in parental guilt",
      paperTag: "Quick Read",
      paperTitle: "The \"Good Enough\" Parent: Why Perfection Hurts",
      paperDesc: "A summary of Winnicott's theory on why being an available, imperfect parent creates healthier children than a stressed, perfect one.",
      paperMeta: "Summary (3 min read)",
      promoTitle: "Single Parent Discount",
      promoDesc: "We know it's tighter on one income. Apply here."
    },
    tr: {
      badge: "\"Yeterince İyi\"nin Bilimi",
      title: "Nicelikten çok nitelikli zaman. Kanıtlanmış.",
      desc: "Araştırmalar, 15 dakikalık odaklanmış bağ kurmanın, 3 saatlik dikkat dağınıklığıyla yan yana durmaktan daha değerli olduğunu gösteriyor. Cognit, sahip olduğunuz kısıtlı zamanı maksimize etmenize yardımcı olur.",
      btn1: "\"Meşgul Ebeveyn\" Çalışmasını Oku",
      btn2: "Kaynakları ve Alıntıları Gör",
      quote: "\"Çalışan ebeveynler genellikle suçluluk hisseder, ancak Cognit 'onarıma' odaklanır—stresli bir günün ardından çocuklarıyla hızlıca yeniden bağ kurmalarına yardımcı olur. Dayanıklılığı oluşturan şey budur.\"",
      stat1: "Ayda tasarruf edilen araştırma süresi",
      stat2: "Ebeveyn suçluluğunda azalma",
      paperTag: "Hızlı Oku",
      paperTitle: "\"Yeterince İyi\" Ebeveyn: Mükemmellik Neden Zarar Verir?",
      paperDesc: "Winnicott'un teorisinin özeti: Neden ulaşılabilir, kusurlu bir ebeveyn olmak, stresli ve mükemmel bir ebeveynden daha sağlıklı çocuklar yetiştirir.",
      paperMeta: "Özet (3 dk okuma)",
      promoTitle: "Bekar Ebeveyn İndirimi",
      promoDesc: "Tek gelirle geçinmenin zor olduğunu biliyoruz. Buradan başvurun."
    }
  };

  const text = t[language];

  return (
    <section id="research" className="py-24 px-6 max-w-7xl mx-auto border-t border-[#e7e5e4] dark:border-[#292524]">
      <div className="flex flex-col md:flex-row gap-16">
        
        {/* Left Column: Header & Context */}
        <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f5f4] dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#44403c] text-[#78716c] dark:text-[#a8a29e] text-xs font-semibold mb-6 shadow-sm">
                <Microscope className="w-3 h-3 text-[#d97757]" />
                {text.badge}
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold text-[#292524] dark:text-[#fafaf9] tracking-tight mb-6">
                {text.title.split('.')[0]}.<br/>{text.title.split('.')[1]}.
            </h2>
            <p className="text-lg text-[#78716c] dark:text-[#a8a29e] mb-8 font-light leading-relaxed">
                {text.desc}
            </p>

            <div className="flex flex-col gap-4">
                <button className="inline-flex items-center gap-2 text-[#d97757] font-semibold hover:gap-3 transition-all group w-fit">
                    {text.btn1}
                    <ArrowRight className="w-4 h-4" />
                </button>
                <button className="inline-flex items-center gap-2 text-[#57534e] dark:text-[#d6d3d1] font-medium text-sm hover:text-[#292524] dark:hover:text-[#fafaf9] transition-colors w-fit">
                    {text.btn2}
                    <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            {/* Quote Card */}
            <div className="mt-12 bg-[#fdfcfb] dark:bg-[#1c1917] p-6 rounded-2xl border border-[#e7e5e4] dark:border-[#292524] relative">
                <Quote className="w-8 h-8 text-[#e7e5e4] dark:text-[#292524] absolute top-4 right-4 fill-current" />
                <p className="text-[#57534e] dark:text-[#d6d3d1] italic mb-4 relative z-10 text-sm leading-relaxed">
                    {text.quote}
                </p>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#d6d3d1] dark:bg-[#44403c] overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Dr&backgroundColor=d6d3d1" alt="Doctor" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-[#292524] dark:text-[#fafaf9]">Dr. Sarah Miller</div>
                        <div className="text-[10px] text-[#78716c] dark:text-[#a8a29e]">Family Therapist & Author</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Stats & Papers */}
        <div className="flex-1 flex flex-col gap-6">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#fff7ed] dark:bg-[#431407]/10 p-6 rounded-2xl border border-[#ffedd5] dark:border-[#44403c]">
                    <LineChart className="w-6 h-6 text-[#d97757] mb-4" />
                    <div className="text-3xl font-bold text-[#292524] dark:text-[#fafaf9] mb-1">10h+</div>
                    <div className="text-xs text-[#78716c] dark:text-[#a8a29e]">{text.stat1}</div>
                </div>
                <div className="bg-[#f5f5f4] dark:bg-[#1c1917] p-6 rounded-2xl border border-[#e7e5e4] dark:border-[#292524]">
                    <BookOpen className="w-6 h-6 text-[#78716c] dark:text-[#a8a29e] mb-4" />
                    <div className="text-3xl font-bold text-[#292524] dark:text-[#fafaf9] mb-1">92%</div>
                    <div className="text-xs text-[#78716c] dark:text-[#a8a29e]">{text.stat2}</div>
                </div>
            </div>

            {/* Featured Paper */}
            <div className="bg-white dark:bg-[#1c1917] p-6 rounded-2xl border border-[#e7e5e4] dark:border-[#292524] hover:shadow-md transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#d97757] bg-[#fff7ed] dark:bg-[#431407]/20 px-2 py-1 rounded">{text.paperTag}</span>
                    <Share2 className="w-4 h-4 text-[#a8a29e] group-hover:text-[#d97757] transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-[#292524] dark:text-[#fafaf9] mb-2 group-hover:text-[#d97757] transition-colors">
                    {text.paperTitle}
                </h3>
                <p className="text-xs text-[#78716c] dark:text-[#a8a29e] mb-4 line-clamp-2">
                    {text.paperDesc}
                </p>
                <div className="flex items-center gap-4 text-xs text-[#a8a29e]">
                    <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {text.paperMeta}
                    </span>
                </div>
            </div>

            {/* Call to Collaborate */}
            <div className="p-6 rounded-2xl border border-dashed border-[#d6d3d1] dark:border-[#44403c] flex items-center justify-between hover:bg-[#fdfcfb] dark:hover:bg-[#1c1917] transition-colors cursor-pointer">
                <div>
                    <h3 className="text-sm font-semibold text-[#292524] dark:text-[#fafaf9]">{text.promoTitle}</h3>
                    <p className="text-xs text-[#78716c] dark:text-[#a8a29e] mt-1">{text.promoDesc}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#f5f5f4] dark:bg-[#292524] flex items-center justify-center text-[#57534e] dark:text-[#d6d3d1]">
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>

        </div>
      </div>
    </section>
  );
};

export default Research;