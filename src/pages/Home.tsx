import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, Play, ArrowRight, Calendar, Music as MusicIcon, Clock, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { differenceInDays } from 'date-fns';

export const Home: React.FC = () => {
  const { settings, isPlaying, togglePlay, currentTrack } = useApp();
  const [time, setTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

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
    settings.couple_photo_url || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600';

  return (
    <div className="relative min-h-[calc(100vh-6rem)] flex flex-col justify-center items-center px-4 py-8 lg:py-12 overflow-hidden">
      {/* Background Soft Ambient Decorations */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-[#FFE4EC] rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-[#F8BBD0] rounded-full blur-[80px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-[#FF69B4] rounded-full opacity-20 pointer-events-none" />

      {/* Main Content Layout */}
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Column: Hero & Countdown */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6 text-left">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-1"
          >
            <h2 className="text-[#FF69B4] text-xl font-serif italic tracking-wide">
              Our Little Universe
            </h2>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter leading-tight text-[#5C3A4D]">
              {settings.partner1_name}{' '}
              <span className="text-[#F8BBD0] font-light">&amp;</span>{' '}
              {settings.partner2_name}
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-[#5C3A4D]/80 max-w-lg leading-relaxed italic font-serif"
          >
            "{settings.quote}"
          </motion.p>

          {/* Anniversary Countdown & Stats Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-lg"
          >
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-3xl border border-white/80 shadow-sm text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[#EC407A]">{time.days}</div>
              <div className="text-[10px] uppercase tracking-tighter font-bold text-[#5C3A4D]/60">Days</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-3xl border border-white/80 shadow-sm text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[#EC407A]">{time.hours}</div>
              <div className="text-[10px] uppercase tracking-tighter font-bold text-[#5C3A4D]/60">Hours</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-3xl border border-white/80 shadow-sm text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[#EC407A]">{time.minutes}</div>
              <div className="text-[10px] uppercase tracking-tighter font-bold text-[#5C3A4D]/60">Mins</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-3xl border border-white/80 shadow-sm text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[#EC407A]">{time.seconds}</div>
              <div className="text-[10px] uppercase tracking-tighter font-bold text-[#5C3A4D]/60">Secs</div>
            </div>
          </motion.div>

          {/* Hero Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <Link
              to="/story"
              className="px-8 py-4 bg-[#EC407A] text-white rounded-full font-bold shadow-lg shadow-[#EC407A]/20 uppercase tracking-widest text-xs hover:bg-[#D81B60] transition transform active:scale-95 flex items-center gap-2"
            >
              <span>Open Universe</span>
              <ArrowRight size={14} />
            </Link>

            <button
              onClick={togglePlay}
              className="px-8 py-4 bg-white text-[#EC407A] rounded-full font-bold border border-[#F8BBD0] uppercase tracking-widest text-xs hover:shadow-md transition transform active:scale-95 flex items-center gap-2"
            >
              <MusicIcon size={14} />
              <span>{isPlaying ? 'Pause Music' : 'Play Music'}</span>
            </button>
          </motion.div>
        </div>

        {/* Right Column: Visual Elements & Glass Photo Frame */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center lg:items-end relative pt-6 lg:pt-0">
          {/* Floating Heart Graphic */}
          <div className="absolute -top-6 -right-6 w-28 h-28 text-[#F8BBD0]/40 pointer-events-none hidden sm:block">
            <Heart size={100} className="fill-current" />
          </div>

          {/* Couple Photo Frame (Glassmorphism) */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-72 sm:w-80 h-96 bg-white/30 backdrop-blur-md rounded-[40px] border border-white/80 p-4 shadow-2xl relative group"
          >
            <div className="w-full h-full bg-gradient-to-tr from-[#FFE4EC] to-[#FFF0F6] rounded-[30px] overflow-hidden relative shadow-inner">
              <img
                src={dashboardPhoto}
                alt="Couple"
                className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700"
              />
            </div>

            {/* Polaroid Label Overlay */}
            <motion.div
              animate={{ rotate: [-5, -2, -5] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="absolute -bottom-5 -left-5 bg-white p-4 rounded-2xl shadow-xl border border-[#FFE4EC]"
            >
              <p className="text-[#EC407A] font-bold text-xs sm:text-sm tracking-tighter uppercase">
                {settings.anniversary_date ? settings.anniversary_date : 'OUR SPECIAL DAY'}
              </p>
              <p className="text-[10px] text-[#5C3A4D]/60 font-medium">Forever &amp; Always</p>
            </motion.div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};
