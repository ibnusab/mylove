import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import {
  Clock,
  Heart,
  Sparkles,
  Trophy,
  Calendar,
  Gift,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';

export const Anniversary: React.FC = () => {
  const { settings } = useApp();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      if (!settings.anniversary_date) return;
      const annDate = new Date(settings.anniversary_date).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - annDate);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [settings.anniversary_date]);

  const triggerCelebration = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#EC407A', '#FFFFFF'],
    });
  };

  const milestones = [
    { title: '100 Days Together', days: 100, achieved: timeLeft.days >= 100 },
    { title: '1 Year (365 Days)', days: 365, achieved: timeLeft.days >= 365 },
    { title: '500 Days of Smiles', days: 500, achieved: timeLeft.days >= 500 },
    { title: '2 Years (730 Days)', days: 730, achieved: timeLeft.days >= 730 },
    { title: '1000 Days of Endless Love', days: 1000, achieved: timeLeft.days >= 1000 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFE4EC] text-[#EC407A] text-xs font-bold uppercase tracking-wider">
          <Sparkles size={14} />
          <span>Every Second Counts</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-[#5C3A4D]">
          Days Together Counter
        </h1>
        <p className="text-[#5C3A4D]/80 text-sm max-w-lg mx-auto">
          Since {settings.anniversary_date || '2023-05-14'} — every single moment has been a blessing.
        </p>
      </div>

      {/* Main Countdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
        {[
          { label: 'DAYS', value: timeLeft.days },
          { label: 'HOURS', value: timeLeft.hours },
          { label: 'MINUTES', value: timeLeft.minutes },
          { label: 'SECONDS', value: timeLeft.seconds },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white/60 backdrop-blur-md border border-white/80 p-6 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center space-y-1 relative overflow-hidden group"
          >
            <div className="text-4xl sm:text-5xl font-extrabold font-serif text-[#EC407A] tracking-tight">
              {item.value}
            </div>
            <div className="text-[11px] font-bold text-[#5C3A4D] tracking-widest uppercase">
              {item.label}
            </div>
            <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-[#FFE4EC]/60 rounded-full blur-sm group-hover:scale-150 transition duration-500 pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* Celebration Button */}
      <div className="text-center">
        <button
          onClick={triggerCelebration}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#EC407A] hover:bg-[#D81B60] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#EC407A]/20 transition transform active:scale-95"
        >
          <Gift size={18} />
          <span>Trigger Anniversary Fireworks 🎉</span>
        </button>
      </div>

      {/* Relationship Statistics & Milestones */}
      <div className="bg-white/60 backdrop-blur-md border border-white/80 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-[#FFE4EC] pb-4">
          <Trophy size={22} className="text-[#EC407A]" />
          <h2 className="font-serif text-xl font-bold text-[#5C3A4D]">
            Relationship Milestones &amp; Achievements
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {milestones.map((m) => (
            <div
              key={m.title}
              className={`p-4 rounded-2xl border transition flex items-center gap-3 ${
                m.achieved
                  ? 'bg-[#FFE4EC] border-[#F8BBD0] text-[#5C3A4D] shadow-sm'
                  : 'bg-white/30 border-white/40 text-[#5C3A4D]/40 opacity-70'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  m.achieved ? 'bg-[#EC407A] text-white shadow-sm' : 'bg-gray-200 text-gray-400'
                }`}
              >
                <Heart size={20} className={m.achieved ? 'fill-white' : ''} />
              </div>
              <div>
                <h4 className="text-xs font-bold">{m.title}</h4>
                <p className="text-[11px] font-medium">
                  {m.achieved ? 'Unlocked! ❤️' : `${m.days - timeLeft.days} days remaining`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
