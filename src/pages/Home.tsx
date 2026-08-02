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
    <div className="relative min-h-[calc(100vh-6rem)] flex flex-col justify-start items-center px-4 py-4 sm:py-8 space-y-6 max-w-5xl mx-auto">
      {/* Background Soft Ambient Glows */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-[#FFE4EC] rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-[#F8BBD0] rounded-full blur-[80px] opacity-40 pointer-events-none" />

      {/* Top Hero Container Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full bg-[#FFE4EC]/75 backdrop-blur-md rounded-[36px] p-6 sm:p-8 md:p-10 border border-white/90 shadow-lg text-center space-y-3 sm:space-y-5 relative"
      >
        {/* Date Eyebrow */}
        <p className="text-[11px] sm:text-xs font-bold text-[#EC407A] tracking-widest uppercase">
          TODAY IS {currentDateString}
        </p>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#5C3A4D] leading-tight max-w-2xl mx-auto">
          You are the <span className="text-[#EC407A] italic font-serif">stars</span> in my little sky.
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm md:text-base text-[#5C3A4D]/80 max-w-lg mx-auto leading-relaxed">
          {settings.quote ||
            'A sweet corner of the cosmos made entirely of our love, quiet laughs, and endless memories.'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/notes"
            className="w-full sm:w-auto px-6 py-3 bg-[#EC407A] hover:bg-[#D81B60] text-white rounded-full font-bold shadow-md shadow-[#EC407A]/25 uppercase tracking-wider text-xs transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles size={15} />
            <span>WRITE A NOTE</span>
          </Link>

          <Link
            to="/story"
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-pink-50 text-[#5C3A4D] rounded-full font-bold border border-pink-200/80 shadow-xs uppercase tracking-wider text-xs transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>EXPLORE TIMELINE</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </motion.div>

      {/* Main Content Grid for Desktop (Photo + Timer Counter) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Left Column: Polaroid Photo Frame */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full bg-white p-4 sm:p-5 rounded-[32px] shadow-xl border border-pink-100/80 relative group mx-auto"
        >
          <div className="w-full h-72 sm:h-80 lg:h-80 rounded-[24px] overflow-hidden relative bg-[#FFE4EC]/50 shadow-inner">
            <img
              src={dashboardPhoto}
              alt="Couple Memory"
              className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700"
            />
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

        {/* Right Column: Live Relationship Counter Widget & Extra Details */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full space-y-4"
        >
          <div className="bg-white/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#EC407A]">
                <Clock size={16} />
                <span>OUR TIME TOGETHER</span>
              </div>
              <span className="text-xs font-bold text-[#5C3A4D]/70 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100">
                {time.days} Days Total
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-[#FFE4EC]/70 p-3 rounded-2xl border border-pink-200/50">
                <div className="text-xl sm:text-3xl font-serif font-bold text-[#EC407A]">{time.days}</div>
                <div className="text-[9px] uppercase font-bold text-[#5C3A4D]/70 tracking-wider mt-0.5">Days</div>
              </div>
              <div className="bg-[#FFE4EC]/70 p-3 rounded-2xl border border-pink-200/50">
                <div className="text-xl sm:text-3xl font-serif font-bold text-[#EC407A]">{time.hours}</div>
                <div className="text-[9px] uppercase font-bold text-[#5C3A4D]/70 tracking-wider mt-0.5">Hours</div>
              </div>
              <div className="bg-[#FFE4EC]/70 p-3 rounded-2xl border border-pink-200/50">
                <div className="text-xl sm:text-3xl font-serif font-bold text-[#EC407A]">{time.minutes}</div>
                <div className="text-[9px] uppercase font-bold text-[#5C3A4D]/70 tracking-wider mt-0.5">Mins</div>
              </div>
              <div className="bg-[#FFE4EC]/70 p-3 rounded-2xl border border-pink-200/50">
                <div className="text-xl sm:text-3xl font-serif font-bold text-[#EC407A]">{time.seconds}</div>
                <div className="text-[9px] uppercase font-bold text-[#5C3A4D]/70 tracking-wider mt-0.5">Secs</div>
              </div>
            </div>
          </div>

          {/* Quick Nav Badges Card */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-2xl border border-pink-100 flex items-center justify-between text-xs text-[#5C3A4D]">
            <span className="font-semibold">Ready to share a sweet message?</span>
            <Link
              to="/letter"
              className="text-[#EC407A] font-bold hover:underline flex items-center gap-1"
            >
              Open Letters &rarr;
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
