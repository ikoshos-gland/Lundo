import React from 'react';
import { Filter, Stethoscope, Heart, Brain, Moon, BookOpen, Smile, Baby, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Agents: React.FC = () => {
  const { language } = useLanguage();

  const t = {
    en: {
      badge: "Your Digital Village",
      title: "The Council of \"I've Got You\"",
      subtitle: "When you're the only adult in the room, you need backup. Our agents play different roles to help you manage the chaos.",
      filter: "Customize Support",
      section1: "Daily Survival Squad",
      agent1Name: "The Reality Checker",
      agent1Desc: "\"Is this normal or am I failing?\" This agent reassures you that the tantrum is biological, not a result of your divorce or job.",
      agent1Focus: "Focus: Validation & Norms",
      active: "Always On",
      agent2Name: "The Routine Architect",
      agent2Desc: "Specializes in \"Getting out the door in 15 minutes\" and \"Dinner without a fight.\" Efficient, structured plans for busy schedules.",
      agent2Focus: "Focus: Efficiency & Logistics",
      agent3Name: "The Guilt Dissolver",
      agent3Desc: "Helps you maximize \"quality time\" over quantity. Reminds you that you're a good parent even when you're exhausted.",
      agent3Focus: "Focus: Mental Health",
      section2: "Scenario Support",
      agent4Name: "Sleep Recovery",
      agent4Desc: "Because you have a presentation tomorrow and you need them to stay in bed.",
      enable: "Enable",
      agent5Name: "Homework Helper",
      agent5Desc: "Strategies to stop the homework battle so you can actually enjoy your evening.",
      agent6Name: "Transition Tamer",
      agent6Desc: "Managing drop-offs, pick-ups, and the switch between \"work mode\" and \"parent mode\"."
    },
    tr: {
      badge: "Dijital Köyünüz",
      title: "\"Yanındayım\" Diyen Meclis",
      subtitle: "Odadaki tek yetişkin sizseniz, desteğe ihtiyacınız var demektir. Ajanlarımız kaosu yönetmenize yardımcı olmak için farklı roller üstlenir.",
      filter: "Desteği Özelleştir",
      section1: "Günlük Hayatta Kalma Ekibi",
      agent1Name: "Gerçeklik Kontrolcüsü",
      agent1Desc: "\"Bu normal mi yoksa ben mi başarısızım?\" Bu ajan, krizin boşanmanız veya işiniz yüzünden değil, biyolojik olduğunu size garanti eder.",
      agent1Focus: "Odak: Doğrulama & Normlar",
      active: "Her Zaman Açık",
      agent2Name: "Rutin Mimarı",
      agent2Desc: "\"15 dakikada evden çıkma\" ve \"Kavgasız akşam yemeği\" konularında uzmanlaşmıştır. Yoğun programlar için verimli, yapılandırılmış planlar.",
      agent2Focus: "Odak: Verimlilik & Lojistik",
      agent3Name: "Suçluluk Giderici",
      agent3Desc: "Nicelik yerine \"nitelikli zamanı\" maksimize etmenize yardımcı olur. Yorgun olduğunuzda bile iyi bir ebeveyn olduğunuzu hatırlatır.",
      agent3Focus: "Odak: Akıl Sağlığı",
      section2: "Senaryo Desteği",
      agent4Name: "Uyku Kurtarma",
      agent4Desc: "Çünkü yarın bir sunumunuz var ve yataklarında kalmalarına ihtiyacınız var.",
      enable: "Etkinleştir",
      agent5Name: "Ödev Yardımcısı",
      agent5Desc: "Akşamınızın tadını çıkarabilmeniz için ödev savaşlarını durduracak stratejiler.",
      agent6Name: "Geçiş Terbiyecisi",
      agent6Desc: "Bırakmalar, almalar ve \"iş modu\" ile \"ebeveyn modu\" arasındaki geçişi yönetme."
    }
  };

  const text = t[language];

  return (
    <section id="agents" className="relative py-24 px-6 max-w-7xl mx-auto">
        {/* Warm ambient blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-[#fff7ed] dark:bg-[#2a1810] rounded-full blur-[100px] -z-10 opacity-60 transition-colors duration-700"></div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f5f4] dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#44403c] text-[#78716c] dark:text-[#a8a29e] text-xs font-semibold mb-6 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#d97757] animate-pulse"></span>
                    {text.badge}
                </div>
                <h2 className="text-4xl md:text-5xl font-semibold text-[#292524] dark:text-[#fafaf9] tracking-tight mb-4">
                    {text.title}
                </h2>
                <p className="text-lg text-[#78716c] dark:text-[#a8a29e] max-w-2xl font-light">
                    {text.subtitle}
                </p>
            </div>
            
            <div className="flex gap-2">
                <button className="bg-white dark:bg-[#1c1917] hover:bg-[#fafaf9] dark:hover:bg-[#292524] text-[#57534e] dark:text-[#d6d3d1] border border-[#e7e5e4] dark:border-[#292524] px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {text.filter}
                </button>
            </div>
        </div>

        {/* Section 1: Core Specialists */}
        <div className="mb-12">
            <h2 className="text-sm font-bold text-[#a8a29e] uppercase tracking-wider mb-6 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                {text.section1}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Developmental Agent */}
                <div className="bg-white dark:bg-[#1c1917] border border-[#e7e5e4] dark:border-[#292524] rounded-2xl p-6 hover:shadow-lg hover:border-[#d97757]/30 dark:hover:border-[#d97757]/30 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                            <Baby className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20">{text.active}</span>
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-[#292524] dark:text-[#fafaf9] mb-2">{text.agent1Name}</h3>
                    <p className="text-sm text-[#78716c] dark:text-[#a8a29e] mb-6 leading-relaxed">
                        {text.agent1Desc}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-[#f5f5f4] dark:border-[#292524]">
                        <span className="text-xs font-medium text-[#a8a29e]">{text.agent1Focus}</span>
                    </div>
                </div>

                {/* Behavioral Coach */}
                <div className="bg-white dark:bg-[#1c1917] border border-[#e7e5e4] dark:border-[#292524] rounded-2xl p-6 hover:shadow-lg hover:border-[#d97757]/30 dark:hover:border-[#d97757]/30 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div className="relative inline-block w-10 align-middle select-none">
                            <input type="checkbox" defaultChecked name="toggle" id="daily-toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white dark:bg-[#d6d3d1] border-2 border-[#e7e5e4] dark:border-[#44403c] appearance-none cursor-pointer transition-all duration-300" />
                            <label htmlFor="daily-toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-[#e7e5e4] dark:bg-[#44403c] cursor-pointer"></label>
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-[#292524] dark:text-[#fafaf9] mb-2">{text.agent2Name}</h3>
                    <p className="text-sm text-[#78716c] dark:text-[#a8a29e] mb-6 leading-relaxed">
                        {text.agent2Desc}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-[#f5f5f4] dark:border-[#292524]">
                        <span className="text-xs font-medium text-[#a8a29e]">{text.agent2Focus}</span>
                    </div>
                </div>

                {/* Emotional Guide */}
                <div className="bg-white dark:bg-[#1c1917] border border-[#e7e5e4] dark:border-[#292524] rounded-2xl p-6 hover:shadow-lg hover:border-[#d97757]/30 dark:hover:border-[#d97757]/30 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/10 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform duration-300">
                            <Heart className="w-6 h-6" />
                        </div>
                        <div className="relative inline-block w-10 align-middle select-none">
                            <input type="checkbox" defaultChecked name="toggle" id="insight-toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white dark:bg-[#d6d3d1] border-2 border-[#e7e5e4] dark:border-[#44403c] appearance-none cursor-pointer transition-all duration-300" />
                            <label htmlFor="insight-toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-[#e7e5e4] dark:bg-[#44403c] cursor-pointer"></label>
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-[#292524] dark:text-[#fafaf9] mb-2">{text.agent3Name}</h3>
                    <p className="text-sm text-[#78716c] dark:text-[#a8a29e] mb-6 leading-relaxed">
                        {text.agent3Desc}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-[#f5f5f4] dark:border-[#292524]">
                        <span className="text-xs font-medium text-[#a8a29e]">{text.agent3Focus}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Section 2: Specific Issues */}
        <div className="mb-12">
            <h2 className="text-sm font-bold text-[#a8a29e] uppercase tracking-wider mb-6 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                {text.section2}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Sleep Specialist */}
                <div className="bg-white dark:bg-[#1c1917] border border-[#e7e5e4] dark:border-[#292524] rounded-2xl p-6 hover:shadow-lg hover:border-[#d97757]/30 dark:hover:border-[#d97757]/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:rotate-3 transition-transform duration-300">
                            <Moon className="w-6 h-6" />
                        </div>
                        <button className="px-3 py-1.5 text-xs font-semibold text-[#d97757] border border-[#d97757]/20 rounded-full hover:bg-[#d97757] hover:text-white transition-all">{text.enable}</button>
                    </div>
                    <h3 className="text-lg font-semibold text-[#292524] dark:text-[#fafaf9] mb-2">{text.agent4Name}</h3>
                    <p className="text-sm text-[#78716c] dark:text-[#a8a29e] mb-4 leading-relaxed">
                        {text.agent4Desc}
                    </p>
                </div>

                {/* Academic/School */}
                <div className="bg-white dark:bg-[#1c1917] border border-[#e7e5e4] dark:border-[#292524] rounded-2xl p-6 hover:shadow-lg hover:border-[#d97757]/30 dark:hover:border-[#d97757]/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/10 flex items-center justify-center text-rose-700 dark:text-rose-400 group-hover:rotate-3 transition-transform duration-300">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <button className="px-3 py-1.5 text-xs font-semibold text-[#d97757] border border-[#d97757]/20 rounded-full hover:bg-[#d97757] hover:text-white transition-all">{text.enable}</button>
                    </div>
                    <h3 className="text-lg font-semibold text-[#292524] dark:text-[#fafaf9] mb-2">{text.agent5Name}</h3>
                    <p className="text-sm text-[#78716c] dark:text-[#a8a29e] mb-4 leading-relaxed">
                        {text.agent5Desc}
                    </p>
                </div>

                {/* Social Skills */}
                <div className="bg-white dark:bg-[#1c1917] border border-[#e7e5e4] dark:border-[#292524] rounded-2xl p-6 hover:shadow-lg hover:border-[#d97757]/30 dark:hover:border-[#d97757]/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:rotate-3 transition-transform duration-300">
                            <Smile className="w-6 h-6" />
                        </div>
                        <button className="px-3 py-1.5 text-xs font-semibold text-[#d97757] border border-[#d97757]/20 rounded-full hover:bg-[#d97757] hover:text-white transition-all">{text.enable}</button>
                    </div>
                    <h3 className="text-lg font-semibold text-[#292524] dark:text-[#fafaf9] mb-2">{text.agent6Name}</h3>
                    <p className="text-sm text-[#78716c] dark:text-[#a8a29e] mb-4 leading-relaxed">
                        {text.agent6Desc}
                    </p>
                </div>

            </div>
        </div>
    </section>
  );
};

export default Agents;