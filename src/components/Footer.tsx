import React from 'react';
import { useApp } from '../context/AppContext';
import { Heart, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings } = useApp();

  return (
    <footer className="relative z-10 bg-white/40 backdrop-blur-md border-t border-[#F8BBD0]/40 pt-8 pb-32 lg:pb-10 px-4 text-center mt-auto">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-2 text-[#5C3A4D]">
        <div className="flex items-center gap-2 text-[#EC407A] font-serif text-base font-bold">
          <Sparkles size={16} />
          <span>{settings.partner1_name} &amp; {settings.partner2_name}</span>
          <Heart size={16} className="fill-[#EC407A]" />
        </div>
        <p className="text-xs text-[#5C3A4D]/80 italic max-w-md">
          "{settings.quote}"
        </p>
        <div className="text-[10px] uppercase tracking-widest text-[#5C3A4D]/60 mt-1 font-bold">
          SABRIANISA — Our Little Universe © {new Date().getFullYear()} • Forever &amp; Always
        </div>
      </div>
    </footer>
  );
};
