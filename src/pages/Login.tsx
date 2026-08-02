import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Heart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const { setUser, settings } = useApp();
  const navigate = useNavigate();

  const [username, setUsername] = useState('love');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        navigate('/');
      } else {
        setError(data.message || 'Invalid login credentials');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-white/70 backdrop-blur-md border border-white/80 p-8 rounded-3xl shadow-xl relative space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#EC407A] text-white flex items-center justify-center mx-auto shadow-md shadow-[#EC407A]/20">
            <Lock size={20} />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#5C3A4D]">
            Private Access
          </h1>
          <p className="text-xs text-[#5C3A4D]/80">
            Enter password to unlock {settings.partner1_name} &amp; {settings.partner2_name}'s sanctuary.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5C3A4D] mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8BBD0]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#EC407A] bg-white/50 text-[#5C3A4D]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C3A4D] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8BBD0]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#EC407A] bg-white/50 text-[#5C3A4D]"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600 text-center">{error}</p>
          )}

          <div className="bg-[#FFE4EC]/60 p-3 rounded-xl border border-[#F8BBD0]/50 text-[11px] text-[#5C3A4D] text-center">
            Default Password: <span className="font-mono font-bold text-[#EC407A]">123456</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-[#EC407A] hover:bg-[#D81B60] text-white font-bold text-xs uppercase tracking-widest shadow-md transition transform active:scale-95"
          >
            {isLoading ? 'Unlocking Universe...' : 'Unlock Universe'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
