export interface RelationshipSettings {
  partner1_name: string;
  partner2_name: string;
  anniversary_date: string; // YYYY-MM-DD
  quote: string;
  couple_photo_url?: string;
  accent_color: string;
  particle_intensity: 'low' | 'medium' | 'high';
  theme_mode: string;
  gallery_layout: string;
}

export interface TimelineEvent {
  id: number;
  title: string;
  date: string;
  description: string;
  category: string;
  location: string;
  photo_url: string;
  favorite: number;
  created_at?: string;
}

export interface GalleryItem {
  id: number;
  type: 'photo' | 'video';
  url: string;
  caption: string;
  date: string;
  favorite: number;
  created_at?: string;
}

export interface MusicTrack {
  id: number;
  title: string;
  artist: string;
  file_url: string;
  album_art: string;
  duration: string;
  favorite: number;
  created_at?: string;
}

export interface LoveNote {
  id: number;
  sender: string;
  receiver: string;
  message: string;
  emoji: string;
  is_pinned: number;
  created_at?: string;
}

export interface CalendarMemory {
  id: number;
  date: string;
  title: string;
  note: string;
  media_url: string;
  event_type: string;
  created_at?: string;
}

export interface LoveLetter {
  id: number;
  title: string;
  content: string;
  date: string;
  is_opened: number;
  is_archived: number;
  created_at?: string;
}

export interface User {
  id: number;
  username: string;
}
