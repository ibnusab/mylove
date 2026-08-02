import React, { useEffect, useState } from 'react';
import { LoveLetter } from '../types';
import { fetchWithFallback, getLocalData, setLocalData } from '../lib/storage';
import { isSupabaseConfigured, getSupabaseClient } from '../lib/supabase';
import {
  Mail,
  Heart,
  Plus,
  Sparkles,
  Flame,
  Trash2,
  X,
  Edit2,
  Copy,
  Check,
  RotateCcw,
  Send,
  Feather,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY_LETTERS = 'sabrianisa_letters';

const defaultLetters: LoveLetter[] = [
  {
    id: 1,
    title: 'Surat Cinta Pertama Untuk Anisa',
    date: '2026-08-01',
    content: `Untuk Kamu yang Paling Ku Sayang,

Setiap hari bersamamu adalah hadiah terindah yang pernah Tuhan berikan dalam hidupku. Senyumanmu selalu berhasil menghangatkan hariku, dan hadirmu membuat segala hal menjadi jauh lebih bermakna.

Terima kasih telah menjadi bagian dari perjalanan ini, mengisi hari-hariku dengan tawa, kasih sayang, dan kehangatan yang tak terhingga. Aku berjanji akan selalu menggenggam tanganmu, melewati setiap suka dan duka bersama.

Dengan seluruh cintaku,
Rian ❤️`,
    is_opened: 1,
    is_archived: 0,
  },
  {
    id: 2,
    title: 'Janji Setia & Masa Depan Kita',
    date: '2026-02-14',
    content: `Sayangku Anisa,

Melihat ke belakang pada semua momen indah yang telah kita lewati—dari kencan pertama kita, tawa lepas di malam hari, hingga mimpi-mimpi besar yang kita susun bersama—aku semakin yakin bahwa kamu adalah takdir terbaikku.

Semoga cinta kita selalu bertumbuh lebih kuat dari hari kemarin. Aku mencintaimu, hari ini, esok, dan selamanya.

Selamanya Milikmu,
Rian 💖`,
    is_opened: 0,
    is_archived: 0,
  },
];

export const LoveLetterPage: React.FC = () => {
  const [letters, setLetters] = useState<LoveLetter[]>(() => {
    const local = getLocalData<LoveLetter[]>(STORAGE_KEY_LETTERS, []);
    return local.length > 0 ? local : defaultLetters;
  });
  const [activeLetter, setActiveLetter] = useState<LoveLetter | null>(null);
  const [isOpenAnimation, setIsOpenAnimation] = useState(false);
  const [isFlapOpen, setIsFlapOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<LoveLetter | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHeartsEffect, setShowHeartsEffect] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchLetters = () => {
    fetchWithFallback<LoveLetter[]>('/api/letters', STORAGE_KEY_LETTERS, defaultLetters, 'letters')
      .then((data) => {
        const finalData = data.length > 0 ? data : defaultLetters;
        setLetters(finalData);
        if (finalData.length > 0 && !activeLetter) {
          setActiveLetter(finalData[0]);
        }
      })
      .catch((err) => {
        console.error(err);
        if (letters.length === 0) {
          setLetters(defaultLetters);
          setActiveLetter(defaultLetters[0]);
        }
      });
  };

  useEffect(() => {
    fetchLetters();
  }, []);

  useEffect(() => {
    if (letters.length > 0 && !activeLetter) {
      setActiveLetter(letters[0]);
    }
  }, [letters]);

  const saveLetters = (newLetters: LoveLetter[]) => {
    setLetters(newLetters);
    setLocalData(STORAGE_KEY_LETTERS, newLetters);
  };

  const openWriteModal = () => {
    setEditingLetter(null);
    setTitle('');
    setContent('');
    setDate(new Date().toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const openEditModal = (letItem: LoveLetter) => {
    setEditingLetter(letItem);
    setTitle(letItem.title);
    setContent(letItem.content);
    setDate(letItem.date || new Date().toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleOpenEnvelope = () => {
    setIsFlapOpen(true);
    setShowHeartsEffect(true);
    setTimeout(() => {
      setShowHeartsEffect(false);
    }, 2000);

    setTimeout(() => {
      setIsOpenAnimation(true);
    }, 350);

    if (activeLetter && !activeLetter.is_opened) {
      const updatedLetter = { ...activeLetter, is_opened: 1 };
      const updatedList = letters.map((l) => (l.id === activeLetter.id ? updatedLetter : l));
      saveLetters(updatedList);
      setActiveLetter(updatedLetter);

      const client = getSupabaseClient();
      if (isSupabaseConfigured() && client) {
        try {
          client.from('letters').update({ is_opened: 1 }).eq('id', activeLetter.id);
        } catch (err) {
          console.warn('Supabase open letter error:', err);
        }
      }

      try {
        fetch(`/api/letters/${activeLetter.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedLetter),
        });
      } catch {
        // ignore
      }
    }
  };

  const handleResealEnvelope = () => {
    setIsOpenAnimation(false);
    setTimeout(() => {
      setIsFlapOpen(false);
    }, 150);
  };

  const handleSaveLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLetter) {
      const updatedLetter = { ...editingLetter, title, content, date };
      const updatedList = letters.map((l) => (l.id === editingLetter.id ? updatedLetter : l));
      saveLetters(updatedList);
      setActiveLetter(updatedLetter);

      const client = getSupabaseClient();
      if (isSupabaseConfigured() && client) {
        try {
          const { error } = await client.from('letters').update({ title, content, date }).eq('id', editingLetter.id);
          if (error) console.error('Supabase update letter error:', error.message, error);
        } catch (err) {
          console.warn('Supabase update letter exception:', err);
        }
      }

      try {
        await fetch(`/api/letters/${editingLetter.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedLetter),
        });
      } catch {
        // ignore
      }
    } else {
      const newLetter: LoveLetter = {
        id: Date.now(),
        title,
        content,
        date,
        is_opened: 1,
        is_archived: 0,
      };
      const updatedList = [newLetter, ...letters];
      saveLetters(updatedList);
      setActiveLetter(newLetter);
      setIsFlapOpen(true);
      setIsOpenAnimation(true);

      const client = getSupabaseClient();
      if (isSupabaseConfigured() && client) {
        try {
          const { data, error } = await client
            .from('letters')
            .insert([
              {
                title,
                content,
                date,
                is_opened: 1,
              },
            ])
            .select();

          if (error) {
            console.error('Supabase insert letter error:', error.message, error);
          } else if (data && data[0]) {
            const inserted = data[0] as unknown as LoveLetter;
            const synced = [inserted, ...letters.filter((l) => l.id !== newLetter.id)];
            saveLetters(synced);
            setActiveLetter(inserted);
          }
        } catch (err) {
          console.warn('Supabase insert letter exception:', err);
        }
      }

      try {
        await fetch('/api/letters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, date }),
        });
      } catch {
        // ignore
      }
    }

    setIsModalOpen(false);
    setEditingLetter(null);
    setTitle('');
    setContent('');
  };

  const handleDeleteLetter = async (id: number) => {
    const updatedList = letters.filter((l) => l.id !== id);
    saveLetters(updatedList);
    if (activeLetter?.id === id) {
      setActiveLetter(updatedList[0] || null);
      setIsOpenAnimation(false);
      setIsFlapOpen(false);
    }

    const client = getSupabaseClient();
    if (isSupabaseConfigured() && client) {
      try {
        const { error } = await client.from('letters').delete().eq('id', id);
        if (error) console.error('Supabase delete letter error:', error.message, error);
      } catch (err) {
        console.warn('Supabase delete letter exception:', err);
      }
    }

    try {
      await fetch(`/api/letters/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
  };

  const handleCopyText = () => {
    if (!activeLetter) return;
    navigator.clipboard.writeText(`${activeLetter.title}\n\n${activeLetter.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFE4EC] text-[#EC407A] text-xs font-bold uppercase tracking-wider shadow-sm border border-pink-200">
          <Feather size={14} className="text-[#EC407A]" />
          <span>Handwritten Words from the Heart</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#5C3A4D] tracking-tight">
          Surat Cinta Sabrianisa
        </h1>
        <p className="text-[#5C3A4D]/80 text-sm max-w-lg mx-auto">
          Ungkapan perasaan yang tersimpan rapi dalam amplop cinta bersegel lilin romantis.
        </p>
      </div>

      {/* Letters Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white/70 backdrop-blur-md p-3.5 rounded-3xl border border-white/90 shadow-sm gap-3">
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-w-full pb-1 sm:pb-0">
          {letters.map((letItem) => {
            const isSelected = activeLetter?.id === letItem.id;
            return (
              <button
                key={letItem.id}
                onClick={() => {
                  setActiveLetter(letItem);
                  setIsOpenAnimation(false);
                  setIsFlapOpen(false);
                }}
                className={`px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 border whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#EC407A] text-white border-[#EC407A] shadow-md shadow-[#EC407A]/25 scale-[1.02]'
                    : 'bg-[#FFE4EC]/60 text-[#5C3A4D] border-pink-100 hover:bg-[#FFE4EC]'
                }`}
              >
                <Mail size={14} className={isSelected ? 'text-white' : 'text-[#EC407A]'} />
                <span className="truncate max-w-[120px] sm:max-w-[160px]">{letItem.title}</span>
                {!letItem.is_opened && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={openWriteModal}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full bg-gradient-to-r from-[#EC407A] to-[#D81B60] hover:from-[#D81B60] hover:to-[#C2185B] text-white text-xs font-extrabold uppercase tracking-widest shadow-md hover:shadow-lg transition shrink-0"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Tulis Surat Cinta</span>
          <span className="sm:hidden text-[11px]">Tulis Surat</span>
        </button>
      </div>

      {/* ENVELOPE / LETTER CONTAINER */}
      {activeLetter ? (
        <div className="relative flex flex-col items-center justify-center py-6 min-h-[420px]">
          {/* Ambient Romantic Flame/Candle Glow */}
          <div className="absolute w-80 h-80 bg-gradient-to-tr from-[#FFE4EC]/80 to-[#F8BBD0]/60 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Floating Heart Burst Particles */}
          <AnimatePresence>
            {showHeartsEffect && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                    animate={{
                      opacity: 0,
                      scale: 1.5,
                      x: (Math.random() - 0.5) * 320,
                      y: -120 - Math.random() * 150,
                      rotate: Math.random() * 360,
                    }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="absolute text-pink-500"
                  >
                    <Heart size={20 + (i % 3) * 8} className="fill-pink-500/80 drop-shadow-sm" />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!isOpenAnimation ? (
              /* CLEAN MINIMALIST ENVELOPE DESIGN */
              <motion.div
                key="envelope-card"
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: -30 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={handleOpenEnvelope}
                className="relative w-full max-w-md cursor-pointer group select-none"
                style={{ perspective: '1000px' }}
              >
                {/* Envelope Main Box */}
                <div className="relative w-full h-[260px] sm:h-[290px] bg-gradient-to-b from-[#FFF0F5] via-[#FFE4EC] to-[#F8BBD0] rounded-3xl shadow-xl border border-pink-200 overflow-hidden flex flex-col items-center justify-center p-6 text-center transform group-hover:-translate-y-1.5 group-hover:shadow-2xl transition duration-500">
                  {/* Animated Flap Triangle with 3D perspective */}
                  <motion.div
                    animate={{
                      rotateX: isFlapOpen ? -160 : 0,
                      originY: 0,
                    }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                    className="absolute top-0 inset-x-0 h-28 bg-[#F8BBD0]/60 clip-path-triangle border-b border-pink-300/60 z-20 pointer-events-none"
                  />

                  <div className="relative z-10 flex flex-col items-center justify-center space-y-4 my-auto">
                    {/* Wax Seal Button */}
                    <motion.div
                      animate={{ scale: isFlapOpen ? 1.2 : 1 }}
                      transition={{ duration: 0.3 }}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-[#EC407A] to-[#C2185B] shadow-lg border-2 border-white flex items-center justify-center text-white group-hover:scale-110 transition duration-300"
                    >
                      <Heart size={28} className="fill-white drop-shadow-sm" />
                    </motion.div>

                    {/* Title */}
                    <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#5C3A4D] px-4 tracking-tight">
                      {activeLetter.title}
                    </h3>

                    {/* Click To Open Subtitle */}
                    <p className="text-xs font-medium text-[#EC407A]/90 tracking-wide bg-white/70 px-4 py-1 rounded-full shadow-2xs border border-pink-100 group-hover:bg-[#EC407A] group-hover:text-white transition duration-300">
                      Click to open
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* OPENED ROMANTIC STATIONERY PAPER */
              <motion.div
                key="opened-letter-paper"
                initial={{ y: 80, opacity: 0, scale: 0.88 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 70, opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.45, type: 'spring', damping: 22, stiffness: 220 }}
                className="relative w-full max-w-2xl bg-[#FFFDF9] border-2 border-pink-200/80 shadow-2xl rounded-3xl p-5 sm:p-12 font-serif text-[#5C3A4D] space-y-6 overflow-hidden"
                style={{
                  backgroundImage: 'linear-gradient(#fce4ec 1px, transparent 1px)',
                  backgroundSize: '100% 2rem',
                }}
              >
              {/* Decorative Vintage Lace Corner Watermarks */}
              <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-pink-200/50 to-transparent rounded-br-full pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-pink-200/50 to-transparent rounded-tl-full pointer-events-none" />

              {/* Letter Toolbar Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-pink-200/80 pb-3 sm:pb-4 gap-2.5 sm:gap-4 relative z-10">
                <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Flame size={18} className="text-[#EC407A] animate-pulse shrink-0" />
                    <span className="text-[11px] sm:text-xs font-sans font-extrabold text-[#EC407A] tracking-wider uppercase truncate">
                      Surat Cinta • {activeLetter.date}
                    </span>
                  </div>

                  {/* Mobile Reseal button */}
                  <button
                    onClick={handleResealEnvelope}
                    className="sm:hidden flex items-center gap-1 px-2.5 py-1 text-[11px] font-sans font-bold text-white bg-[#EC407A] hover:bg-[#D81B60] rounded-full shadow-xs transition shrink-0"
                    title="Lipat Kembali Ke Amplop"
                  >
                    <RotateCcw size={12} />
                    <span>Lipat</span>
                  </button>
                </div>

                <div className="flex items-center justify-end gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-pink-100">
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-sans font-bold text-pink-700 bg-pink-100/80 hover:bg-pink-200 rounded-full transition"
                    title="Salin Isi Surat"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span className="hidden sm:inline">{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(activeLetter)}
                    className="p-1.5 sm:p-2 text-[#EC407A] hover:bg-pink-100 rounded-full transition"
                    title="Edit Surat"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    onClick={() => handleDeleteLetter(activeLetter.id)}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition"
                    title="Hapus Surat"
                  >
                    <Trash2 size={16} />
                  </button>

                  <button
                    onClick={handleResealEnvelope}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-bold text-white bg-[#EC407A] hover:bg-[#D81B60] rounded-full shadow-xs transition ml-1"
                    title="Lipat Kembali Ke Amplop"
                  >
                    <RotateCcw size={13} />
                    <span>Lipat Amplop</span>
                  </button>
                </div>
              </div>

              {/* Letter Title */}
              <div className="relative z-10 pt-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#5C3A4D] font-serif leading-tight">
                  {activeLetter.title}
                </h2>
              </div>

              {/* Letter Body Text */}
              <div className="relative z-10 min-h-[200px]">
                <p className="text-base sm:text-lg leading-loose whitespace-pre-wrap font-serif italic text-[#4A2B3D]">
                  {activeLetter.content}
                </p>
              </div>

              {/* Letter Signature Block */}
              <div className="relative z-10 text-right pt-6 border-t-2 border-pink-200/80 flex flex-col items-end">
                <div className="flex items-center gap-1 text-xs text-[#EC407A] font-sans font-bold uppercase tracking-widest mb-1">
                  <Heart size={14} className="fill-[#EC407A]" />
                  <span>Forever & Always</span>
                </div>
                <p className="font-serif text-lg font-extrabold text-[#5C3A4D]">
                  Rian & Anisa ❤️
                </p>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-16 text-[#5C3A4D]/60 font-serif bg-white/50 rounded-3xl border border-pink-100">
          Belum ada surat cinta. Klik <span className="font-bold text-[#EC407A]">Tulis Surat Cinta</span> untuk menulis pesan pertamamu!
        </div>
      )}

      {/* ALL LETTERS GALLERY DECK */}
      <div className="space-y-4 pt-6 border-t border-pink-200/60">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-[#5C3A4D] flex items-center gap-2">
            <BookOpen size={20} className="text-[#EC407A]" />
            <span>Koleksi Surat Cinta ({letters.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {letters.map((letItem) => (
            <div
              key={letItem.id}
              onClick={() => {
                setActiveLetter(letItem);
                setIsOpenAnimation(false);
                setIsFlapOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                activeLetter?.id === letItem.id
                  ? 'bg-gradient-to-br from-[#FFE4EC] to-white border-[#EC407A] shadow-md ring-2 ring-[#EC407A]/30'
                  : 'bg-white/80 hover:bg-[#FFE4EC]/40 border-pink-100 hover:border-pink-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-[#EC407A] uppercase tracking-wider bg-pink-100 px-2 py-0.5 rounded-full">
                  {letItem.date}
                </span>
                <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm text-xs font-bold">
                  <Heart size={14} className="fill-white" />
                </div>
              </div>

              <h3 className="font-serif text-base font-bold text-[#5C3A4D] group-hover:text-[#EC407A] transition truncate">
                {letItem.title}
              </h3>

              <p className="text-xs text-[#5C3A4D]/70 line-clamp-2 mt-1 font-serif italic">
                {letItem.content}
              </p>

              <div className="mt-3 pt-2 border-t border-pink-100/80 flex items-center justify-between text-[11px] text-[#EC407A] font-bold">
                <span>{letItem.is_opened ? '✉️ Sudah Dibuka' : '💌 Tertutup'}</span>
                <span className="group-hover:translate-x-1 transition">Buka Surat &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Write / Edit Letter Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-pink-200 relative space-y-4"
            >
              <div className="flex items-center justify-between border-b border-pink-100 pb-3">
                <div className="flex items-center gap-2">
                  <Feather className="text-[#EC407A]" size={20} />
                  <h3 className="font-serif text-lg font-bold text-[#5C3A4D]">
                    {editingLetter ? 'Edit Surat Cinta' : 'Tulis Surat Cinta Baru'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-pink-100 rounded-full text-pink-500 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveLetter} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#5C3A4D] mb-1">
                    Judul Surat / Penerima
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Untuk Anisa Sayang / Surat Cinta Ke-10"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EC407A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5C3A4D] mb-1">
                    Tanggal Surat
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EC407A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5C3A4D] mb-1">
                    Isi Pesan Cinta
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Tuliskan kata-kata indah dan penuh kasih untuknya..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EC407A] font-serif leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-[#5C3A4D] bg-[#FFE4EC] hover:bg-[#F8BBD0] transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest text-white bg-gradient-to-r from-[#EC407A] to-[#D81B60] hover:from-[#D81B60] hover:to-[#C2185B] shadow-md transition"
                  >
                    <Send size={13} />
                    <span>Segel Surat & Simpan</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

