import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MusicTrack } from '../types';
import { fetchWithFallback, uploadFileWithFallback } from '../lib/storage';
import { isSupabaseConfigured, getSupabaseClient } from '../lib/supabase';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Plus,
  Trash2,
  Volume2,
  Radio,
  Sparkles,
  Upload,
  X,
  Edit2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY_MUSIC = 'sabrianisa_music';

const FALLBACK_ALBUM_ART = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500';

const defaultMusicTracks: MusicTrack[] = [
  {
    id: 1,
    title: 'Ceritanya Jatuh Cinta',
    artist: 'Aku Jeje',
    file_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    album_art: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500',
    duration: '03:30',
    favorite: 1,
  },
  {
    id: 2,
    title: 'Anugerah Terindah',
    artist: 'Sabrianisa',
    file_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a7315b.mp3',
    album_art: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
    duration: '04:12',
    favorite: 1,
  },
];

export const MusicPage: React.FC = () => {
  const { currentTrack, isPlaying, playTrack, togglePlay, nextTrack, prevTrack, playlist, setPlaylist } =
    useApp();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload & Edit state
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [albumArt, setAlbumArt] = useState('');
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchTracks = () => {
    fetchWithFallback<MusicTrack[]>('/api/music', STORAGE_KEY_MUSIC, defaultMusicTracks, 'music')
      .then((data) => {
        const finalData = data && data.length > 0 ? data : defaultMusicTracks;
        setPlaylist(finalData);
      })
      .catch((err) => {
        console.error(err);
        if (playlist.length === 0) setPlaylist(defaultMusicTracks);
      });
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const openAddModal = () => {
    setEditingTrack(null);
    setTitle('');
    setArtist('');
    setAlbumArt('');
    setMusicFile(null);
    setIsUploadOpen(true);
  };

  const openEditModal = (track: MusicTrack) => {
    setEditingTrack(track);
    setTitle(track.title);
    setArtist(track.artist || '');
    setAlbumArt(track.album_art || '');
    setMusicFile(null);
    setIsUploadOpen(true);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsUploading(true);
    try {
      let audioUrl = editingTrack ? editingTrack.file_url : '';

      if (musicFile) {
        audioUrl = await uploadFileWithFallback(musicFile, '/api/upload/music');
      }

      if (!audioUrl) {
        setIsUploading(false);
        return;
      }

      const payload = {
        title: title || 'Untitled Song',
        artist: artist || 'Unknown Artist',
        file_url: audioUrl,
        album_art: albumArt || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300',
        duration: '03:30',
        favorite: editingTrack ? editingTrack.favorite : 0,
      };

      if (editingTrack) {
        const updatedTrack = { ...editingTrack, ...payload };
        const updated = playlist.map((tr) => (tr.id === editingTrack.id ? updatedTrack : tr));
        setPlaylist(updated);

        const client = getSupabaseClient();
        if (isSupabaseConfigured() && client) {
          try {
            const { error } = await client.from('music').update(payload).eq('id', editingTrack.id);
            if (error) console.error('Supabase update music error:', error.message, error);
          } catch (err) {
            console.warn('Supabase update music exception:', err);
          }
        }

        try {
          await fetch(`/api/music/${editingTrack.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch {
          // ignore API error on static host
        }
      } else {
        const newTrack: MusicTrack = { id: Date.now(), ...payload };
        const updated = [...playlist, newTrack];
        setPlaylist(updated);

        const client = getSupabaseClient();
        if (isSupabaseConfigured() && client) {
          try {
            const { data, error } = await client.from('music').insert([payload]).select();
            if (error) {
              console.error('Supabase insert music error:', error.message, error);
            } else if (data && data[0]) {
              const inserted = data[0] as unknown as MusicTrack;
              const synced = [...playlist.filter((t) => t.id !== newTrack.id), inserted];
              setPlaylist(synced);
            }
          } catch (err) {
            console.warn('Supabase insert music exception:', err);
          }
        }

        try {
          await fetch('/api/music', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch {
          // ignore API error on static host
        }
      }

      setIsUploadOpen(false);
      setEditingTrack(null);
      setTitle('');
      setArtist('');
      setAlbumArt('');
      setMusicFile(null);
    } catch (err) {
      console.error('Save music error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleFavorite = async (id: number) => {
    const trackToToggle = playlist.find((t) => t.id === id);
    const newFav = trackToToggle ? (trackToToggle.favorite === 1 ? 0 : 1) : 1;
    const updated = playlist.map((tr) =>
      tr.id === id ? { ...tr, favorite: newFav } : tr
    );
    setPlaylist(updated);

    const client = getSupabaseClient();
    if (isSupabaseConfigured() && client) {
      try {
        const { error } = await client.from('music').update({ favorite: newFav }).eq('id', id);
        if (error) console.error('Supabase favorite music error:', error.message, error);
      } catch (err) {
        console.warn('Supabase favorite toggle music failed:', err);
      }
    }

    try {
      await fetch(`/api/music/${id}/favorite`, { method: 'POST' });
    } catch {
      // ignore API error on static host
    }
  };

  const handleDelete = async (id: number) => {
    const updated = playlist.filter((tr) => tr.id !== id);
    setPlaylist(updated);

    const client = getSupabaseClient();
    if (isSupabaseConfigured() && client) {
      try {
        const { error } = await client.from('music').delete().eq('id', id);
        if (error) console.error('Supabase delete music error:', error.message, error);
      } catch (err) {
        console.warn('Supabase delete music failed:', err);
      }
    }

    try {
      await fetch(`/api/music/${id}`, { method: 'DELETE' });
    } catch {
      // ignore API error on static host
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFE4EC] text-[#EC407A] text-xs font-bold uppercase tracking-wider">
          <Sparkles size={14} />
          <span>Our Love Soundtrack</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#5C3A4D]">
          Romantic Music Player
        </h1>
        <p className="text-[#5C3A4D]/80 text-sm max-w-lg mx-auto">
          Songs that remind us of our first glance, midnight drives, and warm quiet evenings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Animated Vinyl / Album Art Display */}
        <div className="lg:col-span-5 bg-white/60 backdrop-blur-md border border-white/80 p-6 rounded-3xl shadow-sm flex flex-col items-center text-center space-y-6">
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full p-2 bg-gradient-to-tr from-[#FF69B4] via-[#F8BBD0] to-[#EC407A] shadow-2xl flex items-center justify-center">
            {/* Spinning Vinyl */}
            <div
              className={`w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '12s' }}
            >
              <img
                src={currentTrack?.album_art || FALLBACK_ALBUM_ART}
                alt={currentTrack?.title || 'Song'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_ALBUM_ART;
                }}
              />
            </div>
            {/* Vinyl Center Hole */}
            <div className="absolute w-8 h-8 rounded-full bg-white border-2 border-[#F8BBD0] shadow-inner" />
          </div>

          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold text-[#5C3A4D]">
              {currentTrack?.title || 'Select a Song'}
            </h2>
            <p className="text-sm font-semibold text-[#EC407A]">
              {currentTrack?.artist || 'Our Playlist'}
            </p>
          </div>

          {/* Main Playback Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={prevTrack}
              className="p-3 bg-[#FFE4EC] hover:bg-[#F8BBD0] text-[#5C3A4D] rounded-full transition"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={togglePlay}
              className="p-4 bg-[#EC407A] hover:bg-[#D81B60] text-white rounded-full shadow-lg shadow-[#EC407A]/20 transform active:scale-95 transition"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </button>
            <button
              onClick={nextTrack}
              className="p-3 bg-[#FFE4EC] hover:bg-[#F8BBD0] text-[#5C3A4D] rounded-full transition"
            >
              <SkipForward size={20} />
            </button>
          </div>
        </div>

        {/* Right: Playlist Queue */}
        <div className="lg:col-span-7 bg-white/60 backdrop-blur-md border border-white/80 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#FFE4EC] pb-3">
            <div className="flex items-center gap-2">
              <Radio size={18} className="text-[#EC407A]" />
              <h3 className="font-serif text-lg font-bold text-[#5C3A4D]">
                Our Playlist ({playlist.length})
              </h3>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-[#EC407A] hover:bg-[#D81B60] text-white text-xs font-bold uppercase tracking-widest shadow-md transition shrink-0"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add Song</span>
              <span className="sm:hidden text-[11px]">Tambah</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {playlist.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                    isCurrent
                      ? 'bg-[#FFE4EC] border-[#F8BBD0] shadow-sm'
                      : 'bg-white/50 border-white/60 hover:bg-[#FFE4EC]/50'
                  }`}
                >
                  <div
                    onClick={() => playTrack(track)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#FFE4EC] shrink-0">
                      <img
                        src={track.album_art || FALLBACK_ALBUM_ART}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_ALBUM_ART;
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#5C3A4D] truncate">
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-[#EC407A] truncate">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#5C3A4D]/60 font-mono">
                      {track.duration}
                    </span>
                    <button
                      onClick={() => openEditModal(track)}
                      className="p-1 text-[#EC407A] hover:bg-[#FFE4EC] rounded-full transition"
                      title="Edit Song"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => toggleFavorite(track.id)}
                      className="p-1 text-[#EC407A] hover:scale-110 transition"
                    >
                      <Heart size={14} className={track.favorite ? 'fill-[#EC407A] text-[#EC407A]' : ''} />
                    </button>
                    <button
                      onClick={() => handleDelete(track.id)}
                      className="p-1 text-[#5C3A4D]/40 hover:text-rose-600 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upload Song Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-100 relative space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-pink-100 pb-3">
                <h3 className="font-serif text-lg font-bold text-pink-950">
                  {editingTrack ? 'Edit Song Details' : 'Upload Romantic Song (MP3/WAV)'}
                </h3>
                <button
                  onClick={() => setIsUploadOpen(false)}
                  className="p-1 hover:bg-pink-100 rounded-full text-pink-500"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-pink-900 mb-1">
                    Select Audio File {editingTrack ? '(Optional - Keep existing file)' : '(MP3/WAV)'}
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    required={!editingTrack}
                    onChange={(e) => setMusicFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-pink-800 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pink-900 mb-1">
                    Song Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Perfect"
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pink-900 mb-1">
                    Artist Name
                  </label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="e.g. Ed Sheeran"
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pink-900 mb-1">
                    Album Art / Foto Cover (Upload or URL)
                  </label>
                  <div className="flex items-center gap-2">
                    {albumArt && (
                      <img
                        src={albumArt}
                        alt="Preview"
                        className="w-10 h-10 rounded-xl object-cover border border-pink-300 shrink-0 shadow-xs"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_ALBUM_ART;
                        }}
                      />
                    )}
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFE4EC] hover:bg-[#F8BBD0] text-[#EC407A] text-xs font-bold transition shrink-0">
                      <Upload size={14} />
                      <span>{albumArt ? 'Ganti Cover' : 'Unggah Cover'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await uploadFileWithFallback(file, '/api/upload/photos');
                            if (url) setAlbumArt(url);
                          } catch (err) {
                            console.error('Failed to upload cover image:', err);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={albumArt}
                      onChange={(e) => setAlbumArt(e.target.value)}
                      placeholder="Atau masukkan URL gambar..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-pink-700 bg-pink-50 hover:bg-pink-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-pink-500 hover:bg-pink-600 shadow-md"
                  >
                    {isUploading ? 'Uploading...' : 'Save Song'}
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
