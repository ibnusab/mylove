import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Pause, SkipForward, SkipBack, Music, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FALLBACK_ALBUM_ART = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300';

export const GlobalMusicPlayer: React.FC = () => {
  const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack } = useApp();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          // Auto-play policy standard catch
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
    <div className="fixed bottom-5 right-5 z-50">
      <audio
        ref={audioRef}
        src={currentTrack.file_url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextTrack}
      />

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/70 backdrop-blur-md border border-white/80 shadow-lg rounded-2xl p-3 max-w-xs sm:max-w-sm text-[#5C3A4D]"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-[#FFE4EC] border border-white">
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

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={prevTrack}
              className="p-1.5 hover:bg-[#FFE4EC] rounded-full text-[#5C3A4D] transition"
              title="Previous"
            >
              <SkipBack size={15} />
            </button>
            <button
              onClick={togglePlay}
              className="p-2 bg-[#EC407A] hover:bg-[#D81B60] text-white rounded-full shadow-md transition transform active:scale-95"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
            <button
              onClick={nextTrack}
              className="p-1.5 hover:bg-[#FFE4EC] rounded-full text-[#5C3A4D] transition"
              title="Next"
            >
              <SkipForward size={15} />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-[#FFE4EC] rounded-full text-[#EC407A] transition"
            >
              {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            </button>
          </div>
        </div>

        {/* Expanded controls */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-3 border-t border-[#FFE4EC] flex flex-col gap-2"
            >
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="w-full h-1.5 bg-[#FFE4EC] rounded-lg appearance-none cursor-pointer accent-[#EC407A]"
              />
              <div className="flex items-center justify-between text-xs text-[#5C3A4D]/80">
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="hover:text-[#EC407A]">
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-[#FFE4EC] rounded appearance-none cursor-pointer accent-[#EC407A]"
                  />
                </div>
                <span>{currentTrack.duration}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
