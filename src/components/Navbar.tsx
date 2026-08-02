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
              whileHover={{ scale: 1.08, rotate: 6 }}
              className="w-8 h-8 rounded-xl bg-[#FFE4EC] text-[#EC407A] flex items-center justify-center border border-[#F8BBD0]/50 shadow-xs"
            >
              <Sparkles size={16} />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-serif font-bold tracking-tight text-lg sm:text-xl text-[#C2185B] group-hover:text-[#EC407A] transition lowercase">
                sabrianisa
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

          {/* Mobile Heart Badge */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              to="/settings"
              className="w-9 h-9 rounded-full bg-[#FFE4EC] text-[#EC407A] flex items-center justify-center transition active:scale-95 shadow-xs border border-white"
              aria-label="Settings & Love"
            >
              <Heart size={18} className="fill-[#EC407A]" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
