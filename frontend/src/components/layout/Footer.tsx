import React from 'react';
import { BrainCircuit, Twitter, Github, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
    const footerLinks = {
        product: [
            { label: 'Features', href: '#' },
            { label: 'Pricing', href: '#' },
            { label: 'Integrations', href: '#' },
        ],
        company: [
            { label: 'About', href: '#' },
            { label: 'Blog', href: '#' },
            { label: 'Careers', href: '#' },
        ],
        legal: [
            { label: 'Privacy', href: '#' },
            { label: 'Terms', href: '#' },
            { label: 'Security', href: '#' },
        ],
    };

    return (
        <footer className="bg-warm-50 dark:bg-warm-900/50 border-t border-warm-200 dark:border-warm-800 pt-16 pb-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center text-white">
                                <BrainCircuit className="w-4 h-4" />
                            </div>
                            <span className="text-warm-800 dark:text-warm-50 font-semibold">
                                Lundo
                            </span>
                        </div>
                        <p className="text-warm-500 dark:text-warm-400 text-sm leading-relaxed">
                            AI-powered support for parents. Evidence-based guidance for every parenting moment.
                        </p>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="text-warm-800 dark:text-warm-50 font-semibold mb-4 text-sm">
                            Product
                        </h4>
                        <ul className="space-y-2 text-sm text-warm-500 dark:text-warm-400">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <a href={link.href} className="hover:text-primary-600 transition-colors">
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="text-warm-800 dark:text-warm-50 font-semibold mb-4 text-sm">
                            Company
                        </h4>
                        <ul className="space-y-2 text-sm text-warm-500 dark:text-warm-400">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <a href={link.href} className="hover:text-primary-600 transition-colors">
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h4 className="text-warm-800 dark:text-warm-50 font-semibold mb-4 text-sm">
                            Legal
                        </h4>
                        <ul className="space-y-2 text-sm text-warm-500 dark:text-warm-400">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <a href={link.href} className="hover:text-primary-600 transition-colors">
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-warm-200 dark:border-warm-800">
                    <p className="text-warm-400 text-xs">
                        © 2024 Lundo. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <Twitter className="w-4 h-4 text-warm-400 hover:text-primary-600 cursor-pointer transition-colors" />
                        <Github className="w-4 h-4 text-warm-400 hover:text-primary-600 cursor-pointer transition-colors" />
                        <Linkedin className="w-4 h-4 text-warm-400 hover:text-primary-600 cursor-pointer transition-colors" />
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
