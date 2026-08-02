import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { uploadFileWithFallback } from '../lib/storage';
import { isSupabaseConfigured, SUPABASE_SQL_SCHEMA } from '../lib/supabase';
import { Settings, Heart, Sparkles, Key, Check, Palette, Upload, Image as ImageIcon, Database, Copy, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useApp();

  const [partner1, setPartner1] = useState(settings.partner1_name);
  const [partner2, setPartner2] = useState(settings.partner2_name);
  const [anniversaryDate, setAnniversaryDate] = useState(settings.anniversary_date);
  const [quote, setQuote] = useState(settings.quote);
  const [couplePhotoUrl, setCouplePhotoUrl] = useState(settings.couple_photo_url || '');
  const [particleIntensity, setParticleIntensity] = useState(settings.particle_intensity);
  const [isUploading, setIsUploading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setPartner1(settings.partner1_name);
    setPartner2(settings.partner2_name);
    setAnniversaryDate(settings.anniversary_date);
    setQuote(settings.quote);
    setCouplePhotoUrl(settings.couple_photo_url || '');
    setParticleIntensity(settings.particle_intensity);
  }, [settings]);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFileWithFallback(file, '/api/upload/photos');
      if (url) {
        setCouplePhotoUrl(url);
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      partner1_name: partner1,
      partner2_name: partner2,
      anniversary_date: anniversaryDate,
      quote,
      couple_photo_url: couplePhotoUrl,
      particle_intensity: particleIntensity,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setPasswordMsg(data.message);
    if (data.success) {
      setCurrentPassword('');
      setNewPassword('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFE4EC] text-[#EC407A] text-xs font-bold uppercase tracking-wider">
          <Sparkles size={14} />
          <span>Customize Our Universe</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#5C3A4D]">
          Relationship Settings
        </h1>
        <p className="text-[#5C3A4D]/80 text-sm max-w-lg mx-auto">
          Manage partner names, anniversary date, particle effects, and security preferences.
        </p>
      </div>

      {/* Settings Form */}
      <div className="max-w-2xl mx-auto bg-white/60 backdrop-blur-md border border-white/80 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-[#FFE4EC] pb-3">
          <Heart size={20} className="text-[#EC407A] fill-[#EC407A]" />
          <h2 className="font-serif text-lg font-bold text-[#5C3A4D]">
            Couple &amp; Theme Preferences
          </h2>
        </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5C3A4D] mb-1">
                  Partner 1 Name
                </label>
                <input
                  type="text"
                  required
                  value={partner1}
                  onChange={(e) => setPartner1(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#F8BBD0]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#EC407A] bg-white/50 text-[#5C3A4D]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5C3A4D] mb-1">
                  Partner 2 Name
                </label>
                <input
                  type="text"
                  required
                  value={partner2}
                  onChange={(e) => setPartner2(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#F8BBD0]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#EC407A] bg-white/50 text-[#5C3A4D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C3A4D] mb-1">
                Anniversary Date
              </label>
              <input
                type="date"
                required
                value={anniversaryDate}
                onChange={(e) => setAnniversaryDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#F8BBD0]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#EC407A] bg-white/50 text-[#5C3A4D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C3A4D] mb-1">
                Our Favorite Romantic Quote
              </label>
              <textarea
                rows={2}
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#F8BBD0]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#EC407A] bg-white/50 text-[#5C3A4D]"
              />
            </div>

            {/* Dashboard Photo Field */}
            <div>
              <label className="block text-xs font-semibold text-[#5C3A4D] mb-1 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-[#EC407A]" />
                <span>Dashboard Photo / Foto Dashboard</span>
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/40 p-3 rounded-2xl border border-[#F8BBD0]/50">
                {couplePhotoUrl ? (
                  <img
                    src={couplePhotoUrl}
                    alt="Dashboard Preview"
                    className="w-20 h-24 object-cover rounded-xl border border-white shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-20 h-24 bg-[#FFE4EC] rounded-xl flex flex-col items-center justify-center text-[#EC407A] text-[10px] text-center p-1 shrink-0">
                    <ImageIcon size={20} />
                    <span>No Photo</span>
                  </div>
                )}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#EC407A] hover:bg-[#D81B60] text-white text-xs font-bold uppercase tracking-wider transition shadow-md w-fit">
                      <Upload size={14} />
                      <span>{isUploading ? 'Uploading...' : 'Upload Photo / Unggah Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                    <p className="text-[11px] text-[#5C3A4D]/70 italic">
                      Upload your favorite couple picture directly from your device.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C3A4D] mb-1">
                Floating Heart Particle Intensity
              </label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((intensity) => (
                  <button
                    type="button"
                    key={intensity}
                    onClick={() => setParticleIntensity(intensity)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider capitalize transition ${
                      particleIntensity === intensity
                        ? 'bg-[#EC407A] text-white shadow-md shadow-[#EC407A]/20'
                        : 'bg-[#FFE4EC]/80 text-[#5C3A4D] hover:bg-[#FFE4EC]'
                    }`}
                  >
                    {intensity}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {savedSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Check size={14} /> Saved successfully!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-6 py-2.5 rounded-full bg-[#EC407A] hover:bg-[#D81B60] text-white text-xs font-bold uppercase tracking-widest shadow-md transition transform active:scale-95"
              >
                Save Settings
              </button>
            </div>
          </form>
      </div>

      {/* Supabase Full-Stack Vercel Setup Section */}
      <div className="max-w-2xl mx-auto bg-white/60 backdrop-blur-md border border-white/80 p-6 sm:p-8 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#FFE4EC] pb-3">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-[#EC407A]" />
            <h2 className="font-serif text-lg font-bold text-[#5C3A4D]">
              Supabase Full-Stack Database (Vercel)
            </h2>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              isSupabaseConfigured()
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isSupabaseConfigured() ? (
              <>
                <CheckCircle2 size={13} /> Connected to Supabase
              </>
            ) : (
              'Using Local Storage Fallback'
            )}
          </span>
        </div>

        <p className="text-xs text-[#5C3A4D]/80 leading-relaxed">
          Aplikasi ini telah siap untuk dikoneksikan ke <strong>Supabase</strong> agar seluruh data (Gallery, Music, Stories, Letters, Notes, Calendar, Settings) dan file upload tersimpan permanen saat dihosting di <strong>Vercel</strong>.
        </p>

        <div className="bg-[#5C3A4D]/5 p-4 rounded-2xl space-y-3 border border-[#FFE4EC]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5C3A4D]">SQL Schema Editor Script</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                alert('Supabase SQL Schema berhasil disalin!');
              }}
              className="px-3 py-1 bg-white text-[#EC407A] border border-[#EC407A]/30 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-[#FFE4EC] transition"
            >
              <Copy size={12} /> Copy SQL Script
            </button>
          </div>
          <pre className="text-[10px] bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto max-h-40 font-mono">
            {SUPABASE_SQL_SCHEMA.trim()}
          </pre>
          <div className="text-[11px] text-[#5C3A4D]/70 space-y-1">
            <p><strong>Langkah Setup Supabase di Vercel:</strong></p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Buat proyek baru di <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-medium text-[#EC407A]">Supabase.com</a>.</li>
              <li>Buka <strong>SQL Editor</strong> di dashboard Supabase, tempel skrip di atas, lalu jalankan (Run).</li>
              <li>Buka <strong>Settings &gt; API</strong> di Supabase, lalu salin <strong>URL</strong> dan <strong>anon public key</strong>.</li>
              <li>Di Vercel (Project Settings &gt; Environment Variables), tambahkan:
                <ul className="list-disc list-inside ml-3 font-mono text-[10px] text-[#EC407A]">
                  <li>VITE_SUPABASE_URL=...</li>
                  <li>VITE_SUPABASE_ANON_KEY=...</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
