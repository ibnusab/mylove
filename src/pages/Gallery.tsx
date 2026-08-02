import React, { useEffect, useState } from "react";
import { GalleryItem } from "../types";
import {
  fetchWithFallback,
  getLocalData,
  setLocalData,
  uploadFileWithFallback,
} from "../lib/storage";
import { isSupabaseConfigured, getSupabaseClient } from "../lib/supabase";
import {
  Upload,
  Heart,
  Grid,
  Maximize2,
  Film,
  Image as ImageIcon,
  Trash2,
  Plus,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Edit2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const STORAGE_KEY_GALLERY = "sabrianisa_gallery";

const defaultGalleryItems: GalleryItem[] = [];

export const Gallery: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>(() =>
    getLocalData(STORAGE_KEY_GALLERY, []),
  );
  const [viewMode, setViewMode] = useState<
    "masonry" | "polaroid" | "grid" | "slideshow"
  >("masonry");
  const [showOnlyFav, setShowOnlyFav] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload/Edit state
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isUploading, setIsUploading] = useState(false);

  // Slideshow state
  const [slideshowIndex, setSlideshowIndex] = useState(0);

  const fetchGallery = () => {
    fetchWithFallback<GalleryItem[]>(
      "/api/gallery",
      STORAGE_KEY_GALLERY,
      defaultGalleryItems,
      "gallery",
    )
      .then((data) => setItems(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchGallery();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
        setIsUploadOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const saveItems = (newItems: GalleryItem[]) => {
    setItems(newItems);
    setLocalData(STORAGE_KEY_GALLERY, newItems);
  };

  const openUploadModal = () => {
    setEditingItem(null);
    setUploadFile(null);
    setCaption("");
    setDate(new Date().toISOString().slice(0, 10));
    setIsUploadOpen(true);
  };

  const openEditModal = (item: GalleryItem) => {
    setEditingItem(item);
    setUploadFile(null);
    setCaption(item.caption || "");
    setDate(item.date || new Date().toISOString().slice(0, 10));
    setIsUploadOpen(true);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsUploading(true);
    try {
      let finalUrl = editingItem ? editingItem.url : "";
      let mediaType: "photo" | "video" = editingItem
        ? editingItem.type
        : "photo";

      if (uploadFile) {
        const isVideo = uploadFile.type.startsWith("video/");
        const endpoint = isVideo ? "/api/upload/videos" : "/api/upload/photos";
        finalUrl = await uploadFileWithFallback(uploadFile, endpoint);
        mediaType = isVideo ? "video" : "photo";
      }

      if (!finalUrl) {
        setIsUploading(false);
        return;
      }

      if (editingItem) {
        const updatedItem = {
          ...editingItem,
          type: mediaType,
          url: finalUrl,
          caption,
          date,
        };
        const updated = items.map((it) =>
          it.id === editingItem.id ? updatedItem : it,
        );
        saveItems(updated);

        const client = getSupabaseClient();
        if (isSupabaseConfigured() && client) {
          try {
            const { error } = await client
              .from("gallery")
              .update({
                type: mediaType,
                url: finalUrl,
                caption,
                date,
                favorite: editingItem.favorite,
              })
              .eq("id", editingItem.id);
            if (error)
              console.error(
                "Supabase update gallery error:",
                error.message,
                error,
              );
          } catch (err) {
            console.warn("Supabase update gallery exception:", err);
          }
        }

        try {
          await fetch(`/api/gallery/${editingItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: mediaType,
              url: finalUrl,
              caption,
              date,
              favorite: editingItem.favorite,
            }),
          });
        } catch {
          // ignore API error on static host
        }
      } else {
        const newItem: GalleryItem = {
          id: Date.now(),
          type: mediaType,
          url: finalUrl,
          caption,
          date,
          favorite: 0,
        };
        const updated = [newItem, ...items];
        saveItems(updated);

        const client = getSupabaseClient();
        if (isSupabaseConfigured() && client) {
          try {
            const { data, error } = await client
              .from("gallery")
              .insert([
                {
                  type: mediaType,
                  url: finalUrl,
                  caption,
                  date,
                  favorite: 0,
                },
              ])
              .select();

            if (error) {
              console.error(
                "Supabase insert gallery error:",
                error.message,
                error,
              );
            } else if (data && data[0]) {
              const inserted = data[0] as unknown as GalleryItem;
              const synced = [
                inserted,
                ...items.filter((i) => i.id !== newItem.id),
              ];
              saveItems(synced);
            }
          } catch (err) {
            console.warn("Supabase insert gallery exception:", err);
          }
        }

        try {
          await fetch("/api/gallery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: mediaType,
              url: finalUrl,
              caption,
              date,
              favorite: 0,
            }),
          });
        } catch {
          // ignore API error on static host
        }
      }

      setIsUploadOpen(false);
      setEditingItem(null);
      setUploadFile(null);
      setCaption("");
    } catch (err) {
      console.error("Save media error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleFavorite = async (id: number) => {
    const itemToToggle = items.find((i) => i.id === id);
    const newFav = itemToToggle ? (itemToToggle.favorite === 1 ? 0 : 1) : 1;
    const updated = items.map((it) =>
      it.id === id ? { ...it, favorite: newFav } : it,
    );
    saveItems(updated);

    const client = getSupabaseClient();
    if (isSupabaseConfigured() && client) {
      try {
        const { error } = await client
          .from("gallery")
          .update({ favorite: newFav })
          .eq("id", id);
        if (error)
          console.error(
            "Supabase favorite gallery error:",
            error.message,
            error,
          );
      } catch (err) {
        console.warn("Supabase favorite toggle failed:", err);
      }
    }

    try {
      await fetch(`/api/gallery/${id}/favorite`, { method: "POST" });
    } catch {
      // ignore API error on static host
    }
  };

  const handleDelete = async (id: number) => {
    const updated = items.filter((it) => it.id !== id);
    saveItems(updated);

    const client = getSupabaseClient();
    if (isSupabaseConfigured() && client) {
      try {
        const { error } = await client.from("gallery").delete().eq("id", id);
        if (error)
          console.error("Supabase delete gallery error:", error.message, error);
      } catch (err) {
        console.warn("Supabase delete gallery failed:", err);
      }
    }

    try {
      await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    } catch {
      // ignore API error on static host
    }
  };

  const filteredItems = items.filter((item) =>
    showOnlyFav ? item.favorite === 1 : true,
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFE4EC] text-[#EC407A] text-xs font-bold uppercase tracking-wider">
          <Sparkles size={14} />
          <span>Our Visual Memories</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#5C3A4D]">
          Photo &amp; Video Gallery
        </h1>
        <p className="text-[#5C3A4D]/80 text-sm max-w-lg mx-auto">
          Captured smiles, quiet sunsets, and beautiful moments preserved
          forever in time.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-white/80 shadow-sm">
        {/* View Mode Selectors */}
        <div className="flex items-center gap-1 bg-[#FFE4EC]/60 p-1 rounded-full">
          {(["masonry", "polaroid", "grid", "slideshow"] as const).map(
            (mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider capitalize transition ${
                  viewMode === mode
                    ? "bg-[#EC407A] text-white shadow-md shadow-[#EC407A]/20"
                    : "text-[#5C3A4D] hover:text-[#EC407A]"
                }`}
              >
                {mode}
              </button>
            ),
          )}
        </div>

        {/* Favorite Filter & Upload Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOnlyFav(!showOnlyFav)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition border ${
              showOnlyFav
                ? "bg-[#EC407A] text-white border-[#EC407A] shadow-md"
                : "bg-white text-[#5C3A4D] border-[#FFE4EC] hover:bg-[#FFE4EC]"
            }`}
          >
            <Heart size={14} className={showOnlyFav ? "fill-white" : ""} />
            <span>Favorites</span>
          </button>

          <button
            onClick={openUploadModal}
            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#EC407A] hover:bg-[#D81B60] text-white text-xs font-bold uppercase tracking-widest shadow-md transition transform active:scale-95"
          >
            <Upload size={14} />
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      {/* GALLERY DISPLAY */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white/60 backdrop-blur-md rounded-3xl border border-white/80 shadow-sm space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto bg-[#FFE4EC] text-[#EC407A] rounded-full flex items-center justify-center">
            <ImageIcon size={32} />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#5C3A4D]">
            Belum Ada Foto/Video
          </h3>
          <p className="text-xs text-[#5C3A4D]/80">
            Galeri kamu masih kosong. Tambahkan momen foto atau video indah
            kalian sekarang!
          </p>
          <button
            onClick={openUploadModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#EC407A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#D81B60] transition shadow-md"
          >
            <Upload size={14} /> Upload Foto Pertamamu
          </button>
        </div>
      ) : viewMode === "slideshow" ? (
        /* Slideshow View */
        <div className="relative max-w-3xl mx-auto bg-black/90 rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col items-center justify-center min-h-[420px]">
          {filteredItems.length > 0 ? (
            <div className="relative w-full h-[380px] sm:h-[450px] flex items-center justify-center">
              {filteredItems[slideshowIndex]?.type === "video" ? (
                <video
                  src={filteredItems[slideshowIndex].url}
                  controls
                  className="max-h-full max-w-full rounded-2xl object-contain"
                />
              ) : (
                <img
                  src={filteredItems[slideshowIndex].url}
                  alt={filteredItems[slideshowIndex].caption}
                  className="max-h-full max-w-full rounded-2xl object-contain shadow-lg"
                />
              )}

              {/* Caption Overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl text-white text-center">
                <p className="text-sm font-medium">
                  {filteredItems[slideshowIndex].caption}
                </p>
                <p className="text-xs text-pink-300">
                  {filteredItems[slideshowIndex].date}
                </p>
              </div>

              {/* Prev / Next Controls */}
              <button
                onClick={() =>
                  setSlideshowIndex(
                    (slideshowIndex - 1 + filteredItems.length) %
                      filteredItems.length,
                  )
                }
                className="absolute left-2 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={() =>
                  setSlideshowIndex((slideshowIndex + 1) % filteredItems.length)
                }
                className="absolute right-2 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          ) : (
            <div className="text-pink-300 text-sm">
              No items to display in slideshow
            </div>
          )}
        </div>
      ) : viewMode === "polaroid" ? (
        /* Polaroid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-4 pb-6 rounded-xl shadow-lg border border-pink-100 transform hover:-translate-y-2 hover:rotate-1 transition duration-300 relative group"
            >
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-pink-50 mb-3">
                {item.type === "video" ? (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.caption}
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  onClick={() => setLightboxIndex(idx)}
                  className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition"
                >
                  <Maximize2 size={24} />
                </button>
              </div>

              <div className="flex items-center justify-between text-pink-950 font-serif">
                <div>
                  <p className="text-sm font-semibold truncate max-w-[180px]">
                    {item.caption || "Our Memory"}
                  </p>
                  <p className="text-[10px] text-pink-500">{item.date}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1 text-[#EC407A] hover:bg-[#FFE4EC] rounded-full transition"
                    title="Edit Caption / Date"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="p-1 text-rose-500 hover:scale-125 transition"
                  >
                    <Heart
                      size={16}
                      className={item.favorite ? "fill-rose-500" : ""}
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-pink-400 hover:text-rose-600 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Grid or Masonry Mode */
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
              : "columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
          }
        >
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group rounded-3xl overflow-hidden shadow-md bg-white border border-pink-100 break-inside-avoid"
            >
              {item.type === "video" ? (
                <div className="relative aspect-square bg-black">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Film size={28} className="text-white opacity-80" />
                  </div>
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={item.caption}
                  className="w-full object-cover group-hover:scale-105 transition duration-500"
                />
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 p-4 flex flex-col justify-end text-white">
                <p className="text-xs font-semibold truncate">{item.caption}</p>
                <p className="text-[10px] text-pink-200">{item.date}</p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
                  <button
                    onClick={() => setLightboxIndex(idx)}
                    className="text-xs flex items-center gap-1 hover:text-pink-300"
                  >
                    <Maximize2 size={12} /> View
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(item)} title="Edit">
                      <Edit2
                        size={16}
                        className="text-white hover:text-pink-300"
                      />
                    </button>
                    <button onClick={() => toggleFavorite(item.id)}>
                      <Heart
                        size={16}
                        className={
                          item.favorite
                            ? "fill-rose-500 text-rose-500"
                            : "text-white"
                        }
                      />
                    </button>
                    <button onClick={() => handleDelete(item.id)}>
                      <Trash2
                        size={16}
                        className="text-rose-300 hover:text-rose-500"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Media Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-100 relative space-y-4"
            >
              <div className="flex items-center justify-between border-b border-pink-100 pb-3">
                <h3 className="font-serif text-lg font-bold text-pink-950">
                  {editingItem ? "Edit Media Details" : "Upload Photo or Video"}
                </h3>
                <button
                  onClick={() => setIsUploadOpen(false)}
                  className="p-1 hover:bg-pink-100 rounded-full text-pink-500"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-pink-900 mb-1">
                    Select File{" "}
                    {editingItem
                      ? "(Optional - Leave blank to keep current media)"
                      : "(JPG, PNG, WEBP, MP4, WEBM)"}
                  </label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    required={!editingItem}
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-pink-800 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pink-900 mb-1">
                    Memory Caption
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="e.g. Sunset holding hands in Paris"
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pink-900 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-[#5C3A4D] bg-[#FFE4EC] hover:bg-[#F8BBD0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest text-white bg-[#EC407A] hover:bg-[#D81B60] shadow-md"
                  >
                    {isUploading ? "Uploading..." : "Save Media"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Popup */}
      {lightboxIndex !== null && filteredItems[lightboxIndex] && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 sm:p-8 backdrop-blur-md cursor-pointer"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[110] p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition shadow-xl border border-white/20 flex items-center justify-center"
            title="Close (Esc)"
          >
            <X size={24} />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full flex flex-col items-center cursor-default"
          >
            {filteredItems[lightboxIndex].type === "video" ? (
              <video
                src={filteredItems[lightboxIndex].url}
                controls
                autoPlay
                className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl"
              />
            ) : (
              <img
                src={filteredItems[lightboxIndex].url}
                alt="Lightbox"
                className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
            )}
            <div className="text-center mt-4 text-white">
              <p className="font-serif text-lg font-semibold">
                {filteredItems[lightboxIndex].caption}
              </p>
              <p className="text-xs text-pink-300">
                {filteredItems[lightboxIndex].date}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
