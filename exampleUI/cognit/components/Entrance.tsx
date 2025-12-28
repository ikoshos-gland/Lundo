import React, { useEffect, useState } from 'react';

interface EntranceProps {
    onComplete: () => void;
}

const Entrance: React.FC<EntranceProps> = ({ onComplete }) => {
  const [show, setShow] = useState(true);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateOut(true);
      setTimeout(() => {
        setShow(false);
        onComplete();
      }, 800); // Wait for animation to finish
    }, 2000); // Show for 2 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-700 ease-in-out ${
        animateOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 
        We use a transparent background to let the global animated background show through.
        However, we add a very subtle backdrop blur to give depth to the floating text.
      */}
      <div className="absolute inset-0 bg-[#fdfcf8]/30 dark:bg-[#0c0a09]/30 backdrop-blur-sm"></div>

      <div className="relative flex flex-col items-center z-10">
        {/* Iridescent Orb Simulation */}
        <div className="relative w-32 h-32 mb-8">
            {/* Colorful blur backing */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400 via-pink-400 to-white opacity-80 blur-xl animate-pulse"></div>
            
            {/* The Orb */}
            <div className="absolute inset-0 rounded-full bg-white dark:bg-black overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center">
                {/* Spinning gradient for pearl effect */}
                <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,#d97757_0deg,transparent_60deg,#3b82f6_120deg,transparent_180deg,#ec4899_240deg,transparent_300deg,#d97757_360deg)] animate-[spin_3s_linear_infinite] opacity-40 blur-md"></div>
                
                {/* Shine */}
                <div className="absolute top-2 left-4 w-8 h-4 bg-white opacity-40 blur-md rounded-[100%] transform -rotate-45"></div>
            </div>
            
            {/* Core Glow */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(255,255,255,0.5)] dark:shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]"></div>
        </div>

        <h1 className="text-2xl font-bold text-[#292524] dark:text-[#fafaf9] tracking-tight animate-float">
          Cognit
        </h1>
        <p className="text-sm text-[#78716c] dark:text-[#a8a29e] mt-2 font-light">
          Decoding behavior...
        </p>
      </div>
    </div>
  );
};

export default Entrance;