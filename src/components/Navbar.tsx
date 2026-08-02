import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Heart,
  BookOpen,
  Image as ImageIcon,
  Music,
  MessageSquareHeart,
  Clock,
  Calendar as CalendarIcon,
  Mail,
  Settings,
  Lock,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const { settings } = useApp();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Home', icon: Heart },
    { path: '/story', label: 'Story', icon: BookOpen },
    { path: '/gallery', label: 'Gallery', icon: ImageIcon },
    { path: '/music', label: 'Music', icon: Music },
    { path: '/notes', label: 'Notes', icon: MessageSquareHeart },
    { path: '/anniversary', label: 'Countdown', icon: Clock },
    { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { path: '/letter', label: 'Letters', icon: Mail },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full px-3 py-2">
      <div className="max-w-7xl mx-auto bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-sm px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 6 }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#FF69B4] to-[#EC407A] flex items-center justify-center text-white shadow-sm"
            >
              <Heart className="fill-white" size={18} />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-base sm:text-lg text-[#5C3A4D] flex items-center gap-1 group-hover:text-[#EC407A] transition">
                SABRIANISA
                <Sparkles size={12} className="text-[#FF69B4] animate-pulse" />
              </span>
              <span className="text-[9px] tracking-widest text-[#EC407A] uppercase font-bold">
                {settings.partner1_name} & {settings.partner2_name}
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
                    active
                      ? 'bg-[#EC407A] text-white shadow-md shadow-[#EC407A]/20'
                      : 'text-[#5C3A4D]/80 hover:bg-white/60 hover:text-[#EC407A]'
                  }`}
                >
                  <Icon size={13} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-[#5C3A4D] hover:bg-white/50 rounded-full transition"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="lg:hidden mt-2 bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-4 shadow-xl space-y-1 max-w-md mx-auto"
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition ${
                    active
                      ? 'bg-[#EC407A] text-white shadow-md'
                      : 'text-[#5C3A4D] hover:bg-[#FFE4EC]'
                  }`}
                >
                  <Icon size={16} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
