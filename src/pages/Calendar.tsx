import React, { useEffect, useState } from 'react';
import { CalendarMemory, GalleryItem, TimelineEvent } from '../types';
import { fetchWithFallback, getLocalData, setLocalData, uploadFileWithFallback } from '../lib/storage';
import { isSupabaseConfigured, getSupabaseClient } from '../lib/supabase';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Heart,
  Trash2,
  X,
  Sparkles,
  Edit2,
  Film,
  Image as ImageIcon,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
} from 'date-fns';

const STORAGE_KEY_CALENDAR = 'sabrianisa_calendar';
const STORAGE_KEY_GALLERY = 'sabrianisa_gallery';
const STORAGE_KEY_STORIES = 'sabrianisa_stories';

const normalizeDateStr = (rawStr?: string) => {
  if (!rawStr) return '';
  const trimmed = rawStr.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [dd, mm, yyyy] = trimmed.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  return trimmed.slice(0, 10);
};

const isSameDateStr = (d1?: string, d2?: string) => {
  if (!d1 || !d2) return false;
  return normalizeDateStr(d1) === normalizeDateStr(d2);
};

export const MemoryCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [memories, setMemories] = useState<CalendarMemory[]>(() =>
    getLocalData(STORAGE_KEY_CALENDAR, [])
  );
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() =>
    getLocalData(STORAGE_KEY_GALLERY, [])
  );
  const [storyEvents, setStoryEvents] = useState<TimelineEvent[]>(() =>
    getLocalData(STORAGE_KEY_STORIES, [])
  );

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<CalendarMemory | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [eventType, setEventType] = useState('memory');

  const fetchAllData = () => {
    fetchWithFallback<CalendarMemory[]>('/api/calendar', STORAGE_KEY_CALENDAR, [], 'calendar')
      .then((data) => setMemories(data))
      .catch((err) => console.error(err));

    fetchWithFallback<GalleryItem[]>('/api/gallery', STORAGE_KEY_GALLERY, [], 'gallery')
      .then((data) => setGalleryItems(data))
      .catch((err) => console.error(err));

    fetchWithFallback<TimelineEvent[]>('/api/story', STORAGE_KEY_STORIES, [], 'story')
      .then((data) => setStoryEvents(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const saveMemories = (newMemories: CalendarMemory[]) => {
    setMemories(newMemories);
    setLocalData(STORAGE_KEY_CALENDAR, newMemories);
  };

  const openAddModal = () => {
    setEditingMemory(null);
    setTitle('');
    setNote('');
    setMediaUrl('');
    setEventType('memory');
    setIsAddModalOpen(true);
  };

  const openEditModal = (mem: CalendarMemory) => {
    setEditingMemory(mem);
    setTitle(mem.title);
    setNote(mem.note || '');
    setMediaUrl(mem.media_url || '');
    setEventType(mem.event_type || 'memory');
    setIsAddModalOpen(true);
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const payload = {
      date: dateStr,
      title,
      note,
      media_url: mediaUrl,
      event_type: eventType,
    };

    if (editingMemory) {
      const updatedList = memories.map((m) => (m.id === editingMemory.id ? { ...m, ...payload } : m));
      saveMemories(updatedList);

      const client = getSupabaseClient();
      if (isSupabaseConfigured() && client) {
        try {
          const { error } = await client.from('calendar').update(payload).eq('id', editingMemory.id);
          if (error) console.error('Supabase update calendar error:', error.message, error);
        } catch (err) {
          console.warn('Supabase update calendar exception:', err);
        }
      }

      try {
        await fetch(`/api/calendar/${editingMemory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        // ignore
      }
    } else {
      const newMem: CalendarMemory = { id: Date.now(), ...payload };
      const updatedList = [newMem, ...memories];
      saveMemories(updatedList);

      const client = getSupabaseClient();
      if (isSupabaseConfigured() && client) {
        try {
          const { data, error } = await client.from('calendar').insert([payload]).select();
          if (error) {
            console.error('Supabase insert calendar error:', error.message, error);
          } else if (data && data[0]) {
            const inserted = data[0] as unknown as CalendarMemory;
            const synced = [inserted, ...memories.filter((m) => m.id !== newMem.id)];
            saveMemories(synced);
          }
        } catch (err) {
          console.warn('Supabase insert calendar exception:', err);
        }
      }

      try {
        await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        // ignore
      }
    }

    setIsAddModalOpen(false);
    setEditingMemory(null);
    setTitle('');
    setNote('');
    setMediaUrl('');
  };

  const handleDeleteMemory = async (id: number) => {
    const updatedList = memories.filter((m) => m.id !== id);
    saveMemories(updatedList);

    const client = getSupabaseClient();
    if (isSupabaseConfigured() && client) {
      try {
        const { error } = await client.from('calendar').delete().eq('id', id);
        if (error) console.error('Supabase delete calendar error:', error.message, error);
      } catch (err) {
        console.warn('Supabase delete calendar exception:', err);
      }
    }

    try {
      await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
  };

  // Calendar dates generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedMemories = memories.filter((m) => isSameDateStr(m.date, selectedDateStr));
  const selectedGallery = galleryItems.filter((g) => isSameDateStr(g.date, selectedDateStr));
  const selectedStories = storyEvents.filter((s) => isSameDateStr(s.date, selectedDateStr));
  const totalItemsOnDate = selectedMemories.length + selectedGallery.length + selectedStories.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFE4EC] text-[#EC407A] text-xs font-bold uppercase tracking-wider">
          <Sparkles size={14} />
          <span>Our Days &amp; Moments</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#5C3A4D]">
          Memory Calendar
        </h1>
        <p className="text-[#5C3A4D]/80 text-sm max-w-lg mx-auto">
          Click on any day to revisit sweet notes, gallery photos, videos, and story milestones.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Grid */}
        <div className="lg:col-span-7 bg-white/60 backdrop-blur-md border border-white/80 p-6 rounded-3xl shadow-sm space-y-4">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-[#5C3A4D]">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-[#FFE4EC] rounded-full text-[#EC407A] transition"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-[#FFE4EC] rounded-full text-[#EC407A] transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#5C3A4D]/80 py-2 border-b border-[#FFE4EC]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const hasMemory = memories.some((m) => isSameDateStr(m.date, dayStr));
              const hasGallery = galleryItems.some((g) => isSameDateStr(g.date, dayStr));
              const hasStory = storyEvents.some((s) => isSameDateStr(s.date, dayStr));
              const hasActivity = hasMemory || hasGallery || hasStory;

              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDate(day)}
                  className={`h-11 sm:h-12 rounded-2xl flex flex-col items-center justify-center relative transition text-xs font-semibold ${
                    !isCurrentMonth
                      ? 'text-[#5C3A4D]/30'
                      : isSelected
                      ? 'bg-[#EC407A] text-white shadow-md shadow-[#EC407A]/20'
                      : 'hover:bg-[#FFE4EC] text-[#5C3A4D]'
                  }`}
                >
                  <span>{format(day, 'd')}</span>
                  {hasActivity && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-[#EC407A]'
                        }`}
                      />
                      {hasGallery && (
                        <span
                          className={`w-1 h-1 rounded-full ${
                            isSelected ? 'bg-pink-200' : 'bg-purple-500'
                          }`}
                        />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Memories Panel */}
        <div className="lg:col-span-5 bg-white/60 backdrop-blur-md border border-white/80 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#FFE4EC] pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#5C3A4D]">
                {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              <p className="text-xs text-[#EC407A] font-medium">
                {totalItemsOnDate} {totalItemsOnDate === 1 ? 'item' : 'items'} recorded for this date
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-[#EC407A] hover:bg-[#D81B60] text-white text-xs font-bold uppercase tracking-widest shadow-md transition shrink-0"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add Memory</span>
              <span className="sm:hidden text-[11px]">Tambah</span>
            </button>
          </div>

          <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
            {/* Story Chapters on this date */}
            {selectedStories.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#EC407A] flex items-center gap-1">
                  <BookOpen size={12} />
                  <span>Story Chapter ({selectedStories.length})</span>
                </span>
                {selectedStories.map((st) => (
                  <div
                    key={st.id}
                    className="bg-white/90 border border-pink-200 p-3.5 rounded-2xl space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#5C3A4D]">{st.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-pink-100 text-[#EC407A] text-[9px] font-extrabold">
                        {st.category || 'Story'}
                      </span>
                    </div>
                    {st.description && (
                      <p className="text-xs text-[#5C3A4D]/80 line-clamp-2">{st.description}</p>
                    )}
                    {st.photo_url && (
                      <img
                        src={st.photo_url}
                        alt={st.title}
                        className="w-full h-28 object-cover rounded-xl mt-1"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Gallery Photos & Videos on this date */}
            {selectedGallery.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 flex items-center gap-1">
                  <ImageIcon size={12} />
                  <span>Gallery Media ({selectedGallery.length})</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {selectedGallery.map((gal) => (
                    <div
                      key={gal.id}
                      className="relative rounded-xl overflow-hidden border border-purple-100 bg-black/5 group"
                    >
                      {gal.type === 'video' ? (
                        <video
                          src={gal.url}
                          controls
                          className="w-full h-28 object-cover rounded-xl bg-black"
                        />
                      ) : (
                        <img
                          src={gal.url}
                          alt={gal.caption || 'Gallery photo'}
                          className="w-full h-28 object-cover rounded-xl"
                        />
                      )}
                      {gal.caption && (
                        <div className="p-1.5 text-[10px] text-[#5C3A4D] font-medium truncate bg-white/90">
                          {gal.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar Memories on this date */}
            {selectedMemories.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5C3A4D] flex items-center gap-1">
                  <Heart size={12} className="text-[#EC407A]" />
                  <span>Calendar Notes ({selectedMemories.length})</span>
                </span>
                {selectedMemories.map((mem) => (
                  <div
                    key={mem.id}
                    className="bg-[#FFE4EC]/50 border border-[#F8BBD0]/50 p-4 rounded-2xl space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#5C3A4D]">{mem.title}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(mem)}
                          className="p-1 text-[#EC407A] hover:bg-[#FFE4EC] rounded-full transition"
                          title="Edit Memory"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteMemory(mem.id)}
                          className="p-1 text-[#5C3A4D]/40 hover:text-rose-600 transition"
                          title="Delete Memory"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {mem.note && <p className="text-xs text-[#5C3A4D]/80">{mem.note}</p>}
                    {mem.media_url && (
                      <img
                        src={mem.media_url}
                        alt={mem.title}
                        className="w-full h-32 object-cover rounded-xl"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {totalItemsOnDate === 0 && (
              <div className="text-center py-12 text-xs text-[#5C3A4D]/50 italic">
                No memories or media logged for this date yet.
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Add Memory Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-100 relative space-y-4"
            >
              <div className="flex items-center justify-between border-b border-pink-100 pb-3">
                <h3 className="font-serif text-lg font-bold text-pink-950">
                  {editingMemory ? 'Edit Memory' : 'Add Memory'} for {format(selectedDate, 'MMM d, yyyy')}
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 hover:bg-pink-100 rounded-full text-pink-500"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveMemory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-pink-900 mb-1">
                    Memory Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Surprise flowers"
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pink-900 mb-1">
                    Note / Journal
                  </label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Write a little story..."
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pink-900 mb-1">
                    Photo / Media (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFE4EC] hover:bg-[#F8BBD0] text-[#EC407A] text-xs font-bold transition">
                      <Plus size={14} />
                      <span>{mediaUrl ? 'Photo Selected ✓' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await uploadFileWithFallback(file, '/api/upload/photos');
                            if (url) setMediaUrl(url);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {mediaUrl && (
                      <span className="text-xs text-[#EC407A] truncate max-w-[180px]">
                        {mediaUrl}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-[#5C3A4D] bg-[#FFE4EC] hover:bg-[#F8BBD0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest text-white bg-[#EC407A] hover:bg-[#D81B60] shadow-md"
                  >
                    Save Memory
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
