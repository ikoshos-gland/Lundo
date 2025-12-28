import React from 'react';
import { BrainCircuit, Twitter, Github, Linkedin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { language } = useLanguage();

  const t = {
    en: {
      desc: "Pioneering the intersection of artificial intelligence and human psychology with warmth and precision.",
      product: "Product",
      company: "Company",
      legal: "Legal",
      features: "Features",
      integrations: "Integrations",
      pricing: "Pricing",
      about: "About",
      blog: "Blog",
      careers: "Careers",
      privacy: "Privacy",
      terms: "Terms",
      hipaa: "HIPAA",
      rights: "© 2024 Cognit AI Inc. All rights reserved."
    },
    tr: {
      desc: "Yapay zeka ve insan psikolojisinin kesişim noktasında sıcaklık ve hassasiyetle öncülük ediyoruz.",
      product: "Ürün",
      company: "Şirket",
      legal: "Yasal",
      features: "Özellikler",
      integrations: "Entegrasyonlar",
      pricing: "Fiyatlandırma",
      about: "Hakkımızda",
      blog: "Blog",
      careers: "Kariyer",
      privacy: "Gizlilik",
      terms: "Koşullar",
      hipaa: "HIPAA",
      rights: "© 2024 Cognit AI Inc. Tüm hakları saklıdır."
    }
  };

  const text = t[language];

  return (
    <footer className="bg-[#fbfaf9] dark:bg-[#171514] border-t border-[#e7e5e4] dark:border-[#292524] pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-[#d97757] rounded-lg flex items-center justify-center text-white">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <span className="text-[#292524] dark:text-[#fafaf9] font-semibold">
                Cognit
              </span>
            </div>
            <p className="text-[#78716c] dark:text-[#a8a29e] text-sm leading-relaxed">
              {text.desc}
            </p>
          </div>
          <div>
            <h4 className="text-[#292524] dark:text-[#fafaf9] font-semibold mb-4 text-sm">
              {text.product}
            </h4>
            <ul className="space-y-2 text-sm text-[#78716c] dark:text-[#a8a29e]">
              <li>
                <a
                  href="#"
                  className="hover:text-[#d97757] dark:hover:text-[#d97757] transition-colors"
                >
                  {text.features}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[#d97757] dark:hover:text-[#d97757] transition-colors"
                >
                  {text.integrations}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[#d97757] dark:hover:text-[#d97757] transition-colors"
                >
                  {text.pricing}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#292524] dark:text-[#fafaf9] font-semibold mb-4 text-sm">
              {text.company}
            </h4>
            <ul className="space-y-2 text-sm text-[#78716c] dark:text-[#a8a29e]">
              <li>
                <a
                  href="#"
                  className="hover:text-[#d97757] dark:hover:text-[#d97757] transition-colors"
                >
                  {text.about}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[#d97757] dark:hover:text-[#d97757] transition-colors"
                >
                  {text.blog}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[#d97757] dark:hover:text-[#d97757] transition-colors"
                >
                  {text.careers}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#292524] dark:text-[#fafaf9] font-semibold mb-4 text-sm">
              {text.legal}
            </h4>
            <ul className="space-y-2 text-sm text-[#78716c] dark:text-[#a8a29e]">
              <li>
                <a
                  href="#"
                  className="hover:text-[#d97757] dark:hover:text-[#d97757] transition-colors"
                >
                  {text.privacy}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[#d97757] dark:hover:text-[#d97757] transition-colors"
                >
                  {text.terms}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[#d97757] dark:hover:text-[#d97757] transition-colors"
                >
                  {text.hipaa}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-[#e7e5e4] dark:border-[#292524]">
          <p className="text-[#a8a29e] text-xs">
            {text.rights}
          </p>
          <div className="flex gap-4">
            <Twitter className="w-4 h-4 text-[#a8a29e] hover:text-[#d97757] cursor-pointer transition-colors" />
            <Github className="w-4 h-4 text-[#a8a29e] hover:text-[#d97757] cursor-pointer transition-colors" />
            <Linkedin className="w-4 h-4 text-[#a8a29e] hover:text-[#d97757] cursor-pointer transition-colors" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;