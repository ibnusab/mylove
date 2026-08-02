import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, ArrowRight, Music as MusicIcon, Calendar, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export const Home: React.FC = () => {
  const { settings, isPlaying, togglePlay, currentTrack } = useApp();
  const [time, setTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const currentDateString = format(new Date(), 'MMMM d, yyyy').toUpperCase();

  useEffect(() => {
    const calcRealtime = () => {
      if (!settings.anniversary_date) return;
      const annDate = new Date(settings.anniversary_date).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - annDate);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTime({ days, hours, minutes, seconds });
    };

    calcRealtime();
    const interval = setInterval(calcRealtime, 1000);
    return () => clearInterval(interval);
  }, [settings.anniversary_date]);

  const dashboardPhoto =
    settings.couple_photo_url || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800';

  return (
    <div className="relative min-h-[calc(100vh-6rem)] flex flex-col justify-start items-center px-4 py-4 sm:py-8 space-y-6 max-w-4xl mx-auto">
      {/* Background Soft Ambient Glows */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-[#FFE4EC] rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-[#F8BBD0] rounded-full blur-[80px] opacity-40 pointer-events-none" />

      {/* Top Hero Container Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full bg-[#FFE4EC]/75 backdrop-blur-md rounded-[36px] p-6 sm:p-10 border border-white/90 shadow-lg text-center space-y-4 sm:space-y-6 relative"
      >
        {/* Date Eyebrow */}
        <p className="text-[11px] sm:text-xs font-bold text-[#EC407A] tracking-widest uppercase">
          TODAY IS {currentDateString}
        </p>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-bold text-[#5C3A4D] leading-tight max-w-xl mx-auto">
          You are the <span className="text-[#EC407A] italic font-serif">stars</span> in my little sky.
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-base text-[#5C3A4D]/80 max-w-md mx-auto leading-relaxed">
          {settings.quote ||
            'A sweet corner of the cosmos made entirely of our love, quiet laughs, and endless memories.'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/notes"
            className="w-full sm:w-auto px-7 py-3.5 bg-[#EC407A] hover:bg-[#D81B60] text-white rounded-full font-bold shadow-md shadow-[#EC407A]/25 uppercase tracking-wider text-xs transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles size={15} />
            <span>WRITE A NOTE</span>
          </Link>

          <Link
            to="/story"
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-pink-50 text-[#5C3A4D] rounded-full font-bold border border-pink-200/80 shadow-xs uppercase tracking-wider text-xs transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>EXPLORE TIMELINE</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </motion.div>

      {/* Polaroid Photo Frame with Overlapping Avatar Badges */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="w-full max-w-md bg-white p-4 sm:p-5 rounded-[32px] shadow-2xl border border-pink-100 relative group"
      >
        <div className="w-full h-80 sm:h-96 rounded-[24px] overflow-hidden relative bg-[#FFE4EC]/50 shadow-inner">
          <img
            src={dashboardPhoto}
            alt="Couple Memory"
            className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700"
          />

          {/* Overlapping Avatar Badges Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center -space-x-4 bg-white/40 backdrop-blur-md p-2 rounded-full border border-white/80 shadow-xl pointer-events-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white overflow-hidden shadow-md shrink-0 bg-[#FFE4EC]">
                <img
                  src={dashboardPhoto}
                  alt={settings.partner1_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white overflow-hidden shadow-md shrink-0 bg-[#F8BBD0]">
                <img
                  src={dashboardPhoto}
                  alt={settings.partner2_name}
                  className="w-full h-full object-cover scale-125 origin-right"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Label inside Polaroid */}
        <div className="pt-3 pb-1 text-center">
          <p className="font-serif font-bold text-lg text-[#5C3A4D]">
            {settings.partner1_name} &amp; {settings.partner2_name}
          </p>
          <p className="text-xs text-[#EC407A] font-medium tracking-wide">
            {settings.anniversary_date ? `Together since ${settings.anniversary_date}` : 'Forever & Always'}
          </p>
        </div>
      </motion.div>

      {/* Live Relationship Counter Widget */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-white shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between border-b border-pink-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#EC407A]">
            <Clock size={16} />
            <span>OUR TIME TOGETHER</span>
          </div>
          <span className="text-[11px] font-bold text-[#5C3A4D]/60">
            {time.days} Days Total
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-[#FFE4EC]/60 p-2.5 rounded-2xl border border-pink-200/50">
            <div className="text-xl sm:text-2xl font-bold text-[#EC407A]">{time.days}</div>
            <div className="text-[9px] uppercase font-bold text-[#5C3A4D]/60">Days</div>
          </div>
          <div className="bg-[#FFE4EC]/60 p-2.5 rounded-2xl border border-pink-200/50">
            <div className="text-xl sm:text-2xl font-bold text-[#EC407A]">{time.hours}</div>
            <div className="text-[9px] uppercase font-bold text-[#5C3A4D]/60">Hours</div>
          </div>
          <div className="bg-[#FFE4EC]/60 p-2.5 rounded-2xl border border-pink-200/50">
            <div className="text-xl sm:text-2xl font-bold text-[#EC407A]">{time.minutes}</div>
            <div className="text-[9px] uppercase font-bold text-[#5C3A4D]/60">Mins</div>
          </div>
          <div className="bg-[#FFE4EC]/60 p-2.5 rounded-2xl border border-pink-200/50">
            <div className="text-xl sm:text-2xl font-bold text-[#EC407A]">{time.seconds}</div>
            <div className="text-[9px] uppercase font-bold text-[#5C3A4D]/60">Secs</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
