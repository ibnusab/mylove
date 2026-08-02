import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Pause, SkipForward, SkipBack, Music, Volume2, VolumeX, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FALLBACK_ALBUM_ART = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300';

export const GlobalMusicPlayer: React.FC = () => {
  const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack } = useApp();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          // Auto-play policy catch
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 1;
      setProgress((cur / dur) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const seekTime = (parseFloat(e.target.value) / 100) * (audioRef.current.duration || 0);
      audioRef.current.currentTime = seekTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
      setIsMuted(v === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-16 right-3 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      <audio
        ref={audioRef}
        src={currentTrack.file_url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextTrack}
      />

      {/* Expanded Popover Player Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            className="mb-3 bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl rounded-3xl p-4 w-[280px] sm:w-[320px] text-[#5C3A4D] space-y-3"
          >
            <div className="flex items-center justify-between border-b border-pink-100 pb-2">
              <div className="flex items-center gap-2">
                <Music size={15} className="text-[#EC407A]" />
                <span className="text-xs font-bold text-[#5C3A4D] uppercase tracking-wider">
                  Now Playing
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 text-[#5C3A4D]/60 hover:text-[#EC407A] rounded-full hover:bg-pink-50 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-[#FFE4EC] border border-white shadow-sm">
                <img
                  src={currentTrack.album_art || FALLBACK_ALBUM_ART}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_ALBUM_ART;
                  }}
                />
                {isPlaying && (
                  <span className="absolute inset-0 bg-[#FF69B4]/20 animate-pulse" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-[#5C3A4D] truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-[11px] text-[#5C3A4D]/70 truncate">
                  {currentTrack.artist}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="w-full h-1.5 bg-[#FFE4EC] rounded-lg appearance-none cursor-pointer accent-[#EC407A]"
              />
              <div className="flex justify-between text-[10px] text-[#5C3A4D]/60 font-mono">
                <span>
                  {audioRef.current
                    ? `${Math.floor(audioRef.current.currentTime / 60)}:${Math.floor(
                        audioRef.current.currentTime % 60
                      )
                        .toString()
                        .padStart(2, '0')}`
                    : '0:00'}
                </span>
                <span>{currentTrack.duration || '3:30'}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                <button onClick={toggleMute} className="p-1.5 text-[#5C3A4D]/80 hover:text-[#EC407A]">
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-14 h-1 bg-[#FFE4EC] rounded appearance-none cursor-pointer accent-[#EC407A]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={prevTrack}
                  className="p-1.5 hover:bg-[#FFE4EC] rounded-full text-[#5C3A4D] transition"
                  title="Previous"
                >
                  <SkipBack size={16} />
                </button>
                <button
                  onClick={togglePlay}
                  className="p-2.5 bg-[#EC407A] hover:bg-[#D81B60] text-white rounded-full shadow-md transition transform active:scale-95"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>
                <button
                  onClick={nextTrack}
                  className="p-1.5 hover:bg-[#FFE4EC] rounded-full text-[#5C3A4D] transition"
                  title="Next"
                >
                  <SkipForward size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Floating Music Logo Button (FAB) */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative w-12 h-12 rounded-full bg-[#EC407A] text-white shadow-xl shadow-[#EC407A]/30 flex items-center justify-center border-2 border-white transition-all group"
        aria-label="Music Player Toggle"
      >
        {isPlaying && (
          <span className="absolute -inset-1 rounded-full bg-[#EC407A]/40 animate-ping opacity-75" />
        )}
        <Music size={20} className={isPlaying ? 'animate-bounce' : ''} />
        
        {/* Status indicator dot */}
        <span
          className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
            isPlaying ? 'bg-emerald-400' : 'bg-pink-300'
          }`}
        />
      </motion.button>
    </div>
  );
};
