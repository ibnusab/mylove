import React, { createContext, useContext, useState, useEffect } from "react";
import { RelationshipSettings, MusicTrack, User } from "../types";
import { fetchWithFallback, getLocalData, setLocalData } from "../lib/storage";
import { isSupabaseConfigured, getSupabaseClient } from "../lib/supabase";

interface AppContextType {
  settings: RelationshipSettings;
  updateSettings: (newSettings: Partial<RelationshipSettings>) => Promise<void>;
  user: User | null;
  setUser: (u: User | null) => void;
  // Global Audio Player state
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  playTrack: (track: MusicTrack) => void;
  togglePlay: () => void;
  playlist: MusicTrack[];
  setPlaylist: (tracks: MusicTrack[]) => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

const defaultSettings: RelationshipSettings = {
  partner1_name: "Ibnu Sabrian",
  partner2_name: "Anisa Wulandari",
  anniversary_date: "2023-05-14",
  quote: "In all the world, there is no heart for me like yours.",
  couple_photo_url:
    "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600",
  accent_color: "#FF69B4",
  particle_intensity: "medium",
  theme_mode: "pastel",
  gallery_layout: "masonry",
};

const STORAGE_KEY_SETTINGS = "sabrianisa_settings";
const STORAGE_KEY_MUSIC = "sabrianisa_music";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<RelationshipSettings>(() =>
    getLocalData(STORAGE_KEY_SETTINGS, defaultSettings),
  );
  const [user, setUser] = useState<User | null>({ id: 1, username: "love" });
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playlist, setPlaylistState] = useState<MusicTrack[]>(() =>
    getLocalData(STORAGE_KEY_MUSIC, []),
  );

  const setPlaylist = (tracks: MusicTrack[]) => {
    setPlaylistState(tracks);
    setLocalData(STORAGE_KEY_MUSIC, tracks);
  };

  // Fetch settings & music from API on load with fallbacks
  useEffect(() => {
    fetchWithFallback<RelationshipSettings>(
      "/api/settings",
      STORAGE_KEY_SETTINGS,
      defaultSettings,
      "settings",
    )
      .then((data) => {
        if (data && Object.keys(data).length > 0) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.error("Error fetching settings:", err));

    fetchWithFallback<MusicTrack[]>(
      "/api/music",
      STORAGE_KEY_MUSIC,
      [],
      "music",
    )
      .then((data) => {
        if (data && data.length > 0) {
          setPlaylistState(data);
          setCurrentTrack((prev) => prev || data[0]);
        }
      })
      .catch((err) => console.error("Error fetching music:", err));
  }, []);

  const updateSettings = async (newSettings: Partial<RelationshipSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    setLocalData(STORAGE_KEY_SETTINGS, updated);

    const client = getSupabaseClient();
    if (isSupabaseConfigured() && client) {
      try {
        const payload = {
          id: 1,
          couple_name: `${updated.partner1_name} & ${updated.partner2_name}`,
          partner1_name: updated.partner1_name,
          partner2_name: updated.partner2_name,
          anniversary_date: updated.anniversary_date,
          start_date: updated.anniversary_date,
          quote: updated.quote,
          couple_photo_url: updated.couple_photo_url,
          particle_intensity: updated.particle_intensity,
          accent_color: updated.accent_color,
          theme_mode: updated.theme_mode,
          gallery_layout: updated.gallery_layout,
        };

        const { error } = await client.from("settings").upsert(payload);
        if (error) {
          console.warn(
            "Supabase full settings upsert failed:",
            error.message,
            error,
          );
          // Fallback: upsert only standard basic columns if extended columns do not exist in user's Supabase schema yet
          const fallbackPayload = {
            id: 1,
            couple_name: `${updated.partner1_name} & ${updated.partner2_name}`,
            partner1_name: updated.partner1_name,
            partner2_name: updated.partner2_name,
            start_date: updated.anniversary_date,
            couple_photo_url: updated.couple_photo_url,
          };
          const { error: err2 } = await client
            .from("settings")
            .upsert(fallbackPayload);
          if (err2) {
            console.error(
              "Supabase fallback settings upsert error:",
              err2.message,
              err2,
            );
          } else {
            console.log("Saved settings to Supabase via fallback schema");
          }
        } else {
          console.log("Saved settings to Supabase successfully");
        }
      } catch (err) {
        console.warn("Supabase settings update exception:", err);
      }
    }

    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.warn("Backend API update failed, updated in LocalStorage:", err);
    }
  };

  const playTrack = (track: MusicTrack) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const nextTrack = () => {
    if (!playlist.length || !currentTrack) return;
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentTrack(playlist[nextIndex]);
  };

  const prevTrack = () => {
    if (!playlist.length || !currentTrack) return;
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentTrack(playlist[prevIndex]);
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        user,
        setUser,
        currentTrack,
        isPlaying,
        playTrack,
        togglePlay,
        playlist,
        setPlaylist,
        nextTrack,
        prevTrack,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
