import React, { useEffect, useState } from "react";
import { TimelineEvent, GalleryItem, CalendarMemory } from "../types";
import {
  fetchWithFallback,
  getLocalData,
  setLocalData,
  uploadFileWithFallback,
} from "../lib/storage";
import { isSupabaseConfigured, getSupabaseClient } from "../lib/supabase";
import {
  Plus,
  Heart,
  MapPin,
  Calendar as CalendarIcon,
  Trash2,
  Edit2,
  Sparkles,
  Filter,
  X,
  ArrowUpDown,
  Film,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const STORAGE_KEY_STORIES = "sabrianisa_stories";
const STORAGE_KEY_GALLERY = "sabrianisa_gallery";
const STORAGE_KEY_CALENDAR = "sabrianisa_calendar";

interface TimelineDisplayItem {
  key: string;
  id: number;
  source: "story" | "gallery" | "calendar";
  title: string;
  date: string;
  description: string;
  category: string;
  location?: string;
  mediaUrl?: string;
  mediaType: "photo" | "video";
  favorite?: number;
  originalStory?: TimelineEvent;
  originalGallery?: GalleryItem;
  originalCalendar?: CalendarMemory;
}

export const Story: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>(() =>
    getLocalData(STORAGE_KEY_STORIES, []),
  );
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() =>
    getLocalData(STORAGE_KEY_GALLERY, []),
  );
  const [calendarMemories, setCalendarMemories] = useState<CalendarMemory[]>(
    () => getLocalData(STORAGE_KEY_CALENDAR, []),
  );

  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);

  // Form states for Story Chapter
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("First Meeting");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [location, setLocation] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [favorite, setFavorite] = useState(false);

  const fetchAllData = () => {
    fetchWithFallback<TimelineEvent[]>(
      "/api/story",
      STORAGE_KEY_STORIES,
      [],
      "story",
    )
      .then((data) => setEvents(data))
      .catch((err) => console.error(err));

    fetchWithFallback<GalleryItem[]>(
      "/api/gallery",
      STORAGE_KEY_GALLERY,
      [],
      "gallery",
    )
      .then((data) => setGalleryItems(data))
      .catch((err) => console.error(err));

    fetchWithFallback<CalendarMemory[]>(
      "/api/calendar",
      STORAGE_KEY_CALENDAR,
      [],
      "calendar",
    )
      .then((data) => setCalendarMemories(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const saveEvents = (newEvents: TimelineEvent[]) => {
    setEvents(newEvents);
    setLocalData(STORAGE_KEY_STORIES, newEvents);
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setTitle("");
    setDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setCategory("First Meeting");
    setCustomCategory("");
    setIsCustom(false);
    setLocation("");
    setPhotoUrl("");
    setFavorite(false);
    setIsModalOpen(true);
  };

  const openEditModal = (ev: TimelineEvent) => {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDate(ev.date);
    setDescription(ev.description || "");
    const currentCat = ev.category || "First Meeting";
    setCategory(currentCat);
    setCustomCategory(currentCat);
    setIsCustom(
      !defaultCategories.includes(currentCat) &&
        !dynamicCategories.includes(currentCat),
    );
    setLocation(ev.location || "");
    setPhotoUrl(ev.photo_url || "");
    setFavorite(ev.favorite === 1);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory =
      isCustom && customCategory.trim()
        ? customCategory.trim()
        : category === "CUSTOM_OPTION" && customCategory.trim()
          ? customCategory.trim()
          : category;

    const payload = {
      title,
      date,
      description,
      category: finalCategory || "Memory",
      location,
      photo_url: photoUrl,
      favorite: favorite ? 1 : 0,
    };

    if (editingEvent) {
      const updated = events.map((ev) =>
        ev.id === editingEvent.id ? { ...ev, ...payload } : ev,
      );
      saveEvents(updated);

      const client = getSupabaseClient();
      if (isSupabaseConfigured() && client) {
        try {
          const { error } = await client
            .from("story")
            .update(payload)
            .eq("id", editingEvent.id);
          if (error)
            console.error("Supabase update story error:", error.message, error);
        } catch (err) {
          console.warn("Supabase update story exception:", err);
        }
      }

      try {
        await fetch(`/api/story/${editingEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // ignore
      }
    } else {
      const newEv: TimelineEvent = { id: Date.now(), ...payload };
      const updated = [newEv, ...events];
      saveEvents(updated);

      const client = getSupabaseClient();
      if (isSupabaseConfigured() && client) {
        try {
          const { data, error } = await client
            .from("story")
            .insert([payload])
            .select();
          if (error) {
            console.error("Supabase insert story error:", error.message, error);
          } else if (data && data[0]) {
            const inserted = data[0] as unknown as TimelineEvent;
            const synced = [
              inserted,
              ...events.filter((e) => e.id !== newEv.id),
            ];
            saveEvents(synced);
          }
        } catch (err) {
          console.warn("Supabase insert story exception:", err);
        }
      }

      try {
        await fetch("/api/story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // ignore
      }
    }
    setIsModalOpen(false);
  };

  const handleDeleteStory = async (id: number) => {
    const updated = events.filter((ev) => ev.id !== id);
    saveEvents(updated);

    const client = getSupabaseClient();
    if (isSupabaseConfigured() && client) {
      try {
        await client.from("story").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete story error:", err);
      }
    }
    try {
      await fetch(`/api/story/${id}`, { method: "DELETE" });
    } catch {}
  };

  const handleDeleteGallery = async (id: number) => {
    const updated = galleryItems.filter((g) => g.id !== id);
    setGalleryItems(updated);
    setLocalData(STORAGE_KEY_GALLERY, updated);

    const client = getSupabaseClient();
    if (isSupabaseConfigured() && client) {
      try {
        await client.from("gallery").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete gallery error:", err);
      }
    }
    try {
      await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    } catch {}
  };

  const handleDeleteCalendar = async (id: number) => {
    const updated = calendarMemories.filter((c) => c.id !== id);
    setCalendarMemories(updated);
    setLocalData(STORAGE_KEY_CALENDAR, updated);

    const client = getSupabaseClient();
    if (isSupabaseConfigured() && client) {
      try {
        await client.from("calendar").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete calendar error:", err);
      }
    }
    try {
      await fetch(`/api/calendar/${id}`, { method: "DELETE" });
    } catch {}
  };

  // Build merged display timeline items from Story, Gallery, and Calendar
  const combinedItems: TimelineDisplayItem[] = [
    ...events.map((ev) => ({
      key: `story-${ev.id}`,
      id: ev.id,
      source: "story" as const,
      title: ev.title,
      date: ev.date || "",
      description: ev.description || "",
      category: ev.category || "Story Chapter",
      location: ev.location || "",
      mediaUrl: ev.photo_url || "",
      mediaType: (ev.photo_url?.match(/\.(mp4|webm|mov|ogg)$/i)
        ? "video"
        : "photo") as "photo" | "video",
      favorite: ev.favorite,
      originalStory: ev,
    })),
    ...galleryItems.map((g) => ({
      key: `gallery-${g.id}`,
      id: g.id,
      source: "gallery" as const,
      title:
        g.caption ||
        (g.type === "video" ? "Gallery Video 🎬" : "Gallery Photo 📷"),
      date: g.date || "",
      description: g.caption || "",
      category: g.type === "video" ? "Gallery Video" : "Gallery Photo",
      location: "",
      mediaUrl: g.url,
      mediaType: g.type,
      favorite: g.favorite,
      originalGallery: g,
    })),
    ...calendarMemories.map((c) => ({
      key: `calendar-${c.id}`,
      id: c.id,
      source: "calendar" as const,
      title: c.title || "Calendar Memory 📅",
      date: c.date || "",
      description: c.note || "",
      category: c.event_type || "Calendar Memory",
      location: "",
      mediaUrl: c.media_url || "",
      mediaType: (c.media_url?.match(/\.(mp4|webm|mov|ogg)$/i)
        ? "video"
        : "photo") as "photo" | "video",
      favorite: 0,
      originalCalendar: c,
    })),
  ];

  const defaultCategories = [
    "First Meeting",
    "First Date",
    "Anniversary",
    "Trip",
    "Special Memories",
    "Gallery Photo",
    "Gallery Video",
  ];

  const dynamicCategories = Array.from(
    new Set([
      ...defaultCategories,
      ...combinedItems.map((i) => i.category).filter(Boolean),
    ]),
  );

  const filterCategories = ["All", ...dynamicCategories];

  const filteredItems = combinedItems.filter((item) => {
    if (filterCategory === "All") return true;
    return item.category === filterCategory;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFE4EC] text-[#EC407A] text-xs font-bold uppercase tracking-wider">
          <Sparkles size={14} />
          <span>Our Love Journey</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#5C3A4D]">
          Our Story Timeline
        </h1>
        <p className="text-[#5C3A4D]/80 text-sm max-w-lg mx-auto">
          Every chapter, photo, video, and magical memory we have shared
          together, sorted by date.
        </p>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-3 sm:p-4 rounded-3xl border border-white/80 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter size={14} className="text-[#EC407A] ml-2 mr-1 shrink-0" />
          {filterCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 transition ${
                filterCategory === cat
                  ? "bg-[#EC407A] text-white shadow-md shadow-[#EC407A]/20"
                  : "bg-white/80 text-[#5C3A4D] hover:bg-[#FFE4EC]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/80 hover:bg-[#FFE4EC] text-[#5C3A4D] text-xs font-bold transition border border-pink-100 shadow-sm shrink-0"
            title="Urutkan Berdasarkan Tanggal"
          >
            <ArrowUpDown size={14} className="text-[#EC407A]" />
            <span>
              {sortOrder === "asc"
                ? "Urut Tanggal: Terlama → Terbaru"
                : "Urut Tanggal: Terbaru → Terlama"}
            </span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#EC407A] hover:bg-[#D81B60] text-white text-xs font-bold uppercase tracking-widest shadow-md transition transform active:scale-95 shrink-0"
          >
            <Plus size={16} />
            <span>Add Chapter</span>
          </button>
        </div>
      </div>

      {/* Timeline Connector Container */}
      <div className="relative py-4">
        {/* Vertical Center Line */}
        <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#FF69B4] via-[#EC407A] to-[#F8BBD0] -translate-x-1/2" />

        <div className="space-y-12">
          {sortedItems.length === 0 ? (
            <div className="text-center py-12 text-[#5C3A4D]/60 text-sm font-medium">
              Belum ada kenangan atau foto/video untuk kategori ini.
            </div>
          ) : (
            sortedItems.map((item, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className={`relative flex flex-col sm:flex-row items-center ${
                    isEven ? "sm:flex-row-reverse" : ""
                  }`}
                >
                  {/* Center Heart Node */}
                  <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 border-[#EC407A] shadow-md flex items-center justify-center text-[#EC407A] z-10">
                    <Heart
                      size={14}
                      className={item.favorite ? "fill-[#EC407A]" : ""}
                    />
                  </div>

                  {/* Event Card Content */}
                  <div className="w-full sm:w-1/2 pl-12 sm:pl-0 sm:px-8">
                    <div className="bg-white/60 backdrop-blur-md border border-white/80 shadow-sm hover:shadow-xl rounded-3xl p-5 transition-all group relative overflow-hidden">
                      {/* Media Display */}
                      {item.mediaUrl && (
                        <div className="w-full rounded-2xl overflow-hidden mb-4 bg-[#FFE4EC]/50">
                          {item.mediaType === "video" ? (
                            <div className="relative bg-black/90 rounded-2xl overflow-hidden">
                              <video
                                src={item.mediaUrl}
                                controls
                                className="w-full max-h-80 object-contain rounded-2xl"
                              />
                              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm pointer-events-none">
                                <Film size={12} className="text-pink-400" />
                                <span>Video Galeri</span>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <img
                                src={item.mediaUrl}
                                alt={item.title}
                                className="w-full h-52 object-cover rounded-2xl group-hover:scale-105 transition duration-500"
                              />
                              {item.source === "gallery" && (
                                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm">
                                  <ImageIcon
                                    size={12}
                                    className="text-pink-300"
                                  />
                                  <span>Foto Galeri</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-3 py-1 rounded-full bg-[#FFE4EC] text-[#EC407A] text-[10px] font-bold tracking-widest uppercase">
                            {item.category || "Memory"}
                          </span>
                          {item.source === "gallery" && (
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-extrabold uppercase">
                              Galeri
                            </span>
                          )}
                          {item.source === "calendar" && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-extrabold uppercase">
                              Kalender
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[#EC407A]">
                          {item.source === "story" && item.originalStory && (
                            <button
                              onClick={() => openEditModal(item.originalStory!)}
                              className="p-1 hover:bg-[#FFE4EC] rounded-full transition text-[#EC407A]"
                              title="Edit Chapter"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (item.source === "story")
                                handleDeleteStory(item.id);
                              else if (item.source === "gallery")
                                handleDeleteGallery(item.id);
                              else if (item.source === "calendar")
                                handleDeleteCalendar(item.id);
                            }}
                            className="p-1 hover:bg-[#FFE4EC] rounded-full transition text-rose-500"
                            title="Delete Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-serif text-xl font-bold text-[#5C3A4D] mb-1">
                        {item.title}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-[#5C3A4D]/80 mb-3">
                        <span className="flex items-center gap-1 font-medium">
                          <CalendarIcon size={12} />
                          {item.date}
                        </span>
                        {item.location && (
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin size={12} />
                            {item.location}
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-[#5C3A4D]/90 leading-relaxed font-sans whitespace-pre-line">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-pink-100 relative space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-pink-100 pb-3">
                <h3 className="font-serif text-xl font-bold text-pink-950">
                  {editingEvent ? "Edit Story Chapter" : "Add Story Chapter"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-pink-100 rounded-full text-pink-500 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-pink-900 mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Our First Trip to Kyoto"
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-pink-900 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-pink-900">
                        Category
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !isCustom;
                          setIsCustom(nextState);
                          if (nextState) {
                            setCustomCategory("");
                          }
                        }}
                        className="text-[10px] font-bold text-[#EC407A] hover:underline"
                      >
                        {isCustom ? "← Choose Preset" : "+ Custom Category"}
                      </button>
                    </div>

                    {!isCustom ? (
                      <select
                        value={category}
                        onChange={(e) => {
                          if (e.target.value === "CUSTOM_OPTION") {
                            setIsCustom(true);
                            setCustomCategory("");
                          } else {
                            setCategory(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
                      >
                        {dynamicCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="CUSTOM_OPTION">
                          + Custom Category / Kategori Baru...
                        </option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        required={isCustom}
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="e.g. Engagement, Concert, Birthday"
                        className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pink-900 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Kyoto Botanical Garden"
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pink-900 mb-1">
                    Story Photo (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFE4EC] hover:bg-[#F8BBD0] text-[#EC407A] text-xs font-bold transition">
                      <Plus size={14} />
                      <span>
                        {photoUrl ? "Photo Uploaded ✓" : "Upload Chapter Photo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const isVideo = file.type.startsWith("video/");
                            const endpoint = isVideo
                              ? "/api/upload/videos"
                              : "/api/upload/photos";
                            const url = await uploadFileWithFallback(
                              file,
                              endpoint,
                            );
                            if (url) setPhotoUrl(url);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {photoUrl && (
                      <span className="text-xs text-[#EC407A] truncate max-w-[180px]">
                        {photoUrl}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pink-900 mb-1">
                    Description & Memories
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe how magical this moment was..."
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="fav"
                    checked={favorite}
                    onChange={(e) => setFavorite(e.target.checked)}
                    className="rounded text-pink-500 focus:ring-pink-400"
                  />
                  <label
                    htmlFor="fav"
                    className="text-xs font-medium text-pink-900"
                  >
                    Mark as Favorite Memory ❤️
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-[#5C3A4D] bg-[#FFE4EC] hover:bg-[#F8BBD0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest text-white bg-[#EC407A] hover:bg-[#D81B60] shadow-md"
                  >
                    Save Story
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
