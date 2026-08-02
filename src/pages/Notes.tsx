import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { LoveNote } from '../types';
import { fetchWithFallback, getLocalData, setLocalData } from '../lib/storage';
import { isSupabaseConfigured, getSupabaseClient } from '../lib/supabase';
import {
  MessageSquareHeart,
  Pin,
  Send,
  Trash2,
  Heart,
  Sparkles,
  Smile,
  Edit2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY_NOTES = 'sabrianisa_notes';

const defaultNotes: LoveNote[] = [];

export const Notes: React.FC = () => {
  const { settings } = useApp();
  const [notes, setNotes] = useState<LoveNote[]>(() =>
    getLocalData(STORAGE_KEY_NOTES, [])
  );
  const [editingNote, setEditingNote] = useState<LoveNote | null>(null);
  const [sender, setSender] = useState(settings.partner1_name || 'Sabri');
  const [receiver, setReceiver] = useState(settings.partner2_name || 'Anisa');
  const [message, setMessage] = useState('');
  const [emoji, setEmoji] = useState('❤️');

  const fetchNotes = () => {
    fetchWithFallback<LoveNote[]>('/api/notes', STORAGE_KEY_NOTES, [], 'notes')
      .then((data) => setNotes(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const saveNotes = (newNotes: LoveNote[]) => {
    setNotes(newNotes);
    setLocalData(STORAGE_KEY_NOTES, newNotes);
  };

  const openEdit = (n: LoveNote) => {
    setEditingNote(n);
    setSender(n.sender);
    setReceiver(n.receiver);
    setMessage(n.message);
    setEmoji(n.emoji || '❤️');
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setMessage('');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (editingNote) {
      const updatedNote = {
        ...editingNote,
        sender,
        receiver,
        message,
        emoji,
      };
      const updatedList = notes.map((n) => (n.id === editingNote.id ? updatedNote : n));
      saveNotes(updatedList);

      const client = getSupabaseClient();
      if (isSupabaseConfigured() && client) {
        try {
          const { error } = await client.from('notes').update({
            sender,
            receiver,
            message,
            emoji,
            is_pinned: editingNote.is_pinned,
          }).eq('id', editingNote.id);
          if (error) console.error('Supabase update note error:', error.message, error);
        } catch (err) {
          console.warn('Supabase update note exception:', err);
        }
      }

      try {
        await fetch(`/api/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender,
            receiver,
            message,
            emoji,
            is_pinned: editingNote.is_pinned,
          }),
        });
      } catch {
        // ignore
      }
    } else {
      const newNote: LoveNote = {
        id: Date.now(),
        sender,
        receiver,
        message,
        emoji,
        created_at: new Date().toISOString(),
        is_pinned: 0,
      };
      const updatedList = [newNote, ...notes];
      saveNotes(updatedList);

      const client = getSupabaseClient();
      if (isSupabaseConfigured() && client) {
        try {
          const { data, error } = await client.from('notes').insert([{
            sender,
            receiver,
            message,
            emoji,
            is_pinned: 0,
          }]).select();

          if (error) {
            console.error('Supabase insert note error:', error.message, error);
          } else if (data && data[0]) {
            const inserted = data[0] as unknown as LoveNote;
            const synced = [inserted, ...notes.filter((n) => n.id !== newNote.id)];
            saveNotes(synced);
          }
        } catch (err) {
          console.warn('Supabase insert note exception:', err);
        }
      }

      try {
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender,
            receiver,
            message,
            emoji,
            is_pinned: 0,
          }),
        });
      } catch {
        // ignore
      }
    }

    setEditingNote(null);
    setMessage('');
  };

  const togglePin = async (id: number) => {
    const noteToPin = notes.find((n) => n.id === id);
    const newPin = noteToPin ? (noteToPin.is_pinned === 1 ? 0 : 1) : 1;
    const updatedList = notes.map((n) =>
      n.id === id ? { ...n, is_pinned: newPin } : n
    );
    saveNotes(updatedList);

    const client = getSupabaseClient();
    if (isSupabaseConfigured() && client) {
      try {
        const { error } = await client.from('notes').update({ is_pinned: newPin }).eq('id', id);
        if (error) console.error('Supabase toggle pin note error:', error.message, error);
      } catch (err) {
        console.warn('Supabase toggle pin note exception:', err);
      }
    }

    try {
      await fetch(`/api/notes/${id}/pin`, { method: 'POST' });
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: number) => {
    const updatedList = notes.filter((n) => n.id !== id);
    saveNotes(updatedList);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('notes').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete note error:', err);
      }
    }

    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
  };

  const emojis = ['❤️', '💖', '🥰', '🌹', '🍓', '☕', '✨', '🌸', '💌'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFE4EC] text-[#EC407A] text-xs font-bold uppercase tracking-wider">
          <Sparkles size={14} />
          <span>Whispers of Love</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#5C3A4D]">
          Private Love Notes
        </h1>
        <p className="text-[#5C3A4D]/80 text-sm max-w-lg mx-auto">
          Leave little sweet notes, gentle reminders, and cute heart messages for each other.
        </p>
      </div>

      {/* Note Composer Card */}
      <div className="bg-white/60 backdrop-blur-md border border-white/80 p-6 rounded-3xl shadow-sm space-y-4">
        <form onSubmit={handleSend} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-[#5C3A4D]">
            <div className="flex items-center gap-2">
              <span>From:</span>
              <select
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="bg-[#FFE4EC] border border-[#F8BBD0] rounded-lg px-2.5 py-1 text-[#5C3A4D] focus:outline-none"
              >
                <option value={settings.partner1_name}>{settings.partner1_name}</option>
                <option value={settings.partner2_name}>{settings.partner2_name}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>To:</span>
              <select
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className="bg-[#FFE4EC] border border-[#F8BBD0] rounded-lg px-2.5 py-1 text-[#5C3A4D] focus:outline-none"
              >
                <option value={settings.partner2_name}>{settings.partner2_name}</option>
                <option value={settings.partner1_name}>{settings.partner1_name}</option>
              </select>
            </div>

            {/* Emoji Selector */}
            <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-w-full py-0.5">
              {emojis.map((em) => (
                <button
                  type="button"
                  key={em}
                  onClick={() => setEmoji(em)}
                  className={`p-1 rounded-lg text-sm shrink-0 transition ${
                    emoji === em ? 'bg-[#FFE4EC] scale-125' : 'hover:bg-[#FFE4EC]/50'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write something sweet and romantic..."
              className="w-full px-4 py-3 rounded-2xl border border-[#F8BBD0]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#EC407A] bg-white/50 text-[#5C3A4D]"
            />
            <div className="flex items-center justify-between mt-2">
              {editingNote ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#FFE4EC] text-[#EC407A] text-xs font-bold transition"
                >
                  <X size={14} />
                  <span>Cancel Edit</span>
                </button>
              ) : <div />}
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#EC407A] hover:bg-[#D81B60] text-white text-xs font-bold uppercase tracking-widest shadow-md transition transform active:scale-95"
              >
                <Send size={14} />
                <span>{editingNote ? 'Update Note' : 'Send Note'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Notes Wall Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map((note) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-5 rounded-3xl border transition relative shadow-sm hover:shadow-md ${
              note.is_pinned
                ? 'bg-gradient-to-tr from-[#FFE4EC] to-[#F8BBD0]/40 border-[#EC407A]/40 ring-2 ring-[#EC407A]/30'
                : 'bg-white/60 backdrop-blur-md border-white/80'
            }`}
          >
            {note.is_pinned === 1 && (
              <div className="absolute top-3 right-3 text-[#EC407A]">
                <Pin size={16} className="fill-[#EC407A]" />
              </div>
            )}

            <div className="flex items-center gap-2 text-xs font-bold text-[#5C3A4D] mb-2">
              <span className="text-lg">{note.emoji}</span>
              <span>{note.sender}</span>
              <span className="text-[#EC407A] font-normal">to</span>
              <span>{note.receiver}</span>
            </div>

            <p className="text-sm text-[#5C3A4D] font-serif leading-relaxed mb-4 whitespace-pre-wrap">
              {note.message}
            </p>

            <div className="flex items-center justify-between text-[11px] text-[#5C3A4D]/60 border-t border-[#F8BBD0]/30 pt-2">
              <span>{note.created_at ? note.created_at.slice(0, 10) : 'Just now'}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(note)}
                  className="p-1 text-[#EC407A] hover:bg-[#FFE4EC] rounded-full transition"
                  title="Edit Note"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => togglePin(note.id)}
                  className="p-1 hover:text-[#EC407A] transition"
                  title="Pin Note"
                >
                  <Pin size={14} className={note.is_pinned ? 'fill-[#EC407A] text-[#EC407A]' : ''} />
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="p-1 hover:text-rose-600 transition"
                  title="Delete Note"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
