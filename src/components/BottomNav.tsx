import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Heart,
  Calendar,
  Sparkles,
  Image as ImageIcon,
  Music,
  MessageSquareHeart,
  Clock,
  Mail,
  Settings,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Heart },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/story', label: 'Timeline', icon: Sparkles },
    { path: '/gallery', label: 'Gallery', icon: ImageIcon },
    { path: '/music', label: 'Music', icon: Music },
    { path: '/notes', label: 'Notes', icon: MessageSquareHeart },
    { path: '/anniversary', label: 'Countdown', icon: Clock },
    { path: '/letter', label: 'Letters', icon: Mail },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden px-2 pb-2.5 pt-1 pointer-events-none">
      <nav className="pointer-events-auto bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto scroll-smooth max-w-lg mx-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-shrink-0 flex flex-col items-center justify-center py-2 px-3.5 rounded-xl transition-all duration-300 relative min-w-[62px] ${
                active
                  ? 'bg-[#EC407A] text-white shadow-md shadow-[#EC407A]/30 scale-105'
                  : 'text-[#5C3A4D]/70 hover:text-[#EC407A] active:bg-pink-50'
              }`}
            >
              <Icon size={18} className={active ? 'stroke-[2.5]' : 'stroke-2'} />
              <span
                className={`text-[10px] font-bold tracking-tight mt-0.5 whitespace-nowrap ${
                  active ? 'text-white' : 'text-[#5C3A4D]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
