import React from 'react';
import Navbar from '@/components/public/Navbar';
import Hero from '@/components/public/Hero';
import Features from '@/components/public/Features';
import Agents from '@/components/public/Agents';
import Research from '@/components/public/Research';
import Pricing from '@/components/public/Pricing';
import Footer from '@/components/public/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 transition-colors duration-300">
      <Navbar />
      <Hero />
      <Features />
      <Agents />
      <Research />
      <Pricing />
      <Footer />
    </div>
  );
};
